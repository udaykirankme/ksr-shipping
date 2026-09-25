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
    expect(sanitizeCustomerHistoryNote('Updated by automated sync')).toBe('Status updated');
    expect(sanitizeCustomerHistoryNote('[ID:abc123xyz] Manifest uploaded')).toBe('Manifest uploaded');
  });

  it('returns clean notes as-is without altering legitimate text', () => {
    expect(sanitizeCustomerHistoryNote('Out for delivery')).toBe('Out for delivery');
    expect(sanitizeCustomerHistoryNote('Package found in Audit')).toBe('Package found in Audit');
    expect(sanitizeCustomerHistoryNote('Package Missing in Audit')).toBe('Package Missing in Audit');
    expect(sanitizeCustomerHistoryNote('Shipment Received at Facility')).toBe('Shipment Received at Facility');
    expect(sanitizeCustomerHistoryNote('')).toBe('Status updated');
    expect(sanitizeCustomerHistoryNote(null)).toBe('Status updated');
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
});
