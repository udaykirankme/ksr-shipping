// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { toTitleCase, formatCustomerHistoryStatus } from './format';

describe('Customer Tracking History Status Formatting (Title Case & UD Resolution)', () => {
  describe('toTitleCase', () => {
    it('formats ALL CAPS statuses to Title Case', () => {
      expect(toTitleCase('MANIFESTED')).toBe('Manifested');
      expect(toTitleCase('IN TRANSIT')).toBe('In Transit');
      expect(toTitleCase('OUT FOR DELIVERY')).toBe('Out For Delivery');
      expect(toTitleCase('DELIVERED')).toBe('Delivered');
      expect(toTitleCase('SHIPMENT CREATED')).toBe('Shipment Created');
      expect(toTitleCase('PICKED UP')).toBe('Picked Up');
      expect(toTitleCase('VEHICLE DEPARTED')).toBe('Vehicle Departed');
    });

    it('formats snake_case status codes to Title Case', () => {
      expect(toTitleCase('PICKED_UP')).toBe('Picked Up');
      expect(toTitleCase('IN_TRANSIT')).toBe('In Transit');
      expect(toTitleCase('OUT_FOR_DELIVERY')).toBe('Out For Delivery');
    });

    it('sensibly handles hyphenated status names', () => {
      expect(toTitleCase('OUT-FOR-DELIVERY')).toBe('Out-For-Delivery');
      expect(toTitleCase('PRE-DISPATCH')).toBe('Pre-Dispatch');
      expect(toTitleCase('in-transit')).toBe('In-Transit');
    });

    it('preserves already Title Case statuses', () => {
      expect(toTitleCase('Manifested')).toBe('Manifested');
      expect(toTitleCase('In Transit')).toBe('In Transit');
      expect(toTitleCase('Vehicle Departed')).toBe('Vehicle Departed');
    });

    it('handles empty or null gracefully', () => {
      expect(toTitleCase('')).toBe('');
      expect(toTitleCase(null)).toBe('');
      expect(toTitleCase(undefined)).toBe('');
    });
  });

  describe('formatCustomerHistoryStatus', () => {
    it('resolves internal "UD" with "Vehicle departed from client location" to "Vehicle Departed"', () => {
      expect(formatCustomerHistoryStatus('UD', 'Vehicle departed from client location')).toBe('Vehicle Departed');
    });

    it('resolves internal "UD" with "Shipment picked up" to "Picked Up"', () => {
      expect(formatCustomerHistoryStatus('UD', 'Shipment picked up')).toBe('Picked Up');
    });

    it('resolves internal "UD" with "Manifest uploaded" to "Manifested"', () => {
      expect(formatCustomerHistoryStatus('UD', 'Manifest uploaded')).toBe('Manifested');
    });

    it('resolves internal "UD" with "Out for delivery" to "Out For Delivery"', () => {
      expect(formatCustomerHistoryStatus('UD', 'Out for delivery to consignee')).toBe('Out For Delivery');
    });

    it('resolves internal "UD" with "Delivered to consignee" to "Delivered"', () => {
      expect(formatCustomerHistoryStatus('UD', 'Delivered to consignee')).toBe('Delivered');
    });

    it('safely falls back ambiguous "UD" event notes to "In Transit" without inventing milestones', () => {
      expect(formatCustomerHistoryStatus('UD', 'Manifest error - returned to warehouse')).toBe('In Transit');
      expect(formatCustomerHistoryStatus('UD', 'Delivery attempted - customer absent')).toBe('In Transit');
      expect(formatCustomerHistoryStatus('UD', 'Network operational delay')).toBe('In Transit');
      expect(formatCustomerHistoryStatus('UD', '')).toBe('In Transit');
    });

    it('resolves internal courier abbreviations (DL, RT, RTO, PU, OFD, CAN)', () => {
      expect(formatCustomerHistoryStatus('DL', 'Delivered to consignee')).toBe('Delivered');
      expect(formatCustomerHistoryStatus('DL', '')).toBe('Delivered');
      expect(formatCustomerHistoryStatus('RT', 'Package returned to hub')).toBe('Returned');
      expect(formatCustomerHistoryStatus('RT', '')).toBe('Returned');
      expect(formatCustomerHistoryStatus('RTO', '')).toBe('Returned');
      expect(formatCustomerHistoryStatus('PU', 'Shipment picked up')).toBe('Picked Up');
      expect(formatCustomerHistoryStatus('PU', '')).toBe('Picked Up');
      expect(formatCustomerHistoryStatus('OFD', 'Out for delivery')).toBe('Out For Delivery');
      expect(formatCustomerHistoryStatus('OFD', '')).toBe('Out For Delivery');
      expect(formatCustomerHistoryStatus('CAN', 'Order cancelled')).toBe('Cancelled');
      expect(formatCustomerHistoryStatus('CAN', '')).toBe('Cancelled');
    });

    it('resolves unknown short status codes safely without exposing raw code or advancing milestone', () => {
      // If note contains recognizable event, resolve it
      expect(formatCustomerHistoryStatus('XX', 'Vehicle departed from facility')).toBe('Vehicle Departed');
      expect(formatCustomerHistoryStatus('XX', 'Shipment picked up')).toBe('Picked Up');
      expect(formatCustomerHistoryStatus('XX', 'Delivered to consignee')).toBe('Delivered');

      // If note is ambiguous, fall back safely to "In Transit" (never Delivered)
      expect(formatCustomerHistoryStatus('XX', 'Ambiguous facility scan')).toBe('In Transit');
      expect(formatCustomerHistoryStatus('XX', '')).toBe('In Transit');
      expect(formatCustomerHistoryStatus('DIS', '')).toBe('In Transit');
      expect(formatCustomerHistoryStatus('FDL', '')).toBe('In Transit');
    });

    it('formats existing non-UD status strings to Title Case', () => {
      expect(formatCustomerHistoryStatus('MANIFESTED', 'Manifest uploaded')).toBe('Manifested');
      expect(formatCustomerHistoryStatus('IN TRANSIT', 'Vehicle departed')).toBe('In Transit');
      expect(formatCustomerHistoryStatus('DELIVERED', 'Delivered')).toBe('Delivered');
      expect(formatCustomerHistoryStatus('SHIPMENT CREATED', 'Shipment created')).toBe('Shipment Created');
    });
  });
});
