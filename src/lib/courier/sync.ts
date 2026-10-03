import { prisma } from '@/lib/db';
import { getCourierProvider } from './index';
import { isDuplicateEvent } from './identity';
import { TrackingEvent, getStatusRank } from './types';

export async function syncTracking(shipmentId: string) {
  // 1. Load the shipment
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      history: true
    }
  });

  if (!shipment) {
    throw new Error(`Shipment with ID ${shipmentId} not found.`);
  }

  // 2. Read the internal service field
  if (!shipment.service) {
    throw new Error("Shipment does not have a courier service specified.");
  }

  // 3. Read the official tracking ID (AWB)
  if (!shipment.official_tracking_id) {
    throw new Error("Shipment does not have an official tracking ID (AWB) assigned.");
  }

  // 4. Select the appropriate CourierProvider
  const provider = getCourierProvider(shipment.service);

  // 5. Request tracking data from that provider
  // (6. The provider normalizes the response internally into KSR's format)
  const trackingData = await provider.trackShipment(shipment.official_tracking_id);

  // Find the max occurred_at from existing history to know our current freshest state
  let maxDbDate = new Date(0);
  for (const h of shipment.history) {
    if (h.occurred_at.getTime() > maxDbDate.getTime()) {
      maxDbDate = h.occurred_at;
    }
  }

  let newEventsInserted = 0;
  
  // 7. Compare incoming tracking events with existing ShipmentStatusHistory
  // Maintain an up-to-date in-memory list of events to check against
  const currentHistory = [...shipment.history];

  // 8. Insert only genuinely new events, avoid duplicates (using status, location, occurred_at, and note)
  for (const event of trackingData.events) {
    const isDuplicate = currentHistory.some(existingEvent => {
      return isDuplicateEvent(existingEvent, event);
    });

    if (!isDuplicate) {
      let finalNote = event.note || (event.raw_status ? `External Update: ${event.raw_status}` : 'Updated by automated sync');
      if (event.provider_event_id) {
        finalNote = `[ID:${event.provider_event_id}] ${finalNote}`;
      }

      try {
        const newHistoryRecord = await prisma.shipmentStatusHistory.create({
          data: {
            shipment_id: shipment.id,
            status: event.status,
            location: event.location,
            note: finalNote,
            occurred_at: event.occurred_at,
          }
        });

        newEventsInserted++;
        currentHistory.push(newHistoryRecord); // Add to in-memory history
      } catch (err: any) {
        console.error(`[Sync Error] Failed to insert event for ${shipment.official_tracking_id}:`, err.message);
        // Continue to the next event
      }
    }
  }

  // 10. Determine highest milestone and latest chronological update from ALL history
  let highestAchievedEvent: any = null;
  let chronologicallyLatestEvent: any = null;

  for (const event of currentHistory) {
    if (!event) continue;

    // Track chronologically latest for note/location
    if (!chronologicallyLatestEvent || event.occurred_at.getTime() >= chronologicallyLatestEvent.occurred_at.getTime()) {
      chronologicallyLatestEvent = event;
    }

    // Track highest milestone rank
    if (!highestAchievedEvent) {
      highestAchievedEvent = event;
    } else {
      const currentRank = getStatusRank(highestAchievedEvent.status);
      const newRank = getStatusRank(event.status);

      if (newRank > currentRank) {
        highestAchievedEvent = event;
      } else if (newRank === currentRank && event.occurred_at.getTime() > highestAchievedEvent.occurred_at.getTime()) {
        // Tie-breaker: Protect terminal statuses (rank 100) from overwriting each other
        if (newRank < 100 || event.status === highestAchievedEvent.status) {
          highestAchievedEvent = event;
        }
      }
    }
  }

  const updateData: any = {};
  
  if (trackingData.estimated_delivery) {
    updateData.estimated_delivery = trackingData.estimated_delivery;
  }

  // Check if we need to update the status (highest achieved)
  const existingRank = getStatusRank(shipment.current_status);
  const highestRank = highestAchievedEvent ? getStatusRank(highestAchievedEvent.status) : 0;

  if (highestAchievedEvent && (highestRank > existingRank || (highestRank === existingRank && highestAchievedEvent.status !== shipment.current_status))) {
    updateData.current_status = highestAchievedEvent.status;
  }

  // Update note/location from the chronologically latest event if newer than maxDbDate or if it's our first sync
  if (chronologicallyLatestEvent && (chronologicallyLatestEvent.occurred_at.getTime() >= maxDbDate.getTime() || currentHistory.length === newEventsInserted)) {
    if (chronologicallyLatestEvent.location && chronologicallyLatestEvent.location !== shipment.current_location) {
      updateData.current_location = chronologicallyLatestEvent.location;
    }
    if (chronologicallyLatestEvent.note && chronologicallyLatestEvent.note.trim() !== shipment.customer_update) {
      updateData.customer_update = chronologicallyLatestEvent.note.trim();
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData
    });
  }

  return {
    success: true,
    shipment_id: shipment.tracking_id,
    new_events: newEventsInserted,
    current_status: updateData.current_status || shipment.current_status,
  };
}
