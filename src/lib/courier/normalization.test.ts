// @ts-ignore
import { describe, it, expect } from 'vitest';
import { normalizeDelhiveryStatus } from './normalization';

describe('Delhivery Status Normalization', () => {
  it('Dispatched + Out for delivery → Out For Delivery', () => {
    expect(normalizeDelhiveryStatus('Dispatched', 'Out for delivery')).toBe('Out For Delivery');
  });

  it('Dispatched + OUT FOR DELIVERY → Out For Delivery (case-insensitive)', () => {
    expect(normalizeDelhiveryStatus('Dispatched', 'OUT FOR DELIVERY')).toBe('Out For Delivery');
  });

  it('out for delivery as raw status → Out For Delivery', () => {
    expect(normalizeDelhiveryStatus('out for delivery', '')).toBe('Out For Delivery');
  });

  it('Dispatched + unrelated instruction → Dispatched', () => {
    expect(normalizeDelhiveryStatus('Dispatched', 'Vehicle Departed')).toBe('Dispatched');
  });
  it('Pending + Trip Arrived → In Transit', () => {
    expect(normalizeDelhiveryStatus('Pending', 'Trip Arrived')).toBe('In Transit');
  });

  it('Pending + Bag Received at Facility → In Transit', () => {
    expect(normalizeDelhiveryStatus('Pending', 'Bag Received at Facility')).toBe('In Transit');
  });

  it('Pending + Shipment Received at Facility → In Transit', () => {
    expect(normalizeDelhiveryStatus('Pending', 'Shipment Received at Facility')).toBe('In Transit');
  });

  it('Pending + Package Missing in Audit → In Transit', () => {
    expect(normalizeDelhiveryStatus('Pending', 'Package Missing in Audit')).toBe('In Transit');
  });

  it('Pending + Package found in Audit → In Transit', () => {
    expect(normalizeDelhiveryStatus('Pending', 'Package found in Audit')).toBe('In Transit');
  });

  it('In Transit + Vehicle Departed → In Transit', () => {
    expect(normalizeDelhiveryStatus('In Transit', 'Vehicle Departed')).toBe('In Transit');
  });

  it('Unknown Pending instruction does not blindly become In Transit', () => {
    expect(normalizeDelhiveryStatus('Pending', 'Some Unknown Instruction')).toBe('Pending');
  });

  it('Delivered mapping continues to work exactly as before', () => {
    expect(normalizeDelhiveryStatus('Delivered', 'Delivered successfully')).toBe('Delivered');
  });

  it('RTO mapping continues to work exactly as before', () => {
    expect(normalizeDelhiveryStatus('RTO', 'Returned to origin')).toBe('RTO');
  });

  it('handles null/undefined gracefully', () => {
    expect(normalizeDelhiveryStatus(null as any, null as any)).toBe('Unknown');
    expect(normalizeDelhiveryStatus('Pending', undefined)).toBe('Pending');
  });
});
