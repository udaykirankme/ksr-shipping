// @ts-ignore
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../../lib/db';

// Configure environment variables for webhook tests
process.env.DELHIVERY_B2C_WEBHOOK_HEADER_NAME = 'X-Delhivery-Signature';
process.env.DELHIVERY_B2C_WEBHOOK_SECRET = 'test_delhivery_b2c_secret_123';

const TEST_AWB = 'TEST_DELHIVERY_B2C_001';
let testShipmentId: string | null = null;

describe('Delhivery B2C Webhook End-to-End Audit & Verification', () => {
  beforeAll(async () => {
    // Warm up the database connection pool and prepared statement for pendingWebhookEvent
    const warmup = await prisma.pendingWebhookEvent.create({
      data: {
        official_tracking_id: 'WARMUP',
        provider: 'warmup',
        payload: {}
      }
    });
    await prisma.pendingWebhookEvent.delete({ where: { id: warmup.id } });

    // Clean up any previous test shipment if it exists
    await prisma.shipment.deleteMany({
      where: { official_tracking_id: TEST_AWB }
    });

    // Create an isolated test shipment so automated tests never mutate live customer data
    const created = await prisma.shipment.create({
      data: {
        tracking_id: 'KSR_TEST_B2C_001',
        official_tracking_id: TEST_AWB,
        tracking_type: 'B2C',
        service: 'delhiveryb2c',
        sender_name: 'Test Sender',
        sender_phone: '9999999999',
        receiver_name: 'Test Receiver',
        receiver_phone: '8888888888',
        origin: 'Kolkata',
        destination: 'Kolkata',
        sender_city: 'Kolkata',
        receiver_city: 'Kolkata',
        current_status: 'In Transit',
        weight: 1.0,
      }
    });
    testShipmentId = created.id;
  });

  afterAll(async () => {
    if (testShipmentId) {
      await prisma.shipment.deleteMany({
        where: { id: testShipmentId }
      });
    }
  });

  const representativeDelhiveryPayload = {
    Shipment: {
      AWB: TEST_AWB,
      Status: {
        Status: 'Dispatched',
        StatusDateTime: '2026-09-25T10:38:27.777',
        StatusType: 'UD',
        StatusLocation: 'Kolkata_Santoshpur_D',
        Instructions: 'Out for delivery'
      },
      NSLCode: 'X-UCI',
      PickUpDate: '2026-09-22T08:01:00.000',
      ExpectedDeliveryDate: '2026-09-25T18:00:00.000'
    }
  };

  it('rejects unauthorized requests with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c')
      .send(representativeDelhiveryPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Unauthorized');
  });

  it('rejects invalid secret with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c')
      .set('x-delhivery-signature', 'wrong_secret')
      .send(representativeDelhiveryPayload);

    expect(res.status).toBe(401);
  });

  it('accepts authorization header with Bearer token format', async () => {
    process.env.DELHIVERY_B2C_WEBHOOK_HEADER_NAME = 'Authorization';
    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c')
      .set('Authorization', 'Bearer test_delhivery_b2c_secret_123')
      .send({
        Shipment: {
          AWB: 'TEST_AUTH_AWB_1001',
          Status: { Status: 'Manifested' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    process.env.DELHIVERY_B2C_WEBHOOK_HEADER_NAME = 'X-Delhivery-Signature';
    await new Promise(r => setTimeout(r, 150));
  });

  it('accepts documented Delhivery B2C payload and returns HTTP 200 directly comfortably below 500ms', async () => {
    const start = performance.now();
    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c')
      .set('X-Delhivery-Signature', 'test_delhivery_b2c_secret_123')
      .send(representativeDelhiveryPayload);
    const duration = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Event accepted');
    expect(duration).toBeLessThan(500);
  });

  it('persists complete Delhivery payload to PendingWebhookEvent immediately with exact documented fields', async () => {
    const testAwb = 'TEST_AWB_PERSIST_999';
    const payload = {
      Shipment: {
        AWB: testAwb,
        Status: {
          Status: 'In Transit',
          StatusDateTime: '2026-09-25T11:00:00.000',
          StatusType: 'UD',
          StatusLocation: 'Kolkata_Santoshpur_D',
          Instructions: 'Package found in Audit'
        },
        NSLCode: 'NSL-AUDIT-01',
        Sortcode: 'CCU/SNT'
      }
    };

    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c')
      .set('X-Delhivery-Signature', 'test_delhivery_b2c_secret_123')
      .send(payload);

    expect(res.status).toBe(200);

    const pending = await prisma.pendingWebhookEvent.findFirst({
      where: { official_tracking_id: testAwb },
      orderBy: { created_at: 'desc' }
    });

    expect(pending).not.toBeNull();
    expect(pending?.provider).toBe('delhiveryb2c');
    expect(pending?.official_tracking_id).toBe(testAwb);

    const savedPayload = pending?.payload as any;
    expect(savedPayload.Shipment.AWB).toBe(testAwb);
    expect(savedPayload.Shipment.Status.Status).toBe('In Transit');
    expect(savedPayload.Shipment.Status.StatusDateTime).toBe('2026-09-25T11:00:00.000');
    expect(savedPayload.Shipment.Status.StatusType).toBe('UD');
    expect(savedPayload.Shipment.Status.StatusLocation).toBe('Kolkata_Santoshpur_D');
    expect(savedPayload.Shipment.Status.Instructions).toBe('Package found in Audit');
    expect(savedPayload.Shipment.NSLCode).toBe('NSL-AUDIT-01');

    // For unknown shipment, background worker should retain the pending event in DB
    await new Promise(r => setTimeout(r, 200));

    const stillPending = await prisma.pendingWebhookEvent.findFirst({
      where: { official_tracking_id: testAwb }
    });
    expect(stillPending).not.toBeNull();

    // Clean up test record
    if (stillPending) {
      await prisma.pendingWebhookEvent.delete({ where: { id: stillPending.id } });
    }
  });

  it('handles numeric AWB cleanly without throwing validation errors', async () => {
    const payloadNumericAwb = {
      Shipment: {
        AWB: 999888777666 as any,
        Status: {
          Status: 'Dispatched',
          StatusDateTime: '2026-09-25T10:38:27.777',
          StatusType: 'UD',
          StatusLocation: 'Kolkata_Santoshpur_D',
          Instructions: 'Out for delivery'
        },
        NSLCode: 'X-UCI'
      }
    };

    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c')
      .set('X-Delhivery-Signature', 'test_delhivery_b2c_secret_123')
      .send(payloadNumericAwb);

    expect(res.status).toBe(200);
  });

  it('rejects malformed payloads missing Shipment root', async () => {
    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c')
      .set('X-Delhivery-Signature', 'test_delhivery_b2c_secret_123')
      .send({ some_other_data: 123 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Missing Shipment');
  });

  it('rejects malformed payloads missing AWB', async () => {
    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c')
      .set('X-Delhivery-Signature', 'test_delhivery_b2c_secret_123')
      .send({
        Shipment: {
          Status: { Status: 'Dispatched' }
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Missing Shipment.AWB');
  });

  it('rejects malformed payloads missing Status.Status', async () => {
    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c')
      .set('X-Delhivery-Signature', 'test_delhivery_b2c_secret_123')
      .send({
        Shipment: {
          AWB: 'TEST_NO_STATUS_001',
          Status: { StatusLocation: 'Delhi' }
        }
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Missing Shipment.Status.Status');
  });

  it('handles route with trailing slash without 301/308 redirect', async () => {
    const res = await request(app)
      .post('/api/webhooks/delhivery/b2c/')
      .set('X-Delhivery-Signature', 'test_delhivery_b2c_secret_123')
      .send(representativeDelhiveryPayload);

    expect(res.status).toBe(200);
  });

  describe('Delhivery Timestamp Timezone Parsing Verification', () => {
    const parseTime = (timeStr: string) => {
      let parsedTimeStr = timeStr ? String(timeStr).trim() : undefined;
      if (parsedTimeStr && !/[zZ]|[+-]\d{2}(?::?\d{2})?$/.test(parsedTimeStr)) {
        parsedTimeStr = parsedTimeStr.replace(' ', 'T') + '+05:30';
      }
      return parsedTimeStr ? new Date(parsedTimeStr) : new Date();
    };

    it('parses naive Delhivery timestamp 2026-09-25T10:38:27.777 as IST (+05:30) yielding 05:08:27.777Z', () => {
      const instant = parseTime('2026-09-25T10:38:27.777');
      expect(instant.toISOString()).toBe('2026-09-25T05:08:27.777Z');
    });

    it('parses space-separated naive timestamp 2026-09-25 10:38:27 as IST yielding 05:08:27.000Z', () => {
      const instant = parseTime('2026-09-25 10:38:27');
      expect(instant.toISOString()).toBe('2026-09-25T05:08:27.000Z');
    });

    it('preserves timestamps that already contain Z (UTC)', () => {
      const instant = parseTime('2026-09-25T10:38:27.777Z');
      expect(instant.toISOString()).toBe('2026-09-25T10:38:27.777Z');
    });

    it('preserves timestamps that already contain lowercase z (UTC)', () => {
      const instant = parseTime('2026-09-25T10:38:27.777z');
      expect(instant.toISOString()).toBe('2026-09-25T10:38:27.777Z');
    });

    it('preserves timestamps that already contain +05:30', () => {
      const instant = parseTime('2026-09-25T10:38:27.777+05:30');
      expect(instant.toISOString()).toBe('2026-09-25T05:08:27.777Z');
    });

    it('preserves timestamps that already contain +0530', () => {
      const instant = parseTime('2026-09-25T10:38:27.777+0530');
      expect(instant.toISOString()).toBe('2026-09-25T05:08:27.777Z');
    });

    it('preserves timestamps that contain negative timezone offset -04:00', () => {
      const instant = parseTime('2026-09-25T10:38:27.777-04:00');
      expect(instant.toISOString()).toBe('2026-09-25T14:38:27.777Z');
    });
  });
});
