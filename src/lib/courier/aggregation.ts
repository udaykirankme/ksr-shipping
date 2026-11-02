import { sanitizeCustomerHistoryNote, sanitizeHistoryForCustomer } from './identity';
import { isExceptionStatus, isRoutineOperationalStatus, normalizeOperationalStatus } from './normalization';

export interface RawTrackingScan {
  status: string;
  location?: string | null;
  note?: string | null;
  occurred_at: string | Date;
  raw_status?: string | null;
  package_id?: string | null;
}

export interface AggregatedTrackingGroup {
  id: string;
  status: string;
  location: string;
  headline: string;
  is_exception: boolean;
  scan_count: number;
  distinct_packages: number;
  has_package_identifiers: boolean;
  first_occurred_at: Date;
  last_occurred_at: Date;
  is_time_range: boolean;
  events: {
    status: string;
    location: string;
    note: string;
    occurred_at: Date;
    package_id?: string | null;
  }[];
}

export interface AggregationOptions {
  /** Maximum duration in minutes between scans in a single group before starting a new group. Default: 10 */
  windowMinutes?: number;
  /** Total number of packages in the shipment, to ensure distinct_packages never exceeds total shipment packages */
  maxShipmentPackages?: number;
  /** Courier service identifier (e.g. 'delhivery-b2b', 'delhivery-b2c', 'dhl', etc.) */
  service?: string | null;
  /** Service through identifier */
  serviceThrough?: string | null;
  /** Courier identifier */
  courier?: string | null;
  /** Explicit flag indicating whether this is a Delhivery B2B or B2C shipment */
  isDelhivery?: boolean;
}

/**
 * Determines whether a given shipment service is Delhivery B2B or Delhivery B2C.
 */
export function isDelhiveryService(
  service?: string | null,
  serviceThrough?: string | null,
  courier?: string | null
): boolean {
  const combined = `${service || ''} ${serviceThrough || ''} ${courier || ''}`.toLowerCase().replace(/[\s\-_]+/g, '');
  return combined.includes('delhivery');
}

/**
 * Extracts a package identifier (e.g. WBN or box/piece ID) if present in the event.
 * Checks explicit package_id first, then extracts from prefixes like [PKG:123], [WBN:123], [ID:123].
 */
export function extractPackageId(event: RawTrackingScan): string | null {
  if (event.package_id && event.package_id.trim()) {
    return event.package_id.trim();
  }
  const note = event.note || '';
  const match = note.match(/\[(?:PKG|WBN|ID):([a-zA-Z0-9_\-]+)\]/i);
  return match ? match[1].trim() : null;
}

/**
 * Converts strings to readable Title Case, while protecting logistics acronyms and fixing typos.
 * Example: "bag added to trip" -> "Bag Added to Trip"
 * Example: "weight captured" -> "Weight Captured"
 * Example: "vehicle departed" -> "Vehicle Departed"
 */
export function toTitleCase(input: string | null | undefined): string {
  if (!input) return '';
  const s = input.trim();
  if (!s) return '';

  // Human-readable mapping for raw provider codes
  const upperInput = s.toUpperCase();
  if (upperInput === 'LEFT_ORIGIN' || upperInput === 'LEFT ORIGIN') return 'Vehicle Departed';
  if (upperInput === 'MANIFESTED') return 'Manifest Uploaded';
  if (upperInput === 'DL') return 'Delivered';
  if (upperInput === 'OFD') return 'Out For Delivery';
  if (upperInput === 'UD') return 'In Transit';

  const minorWords = new Set(['to', 'at', 'in', 'of', 'for', 'from', 'by', 'on', 'with', 'a', 'an', 'the', 'and']);
  const acronyms = new Set(['IST', 'RTO', 'LR', 'AWB', 'WBN', 'COD', 'KSR']);

  const words = s.split(/\s+/);
  return words.map((word, index) => {
    // Preserve words inside parentheses or punctuation
    const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, '');
    const upper = cleanWord.toUpperCase();

    if (acronyms.has(upper)) {
      return word.replace(cleanWord, upper);
    }

    const lower = cleanWord.toLowerCase();
    if (index > 0 && minorWords.has(lower)) {
      return word.replace(cleanWord, lower);
    }

    // Capitalize first letter, lowercase rest
    const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
    return word.replace(cleanWord, capitalized);
  }).join(' ');
}

/**
 * Extracts the clean operational remark from a note, stripping internal prefixes.
 */
export function getCleanOperationalRemark(note: string | null | undefined): string {
  if (!note) return '';
  const clean = sanitizeCustomerHistoryNote(note);
  return clean.trim();
}

/**
 * Resolves the canonical operational action for an event.
 */
function getCanonicalAction(status: string, cleanRemark: string): string {
  const remarkLower = cleanRemark.toLowerCase();
  const statusLower = status.toLowerCase();

  // 1. Prioritize specific operational scan remark first
  if (remarkLower.includes('trip arrived')) {
    return 'Trip Arrived';
  }
  if (
    remarkLower.includes('shipment received at facility') ||
    remarkLower.includes('received at facility') ||
    remarkLower.includes('received at origin center') ||
    remarkLower.includes('recieved at origin center')
  ) {
    return 'Shipment Received at Facility';
  }
  if (remarkLower.includes('bag received at facility') || remarkLower.includes('bag received')) {
    return 'Bag Received at Facility';
  }
  if (remarkLower.includes('bag added to trip')) {
    return 'Bag Added to Trip';
  }
  if (remarkLower.includes('added to bag') || remarkLower.includes('shipment bagged')) {
    return 'Shipment Bagged';
  }
  if (remarkLower.includes('document audited')) {
    return 'Document Audited';
  }
  if (remarkLower.includes('weight captured')) {
    return 'Weight Captured';
  }
  if (
    remarkLower.includes('vehicle departed') ||
    remarkLower.includes('left origin') ||
    remarkLower.includes('departed from client location')
  ) {
    return 'Vehicle Departed';
  }
  if (
    remarkLower.includes('out for delivery') ||
    statusLower === 'out for delivery' ||
    statusLower === 'ofd'
  ) {
    return 'Out For Delivery';
  }
  if (
    statusLower === 'delivered' ||
    (statusLower.includes('deliver') && !statusLower.includes('out for delivery') && !statusLower.includes('return')) ||
    (remarkLower.includes('delivered') && !remarkLower.includes('out for delivery') && !remarkLower.includes('return'))
  ) {
    return 'Delivered';
  }
  if (statusLower === 'returned' || statusLower === 'returned to origin' || remarkLower.includes('returned to origin')) {
    return 'Returned to Origin';
  }
  if (statusLower.includes('return in transit') || remarkLower.includes('return in transit')) {
    return 'Return In Transit';
  }
  if (statusLower.includes('return at hub') || remarkLower.includes('distribution center nearest')) {
    return 'Return at Hub';
  }
  if (statusLower.includes('return out for delivery')) {
    return 'Return Out For Delivery';
  }
  if (remarkLower.includes('manifest uploaded') || statusLower === 'manifest uploaded' || statusLower === 'manifested') {
    return 'Manifest Uploaded';
  }
  if (statusLower === 'picked up' || remarkLower.includes('picked up') || remarkLower.includes('collected')) {
    return 'Picked Up';
  }

  // 2. Fallbacks based on status if remark was generic
  if (statusLower === 'vehicle departed') return 'Vehicle Departed';
  if (statusLower === 'in transit') return cleanRemark || 'In Transit';

  return cleanRemark || status || 'In Transit';
}

function isDepartureAction(action: string): boolean {
  const a = action.toLowerCase();
  return a.includes('depart') || a.includes('left origin');
}

/**
 * Universal Delhivery B2B Tracking Aggregation Engine.
 *
 * Implements Topological Contiguity Clustering:
 * 1. Groups package scans of the same canonical action at the same physical facility during
 *    an active warehouse session into exactly ONE clean customer-facing timeline entry.
 * 2. Recognizes occurrence boundaries:
 *    - Sealed on departure ('Vehicle Departed', 'Dispatched') from the facility.
 *    - Sealed upon movement to a different physical facility ('Trip Arrived', 'Received at Facility').
 *    - Sealed upon terminal milestones ('Out For Delivery', 'Delivered').
 * 3. Correctly distinguishes subsequent visits:
 *    If a shipment returns to the same facility after departure or movement, the new scans form
 *    a distinct, separate operational occurrence card.
 * 4. Filters out all exceptions (Damaged, Lost, Missing, Held, etc.) and unverified unknown events.
 * 5. Returns exactly ONE clean card per operational occurrence with ZERO package badges,
 *    ZERO scan counts, and ZERO expandable accordions.
 */
export function aggregateTrackingHistory(
  rawEvents: RawTrackingScan[],
  options: AggregationOptions = {}
): AggregatedTrackingGroup[] {
  if (!rawEvents || rawEvents.length === 0) {
    return [];
  }

  // 1. Determine whether this is a Delhivery B2B/B2C or other shipment
  const isDelhivery = options.isDelhivery !== undefined
    ? options.isDelhivery
    : isDelhiveryService(options.service, options.serviceThrough, options.courier);

  // 2. Deduplicate identical physical events delivered across webhook and sync API
  const dedupedScans = sanitizeHistoryForCustomer(rawEvents, isDelhivery);

  interface ParsedScan {
    status: string;
    location: string;
    note: string;
    cleanRemark: string;
    canonicalAction: string;
    headline: string;
    occurredAt: Date;
    packageId: string | null;
  }

  const validScans: ParsedScan[] = [];

  for (const evt of dedupedScans) {
    // Absolute public exception suppression
    if (isExceptionStatus(evt.status, evt.note)) {
      continue;
    }
    // Unknown event safety suppression
    if (!isRoutineOperationalStatus(evt.status, evt.note)) {
      continue;
    }

    const rawDate = evt.occurred_at;
    let occurredAt = rawDate instanceof Date ? rawDate : new Date(rawDate);
    if (isNaN(occurredAt.getTime()) || occurredAt.getFullYear() <= 1970) {
      occurredAt = new Date();
    }

    const cleanNote = getCleanOperationalRemark(evt.note);
    const packageId = extractPackageId(evt);

    let normStatus: string;
    let canonicalAction: string;
    let headline: string;

    if (isDelhivery) {
      // 100% untouched Delhivery B2B and B2C operational action resolution
      normStatus = normalizeOperationalStatus(evt.status, cleanNote);
      canonicalAction = getCanonicalAction(normStatus, cleanNote);
      headline = toTitleCase(canonicalAction);
    } else {
      // Services other than Delhivery B2B and B2C:
      // Status MUST be displayed as the heading in the track result
      const rawStatusTrimmed = (evt.status || '').trim();
      normStatus = rawStatusTrimmed
        ? toTitleCase(rawStatusTrimmed.replace(/_/g, ' '))
        : normalizeOperationalStatus(evt.status, cleanNote);
      canonicalAction = normStatus;
      headline = normStatus;
    }

    validScans.push({
      status: normStatus,
      location: (evt.location || '').trim(),
      note: cleanNote || normStatus,
      cleanRemark: cleanNote.toLowerCase(),
      canonicalAction,
      headline,
      occurredAt,
      packageId
    });
  }

  if (validScans.length === 0) {
    return [];
  }

  // 3. Sort scans chronologically ASCENDING (oldest first) to trace physical logistics flow
  validScans.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  // 4. State Machine Clustering: Trace active occurrences and boundaries
  interface TempOccurrence {
    id: string;
    status: string;
    location: string;
    canonicalAction: string;
    headline: string;
    firstOccurredAt: Date;
    lastOccurredAt: Date;
    packageIds: Set<string>;
    items: ParsedScan[];
  }

  const completedOccurrences: TempOccurrence[] = [];
  const activeOccurrences = new Map<string, TempOccurrence>();
  let currentActiveFacility: string | null = null;

  for (const scan of validScans) {
    const facilityNorm = scan.location.toLowerCase();
    const actionNorm = scan.canonicalAction.toLowerCase();
    const isDeparture = isDepartureAction(scan.canonicalAction);
    const isOutForDeliveryOrDelivered = isDelhivery
      ? (actionNorm.includes('out for delivery') || actionNorm.includes('delivered') || actionNorm.includes('dispatched'))
      : (actionNorm.includes('out for delivery') || actionNorm.includes('delivered'));

    // Boundary Check 1: Movement to a different physical facility
    if (currentActiveFacility !== null && facilityNorm !== '' && facilityNorm !== currentActiveFacility) {
      // Seal all open occurrences from the previous facility
      for (const occ of Array.from(activeOccurrences.values())) {
        completedOccurrences.push(occ);
      }
      activeOccurrences.clear();
      currentActiveFacility = facilityNorm;
    }

    // Boundary Check 2: Terminal milestone (OFD or Delivered) seals prior facility operations
    if (isOutForDeliveryOrDelivered) {
      for (const occ of Array.from(activeOccurrences.values())) {
        completedOccurrences.push(occ);
      }
      activeOccurrences.clear();
    }

    // Boundary Check 3: Departure from the facility seals intake/handling occurrences
    if (isDeparture) {
      for (const [key, occ] of Array.from(activeOccurrences.entries())) {
        if (!isDepartureAction(occ.canonicalAction)) {
          completedOccurrences.push(occ);
          activeOccurrences.delete(key);
        }
      }
    }

    const occurrenceKey = `${facilityNorm}::${actionNorm}`;
    const existing = activeOccurrences.get(occurrenceKey);

    // Merge multi-piece package scans only if they occurred within a close operational window (default 30 mins)
    const maxWindowMs = (options.windowMinutes || 30) * 60 * 1000;
    const timeDiffMs = existing ? Math.abs(scan.occurredAt.getTime() - existing.lastOccurredAt.getTime()) : Infinity;
    const shouldMerge = existing && timeDiffMs <= maxWindowMs && (
      isDelhivery || scan.cleanRemark === existing.items[0]?.cleanRemark
    );

    if (shouldMerge && existing) {
      // Attach to the current active occurrence
      if (scan.occurredAt.getTime() < existing.firstOccurredAt.getTime()) {
        existing.firstOccurredAt = scan.occurredAt;
      }
      if (scan.occurredAt.getTime() > existing.lastOccurredAt.getTime()) {
        existing.lastOccurredAt = scan.occurredAt;
      }
      if (scan.packageId) {
        existing.packageIds.add(scan.packageId);
      }
      existing.items.push(scan);
    } else {
      if (existing) {
        completedOccurrences.push(existing);
        activeOccurrences.delete(occurrenceKey);
      }
      // Start a new operational occurrence
      const newOcc: TempOccurrence = {
        id: `occ-${completedOccurrences.length}-${scan.occurredAt.getTime()}`,
        status: scan.status,
        location: scan.location,
        canonicalAction: scan.canonicalAction,
        headline: scan.headline,
        firstOccurredAt: scan.occurredAt,
        lastOccurredAt: scan.occurredAt,
        packageIds: new Set<string>(),
        items: [scan]
      };
      if (scan.packageId) {
        newOcc.packageIds.add(scan.packageId);
      }
      activeOccurrences.set(occurrenceKey, newOcc);
    }

    if (facilityNorm !== '') {
      currentActiveFacility = facilityNorm;
    }
  }

  // Push any remaining active occurrences into completed list
  for (const occ of Array.from(activeOccurrences.values())) {
    completedOccurrences.push(occ);
  }

  // 5. Sort occurrences chronologically DESCENDING (newest occurrence first) for customer tracking view
  completedOccurrences.sort((a, b) => b.lastOccurredAt.getTime() - a.lastOccurredAt.getTime());

  // 6. Map to final AggregatedTrackingGroup structure
  return completedOccurrences.map((occ, idx) => {
    occ.items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    let distinctCount = occ.packageIds.size;
    if (options.maxShipmentPackages && options.maxShipmentPackages > 0 && distinctCount > options.maxShipmentPackages) {
      distinctCount = options.maxShipmentPackages;
    }

    return {
      id: `agg-group-${idx}-${occ.lastOccurredAt.getTime()}`,
      status: occ.status,
      location: occ.location,
      headline: occ.headline,
      is_exception: false,
      scan_count: occ.items.length,
      distinct_packages: distinctCount,
      has_package_identifiers: occ.packageIds.size > 0,
      first_occurred_at: occ.firstOccurredAt,
      last_occurred_at: occ.lastOccurredAt,
      is_time_range: false,
      events: occ.items.map(item => ({
        status: item.status,
        location: item.location,
        note: item.note,
        occurred_at: item.occurredAt,
        package_id: item.packageId
      }))
    };
  });
}

/**
 * Universal Delhivery B2B Tracking Aggregation Alias.
 */
export const aggregateDelhiveryB2BHistory = aggregateTrackingHistory;
