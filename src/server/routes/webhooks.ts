import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/db';
import { parseBusinessDateTime } from '@/lib/datetime';

const router = Router();

// --- Configuration ---
// These are read dynamically per request so they don't crash the server if missing at startup.
// They must be configured in the production environment.
const getB2CConfig = () => ({
  headerName: process.env.DELHIVERY_B2C_WEBHOOK_HEADER_NAME || '',
  secret: process.env.DELHIVERY_B2C_WEBHOOK_SECRET || ''
});

const getB2BConfig = () => ({
  headerName: process.env.DELHIVERY_B2B_WEBHOOK_HEADER_NAME || '',
  secret: process.env.DELHIVERY_B2B_WEBHOOK_SECRET || ''
});

// --- Authentication Middleware ---
const verifyWebhookAuth = (type: 'b2c' | 'b2b') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const config = type === 'b2c' ? getB2CConfig() : getB2BConfig();
    
    if (!config.headerName || !config.secret) {
      console.error(`[Webhook ${type}] Auth configuration missing on server.`);
      return res.status(500).json({ success: false, message: 'Server configuration error' });
    }

    // The incoming header might be lowercased by Express/Node
    const providedSecret = req.headers[config.headerName.toLowerCase()];

    if (!providedSecret || providedSecret !== config.secret) {
      console.warn(`[Webhook ${type}] Unauthorized attempt. Invalid or missing header: ${config.headerName}`);
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    next();
  };
};

// --- Helper Functions ---

// Normalizes the service name to safely compare with the webhook route type
const normalizeService = (serviceName: string | null | undefined): string => {
  if (!serviceName) return '';
  return serviceName.toLowerCase().replace(/[\s\-]+/g, '');
};

// Centralized logic to update the shipment and prevent duplicates
const processWebhookEvent = async (
  officialTrackingId: string,
  expectedServiceNormalized: string,
  eventStatus: string,
  eventLocation: string,
  eventTimeStr: string | null | undefined,
  rawPayload: any,
  res: Response
) => {
  try {
    if (!officialTrackingId) {
      console.warn('[Webhook] Received payload without a valid tracking identifier.');
      return res.status(400).json({ success: false, message: 'Missing tracking identifier' });
    }

    // 1. Load the shipment using the official tracking ID (AWB / LR)
    const shipment = await prisma.shipment.findUnique({
      where: { official_tracking_id: officialTrackingId },
      include: { history: true }
    });

    if (!shipment) {
      // User Modification #2: Return 200 OK for unknown shipments to avoid undocumented retry loops,
      // but log it safely.
      console.info(`[Webhook] Received event for unknown shipment: ${officialTrackingId}. Ignoring.`);
      return res.status(200).json({ success: true, message: 'Event ignored (Unknown shipment)' });
    }

    // 2. Verify the provider matches
    const shipmentServiceNormalized = normalizeService(shipment.service);
    if (shipmentServiceNormalized !== expectedServiceNormalized) {
      console.warn(`[Webhook] Provider mismatch for ${officialTrackingId}. Expected ${expectedServiceNormalized}, found ${shipmentServiceNormalized}.`);
      // Return 200 to prevent retries of cross-contaminated events, but log the conflict.
      return res.status(200).json({ success: true, message: 'Event ignored (Provider mismatch)' });
    }

    // 3. Deduplication Logic
    // Delhivery webhooks don't guarantee unique event IDs in their basic payloads, so we match on time/status/location.
    // WARNING (Race Condition): Since we cannot add a UNIQUE database constraint without a migration, 
    // there is a theoretical microsecond read-modify-write race condition here. If two identical payloads 
    // arrive at the exact same millisecond, they could both insert a history record.
    let occurredAt = eventTimeStr ? new Date(eventTimeStr) : new Date();
    
    // Validate timestamp: 
    // 1. Must be a valid date.
    // 2. Must be after 1970.
    // 3. Must not be unreasonably in the future (allow 24 hours clock skew).
    // If invalid, fallback safely to the current time to preserve chronology.
    const nowMs = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    
    if (
      isNaN(occurredAt.getTime()) || 
      occurredAt.getFullYear() <= 1970 || 
      occurredAt.getTime() > nowMs + twentyFourHoursMs
    ) {
       console.warn(`[Webhook] Invalid or far-future timestamp received for ${officialTrackingId}: ${occurredAt.toISOString()}. Falling back to current time.`);
       occurredAt = new Date();
    }

    const isDuplicate = shipment.history.some(existingEvent => {
      const existingTime = existingEvent.occurred_at.getTime();
      const newTime = occurredAt.getTime();
      
      const timeMatches = Math.abs(existingTime - newTime) < 60000; // Within 1 minute tolerance
      const statusMatches = existingEvent.status === eventStatus;
      const locationMatches = (existingEvent.location || '') === (eventLocation || '');

      return timeMatches && statusMatches && locationMatches;
    });

    if (isDuplicate) {
      // Acknowledge the webhook successfully but don't insert a duplicate record.
      return res.status(200).json({ success: true, message: 'Event already recorded' });
    }

    // 4. Update the Database
    const finalNote = `Webhook Update: ${eventStatus}`;

    // Execute in a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Create the history record
      await tx.shipmentStatusHistory.create({
        data: {
          shipment_id: shipment.id,
          status: eventStatus,
          location: eventLocation || null,
          note: finalNote,
          occurred_at: occurredAt,
        }
      });

      // Update the main shipment record
      const updateData: any = {
        current_status: eventStatus,
        version: { increment: 1 }
      };

      if (eventLocation) {
        updateData.current_location = eventLocation;
      }
      
      // We don't forcefully overwrite estimated_delivery unless the payload provides a strictly better one,
      // which basic scan push payloads often don't reliably provide in the standard schema.
      // If it's delivered, we can record the timestamp.
      if (eventStatus.toLowerCase() === 'delivered') {
         updateData.delivered_at = occurredAt;
      }

      await tx.shipment.update({
        where: { id: shipment.id },
        data: updateData
      });
    });

    // 5. Respond quickly with 200 OK (<=500ms requirement)
    return res.status(200).json({ success: true, message: 'Event recorded' });

  } catch (error: any) {
    console.error(`[Webhook Error] Failed to process event for ${officialTrackingId}:`, error.message);
    // Return 500 for genuine server/DB errors so the provider knows it failed on our end
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// ============================================================================
// B2C Webhook Route
// ============================================================================
router.post('/delhivery/b2c', verifyWebhookAuth('b2c'), async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Delhivery B2C payload format: { Shipment: { AWB, Status: { Status, StatusDateTime, StatusLocation }, ... } }
    if (!payload || !payload.Shipment) {
       console.warn('[Webhook B2C] Malformed payload received.');
       return res.status(400).json({ success: false, message: 'Malformed payload' });
    }

    const awb = payload.Shipment.AWB;
    const statusObj = payload.Shipment.Status || {};
    const eventStatus = statusObj.Status;
    const eventLocation = statusObj.StatusLocation;
    const eventTimeStr = statusObj.StatusDateTime || payload.Shipment.PickUpDate; // Fallback to other dates if needed

    if (!eventStatus) {
       console.warn(`[Webhook B2C] Missing Status in payload for AWB ${awb}.`);
       return res.status(400).json({ success: false, message: 'Missing Status' });
    }

    await processWebhookEvent(awb, 'delhiveryb2c', eventStatus, eventLocation, eventTimeStr, payload, res);
  } catch (error) {
    console.error('[Webhook B2C] Unhandled error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ============================================================================
// B2B Webhook Route
// ============================================================================
router.post('/delhivery/b2b', verifyWebhookAuth('b2b'), async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Delhivery B2B payload format: { lrnum, status, timestamp, location, ... }
    if (!payload) {
       console.warn('[Webhook B2B] Empty payload received.');
       return res.status(400).json({ success: false, message: 'Malformed payload' });
    }

    const lrnum = payload.lrnum;
    const eventStatus = payload.status;
    const eventLocation = payload.location;
    // B2B provides a unix timestamp or formatted string, handle safely
    const eventTimeStr = payload.timestamp ? (typeof payload.timestamp === 'number' ? new Date(payload.timestamp).toISOString() : payload.timestamp) : null;

    if (!eventStatus) {
       console.warn(`[Webhook B2B] Missing Status in payload for LR ${lrnum}.`);
       return res.status(400).json({ success: false, message: 'Missing Status' });
    }

    await processWebhookEvent(lrnum, 'delhiveryb2b', eventStatus, eventLocation, eventTimeStr, payload, res);
  } catch (error) {
    console.error('[Webhook B2B] Unhandled error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
