// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { aggregateTrackingHistory, toTitleCase, extractPackageId, getCleanOperationalRemark } from './aggregation';
import { isDuplicateEvent, sanitizeCustomerHistoryNote, sanitizeHistoryForCustomer, isInternalCourierCode } from './identity';
import { normalizeOperationalStatus } from './normalization';

describe('Intelligent Tracking Scan Aggregator', () => {
  const baseTime = new Date('2026-10-30T04:00:00.000Z');

  it('aggregates nine packages scanned with the same operation at the same location into 1 concise group', () => {
    const nineScans = Array.from({ length: 9 }).map((_, i) => ({
      status: 'In Transit',
      location: 'Hyderabad_Shamshbd_H (Telangana)',
      note: `[PKG:6330861000034${i}] Bag Added To Trip`,
      occurred_at: new Date(baseTime.getTime() + i * 10000), // 10s apart
      package_id: `6330861000034${i}`
    }));

    const groups = aggregateTrackingHistory(nineScans);

    expect(groups).toHaveLength(1);
    const group = groups[0];
    expect(group.headline).toBe('Bag Added to Trip');
    expect(group.status).toBe('In Transit');
    expect(group.location).toBe('Hyderabad_Shamshbd_H (Telangana)');
    expect(group.scan_count).toBe(9);
    expect(group.distinct_packages).toBe(9);
    expect(group.has_package_identifiers).toBe(true);
    expect(group.events).toHaveLength(9);
    // Underlying raw notes are sanitized for customer safety
    expect(group.events[0].note).toBe('Bag Added To Trip');
  });

  it('groups scans occurring within the configurable aggregation window', () => {
    const scans = [
      { status: 'In Transit', location: 'Delhi Hub', note: 'Bag Received at Facility', occurred_at: new Date('2026-10-30T10:00:00Z') },
      { status: 'In Transit', location: 'Delhi Hub', note: 'Bag Received at Facility', occurred_at: new Date('2026-10-30T10:03:00Z') },
      { status: 'In Transit', location: 'Delhi Hub', note: 'Bag Received at Facility', occurred_at: new Date('2026-10-30T10:08:00Z') },
    ];

    const groups = aggregateTrackingHistory(scans, { windowMinutes: 10 });
    expect(groups).toHaveLength(1);
    expect(groups[0].scan_count).toBe(3);
    expect(groups[0].is_time_range).toBe(true);
  });

  it('splits scans occurring outside the aggregation window into separate groups', () => {
    const scans = [
      { status: 'In Transit', location: 'Delhi Hub', note: 'Bag Received at Facility', occurred_at: new Date('2026-10-30T10:00:00Z') },
      { status: 'In Transit', location: 'Delhi Hub', note: 'Bag Received at Facility', occurred_at: new Date('2026-10-30T10:15:00Z') }, // 15m > 10m
    ];

    const groups = aggregateTrackingHistory(scans, { windowMinutes: 10 });
    expect(groups).toHaveLength(2);
    expect(groups[0].scan_count).toBe(1);
    expect(groups[1].scan_count).toBe(1);
  });

  it('prevents indefinite window chaining (strictly bounded time window)', () => {
    // 4 scans 6 minutes apart: T=0, T=6m, T=12m, T=18m
    // Total span is 18m, which exceeds a 10m window. It must not chain indefinitely into 1 group.
    const scans = [
      { status: 'In Transit', location: 'Hub', note: 'Sorting', occurred_at: new Date('2026-10-30T10:00:00Z') },
      { status: 'In Transit', location: 'Hub', note: 'Sorting', occurred_at: new Date('2026-10-30T10:06:00Z') },
      { status: 'In Transit', location: 'Hub', note: 'Sorting', occurred_at: new Date('2026-10-30T10:12:00Z') },
      { status: 'In Transit', location: 'Hub', note: 'Sorting', occurred_at: new Date('2026-10-30T10:18:00Z') },
    ];

    const groups = aggregateTrackingHistory(scans, { windowMinutes: 10 });
    // Total 18m cannot fit in a single 10m bounded window
    expect(groups.length).toBeGreaterThanOrEqual(2);
    for (const g of groups) {
      const spanMs = g.last_occurred_at.getTime() - g.first_occurred_at.getTime();
      expect(spanMs).toBeLessThanOrEqual(10 * 60 * 1000);
    }
  });

  it('does NOT group scans across different locations even with same status and time', () => {
    const scans = [
      { status: 'In Transit', location: 'Hyderabad Hub', note: 'Vehicle Departed', occurred_at: new Date('2026-10-30T10:00:00Z') },
      { status: 'In Transit', location: 'Mumbai Hub', note: 'Vehicle Departed', occurred_at: new Date('2026-10-30T10:02:00Z') },
    ];

    const groups = aggregateTrackingHistory(scans);
    expect(groups).toHaveLength(2);
    expect(groups[0].location).toBe('Mumbai Hub');
    expect(groups[1].location).toBe('Hyderabad Hub');
  });

  it('does NOT group scans with different statuses at the same location', () => {
    const scans = [
      { status: 'In Transit', location: 'Hub', note: 'Shipment received at facility', occurred_at: new Date('2026-10-30T10:00:00Z') },
      { status: 'Out For Delivery', location: 'Hub', note: 'Out for delivery', occurred_at: new Date('2026-10-30T10:05:00Z') },
    ];

    const groups = aggregateTrackingHistory(scans);
    expect(groups).toHaveLength(2);
    expect(groups.map(g => g.status)).toContain('In Transit');
    expect(groups.map(g => g.status)).toContain('Out For Delivery');
  });

  it('does NOT group scans with different operational remarks even if status and location match', () => {
    const scans = [
      { status: 'In Transit', location: 'Hub', note: 'Bag Added To Trip', occurred_at: new Date('2026-10-30T10:00:00Z') },
      { status: 'In Transit', location: 'Hub', note: 'Vehicle Departed', occurred_at: new Date('2026-10-30T10:02:00Z') },
    ];

    const groups = aggregateTrackingHistory(scans);
    expect(groups).toHaveLength(2);
    expect(groups[0].headline).toBe('Vehicle Departed');
    expect(groups[1].headline).toBe('Bag Added to Trip');
  });

  it('displays scan record count when package identifiers are missing', () => {
    const scansWithoutPkg = [
      { status: 'In Transit', location: 'Hub', note: 'Bag Received at Facility', occurred_at: new Date('2026-10-30T10:00:00Z') },
      { status: 'In Transit', location: 'Hub', note: 'Bag Received at Facility', occurred_at: new Date('2026-10-30T10:05:00Z') },
    ];

    const groups = aggregateTrackingHistory(scansWithoutPkg);
    expect(groups).toHaveLength(1);
    expect(groups[0].scan_count).toBe(2);
    expect(groups[0].distinct_packages).toBe(0);
    expect(groups[0].has_package_identifiers).toBe(false);
  });

  it('formats headlines in clean Title Case and preserves logistics acronyms', () => {
    expect(toTitleCase('bag added to trip')).toBe('Bag Added to Trip');
    expect(toTitleCase('shipment recieved at origin center')).toBe('Shipment Recieved at Origin Center');
    expect(toTitleCase('vehicle departed')).toBe('Vehicle Departed');
    expect(toTitleCase('weight captured')).toBe('Weight Captured');
    expect(toTitleCase('delivered to consignee - code verified delivery')).toBe('Delivered to Consignee - Code Verified Delivery');
    expect(toTitleCase('lr update')).toBe('LR Update');
    expect(toTitleCase('rto initiated')).toBe('RTO Initiated');
  });

  it('extracts package identifiers from prefixes accurately', () => {
    expect(extractPackageId({ note: '[PKG:63308610000346] Bag Added To Trip' })).toBe('63308610000346');
    expect(extractPackageId({ note: '[WBN:WBN987654321] Scanned' })).toBe('WBN987654321');
    expect(extractPackageId({ note: '[ID:ID-12345] Update' })).toBe('ID-12345');
    expect(extractPackageId({ note: 'No prefix note' })).toBeNull();
  });

  // --- NEW REGRESSION TESTS COVERING ALL PHASE 6 REQUIREMENTS ---

  it('deduplicates duplicate API/webhook event with differing precision/raw status (e.g. 04:51 AM Vehicle Departed)', () => {
    // Exactly replicating the real DB state:
    // Event 1: API sync delivered with status "LEFT_ORIGIN" at 23:21:27.000Z
    // Event 2: Webhook delivered with status "Vehicle Departed" at 23:21:27.901Z (901ms difference)
    const duplicateDelivery = [
      {
        status: 'Vehicle Departed',
        location: 'Hyderabad_Shamshbd_H (Telangana)',
        note: 'Vehicle Departed',
        occurred_at: new Date('2026-10-29T23:21:27.901Z')
      },
      {
        status: 'LEFT_ORIGIN',
        location: 'Hyderabad_Shamshbd_H (Telangana)',
        note: 'Vehicle Departed',
        occurred_at: new Date('2026-10-29T23:21:27.000Z')
      }
    ];

    const groups = aggregateTrackingHistory(duplicateDelivery);

    // Must NOT display two identical "Vehicle Departed" events at 04:51 AM
    expect(groups).toHaveLength(1);
    expect(groups[0].headline).toBe('Vehicle Departed');
    expect(groups[0].status).toBe('Vehicle Departed');
    expect(groups[0].scan_count).toBe(1);
  });

  it('correctly handles 10 scan records involving 9 distinct packages without falsely reporting 10 packages', () => {
    // 9 distinct packages, but package #4 was scanned twice (10 total scans)
    const packageIds = ['PKG-01', 'PKG-02', 'PKG-03', 'PKG-04', 'PKG-05', 'PKG-06', 'PKG-07', 'PKG-08', 'PKG-09'];
    const tenScans = [
      ...packageIds.map((id, idx) => ({
        status: 'In Transit',
        location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
        note: `[PKG:${id}] Added to Bag`,
        occurred_at: new Date(baseTime.getTime() + idx * 5000),
        package_id: id
      })),
      {
        // 10th scan: package #4 re-scanned 45s later
        status: 'In Transit',
        location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
        note: `[PKG:PKG-04] Added to Bag`,
        occurred_at: new Date(baseTime.getTime() + 45000),
        package_id: 'PKG-04'
      }
    ];

    const groups = aggregateTrackingHistory(tenScans, { maxShipmentPackages: 9 });

    expect(groups).toHaveLength(1);
    const g = groups[0];
    // Must accurately preserve total scan count as 10 (not capped)
    expect(g.scan_count).toBe(10);
    // Must accurately calculate distinct packages as 9
    expect(g.distinct_packages).toBe(9);
    expect(g.has_package_identifiers).toBe(true);
  });

  it('sanitizes internal provider codes (LEFT_ORIGIN, UD, MANIFESTED, DL, OFD) so they are never exposed', () => {
    expect(normalizeOperationalStatus('LEFT_ORIGIN', 'Vehicle Departed')).toBe('Vehicle Departed');
    expect(normalizeOperationalStatus('MANIFESTED', 'Manifest uploaded')).toBe('Manifest Uploaded');
    expect(normalizeOperationalStatus('UD', 'Shipment picked up')).toBe('Picked Up');
    expect(normalizeOperationalStatus('UD', 'Vehicle departed from client location')).toBe('Vehicle Departed');
    expect(normalizeOperationalStatus('UD', 'Package received')).toBe('In Transit');
    expect(normalizeOperationalStatus('DL', 'Delivered')).toBe('Delivered');
    expect(normalizeOperationalStatus('OFD', 'Out for delivery')).toBe('Out For Delivery');

    expect(isInternalCourierCode('LEFT_ORIGIN')).toBe(true);
    expect(isInternalCourierCode('UD')).toBe(true);
    expect(isInternalCourierCode('MANIFESTED')).toBe(true);
    expect(isInternalCourierCode('In Transit')).toBe(false);
    expect(isInternalCourierCode('Vehicle Departed')).toBe(false);
  });

  it('keeps single-scan operational events as clean individual timeline entries', () => {
    const singleScan = [
      {
        status: 'Shipment Created',
        location: 'KSR Booking Center',
        note: 'Shipment created successfully',
        occurred_at: new Date('2026-10-28T14:06:00Z')
      }
    ];

    const groups = aggregateTrackingHistory(singleScan);
    expect(groups).toHaveLength(1);
    expect(groups[0].scan_count).toBe(1);
    expect(groups[0].headline).toBe('Shipment Created Successfully');
    expect(groups[0].is_time_range).toBe(false);
  });

  it('keeps multiple different operations at the same location distinctly separated within the same time window', () => {
    // Alternating scans: Added to Bag vs Bag Added To Trip at Balanagar
    const interleavedScans = [
      { status: 'In Transit', location: 'Balanagar Hub', note: 'Added to Bag', occurred_at: new Date('2026-10-29T18:10:30Z') },
      { status: 'In Transit', location: 'Balanagar Hub', note: 'Bag Added To Trip', occurred_at: new Date('2026-10-29T18:10:31Z') },
      { status: 'In Transit', location: 'Balanagar Hub', note: 'Added to Bag', occurred_at: new Date('2026-10-29T18:10:33Z') },
      { status: 'In Transit', location: 'Balanagar Hub', note: 'Bag Added To Trip', occurred_at: new Date('2026-10-29T18:10:34Z') },
    ];

    const groups = aggregateTrackingHistory(interleavedScans);

    // Must group each into its own clean operation
    expect(groups).toHaveLength(2);
    const headlines = groups.map(g => g.headline);
    expect(headlines).toContain('Added to Bag');
    expect(headlines).toContain('Bag Added to Trip');
    for (const g of groups) {
      expect(g.scan_count).toBe(2);
    }
  });

  it('handles distinct locations and time windows cleanly', () => {
    const multiLocationScans = [
      // Balanagar at 18:00
      { status: 'In Transit', location: 'Hyderabad_BalanagarPhase2_L (Telangana)', note: 'Bag Added To Trip', occurred_at: new Date('2026-10-29T18:10:00Z') },
      { status: 'In Transit', location: 'Hyderabad_BalanagarPhase2_L (Telangana)', note: 'Bag Added To Trip', occurred_at: new Date('2026-10-29T18:12:00Z') },
      // Shamshabad at 21:50
      { status: 'In Transit', location: 'Hyderabad_Shamshbd_H (Telangana)', note: 'Bag Added To Trip', occurred_at: new Date('2026-10-29T21:52:00Z') },
      { status: 'In Transit', location: 'Hyderabad_Shamshbd_H (Telangana)', note: 'Bag Added To Trip', occurred_at: new Date('2026-10-29T21:54:00Z') },
    ];

    const groups = aggregateTrackingHistory(multiLocationScans);

    expect(groups).toHaveLength(2);
    expect(groups[0].location).toBe('Hyderabad_Shamshbd_H (Telangana)');
    expect(groups[0].scan_count).toBe(2);
    expect(groups[1].location).toBe('Hyderabad_BalanagarPhase2_L (Telangana)');
    expect(groups[1].scan_count).toBe(2);
  });
});

describe('Package-Level Deduplication (isDuplicateEvent)', () => {
  const t0 = new Date('2026-10-30T12:00:00.000Z');

  it('preserves distinct package scans occurring at the exact same timestamp', () => {
    const existingScanPkg1 = {
      status: 'In Transit',
      location: 'Hyderabad Hub',
      occurred_at: t0,
      note: '[PKG:PKG-001] Bag Added To Trip'
    };

    const incomingScanPkg2 = {
      status: 'In Transit',
      location: 'Hyderabad Hub',
      occurred_at: t0,
      note: '[PKG:PKG-002] Bag Added To Trip',
      package_id: 'PKG-002'
    };

    // Since they represent DIFFERENT packages (PKG-001 vs PKG-002), it must NOT be marked duplicate!
    expect(isDuplicateEvent(existingScanPkg1, incomingScanPkg2)).toBe(false);
  });

  it('deduplicates duplicate delivery of the exact same physical package scan', () => {
    const existingScanPkg1 = {
      status: 'In Transit',
      location: 'Hyderabad Hub',
      occurred_at: t0,
      note: '[PKG:PKG-001] Bag Added To Trip'
    };

    const incomingDuplicate = {
      status: 'In Transit',
      location: 'Hyderabad Hub',
      occurred_at: t0,
      note: '[PKG:PKG-001] Bag Added To Trip',
      package_id: 'PKG-001'
    };

    // Same package, same time, same status, same location -> duplicate!
    expect(isDuplicateEvent(existingScanPkg1, incomingDuplicate)).toBe(true);
  });

  it('never leaks internal package AWBs or prefixes to customers via sanitizeCustomerHistoryNote', () => {
    expect(sanitizeCustomerHistoryNote('[PKG:63308610000346] Bag Added To Trip')).toBe('Bag Added To Trip');
    expect(sanitizeCustomerHistoryNote('[WBN:123456789] Out for delivery')).toBe('Out for delivery');
    expect(sanitizeCustomerHistoryNote('[ID:999] Delivered')).toBe('Delivered');
  });
});
