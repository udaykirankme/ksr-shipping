// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import * as sync from '@/lib/courier/sync';

vi.mock('@/lib/db', () => ({
  prisma: {
    pendingWebhookEvent: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    shipment: {
      findMany: vi.fn(),
    }
  }
}));

vi.mock('@/lib/courier/sync', () => ({
  syncTracking: vi.fn(),
}));

describe('Cron Job: sync-active-shipments', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CRON_SECRET = 'test_secret';
    vi.mocked(prisma.pendingWebhookEvent.findMany).mockResolvedValue([]);
  });

  const mockRequest = () => new NextRequest('http://localhost/api/cron', {
    headers: { authorization: 'Bearer test_secret' }
  });

  it('TEST 1: A batch with one successful shipment and one failed shipment returns HTTP 200 and reports failed: 1', async () => {
    vi.mocked(prisma.shipment.findMany).mockResolvedValue([
      { id: '1', tracking_id: 'SHIP1', is_active: true, current_status: 'Pending', official_tracking_id: '123', service: 'delhiveryb2c', created_at: new Date(), updated_at: new Date(), current_location: null, customer_update: null, estimated_delivery: null },
      { id: '2', tracking_id: 'SHIP2', is_active: true, current_status: 'Pending', official_tracking_id: '456', service: 'delhiveryb2c', created_at: new Date(), updated_at: new Date(), current_location: null, customer_update: null, estimated_delivery: null }
    ]);

    vi.mocked(sync.syncTracking)
      .mockResolvedValueOnce({ success: true, shipment_id: 'SHIP1', new_events: 1, current_status: 'Pending' }) // SHIP1 succeeds
      .mockRejectedValueOnce(new Error('Sync timeout')); // SHIP2 fails

    const response = await GET(mockRequest());
    const data = await response.json();

    // Must return HTTP 200 even on partial failure
    expect(response.status).toBe(200);

    // Must correctly report the failure in the JSON envelope
    expect(data).toMatchObject({
      success: false, // The internal success flag reflects failCount === 0
      total: 2,
      successful: 1,
      failed: 1,
      pendingProcessed: 0
    });
  });

  it('TEST 2: A fully successful batch returns HTTP 200', async () => {
    vi.mocked(prisma.shipment.findMany).mockResolvedValue([
      { id: '1', tracking_id: 'SHIP1', is_active: true, current_status: 'Pending', official_tracking_id: '123', service: 'delhiveryb2c', created_at: new Date(), updated_at: new Date(), current_location: null, customer_update: null, estimated_delivery: null }
    ]);

    vi.mocked(sync.syncTracking).mockResolvedValue({ success: true, shipment_id: 'SHIP1', new_events: 0, current_status: 'Pending' });

    const response = await GET(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      total: 1,
      successful: 1,
      failed: 0,
    });
  });
});
