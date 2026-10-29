// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../../lib/db';

const TEST_TRACKING_ID = 'KSR_TEST_AUDIT_999';

describe('Public Tracking API (/api/track) Customer-Facing Status Audit', () => {
  let createdShipmentId: string | null = null;

  beforeAll(async () => {
    // Clean up if existing
    await prisma.shipment.deleteMany({
      where: { tracking_id: TEST_TRACKING_ID }
    });

    // Create a shipment with internal codes in current_status and history
    const shipment = await prisma.shipment.create({
      data: {
        tracking_id: TEST_TRACKING_ID,
        official_tracking_id: 'OFFICIAL_999',
        tracking_type: 'DOMESTIC',
        shipment_type: 'PARCEL',
        service: 'delhivery-b2b',
        current_status: 'UD', // Legacy internal code in DB
        current_location: 'Hyderabad Hub',
        customer_update: 'Vehicle departed from client location',
        history: {
          create: [
            {
              status: 'UD',
              note: 'Vehicle departed from client location',
              location: 'Hyderabad Hub',
              occurred_at: new Date('2026-10-29T14:48:52.000Z')
            },
            {
              status: 'UD',
              note: 'Shipment picked up',
              location: 'Hyderabad Hub',
              occurred_at: new Date('2026-10-29T14:43:04.000Z')
            },
            {
              status: 'DL',
              note: 'Delivered',
              location: 'Customer Address',
              occurred_at: new Date('2026-10-30T10:00:00.000Z')
            },
            {
              status: 'RT',
              note: 'Returned',
              location: 'Origin Hub',
              occurred_at: new Date('2026-10-28T12:00:00.000Z')
            },
            {
              status: 'XX',
              note: 'Ambiguous internal scan',
              location: 'Transit Junction',
              occurred_at: new Date('2026-10-28T10:00:00.000Z')
            },
            {
              status: 'MANIFESTED',
              note: 'Manifest uploaded',
              location: 'Hyderabad Hub',
              occurred_at: new Date('2026-10-28T09:00:00.000Z')
            }
          ]
        }
      }
    });
    createdShipmentId = shipment.id;
  });

  afterAll(async () => {
    if (createdShipmentId) {
      await prisma.shipmentStatusHistory.deleteMany({
        where: { shipment_id: createdShipmentId }
      });
      await prisma.shipment.delete({
        where: { id: createdShipmentId }
      });
    }
  });

  it('guarantees POST /api/track resolves current_status and history statuses, eliminating raw codes', async () => {
    const res = await request(app)
      .post('/api/track')
      .send({ trackingNumber: TEST_TRACKING_ID });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;

    // 1. Current status badge must be resolved to Title Case human-readable status, NEVER "UD"
    expect(data.current_status).toBe('Vehicle Departed');
    expect(data.current_status).not.toBe('UD');

    // 2. All history events must be sanitized and resolved
    const statuses = data.history.map((h: any) => h.status);

    // No internal raw codes may be exposed
    expect(statuses).not.toContain('UD');
    expect(statuses).not.toContain('DL');
    expect(statuses).not.toContain('RT');
    expect(statuses).not.toContain('XX');
    expect(statuses).not.toContain('MANIFESTED');

    // Human-readable resolved statuses must be present
    expect(statuses).toContain('Vehicle Departed');
    expect(statuses).toContain('Picked Up');
    expect(statuses).toContain('Delivered');
    expect(statuses).toContain('Returned');
    expect(statuses).toContain('In Transit'); // Fallback for XX
    expect(statuses).toContain('Manifested');
  });
});
