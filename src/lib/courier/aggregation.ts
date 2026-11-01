import { sanitizeCustomerHistoryNote, sanitizeHistoryForCustomer } from './identity';
import { isExceptionStatus, normalizeOperationalStatus } from './normalization';

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
 * Intelligently aggregates multiple package-level tracking scans belonging to the
 * same shipment stage and operational remark into concise, customer-friendly groups.
 *
 * Scans are grouped only if:
 * 1. Same normalized status (e.g. "In Transit", "Vehicle Departed")
 * 2. Same physical location (case-insensitive)
 * 3. Compatible operational remark (e.g. both are "Bag Added To Trip")
 * 4. Occur within a bounded time window (default: 10 minutes)
 *    - Strictly bounded: Scans do NOT chain indefinitely beyond the window from the first scan.
 *    - Accommodates interleaved multi-piece scans (e.g. Added to Bag and Bag Added to Trip per package).
 *
 * Preserves every raw scan inside `events` for expandable customer inspection.
 */
export function aggregateTrackingHistory(
  rawEvents: RawTrackingScan[],
  options: AggregationOptions = {}
): AggregatedTrackingGroup[] {
  if (!rawEvents || rawEvents.length === 0) {
    return [];
  }

  // 1. Deduplicate identical physical events across webhook and sync API
  const dedupedScans = sanitizeHistoryForCustomer(rawEvents);

  const windowMinutes = typeof options.windowMinutes === 'number' && options.windowMinutes > 0
    ? options.windowMinutes
    : 10;
  const windowMs = windowMinutes * 60 * 1000;

  // 2. Normalize and parse all scans
  interface ParsedScan {
    status: string;
    location: string;
    note: string;
    cleanRemark: string;
    occurredAt: Date;
    packageId: string | null;
  }

  const parsedScans: ParsedScan[] = dedupedScans.map(evt => {
    const rawDate = evt.occurred_at;
    let occurredAt = rawDate instanceof Date ? rawDate : new Date(rawDate);
    if (isNaN(occurredAt.getTime()) || occurredAt.getFullYear() <= 1970) {
      occurredAt = new Date();
    }

    const cleanNote = getCleanOperationalRemark(evt.note);
    const packageId = extractPackageId(evt);
    const normStatus = normalizeOperationalStatus(evt.status, cleanNote);

    return {
      status: normStatus,
      location: (evt.location || '').trim(),
      note: cleanNote || normStatus,
      cleanRemark: cleanNote.toLowerCase(),
      occurredAt,
      packageId
    };
  });

  // 3. Sort scans chronologically descending (newest first)
  parsedScans.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  // 4. Build aggregated groups
  interface TempGroup {
    status: string;
    location: string;
    cleanRemark: string;
    headline: string;
    isException: boolean;
    anchorTime: number;
    newestTime: number;
    oldestTime: number;
    packageIds: Set<string>;
    items: ParsedScan[];
  }

  const tempGroups: TempGroup[] = [];

  for (const scan of parsedScans) {
    if (isExceptionStatus(scan.status, scan.note)) {
      continue; // Exclude package-level exception events from customer aggregation
    }
    const scanTime = scan.occurredAt.getTime();
    const isScanException = isExceptionStatus(scan.status, scan.note);

    // Look for an existing open group within the bounded window that matches status, location, and remark.
    // Exception events (Damaged, Lost, Missing, Held, Cancelled, etc.) MUST NEVER be merged into routine scan groups.
    let matchingGroup: TempGroup | undefined = undefined;

    if (!isScanException) {
      for (let i = tempGroups.length - 1; i >= 0; i--) {
        const g = tempGroups[i];
        if (g.isException) continue; // Routine scans must never merge into exception events

        // If group is beyond 2x window from scan, stop looking backward
        if (Math.abs(scanTime - g.anchorTime) > windowMs * 2) {
          break;
        }

        const sameStatus = g.status.toLowerCase() === scan.status.toLowerCase();
        const sameLocation = g.location.toLowerCase() === scan.location.toLowerCase();
        const sameRemark = g.cleanRemark === scan.cleanRemark;

        if (sameStatus && sameLocation && sameRemark) {
          const proposedNewest = Math.max(g.newestTime, scanTime);
          const proposedOldest = Math.min(g.oldestTime, scanTime);
          // Strictly bounded window check: span cannot exceed windowMs
          if ((proposedNewest - proposedOldest) <= windowMs) {
            matchingGroup = g;
            break;
          }
        }
      }
    }

    if (matchingGroup) {
      matchingGroup.newestTime = Math.max(matchingGroup.newestTime, scanTime);
      matchingGroup.oldestTime = Math.min(matchingGroup.oldestTime, scanTime);
      if (scan.packageId) {
        matchingGroup.packageIds.add(scan.packageId);
      }
      matchingGroup.items.push(scan);
    } else {
      // Start a new group
      const headlineText = scan.note || scan.status;
      const headline = toTitleCase(headlineText);
      const pkgSet = new Set<string>();
      if (scan.packageId) {
        pkgSet.add(scan.packageId);
      }

      tempGroups.push({
        status: scan.status,
        location: scan.location,
        cleanRemark: scan.cleanRemark,
        headline,
        isException: isScanException,
        anchorTime: scanTime,
        newestTime: scanTime,
        oldestTime: scanTime,
        packageIds: pkgSet,
        items: [scan]
      });
    }
  }

  // 5. Sort groups by latest activity first (chronologically descending)
  tempGroups.sort((a, b) => b.newestTime - a.newestTime);

  // 6. Map to final AggregatedTrackingGroup structure
  return tempGroups.map((g, idx) => {
    // Sort items within the group chronologically descending
    g.items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    const firstTime = new Date(g.oldestTime);
    const lastTime = new Date(g.newestTime);
    const isTimeRange = (g.newestTime - g.oldestTime) >= 60000;

    let distinctCount = g.packageIds.size;
    if (options.maxShipmentPackages && options.maxShipmentPackages > 0 && distinctCount > options.maxShipmentPackages) {
      distinctCount = options.maxShipmentPackages;
    }

    return {
      id: `agg-group-${idx}-${g.oldestTime}`,
      status: g.status,
      location: g.location,
      headline: g.headline,
      is_exception: g.isException,
      scan_count: g.items.length,
      distinct_packages: distinctCount,
      has_package_identifiers: g.packageIds.size > 0,
      first_occurred_at: firstTime,
      last_occurred_at: lastTime,
      is_time_range: isTimeRange,
      events: g.items.map(item => ({
        status: item.status,
        location: item.location,
        note: item.note,
        occurred_at: item.occurredAt,
        package_id: item.packageId
      }))
    };
  });
}
