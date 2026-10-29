// @ts-ignore
import { describe, it, expect } from 'vitest';
import {
  sanitizeCustomerHistoryNote,
  sanitizeHistoryForCustomer,
  isDuplicateEvent,
  normalizeNoteForComparison
} from './identity';

describe('Customer History Sanitization & Identity Deduplication', () => {
  it('strips "Webhook Update:" prefix cleanly', () => {
    expect(sanitizeCustomerHistoryNote('Webhook Update: Out for delivery')).toBe('Out for delivery');
    expect(sanitizeCustomerHistoryNote('webhook update: Vehicle Departed')).toBe('Vehicle Departed');
  });

  it('strips "External Update:" and automated sync prefixes', () => {
    expect(sanitizeCustomerHistoryNote('External Update: Dispatched')).toBe('Dispatched');
    expect(sanitizeCustomerHistoryNote('external update: In Transit')).toBe('In Transit');
    expect(sanitizeCustomerHistoryNote('Updated by automated sync')).toBe('');
    expect(sanitizeCustomerHistoryNote('[ID:abc123xyz] Manifest uploaded')).toBe('Manifest uploaded');
  });

  it('returns clean notes as-is without altering legitimate text', () => {
    expect(sanitizeCustomerHistoryNote('Out for delivery')).toBe('Out for delivery');
    expect(sanitizeCustomerHistoryNote('Package found in Audit')).toBe('Package found in Audit');
    expect(sanitizeCustomerHistoryNote('Package Missing in Audit')).toBe('Package Missing in Audit');
    expect(sanitizeCustomerHistoryNote('Shipment Received at Facility')).toBe('Shipment Received at Facility');
    expect(sanitizeCustomerHistoryNote('')).toBe('');
    expect(sanitizeCustomerHistoryNote(null)).toBe('');
  });

  it('deduplicates identical events at the exact same timestamp', () => {
    const rawEvents = [
      {
        status: 'Out For Delivery',
        location: 'Kolkata_Santoshpur_D',
        note: 'Webhook Update: Out for delivery',
        occurred_at: '2026-09-25T10:38:00.000Z'
      },
      {
        status: 'Out For Delivery',
        location: 'Kolkata_Santoshpur_D',
        note: 'Webhook Update: Out for delivery',
        occurred_at: '2026-09-25T10:38:00.000Z'
      },
      {
        status: 'In Transit',
        location: 'Kolkata_Santoshpur_D (West Bengal)',
        note: 'Package found in Audit',
        occurred_at: '2026-09-22T08:25:50.855Z'
      }
    ];

    const cleaned = sanitizeHistoryForCustomer(rawEvents);
    expect(cleaned).toHaveLength(2);
    expect(cleaned[0].note).toBe('Out for delivery');
    expect(cleaned[0].status).toBe('Out For Delivery');
    expect(cleaned[1].note).toBe('Package found in Audit');
    expect(cleaned[1].status).toBe('In Transit');
  });

  it('preserves legitimate distinct events occurring with same status/location at different times', () => {
    const distinctEvents = [
      {
        status: 'In Transit',
        location: 'Kolkata_Santoshpur_D',
        note: 'Package found in Audit',
        occurred_at: '2026-09-22T08:25:50.855Z'
      },
      {
        status: 'In Transit',
        location: 'Kolkata_Santoshpur_D',
        note: 'Package Missing in Audit',
        occurred_at: '2026-09-22T08:17:29.126Z'
      },
      {
        status: 'In Transit',
        location: 'Kolkata_Santoshpur_D',
        note: 'Shipment Received at Facility',
        occurred_at: '2026-09-22T02:31:52.677Z'
      }
    ];

    const cleaned = sanitizeHistoryForCustomer(distinctEvents);
    expect(cleaned).toHaveLength(3);
    expect(cleaned[0].note).toBe('Package found in Audit');
    expect(cleaned[1].note).toBe('Package Missing in Audit');
    expect(cleaned[2].note).toBe('Shipment Received at Facility');
  });

  it('isDuplicateEvent handles case-insensitive status and webhook prefix matching', () => {
    const existing = {
      status: 'Out For Delivery',
      location: 'Kolkata_Santoshpur_D',
      occurred_at: new Date('2026-09-25T10:38:00.000Z'),
      note: 'Webhook Update: Out for delivery'
    };

    const incoming = {
      status: 'out for delivery', // lowercase status
      location: 'Kolkata_Santoshpur_D',
      occurred_at: new Date('2026-09-25T10:38:00.000Z'),
      note: 'Out for delivery',
      raw_status: 'Dispatched'
    };

    expect(isDuplicateEvent(existing, incoming)).toBe(true);
  });

  it('sanitizeHistoryForCustomer deduplicates overlapping UD/Vehicle Departed rows and title-cases statuses', () => {
    const liveShipmentEvents = [
      {
        status: 'Vehicle Departed',
        location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
        note: 'Vehicle departed from client location',
        occurred_at: '2026-10-29T09:18:52.000Z'
      },
      {
        status: 'UD',
        location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
        note: 'Vehicle departed from client location',
        occurred_at: '2026-10-29T09:18:52.000Z'
      },
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
      },
      {
        status: 'MANIFESTED',
        location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
        note: 'Manifest uploaded',
        occurred_at: '2026-10-28T14:19:51.000Z'
      },
      {
        status: 'Shipment Created',
        location: null,
        note: 'Shipment created',
        occurred_at: '2026-10-28T14:06:00.000Z'
      }
    ];

    const sanitized = sanitizeHistoryForCustomer(liveShipmentEvents);

    // 1. Duplicate Vehicle Departed row (Row 1) must be deduplicated
    expect(sanitized).toHaveLength(6);

    // 2. Vehicle Departed is correctly rendered
    expect(sanitized[0].status).toBe('Vehicle Departed');
    expect(sanitized[0].note).toBe('Vehicle departed from client location');

    // 3. No internal UD code is exposed
    expect(sanitized.some(e => e.status === 'UD')).toBe(false);

    // 4. All three distinct pickup scans are preserved with "Picked Up"
    const pickupScans = sanitized.filter(e => e.status === 'Picked Up');
    expect(pickupScans).toHaveLength(3);
    expect(pickupScans[0].occurred_at).toBe('2026-10-29T09:13:04.000Z');
    expect(pickupScans[1].occurred_at).toBe('2026-10-29T09:12:44.000Z');
    expect(pickupScans[2].occurred_at).toBe('2026-10-29T09:12:28.000Z');

    // 5. MANIFESTED is rendered in Title Case as "Manifested"
    const manifestedEvent = sanitized.find(e => e.note === 'Manifest uploaded');
    expect(manifestedEvent?.status).toBe('Manifested');
  });

  it('isDuplicateEvent recognizes duplicate B2B sync event even if existing has "UD" status', () => {
    const existingInDb = {
      status: 'UD',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:18:52.000Z'),
      note: 'Vehicle departed from client location'
    };

    const incomingFromSync = {
      status: 'Vehicle Departed',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:18:52.000Z'),
      note: 'Vehicle departed from client location',
      raw_status: 'PICKED_UP'
    };

    expect(isDuplicateEvent(existingInDb, incomingFromSync)).toBe(true);
  });

  it('isDuplicateEvent distinguishes distinct pickup scans occurring 16 seconds apart', () => {
    const scan1 = {
      status: 'Picked Up',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:12:28.000Z'),
      note: 'Shipment picked up'
    };

    const scan2 = {
      status: 'Picked Up',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:12:44.000Z'),
      note: 'Shipment picked up'
    };

    // Distinct physical scans (16s apart) must NOT be marked as duplicate
    expect(isDuplicateEvent(scan1, scan2)).toBe(false);
  });

  it('isDuplicateEvent recognizes repeated delivery of the exact same pickup scan', () => {
    const scan1 = {
      status: 'Picked Up',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:12:28.000Z'),
      note: 'Shipment picked up'
    };

    const scan1Redelivery = {
      status: 'Picked Up',
      location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
      occurred_at: new Date('2026-10-29T09:12:28.000Z'),
      note: 'Shipment picked up'
    };

    expect(isDuplicateEvent(scan1, scan1Redelivery)).toBe(true);
  });
});
