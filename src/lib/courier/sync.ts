import { prisma } from '@/lib/db';
import { getCourierProvider } from './index';
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

  let newEventsInserted = 0;

  // 7. Compare incoming tracking events with existing ShipmentStatusHistory
  // 8. Insert only genuinely new events, avoid duplicates (using status, location, occurred_at)
  for (const event of trackingData.events) {
    const isDuplicate = shipment.history.some(existingEvent => {
      // 1. Prefer stable provider event ID if the provider supplies one
      if (event.provider_event_id) {
        // Since we don't have a dedicated DB column for this yet, we check the note
        return existingEvent.note && existingEvent.note.includes(`[ID:${event.provider_event_id}]`);
      }

      // 2. Fallback to heuristic comparison
      // Create safe timestamp comparison (handling slight parsing differences)
      const existingTime = existingEvent.occurred_at.getTime();
      const newTime = event.occurred_at.getTime();
      
      const timeMatches = Math.abs(existingTime - newTime) < 60000; // Within 1 minute tolerance
      const statusMatches = existingEvent.status === event.status;
      const locationMatches = existingEvent.location === event.location;

      return timeMatches && statusMatches && locationMatches;
    });

    if (!isDuplicate) {
      let finalNote = event.note || (event.raw_status ? `External Update: ${event.raw_status}` : 'Updated by automated sync');
      if (event.provider_event_id) {
        finalNote = `[ID:${event.provider_event_id}] ${finalNote}`;
      }

      await prisma.shipmentStatusHistory.create({
        data: {
          shipment_id: shipment.id,
          status: event.status,
          location: event.location,
          note: finalNote,
          occurred_at: event.occurred_at,
        }
      });
      newEventsInserted++;
    }
  }

  // 10. Update Shipment.current_status
  // 11. Update current location
  // 12. Update estimated delivery
  await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      current_status: trackingData.current_status || shipment.current_status,
      current_location: trackingData.current_location || shipment.current_location,
      estimated_delivery: trackingData.estimated_delivery || shipment.estimated_delivery,
    }
  });

  return {
    success: true,
    shipment_id: shipment.tracking_id,
    new_events: newEventsInserted,
    current_status: trackingData.current_status,
  };
}
