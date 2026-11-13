import { isCancelledOrReturnedStatus } from './normalization';
import { prisma } from '@/lib/db';
import { getCourierProvider } from './index';
import { isDuplicateEvent } from './identity';
import { TrackingEvent, getStatusRank } from './types';
import { parseCalendarDate } from '@/lib/datetime';
import { runWithShipmentLock } from '@/lib/concurrency';

export interface SyncOptions {
  skipLock?: boolean;
}

/**
 * Public entrypoint for tracking synchronization.
 * Acquires the centralized execution lock for this shipment unless skipLock is specified.
 */
export async function syncTracking(shipmentId: string, options?: SyncOptions) {
  if (options?.skipLock) {
    return syncTrackingCore(shipmentId, options);
  }
  return runWithShipmentLock(shipmentId, () => syncTrackingCore(shipmentId, options));
}

/**
 * Core synchronization implementation.
 * Can be called directly by internal callers (e.g., webhook reconciliation) that already hold the lock.
 */
export async function syncTrackingCore(shipmentId: string, options?: SyncOptions) {
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

  // Execute database reads and updates atomically inside a transaction to prevent stale-read overwrites
  return await prisma.$transaction(async (tx) => {
    // Acquire database-level exclusive row lock across all instances
    await tx.$queryRaw`SELECT id FROM "shipments" WHERE id = ${shipment.id}::uuid FOR UPDATE`;

    // Re-read current state within transaction to guard against concurrent mutations
    const freshShipment = await tx.shipment.findUnique({
      where: { id: shipment.id },
      include: { history: true }
    });

    if (!freshShipment) {
      throw new Error(`Shipment ${shipmentId} disappeared during synchronization.`);
    }

    // Find the max occurred_at from existing history to know our current freshest state
    let maxDbDate = new Date(0);
    for (const h of freshShipment.history) {
      if (h.occurred_at.getTime() > maxDbDate.getTime()) {
        maxDbDate = h.occurred_at;
      }
    }

    let newEventsInserted = 0;
    const currentHistory = [...freshShipment.history];

    // Insert only genuinely new events, avoid duplicates
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
          const newHistoryRecord = await tx.shipmentStatusHistory.create({
            data: {
              shipment_id: freshShipment.id,
              status: event.status,
              location: event.location,
              note: finalNote,
              occurred_at: event.occurred_at,
            }
          });

          newEventsInserted++;
          currentHistory.push(newHistoryRecord);
        } catch (err: any) {
          console.error(`[Sync Error] Failed to insert event for ${freshShipment.official_tracking_id}:`, err.message);
        }
      }
    }

    // Determine highest milestone and latest chronological update from ALL history
    let highestAchievedEvent: any = null;
    let chronologicallyLatestEvent: any = null;

    for (const event of currentHistory) {
      if (!event) continue;

      if (!chronologicallyLatestEvent || event.occurred_at.getTime() >= chronologicallyLatestEvent.occurred_at.getTime()) {
        chronologicallyLatestEvent = event;
      }

      if (!highestAchievedEvent) {
        highestAchievedEvent = event;
      } else {
        const currentRank = getStatusRank(highestAchievedEvent.status, highestAchievedEvent.note);
        const newRank = getStatusRank(event.status, event.note);

        if (newRank > currentRank) {
          highestAchievedEvent = event;
        } else if (newRank === currentRank && event.occurred_at.getTime() > highestAchievedEvent.occurred_at.getTime()) {
          if (newRank < 100 || event.status === highestAchievedEvent.status) {
            highestAchievedEvent = event;
          }
        }
      }
    }

    const updateData: any = {};
    
    // Evaluate Estimated Delivery Date updates with completeness & SLA protection
    if (trackingData.estimated_delivery) {
      const parsedEdd = parseCalendarDate(trackingData.estimated_delivery);
      if (parsedEdd) {
        const existingEdd = freshShipment.estimated_delivery ? parseCalendarDate(freshShipment.estimated_delivery) : null;
        const totalManifestCount = trackingData.manifest_package_count || freshShipment.num_packages || 1;
        const returnedCount = trackingData.returned_package_count ?? 1;
        const isCompleteResponse = trackingData.is_complete_response !== false && returnedCount >= totalManifestCount;

        if (trackingData.is_dynamic_edd || trackingData.is_dynamic_edd === undefined) {
          if (!existingEdd) {
            // Initial dynamic EDD assignment
            updateData.estimated_delivery = parsedEdd;
          } else if (parsedEdd.getTime() >= existingEdd.getTime()) {
            // Same or later date: always accepted (even from partial response, because any delayed package delays whole shipment)
            updateData.estimated_delivery = parsedEdd;
          } else {
            // Earlier dynamic date:
            // Only accept earlier date if the response is verified complete (all packages accounted for).
            // A partial response (e.g. 1 of 8 waybills) must NEVER downgrade an established shipment EDD.
            if (isCompleteResponse) {
              updateData.estimated_delivery = parsedEdd;
            }
          }
        } else if (!existingEdd) {
          // Static promised SLA fallback is ONLY allowed if shipment has no EDD yet
          updateData.estimated_delivery = parsedEdd;
        }
      }
    }

    // Update status if higher milestone achieved
    const existingRank = getStatusRank(freshShipment.current_status, freshShipment.customer_update);
    const highestRank = highestAchievedEvent ? getStatusRank(highestAchievedEvent.status, highestAchievedEvent.note) : 0;

    if (highestAchievedEvent && (highestRank > existingRank || (highestRank === existingRank && highestAchievedEvent.status !== freshShipment.current_status))) {
      updateData.current_status = highestAchievedEvent.status;
      if (isCancelledOrReturnedStatus(highestAchievedEvent.status)) {
        updateData.profit = 0;
      } else if (isCancelledOrReturnedStatus(freshShipment.current_status)) {
        const received = Number(freshShipment.received_amount) || 0;
        const paid = Number(freshShipment.paid_amount) || 0;
        const misc = Number((freshShipment as any).miscellaneous_charges) || 0;
        updateData.profit = Math.round((received - paid - misc) * 100) / 100;
      }
    }

    // Update location from the chronologically latest event if newer than maxDbDate or first sync
    if (chronologicallyLatestEvent && (chronologicallyLatestEvent.occurred_at.getTime() >= maxDbDate.getTime() || currentHistory.length === newEventsInserted)) {
      if (chronologicallyLatestEvent.location && chronologicallyLatestEvent.location !== freshShipment.current_location) {
        updateData.current_location = chronologicallyLatestEvent.location;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await tx.shipment.update({
        where: { id: freshShipment.id },
        data: updateData
      });
    }

    return {
      success: true,
      shipment_id: freshShipment.tracking_id,
      new_events: newEventsInserted,
      current_status: updateData.current_status || freshShipment.current_status,
      estimated_delivery: updateData.estimated_delivery || freshShipment.estimated_delivery,
    };
  }, {
    maxWait: 10000,
    timeout: 10000,
  });
}
