import { prisma } from '@/lib/db';
import { getCourierProvider } from './index';
import { isDuplicateEvent } from './identity';
import { TrackingEvent } from './types';

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
  
  // Track the latest date among successfully inserted or confirmed duplicate events
  let maxSuccessfulDate = maxDbDate;
  let latestSuccessfulStatus = shipment.current_status;
  let latestSuccessfulLocation = shipment.current_location;

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
        
        if (event.occurred_at.getTime() > maxSuccessfulDate.getTime()) {
          maxSuccessfulDate = event.occurred_at;
          latestSuccessfulStatus = event.status;
          latestSuccessfulLocation = event.location || '';
        }
      } catch (err: any) {
        console.error(`[Sync Error] Failed to insert event for ${shipment.official_tracking_id}:`, err.message);
        // Continue to the next event
      }
    } else {
      // If it is a duplicate, it's a valid event that is already safely persisted.
      if (event.occurred_at.getTime() > maxSuccessfulDate.getTime()) {
        maxSuccessfulDate = event.occurred_at;
        latestSuccessfulStatus = event.status;
        latestSuccessfulLocation = event.location || '';
      }
    }
  }

  // 10. Update Shipment.current_status safely
  // ONLY overwrite if the successful events represent an event newer than what we had.
  const updateData: any = {};
  
  if (trackingData.estimated_delivery) {
    updateData.estimated_delivery = trackingData.estimated_delivery;
  }

  if (maxSuccessfulDate.getTime() > maxDbDate.getTime()) {
    updateData.current_status = latestSuccessfulStatus;
    if (latestSuccessfulLocation) {
      updateData.current_location = latestSuccessfulLocation;
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
