import { isExceptionStatus, isRoutineOperationalStatus, normalizeOperationalStatus } from './normalization';

export interface IncomingTrackingEvent {
  status: string;
  location?: string | null;
  occurred_at: Date;
  note?: string | null;
  provider_event_id?: string | null;
  package_id?: string | null;
  raw_status?: string | null;
}

/**
 * Extracts a package or provider event identifier (e.g. WBN or box/piece ID) from a note or event.
 * Checks explicit fields or prefixes like [PKG:...], [ID:...], [WBN:...].
 */
export function extractPackageIdentifier(noteOrEvent: string | IncomingTrackingEvent | null | undefined): string | null {
  if (!noteOrEvent) return null;
  if (typeof noteOrEvent === 'object') {
    if (noteOrEvent.package_id && noteOrEvent.package_id.trim()) {
      return noteOrEvent.package_id.trim();
    }
    if (noteOrEvent.provider_event_id && noteOrEvent.provider_event_id.trim()) {
      return noteOrEvent.provider_event_id.trim();
    }
    return extractPackageIdentifier(noteOrEvent.note);
  }
  const match = noteOrEvent.match(/\[(?:pkg|id|wbn):([a-zA-Z0-9_\-]+)\]/i);
  return match ? match[1].trim() : null;
}

export function normalizeNoteForComparison(note: string | null | undefined): string {
  if (!note) return '';
  let n = note.toLowerCase().trim();
  // Remove KSR and provider prefixes to compare the core operational instruction
  n = n.replace(/^\[(?:id|pkg|wbn):[^\]]+\]\s*/i, '');
  n = n.replace(/^webhook update:\s*/i, '');
  n = n.replace(/^external update:\s*/i, '');
  n = n.replace(/^updated by automated sync\s*/i, '');
  return n.trim();
}

/**
 * Checks if a string represents an internal courier code that must not be exposed to customers.
 */
const INTERNAL_CODES = new Set([
  'LEFT_ORIGIN', 'LEFT ORIGIN',
  'UD',
  'MANIFESTED',
  'DL',
  'OFD',
  'IN_TRANSIT',
  'REACHED_DESTINATION',
  'PENDING'
]);

export function isInternalCourierCode(str: string | null | undefined): boolean {
  if (!str) return false;
  const s = str.trim().toUpperCase();
  return INTERNAL_CODES.has(s) || (s.includes('_') && !s.includes(' '));
}

/**
 * Sanitizes internal operational prefixes and courier codes from history notes before exposing to customers.
 * Guarantees that internal package barcodes, WBNs, or provider IDs are never exposed in public tracking.
 */
export function sanitizeCustomerHistoryNote(note: string | null | undefined): string {
  if (!note) return '';
  let n = note.trim();
  n = n.replace(/^\[(?:id|pkg|wbn):[^\]]+\]\s*/i, '');
  n = n.replace(/^webhook update:\s*/i, '');
  n = n.replace(/^external update:\s*/i, '');
  n = n.replace(/^updated by automated sync\s*/i, '');

  // If the note itself is just a raw internal code, convert to human-readable
  const upper = n.toUpperCase();
  if (upper === 'LEFT_ORIGIN' || upper === 'LEFT ORIGIN') return 'Vehicle Departed';
  if (upper === 'MANIFESTED') return 'Manifest Uploaded';
  if (upper === 'UD') return 'In Transit';
  if (upper === 'DL') return 'Delivered';
  if (upper === 'OFD') return 'Out For Delivery';

  return n.trim();
}

/**
 * Evaluates whether an incoming event is a duplicate of an existing record.
 * Uses strict conservative physical composite identity:
 * - Package scope / WBN identifier (both must match; different IDs or scope mismatch = not duplicate)
 * - Physical facility location (case-insensitive, trimmed)
 * - Canonical operational action
 * - Core operational remark (stripped of ID prefixes)
 * - Exact normalized carrier timestamp comparison:
 *     - diffMs === 0: exact physical instant match -> DUPLICATE
 *     - diffMs > 0: treated as AMBIGUOUS -> NOT DUPLICATE (preserve both records)
 */
export function isDuplicateEvent(
  existingEvent: { status: string; location: string | null; occurred_at: Date; note: string | null },
  incomingEvent: IncomingTrackingEvent
): boolean {
  const existingPkgId = extractPackageIdentifier(existingEvent.note);
  const incomingPkgId = incomingEvent.package_id?.trim() ||
                        incomingEvent.provider_event_id?.trim() ||
                        extractPackageIdentifier(incomingEvent.note);

  // 1. Package scope / WBN check:
  // If one has an identifier and the other does not, or if they differ,
  // they represent distinct physical scopes (package-level vs shipment-level or distinct boxes).
  // They MUST NOT be merged or treated as duplicates!
  if (existingPkgId || incomingPkgId) {
    if (!existingPkgId || !incomingPkgId) {
      return false;
    }
    if (existingPkgId.toLowerCase() !== incomingPkgId.toLowerCase()) {
      return false;
    }
  }

  // 2. Physical Location check (case-insensitive, trimmed)
  const existingLoc = (existingEvent.location || '').trim().toLowerCase();
  const incomingLoc = (incomingEvent.location || '').trim().toLowerCase();
  if (existingLoc !== incomingLoc) return false;

  // 3. Canonical Action check
  const normalizedExistingStatus = normalizeOperationalStatus(existingEvent.status, existingEvent.note).toLowerCase();
  const normalizedIncomingStatus = normalizeOperationalStatus(incomingEvent.status, incomingEvent.note || incomingEvent.raw_status).toLowerCase();
  if (normalizedExistingStatus !== normalizedIncomingStatus) return false;

  // 4. Core Operational Remark check (stripped of prefixes and ID tags)
  const normalizedExistingNote = normalizeNoteForComparison(existingEvent.note);
  const normalizedIncomingNote = normalizeNoteForComparison(incomingEvent.note || incomingEvent.raw_status);
  const notesMatch = (!normalizedExistingNote && !normalizedIncomingNote) || (normalizedExistingNote === normalizedIncomingNote);
  if (!notesMatch) return false;

  // 5. Exact normalized carrier timestamp comparison
  const diffMs = Math.abs(existingEvent.occurred_at.getTime() - incomingEvent.occurred_at.getTime());

  // Conservative deduplication:
  // Drop ONLY when exact physical instant equivalence is established (diffMs === 0).
  // If timestamps differ by > 0ms (even up to 2000ms), treat as AMBIGUOUS and preserve as separate records.
  if (diffMs === 0) {
    return true;
  }

  return false;
}

/**
 * Prepares history for customer display by:
 * 1. Filtering out all exceptions (Damaged, Lost, Missing, Held, etc.)
 * 2. Sanitizing raw internal provider codes into clean human-readable descriptions
 * 3. Stripping internal barcodes/WBNs/IDs so they are never exposed in public tracking
 * 4. Deduplicating identical physical events delivered across webhook and API sync
 */
export function sanitizeHistoryForCustomer<T extends { status: string; location?: string | null; note?: string | null; occurred_at: Date | string }>(
  history: T[]
): T[] {
  const result: T[] = [];

  for (const item of history) {
    // Exclude exception events from public customer consumption
    if (isExceptionStatus(item.status, item.note)) {
      continue;
    }
    const cleanNote = sanitizeCustomerHistoryNote(item.note);
    const itemDate = item.occurred_at instanceof Date ? item.occurred_at : new Date(item.occurred_at);
    const normalizedStatus = normalizeOperationalStatus(item.status, cleanNote);
    if (isExceptionStatus(normalizedStatus, cleanNote)) {
      continue;
    }
    // Unknown event safety suppression for public customer history
    if (!isRoutineOperationalStatus(normalizedStatus, cleanNote)) {
      continue;
    }
    const pkgId = extractPackageIdentifier(item as any) || extractPackageIdentifier(item.note);

    const isDuplicate = result.some(existing => {
      const existingDate = existing.occurred_at instanceof Date ? existing.occurred_at : new Date(existing.occurred_at);
      return isDuplicateEvent(
        {
          status: existing.status,
          location: existing.location || null,
          occurred_at: existingDate,
          note: existing.note || null
        },
        {
          status: normalizedStatus,
          location: item.location || null,
          occurred_at: itemDate,
          note: cleanNote
        }
      );
    });

    if (!isDuplicate) {
      result.push({
        ...item,
        status: normalizedStatus,
        note: cleanNote || null,
        package_id: pkgId || (item as any).package_id || undefined
      });
    }
  }

  return result;
}
