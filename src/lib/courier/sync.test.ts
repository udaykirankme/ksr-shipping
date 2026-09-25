// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncTracking } from './sync';
import { prisma } from '@/lib/db';
import * as providerIndex from './index';
import { KSRTrackingStatus, TrackingEvent, TrackingResponse } from './types';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    shipment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    shipmentStatusHistory: {
      create: vi.fn(),
    },
  },
}));

const mockTrackShipment = vi.fn();
vi.mock('./index', () => ({
  getCourierProvider: vi.fn(() => ({
    trackShipment: mockTrackShipment,
  })),
}));

describe('Courier Sync: Status Desynchronization Healing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const timestampT = new Date('2026-09-25T14:53:00.000Z');
  const timestampTMinus1 = new Date('2026-09-25T10:38:00.000Z');
  const timestampTPlus1 = new Date('2026-09-25T18:00:00.000Z');

  const baseShipment = {
    id: 'shipment-123',
    tracking_id: 'KSR123',
    service: 'delhiveryb2c',
    official_tracking_id: 'AWB123',
    current_location: 'City',
    customer_update: 'Stale note',
  };

  it('CASE A: Heals desynchronized current_status when exactly matching latest history timestamp', async () => {
    // History contains Delivered at T. Shipment stuck at Out For Delivery.
    vi.mocked(prisma.shipment.findUnique).mockResolvedValue({
      ...baseShipment,
      current_status: 'Out For Delivery',
      history: [
        { id: 'h1', occurred_at: timestampT, status: 'Delivered', location: 'City', note: 'Delivered note', raw_status: 'Del' }
      ]
    } as any);

    // Provider returns exactly matching Delivered event at T
    mockTrackShipment.mockResolvedValue({
      current_status: 'Delivered',
      current_location: 'City',
      estimated_delivery: null,
      events: [
        { occurred_at: timestampT, status: 'Delivered', location: 'City', note: 'Delivered note', raw_status: 'Del' }
      ]
    });

    const result = await syncTracking('shipment-123');

    // Should NOT insert duplicate
    expect(prisma.shipmentStatusHistory.create).not.toHaveBeenCalled();
    // SHOULD heal current_status to Delivered
    expect(prisma.shipment.update).toHaveBeenCalledWith({
      where: { id: 'shipment-123' },
      data: expect.objectContaining({
        current_status: 'Delivered',
        customer_update: 'Delivered note',
      })
    });
    expect(result.current_status).toBe('Delivered');
  });

  it('CASE B: Skips redundant update when history and current_status are both correct', async () => {
    vi.mocked(prisma.shipment.findUnique).mockResolvedValue({
      ...baseShipment,
      current_status: 'Delivered',
      customer_update: 'Delivered note',
      history: [
        { id: 'h1', occurred_at: timestampT, status: 'Delivered', location: 'City', note: 'Delivered note', raw_status: 'Del' }
      ]
    } as any);

    mockTrackShipment.mockResolvedValue({
      current_status: 'Delivered',
      current_location: 'City',
      estimated_delivery: null,
      events: [
        { occurred_at: timestampT, status: 'Delivered', location: 'City', note: 'Delivered note', raw_status: 'Del' }
      ]
    });

    const result = await syncTracking('shipment-123');

    expect(prisma.shipmentStatusHistory.create).not.toHaveBeenCalled();
    // No update necessary
    expect(prisma.shipment.update).not.toHaveBeenCalled();
    expect(result.current_status).toBe('Delivered');
  });

  it('CASE C: Protects Delivered status from older Out For Delivery events', async () => {
    vi.mocked(prisma.shipment.findUnique).mockResolvedValue({
      ...baseShipment,
      current_status: 'Delivered',
      history: [
        { id: 'h1', occurred_at: timestampT, status: 'Delivered', location: 'City', note: 'Delivered note', raw_status: 'Del' }
      ]
    } as any);

    // Provider returns an older event (TMinus1)
    mockTrackShipment.mockResolvedValue({
      current_status: 'Out For Delivery',
      current_location: 'City',
      estimated_delivery: null,
      events: [
        { occurred_at: timestampTMinus1, status: 'Out For Delivery', location: 'City', note: 'OFD note', raw_status: 'OFD' }
      ]
    });

    const result = await syncTracking('shipment-123');

    // It will insert the missing older event
    expect(prisma.shipmentStatusHistory.create).toHaveBeenCalled();
    // But it MUST NOT change current_status to OFD
    expect(prisma.shipment.update).not.toHaveBeenCalled();
    expect(result.current_status).toBe('Delivered');
  });

  it('CASE D: Normal chronological progression (Out For Delivery -> Delivered)', async () => {
    vi.mocked(prisma.shipment.findUnique).mockResolvedValue({
      ...baseShipment,
      current_status: 'Out For Delivery',
      history: [
        { id: 'h1', occurred_at: timestampTMinus1, status: 'Out For Delivery', location: 'City', note: 'OFD note', raw_status: 'OFD' }
      ]
    } as any);

    mockTrackShipment.mockResolvedValue({
      current_status: 'Delivered',
      current_location: 'City',
      estimated_delivery: null,
      events: [
        { occurred_at: timestampTMinus1, status: 'Out For Delivery', location: 'City', note: 'OFD note', raw_status: 'OFD' },
        { occurred_at: timestampT, status: 'Delivered', location: 'City', note: 'Del note', raw_status: 'Del' }
      ]
    });

    const result = await syncTracking('shipment-123');

    // Inserts exactly one new event (Delivered)
    expect(prisma.shipmentStatusHistory.create).toHaveBeenCalledTimes(1);
    expect(prisma.shipmentStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'Delivered' }) })
    );

    // Updates parent shipment to Delivered
    expect(prisma.shipment.update).toHaveBeenCalledWith({
      where: { id: 'shipment-123' },
      data: expect.objectContaining({
        current_status: 'Delivered',
        customer_update: 'Del note',
      })
    });
    expect(result.current_status).toBe('Delivered');
  });
});
