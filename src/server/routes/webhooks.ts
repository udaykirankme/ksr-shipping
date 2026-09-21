import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/db';
import { parseBusinessDateTime } from '@/lib/datetime';
import { isDuplicateEvent } from '@/lib/courier/identity';

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

const normalizeService = (serviceName: string | null | undefined): string => {
  if (!serviceName) return '';
  return serviceName.toLowerCase().replace(/[\s\-_]+/g, '');
};

// Centralized core logic to update the shipment and prevent duplicates
export const processWebhookEventCore = async (
  officialTrackingId: string, 
  expectedServiceNormalized: string, 
  eventStatus: string, 
  eventLocation: string | undefined, 
  eventTimeStr: string | undefined, 
  eventCustomerUpdate: string | undefined, 
  estimatedDeliveryStr: string | undefined,
  payload: any
): Promise<{ status: number, message: string }> => {
  try {
    if (!officialTrackingId) {
      console.warn('[Webhook] Received payload without a valid tracking identifier.');
      return { status: 400, message: 'Missing tracking identifier' };
    }

    // Prepare timestamp for DB filtering
    const nowMs = Date.now();

    let parsedTimeStr = eventTimeStr;
    if (parsedTimeStr && !parsedTimeStr.includes('Z') && !parsedTimeStr.includes('+')) {
      parsedTimeStr = parsedTimeStr.replace(' ', 'T') + '+05:30';
    }

    let occurredAt = parsedTimeStr ? new Date(parsedTimeStr) : new Date();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    
    if (
      isNaN(occurredAt.getTime()) || 
      occurredAt.getFullYear() <= 1970 || 
      occurredAt.getTime() > nowMs + twentyFourHoursMs
    ) {
       console.warn(`[Webhook] Invalid or far-future timestamp received for ${officialTrackingId}: ${occurredAt.toISOString()}. Falling back to current time.`);
       occurredAt = new Date();
    }

    const timeLowerBound = new Date(occurredAt.getTime() - 60000);
    const timeUpperBound = new Date(occurredAt.getTime() + 60000);

    // 1. Load the shipment using the official tracking ID (AWB / LR)
    const shipment = await prisma.shipment.findUnique({
      where: { official_tracking_id: officialTrackingId },
      select: { id: true, service: true }
    });

    if (!shipment) {
      console.info(`[Webhook] Received event for unknown shipment: ${officialTrackingId}. Storing in PendingWebhookEvent.`);
      await prisma.pendingWebhookEvent.create({
        data: {
          official_tracking_id: officialTrackingId,
          provider: expectedServiceNormalized,
          payload: payload || {}
        }
      });
      return { status: 200, message: 'Event ignored (Unknown shipment) but stored as pending' };
    }

    // 2. Verify the provider matches
    const shipmentServiceNormalized = normalizeService(shipment.service);
    if (shipmentServiceNormalized !== expectedServiceNormalized) {
      console.warn(`[Webhook] Provider mismatch for ${officialTrackingId}. Expected ${expectedServiceNormalized}, found ${shipmentServiceNormalized}.`);
      return { status: 200, message: 'Event ignored (Provider mismatch)' };
    }

    // 3. Deduplication Logic - Targeted Query
    // Fetch recent events to run deterministic composite identity check
    const potentialDuplicates = await prisma.shipmentStatusHistory.findMany({
      where: {
        shipment_id: shipment.id,
        occurred_at: { gte: timeLowerBound, lte: timeUpperBound }
      }
    });

    const incomingEventForDedup = {
      status: eventStatus,
      location: eventLocation || null,
      occurred_at: occurredAt,
      note: eventCustomerUpdate,
      raw_status: eventStatus,
    };

    const duplicateCheck = potentialDuplicates.find(existing =>
      isDuplicateEvent(existing, incomingEventForDedup)
    );

    if (duplicateCheck) {
      return { status: 200, message: 'Event already recorded' };
    }

    // 4. Event Ordering Check - Find latest known event
    const latestHistory = await prisma.shipmentStatusHistory.findFirst({
      where: { shipment_id: shipment.id },
      orderBy: { occurred_at: 'desc' },
      select: { occurred_at: true }
    });

    const isNewerOrEqual = !latestHistory || occurredAt.getTime() >= latestHistory.occurred_at.getTime();

    // 5. Update the Database
    const finalNote = eventCustomerUpdate?.trim() ? `Webhook Update: ${eventCustomerUpdate.trim()}` : `Webhook Update: ${eventStatus}`;

    const updateData: any = {
      history: {
        create: {
          status: eventStatus,
          location: eventLocation || null,
          note: finalNote,
          occurred_at: occurredAt,
        }
      }
    };

    // ONLY update main shipment state if this event is chronologically the newest
    if (isNewerOrEqual) {
      updateData.current_status = eventStatus;
      updateData.version = { increment: 1 };
      
      if (eventLocation) {
        updateData.current_location = eventLocation;
      }
      
      if (eventCustomerUpdate && eventCustomerUpdate.trim() !== '') {
        updateData.customer_update = eventCustomerUpdate.trim();
      }
      
      if (eventStatus.toLowerCase() === 'delivered') {
         updateData.delivered_at = occurredAt;
      }
    }

    if (estimatedDeliveryStr) {
      let ed = estimatedDeliveryStr;
      if (!ed.includes('Z') && !ed.includes('+')) {
        ed = ed.replace(' ', 'T') + '+05:30';
      }
      const edDate = new Date(ed);
      if (!isNaN(edDate.getTime()) && edDate.getFullYear() > 1970) {
        updateData.estimated_delivery = edDate;
      }
    }

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData
    });

    // 5. Respond quickly with 200 OK (<=500ms requirement)
    return { status: 200, message: 'Event recorded' };

  } catch (error: any) {
    console.error(`[Webhook Error] Failed to process event for ${officialTrackingId}:`, error.message);
    throw error;
  }
};

export const processWebhookEvent = async (
  officialTrackingId: string, 
  expectedServiceNormalized: string, 
  eventStatus: string, 
  eventLocation: string | undefined, 
  eventTimeStr: string | undefined, 
  eventCustomerUpdate: string | undefined, 
  estimatedDeliveryStr: string | undefined,
  payload: any, 
  res: Response
) => {
  try {
    const result = await processWebhookEventCore(
      officialTrackingId, 
      expectedServiceNormalized, 
      eventStatus, 
      eventLocation, 
      eventTimeStr, 
      eventCustomerUpdate, 
      estimatedDeliveryStr, 
      payload
    );
    return res.status(result.status).json({ success: result.status >= 200 && result.status < 300, message: result.message });
  } catch (error: any) {
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
    const eventCustomerUpdate = statusObj.Instructions;

    if (!eventStatus) {
       console.warn(`[Webhook B2C] Missing Status in payload for AWB ${awb}.`);
       return res.status(400).json({ success: false, message: 'Missing Status' });
    }

    const estimatedDeliveryStr = payload.Shipment.ExpectedDeliveryDate;

    await processWebhookEvent(awb, 'delhiveryb2c', eventStatus, eventLocation, eventTimeStr, eventCustomerUpdate, estimatedDeliveryStr, payload, res);
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
    const eventCustomerUpdate = payload.shipment_remark;

    if (!eventStatus) {
       console.warn(`[Webhook B2B] Missing Status in payload for LR ${lrnum}.`);
       return res.status(400).json({ success: false, message: 'Missing Status' });
    }

    const estimatedDeliveryStr = payload.estimated_date || payload.promised_delivery_date;

    await processWebhookEvent(lrnum, 'delhiveryb2b', eventStatus, eventLocation, eventTimeStr, eventCustomerUpdate, estimatedDeliveryStr, payload, res);
  } catch (error) {
    console.error('[Webhook B2B] Unhandled error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
