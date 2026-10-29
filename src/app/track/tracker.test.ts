// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  getStageIndex,
  getActiveMilestoneStage,
  getStageTimestamp,
  normalizeStatusKey,
} from './TrackResult';
import {
  sanitizeHistoryForCustomer,
  isDuplicateEvent
} from '@/lib/courier/identity';
import { formatCustomerHistoryStatus } from '@/lib/format';

describe('Shipment Progress Tracker Milestones & Stage Indexing', () => {
  it('normalizes status variants cleanly (case, hyphens, underscores)', () => {
    expect(normalizeStatusKey('PICKED_UP')).toBe('picked up');
    expect(normalizeStatusKey('out-for-delivery')).toBe('out for delivery');
    expect(normalizeStatusKey('VEHICLE_DEPARTED')).toBe('vehicle departed');
    expect(normalizeStatusKey('IN_TRANSIT')).toBe('in transit');
    expect(normalizeStatusKey('MANIFESTED')).toBe('manifested');
  });

  it('RULE 1: Shipment Created / Booked / Manifested keeps Stage 0 active', () => {
    expect(getStageIndex('Shipment Created')).toBe(0);
    expect(getStageIndex('SHIPMENT_CREATED')).toBe(0);
    expect(getStageIndex('Booked')).toBe(0);
    expect(getStageIndex('BOOKED')).toBe(0);
    expect(getStageIndex('Manifested')).toBe(0);
    expect(getStageIndex('MANIFESTED')).toBe(0);
    expect(getStageIndex('manifest uploaded')).toBe(0);

    const historyStage0 = [
      { status: 'Manifested', location: 'Hub', note: 'Manifest uploaded', occurred_at: '2026-10-28T14:19:51.000Z' },
      { status: 'Shipment Created', location: null, note: 'Shipment created', occurred_at: '2026-10-28T14:06:00.000Z' }
    ];
    expect(getActiveMilestoneStage('Manifested', historyStage0)).toBe(0);
  });

  it('RULE 2: Picked Up marks Stage 1 (Shipped) active', () => {
    expect(getStageIndex('Picked Up')).toBe(1);
    expect(getStageIndex('PICKED_UP')).toBe(1);
    expect(getStageIndex('picked-up')).toBe(1);
    expect(getStageIndex('Shipped')).toBe(1);
    expect(getStageIndex('SHIPPED')).toBe(1);

    const historyStage1 = [
      { status: 'Picked Up', location: 'Hub', note: 'Shipment picked up', occurred_at: '2026-10-29T09:12:28.000Z' },
      { status: 'Manifested', location: 'Hub', note: 'Manifest uploaded', occurred_at: '2026-10-28T14:19:51.000Z' }
    ];
    expect(getActiveMilestoneStage('Picked Up', historyStage1)).toBe(1);
  });

  it('RULE 3: In Transit marks Stage 2 (In Transit) active', () => {
    expect(getStageIndex('In Transit')).toBe(2);
    expect(getStageIndex('IN_TRANSIT')).toBe(2);
    expect(getStageIndex('in-transit')).toBe(2);
    expect(getStageIndex('Dispatched')).toBe(2);
    expect(getStageIndex('At Hub')).toBe(2);
    expect(getStageIndex('Shipment Bagged')).toBe(2);
    expect(getStageIndex('Shipment Received')).toBe(2);

    expect(getActiveMilestoneStage('In Transit')).toBe(2);
  });

  it('RULE 4: Vehicle Departed marks Stage 2 (In Transit) active and is never mistaken for Out for Delivery or Delivered', () => {
    expect(getStageIndex('Vehicle Departed')).toBe(2);
    expect(getStageIndex('VEHICLE_DEPARTED')).toBe(2);
    expect(getStageIndex('Vehicle departed from client location')).toBe(2);

    // Must NOT be mistaken for Stage 3 (Out for Delivery) or Stage 4 (Delivered)
    expect(getStageIndex('Vehicle Departed')).not.toBe(3);
    expect(getStageIndex('Vehicle Departed')).not.toBe(4);

    expect(getActiveMilestoneStage('Vehicle Departed')).toBe(2);
  });

  it('RULE 5: Out For Delivery marks Stage 3 (Out for Delivery) active', () => {
    expect(getStageIndex('Out For Delivery')).toBe(3);
    expect(getStageIndex('OUT_FOR_DELIVERY')).toBe(3);
    expect(getStageIndex('Out for Delivery')).toBe(3);
    expect(getStageIndex('out-for-delivery')).toBe(3);

    expect(getActiveMilestoneStage('Out For Delivery')).toBe(3);
  });

  it('RULE 6: Delivered marks Stage 4 (Delivered) active and shows completion', () => {
    expect(getStageIndex('Delivered')).toBe(4);
    expect(getStageIndex('DELIVERED')).toBe(4);
    expect(getStageIndex('Delivered to consignee')).toBe(4);

    expect(getActiveMilestoneStage('Delivered')).toBe(4);
  });

  it('Does not infer an advanced milestone from ambiguous status code UD alone', () => {
    expect(getStageIndex('UD')).toBe(0);
    expect(getStageIndex('ud')).toBe(0);
    expect(getActiveMilestoneStage('UD')).toBe(0);
  });

  it('Older events cannot regress the active milestone (monotonic progression)', () => {
    // 1. Delivered shipment cannot regress if an older event says In Transit
    const deliveredHistory = [
      { status: 'Delivered', location: 'City', note: 'Delivered', occurred_at: '2026-10-30T10:00:00.000Z' },
      { status: 'In Transit', location: 'Hub', note: 'In transit', occurred_at: '2026-10-29T10:00:00.000Z' }
    ];
    expect(getActiveMilestoneStage('Delivered', deliveredHistory)).toBe(4);

    // 2. Vehicle Departed shipment cannot regress if an older or unmapped event arrives
    const departedHistory = [
      { status: 'Vehicle Departed', location: 'Hub', note: 'Departed', occurred_at: '2026-10-29T09:18:52.000Z' },
      { status: 'Picked Up', location: 'Hub', note: 'Picked up', occurred_at: '2026-10-29T09:12:28.000Z' },
      { status: 'Manifested', location: 'Hub', note: 'Manifested', occurred_at: '2026-10-28T14:19:51.000Z' }
    ];
    // Even if currentStatus was passed as UD or null, history preserves Stage 2
    expect(getActiveMilestoneStage('UD', departedHistory)).toBe(2);
    expect(getActiveMilestoneStage('Vehicle Departed', departedHistory)).toBe(2);

    // 3. Picked Up shipment cannot regress to Stage 0 from Manifested
    const pickedUpHistory = [
      { status: 'Picked Up', location: 'Hub', note: 'Picked up', occurred_at: '2026-10-29T09:12:28.000Z' },
      { status: 'Manifested', location: 'Hub', note: 'Manifested', occurred_at: '2026-10-28T14:19:51.000Z' }
    ];
    expect(getActiveMilestoneStage('Picked Up', pickedUpHistory)).toBe(1);
  });

  it('getStageTimestamp correctly binds timestamps to milestones without false matches', () => {
    const history = [
      { status: 'Vehicle Departed', location: 'Hyd', note: 'Vehicle departed from client location', occurred_at: '2026-10-29T09:18:52.000Z' },
      { status: 'Picked Up', location: 'Hyd', note: 'Shipment picked up', occurred_at: '2026-10-29T09:13:04.000Z' },
      { status: 'Picked Up', location: 'Hyd', note: 'Shipment picked up', occurred_at: '2026-10-29T09:12:44.000Z' },
      { status: 'Picked Up', location: 'Hyd', note: 'Shipment picked up', occurred_at: '2026-10-29T09:12:28.000Z' },
      { status: 'Manifested', location: 'Hyd', note: 'Manifest uploaded', occurred_at: '2026-10-28T14:19:51.000Z' },
      { status: 'Shipment Created', location: null, note: 'Shipment created', occurred_at: '2026-10-28T14:06:00.000Z' }
    ];

    // Stage 0: matches earliest creation/manifest
    const ts0 = getStageTimestamp(0, history);
    expect(ts0).not.toBeNull();
    expect(ts0?.date).toBe('28 Oct');

    // Stage 1: matches earliest pickup (14:42:28 IST)
    const ts1 = getStageTimestamp(1, history);
    expect(ts1).not.toBeNull();
    expect(ts1?.date).toBe('29 Oct');

    // Stage 2: matches Vehicle Departed (14:48:52 IST)
    const ts2 = getStageTimestamp(2, history);
    expect(ts2).not.toBeNull();
    expect(ts2?.date).toBe('29 Oct');

    // Stage 3 & 4: not yet reached
    expect(getStageTimestamp(3, history)).toBeNull();
    expect(getStageTimestamp(4, history)).toBeNull();
  });
});

describe('Shipment History Multi-Piece Distinct Scans & Idempotency', () => {
  it('Three distinct pickup scans remain distinguishable in history and are not merged', () => {
    const rawEvents = [
      {
        status: 'UD',
        location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
        note: 'Shipment picked up',
        occurred_at: '2026-10-29T09:13:04.000Z'
      },
      {
        status: 'UD',
        location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
        note: 'Shipment picked up',
        occurred_at: '2026-10-29T09:12:44.000Z'
      },
      {
        status: 'UD',
        location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
        note: 'Shipment picked up',
        occurred_at: '2026-10-29T09:12:28.000Z'
      }
    ];

    const sanitized = sanitizeHistoryForCustomer(rawEvents);

    // All 3 distinct scans (20s and 16s apart) must be preserved
    expect(sanitized).toHaveLength(3);
    expect(sanitized.every(e => e.status === 'Picked Up')).toBe(true);
    expect(sanitized[0].occurred_at).toBe('2026-10-29T09:13:04.000Z');
    expect(sanitized[1].occurred_at).toBe('2026-10-29T09:12:44.000Z');
    expect(sanitized[2].occurred_at).toBe('2026-10-29T09:12:28.000Z');
  });

  it('Reprocessing the same event via isDuplicateEvent is strictly idempotent', () => {
    const existingScan = {
      status: 'Picked Up',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:12:28.000Z'),
      note: 'Shipment picked up'
    };

    // 1. Exact re-delivery (same timestamp, same location, same note)
    const reDeliveredScan = {
      status: 'Picked Up',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:12:28.000Z'),
      note: 'Shipment picked up'
    };
    expect(isDuplicateEvent(existingScan, reDeliveredScan)).toBe(true);

    // 2. Re-delivery with UD raw status vs resolved status
    const reDeliveredUd = {
      status: 'UD',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:12:28.000Z'),
      note: 'Shipment picked up'
    };
    expect(isDuplicateEvent(existingScan, reDeliveredUd)).toBe(true);

    // 3. Different scan 16 seconds later is recognized as distinct
    const differentScan = {
      status: 'Picked Up',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:12:44.000Z'),
      note: 'Shipment picked up'
    };
    expect(isDuplicateEvent(existingScan, differentScan)).toBe(false);
  });
});

describe('Customer-Facing Status Badge and Group Heading Protections', () => {
  it('prevents internal codes (UD, RT, DL, PU, OFD, CAN, XX) from appearing in customer-facing status badge', () => {
    // Badge status resolution tests
    expect(formatCustomerHistoryStatus('UD', 'Vehicle departed from client location')).toBe('Vehicle Departed');
    expect(formatCustomerHistoryStatus('UD', 'Shipment picked up')).toBe('Picked Up');
    expect(formatCustomerHistoryStatus('UD', 'Delivery attempted')).toBe('In Transit');
    expect(formatCustomerHistoryStatus('UD', '')).toBe('In Transit');
    expect(formatCustomerHistoryStatus('DL', '')).toBe('Delivered');
    expect(formatCustomerHistoryStatus('RT', '')).toBe('Returned');
    expect(formatCustomerHistoryStatus('PU', '')).toBe('Picked Up');
    expect(formatCustomerHistoryStatus('OFD', '')).toBe('Out For Delivery');
    expect(formatCustomerHistoryStatus('CAN', '')).toBe('Cancelled');
    expect(formatCustomerHistoryStatus('XX', 'Unknown scan')).toBe('In Transit');
    expect(formatCustomerHistoryStatus('XX', '')).not.toBe('Delivered');
  });

  it('guarantees history group headings are human-readable and never display raw internal codes', () => {
    const rawHistory = [
      { status: 'UD', note: 'Vehicle departed from client location', location: 'Hyderabad' },
      { status: 'UD', note: 'Shipment picked up', location: 'Hyderabad' },
      { status: 'DL', note: 'Delivered', location: 'Destination' },
      { status: 'RT', note: 'Returned to origin', location: 'Origin' },
      { status: 'XX', note: 'Transit scan', location: 'Hub' }
    ];

    const headings = rawHistory.map(evt => formatCustomerHistoryStatus(evt.status, evt.note));

    expect(headings).toEqual([
      'Vehicle Departed',
      'Picked Up',
      'Delivered',
      'Returned',
      'In Transit'
    ]);

    expect(headings.some(h => ['UD', 'RT', 'DL', 'XX'].includes(h))).toBe(false);
  });
});

