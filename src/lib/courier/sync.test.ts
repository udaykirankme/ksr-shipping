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
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mocked-id', ...data })),
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
      customer_update: 'Delivered note',
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
  it('TEST 1 & 5: Milestone Regression Protection - Out For Delivery -> newer Pending', async () => {
    vi.mocked(prisma.shipment.findUnique).mockResolvedValue({
      ...baseShipment,
      current_status: 'Out For Delivery',
      history: [
        { id: 'h1', occurred_at: timestampTMinus1, status: 'Out For Delivery', location: 'City', note: 'OFD note', raw_status: 'OFD' }
      ]
    } as any);

    // Provider returns both the old OFD event AND a NEWER Pending event
    mockTrackShipment.mockResolvedValue({
      current_status: 'Pending',
      current_location: 'New City',
      estimated_delivery: null,
      events: [
        { occurred_at: timestampTMinus1, status: 'Out For Delivery', location: 'City', note: 'OFD note', raw_status: 'OFD' },
        { occurred_at: timestampT, status: 'Pending', location: 'New City', note: 'Consignee Unavailable', raw_status: 'Pending' }
      ]
    });

    const result = await syncTracking('shipment-123');

    // Should insert the new Pending event
    expect(prisma.shipmentStatusHistory.create).toHaveBeenCalledTimes(1);
    
    // SHOULD keep current_status as 'Out For Delivery' (no regression), but update customer_update and current_location
    expect(prisma.shipment.update).toHaveBeenCalledWith({
      where: { id: 'shipment-123' },
      data: expect.objectContaining({
        current_location: 'New City',
        customer_update: 'Consignee Unavailable',
      })
    });
    // The returned status should be the resolved one (Out For Delivery)
    expect(result.current_status).toBe('Out For Delivery');
  });

  it('TEST 2: Late-arriving higher milestone - Pending already processed -> late Out For Delivery', async () => {
    vi.mocked(prisma.shipment.findUnique).mockResolvedValue({
      ...baseShipment,
      current_status: 'Pending',
      customer_update: 'Consignee Unavailable',
      history: [
        { id: 'h1', occurred_at: timestampT, status: 'Pending', location: 'New City', note: 'Consignee Unavailable', raw_status: 'Pending' }
      ]
    } as any);

    // Provider now ALSO returns the OLDER Out For Delivery event that was previously missed
    mockTrackShipment.mockResolvedValue({
      current_status: 'Pending', 
      current_location: 'New City',
      estimated_delivery: null,
      events: [
        { occurred_at: timestampTMinus1, status: 'Out For Delivery', location: 'City', note: 'OFD note', raw_status: 'OFD' },
        { occurred_at: timestampT, status: 'Pending', location: 'New City', note: 'Consignee Unavailable', raw_status: 'Pending' }
      ]
    });

    const result = await syncTracking('shipment-123');

    expect(prisma.shipmentStatusHistory.create).toHaveBeenCalledTimes(1);

    // SHOULD upgrade current_status to Out For Delivery, but leave customer_update/location from the newer Pending event
    expect(prisma.shipment.update).toHaveBeenCalledWith({
      where: { id: 'shipment-123' },
      data: expect.objectContaining({
        current_status: 'Out For Delivery',
      })
    });
    // ensure it doesn't overwrite the newer note with the old ones
    const updateCall = vi.mocked(prisma.shipment.update).mock.calls[0][0].data;
    expect(updateCall.current_location).toBe('New City');
    expect(updateCall.customer_update).toBeUndefined();
    expect(result.current_status).toBe('Out For Delivery');
  });

  it('TEST 3: Terminal Status Protection - Delivered cannot be overwritten by newer Cancelled', async () => {
    vi.mocked(prisma.shipment.findUnique).mockResolvedValue({
      ...baseShipment,
      current_status: 'Delivered',
      history: [
        { id: 'h1', occurred_at: timestampTMinus1, status: 'Delivered', location: 'City', note: 'Del', raw_status: 'Del' }
      ]
    } as any);

    mockTrackShipment.mockResolvedValue({
      current_status: 'Cancelled', 
      current_location: 'New City',
      estimated_delivery: null,
      events: [
        { occurred_at: timestampTMinus1, status: 'Delivered', location: 'City', note: 'Del', raw_status: 'Del' },
        { occurred_at: timestampT, status: 'Cancelled', location: 'New City', note: 'Can', raw_status: 'Can' }
      ]
    });

    const result = await syncTracking('shipment-123');

    // Should insert the new Cancelled event
    expect(prisma.shipmentStatusHistory.create).toHaveBeenCalledTimes(1);
    
    // SHOULD keep current_status as 'Delivered', but update customer_update and current_location
    expect(prisma.shipment.update).toHaveBeenCalledWith({
      where: { id: 'shipment-123' },
      data: expect.objectContaining({
        current_location: 'New City',
        customer_update: 'Can',
      })
    });
    // The returned status should be Delivered
    expect(result.current_status).toBe('Delivered');
  });
});
