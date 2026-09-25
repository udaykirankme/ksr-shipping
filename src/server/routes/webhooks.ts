import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/db';
import { parseBusinessDateTime } from '@/lib/datetime';
import { isDuplicateEvent } from '@/lib/courier/identity';
import { normalizeDelhiveryStatus } from '@/lib/courier/normalization';
import { registerBackgroundTask } from '@/lib/background-tasks';

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
    const rawHeader = req.headers[config.headerName.toLowerCase()];
    const providedSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!providedSecret) {
      console.warn(`[Webhook ${type}] Unauthorized attempt. Missing header: ${config.headerName}`);
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const cleanProvided = providedSecret.trim();
    const cleanSecret = config.secret.trim();

    const isMatch =
      cleanProvided === cleanSecret ||
      cleanProvided.replace(/^Bearer\s+/i, '') === cleanSecret ||
      cleanProvided === `Bearer ${cleanSecret}`;

    if (!isMatch) {
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

// In-memory mutex to serialize background processing per shipment, preventing concurrent insertion race conditions
const shipmentLocks = new Map<string, Promise<any>>();

export const runWithShipmentLock = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  const current = shipmentLocks.get(key) || Promise.resolve();
  let release: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  shipmentLocks.set(key, current.then(() => next, () => next));

  try {
    await current;
    return await fn();
  } finally {
    release!();
    if (shipmentLocks.get(key) === next) {
      shipmentLocks.delete(key);
    }
  }
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
  return runWithShipmentLock(officialTrackingId, async () => {
  try {
    // 0. Normalize the status strictly using the shared function
    const normalizedStatus = normalizeDelhiveryStatus(eventStatus, eventCustomerUpdate);

    if (!officialTrackingId) {
      console.warn('[Webhook] Received payload without a valid tracking identifier.');
      return { status: 400, message: 'Missing tracking identifier' };
    }

    // Prepare timestamp for DB filtering
    const nowMs = Date.now();

    let parsedTimeStr = eventTimeStr ? String(eventTimeStr).trim() : undefined;

    if (parsedTimeStr && !/[zZ]|[+-]\d{2}(?::?\d{2})?$/.test(parsedTimeStr)) {
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
      console.info(`[Webhook] Received event for unknown shipment: ${officialTrackingId}. Leaving in PendingWebhookEvent.`);
      return { status: 404, message: 'Event ignored (Unknown shipment)' };
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

    const finalNote = eventCustomerUpdate?.trim() || eventStatus?.trim() || 'Status updated';

    const incomingEventForDedup = {
      status: normalizedStatus,
      location: eventLocation || null,
      occurred_at: occurredAt,
      note: finalNote,
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
    const updateData: any = {
      history: {
        create: {
          status: normalizedStatus,
          location: eventLocation || null,
          note: finalNote,
          occurred_at: occurredAt,
        }
      }
    };

    // ONLY update main shipment state if this event is chronologically the newest
    if (isNewerOrEqual) {
      updateData.current_status = normalizedStatus;
      updateData.version = { increment: 1 };

      if (eventLocation) {
        updateData.current_location = eventLocation;
      }

      if (eventCustomerUpdate && eventCustomerUpdate.trim() !== '') {
        updateData.customer_update = eventCustomerUpdate.trim();
      }

      if (normalizedStatus.toLowerCase() === 'delivered') {
         updateData.delivered_at = occurredAt;
      }
    }

    if (estimatedDeliveryStr) {
      let ed = String(estimatedDeliveryStr).trim();
      if (!/[zZ]|[+-]\d{2}(?::?\d{2})?$/.test(ed)) {
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
  });
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
  req: Request,
  res: Response
) => {
  const start = performance.now();
  try {
    // 1. Insert into PendingWebhookEvent FIRST immediately before responding
    const pendingEvent = await prisma.pendingWebhookEvent.create({
      data: {
        official_tracking_id: officialTrackingId,
        provider: expectedServiceNormalized,
        payload: payload || {}
      }
    });

    // 2. Schedule background worker to process persisted event after fast-ack response
    const executeWorker = async () => {
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

        // Delete from PendingWebhookEvent ONLY on success or deduplicated success (HTTP 2xx).
        // If unknown shipment (404) or processing fails, keep the pending event for retry.
        if (result.status >= 200 && result.status < 300) {
          await prisma.pendingWebhookEvent.delete({ where: { id: pendingEvent.id } });
        }
      } catch (err) {
        console.error(`[Webhook Worker] Failed processing pending event ${pendingEvent.id}:`, err);
      }
    };

    const requestId = req.headers['x-internal-request-id'] as string;
    if (requestId) {
      registerBackgroundTask(requestId, executeWorker);
    } else {
      // Standalone, direct Express execution, or test environment fallback
      setImmediate(executeWorker);
    }

    const duration = performance.now() - start;
    console.log(`[Webhook Ingestion] Accepted ${officialTrackingId} via ${expectedServiceNormalized} in ${duration.toFixed(2)}ms (Pending ID: ${pendingEvent.id})`);

    // 3. Respond quickly with 200 OK after persistence
    return res.status(200).json({ success: true, message: 'Event accepted' });
  } catch (error: any) {
    console.error('[Webhook Ingestion Error]', error.message);
    // Return 500 for genuine DB errors so Delhivery retries
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// ============================================================================
// B2C Webhook Route
// ============================================================================
router.post(['/delhivery/b2c', '/delhivery/b2c/'], verifyWebhookAuth('b2c'), async (req: Request, res: Response) => {
  try {
    let payload = req.body;

    // Handle stringified body if not parsed by express.json()
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (err) {
        console.warn('[Webhook B2C] Failed to parse JSON string payload:', err);
      }
    }

    // Handle array-wrapped payload if sent as an array
    if (Array.isArray(payload)) {
      payload = payload[0];
    } else if (payload && Array.isArray(payload.Shipments)) {
      payload = { Shipment: payload.Shipments[0] };
    }

    // Delhivery B2C payload format:
    // {
    //   Shipment: {
    //     AWB: string | number,
    //     Status: {
    //       Status: string,
    //       StatusDateTime: string,
    //       StatusType: string,
    //       StatusLocation: string,
    //       Instructions: string
    //     },
    //     NSLCode: string,
    //     PickUpDate?: string,
    //     ExpectedDeliveryDate?: string
    //   }
    // }
    if (!payload || !payload.Shipment) {
      console.warn('[Webhook B2C] Malformed payload received: Missing Shipment root object.');
      return res.status(400).json({ success: false, message: 'Malformed payload: Missing Shipment' });
    }

    const rawAwb = payload.Shipment.AWB;
    const awb = (rawAwb !== undefined && rawAwb !== null) ? String(rawAwb).trim() : '';
    if (!awb) {
      console.warn('[Webhook B2C] Missing or empty Shipment.AWB in payload.');
      return res.status(400).json({ success: false, message: 'Missing Shipment.AWB' });
    }

    const statusObj = (payload.Shipment.Status && typeof payload.Shipment.Status === 'object')
      ? payload.Shipment.Status
      : {};

    const eventStatus = (
      typeof payload.Shipment.Status === 'string'
        ? payload.Shipment.Status
        : (statusObj.Status || payload.Shipment.StatusType || '')
    ).trim();

    if (!eventStatus) {
      console.warn(`[Webhook B2C] Missing Status in payload for AWB ${awb}.`);
      return res.status(400).json({ success: false, message: 'Missing Shipment.Status.Status' });
    }

    const eventLocation = (statusObj.StatusLocation || payload.Shipment.StatusLocation || '').trim() || undefined;
    const eventTimeStr = statusObj.StatusDateTime || payload.Shipment.StatusDateTime || payload.Shipment.PickUpDate || undefined;
    const eventCustomerUpdate = (statusObj.Instructions || payload.Shipment.Instructions || '').trim() || undefined;
    const estimatedDeliveryStr = payload.Shipment.ExpectedDeliveryDate || undefined;

    await processWebhookEvent(
      awb,
      'delhiveryb2c',
      eventStatus,
      eventLocation,
      eventTimeStr,
      eventCustomerUpdate,
      estimatedDeliveryStr,
      payload,
      req,
      res
    );
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

    await processWebhookEvent(lrnum, 'delhiveryb2b', eventStatus, eventLocation, eventTimeStr, eventCustomerUpdate, estimatedDeliveryStr, payload, req, res);
  } catch (error) {
    console.error('[Webhook B2B] Unhandled error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
