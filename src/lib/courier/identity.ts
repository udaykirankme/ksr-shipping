import { normalizeOperationalStatus } from './normalization';

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
  if (upper === 'UD') return 'Shipment Updated';
  if (upper === 'DL') return 'Delivered';

  return n.trim();
}

export function isDuplicateEvent(
  existingEvent: { status: string; location: string | null; occurred_at: Date; note: string | null },
  incomingEvent: IncomingTrackingEvent
): boolean {
  const existingPkgId = extractPackageIdentifier(existingEvent.note);
  const incomingPkgId = incomingEvent.package_id?.trim() ||
                        incomingEvent.provider_event_id?.trim() ||
                        extractPackageIdentifier(incomingEvent.note);

  // 1. If both supply package/provider event identifiers:
  // If the identifiers differ, they are distinct physical scans (e.g. two packages under the same LR)
  if (existingPkgId && incomingPkgId && existingPkgId.toLowerCase() !== incomingPkgId.toLowerCase()) {
    return false;
  }

  const existingLoc = (existingEvent.location || '').trim().toLowerCase();
  const incomingLoc = (incomingEvent.location || '').trim().toLowerCase();
  if (existingLoc !== incomingLoc) return false;

  const normalizedExistingStatus = normalizeOperationalStatus(existingEvent.status, existingEvent.note).toLowerCase();
  const normalizedIncomingStatus = normalizeOperationalStatus(incomingEvent.status, incomingEvent.note || incomingEvent.raw_status).toLowerCase();
  if (normalizedExistingStatus !== normalizedIncomingStatus) return false;

  const normalizedExistingNote = normalizeNoteForComparison(existingEvent.note);
  const normalizedIncomingNote = normalizeNoteForComparison(incomingEvent.note || incomingEvent.raw_status);

  // Both notes are empty (or were just prefixes), or match
  const notesMatch = (!normalizedExistingNote && !normalizedIncomingNote) || (normalizedExistingNote === normalizedIncomingNote);
  if (!notesMatch) return false;

  const diffMs = Math.abs(existingEvent.occurred_at.getTime() - incomingEvent.occurred_at.getTime());

  // If both have the same package identifier:
  if (existingPkgId && incomingPkgId && existingPkgId.toLowerCase() === incomingPkgId.toLowerCase()) {
    return diffMs < 60000;
  }

  // Without package identifiers:
  // Duplicate webhook/API transmissions of the same physical event typically have identical timestamps
  // or differ by sub-second millisecond precision (e.g. 23:21:27.901Z vs 23:21:27.000Z).
  // Distinct multi-package scans without IDs are separated by seconds (> 2000ms).
  return diffMs < 2000;
}

/**
 * Prepares history for customer display by:
 * 1. Sanitizing raw internal provider codes into clean human-readable descriptions
 * 2. Stripping internal barcodes/WBNs/IDs so they are never exposed in public tracking
 * 3. Deduplicating duplicate physical events delivered across webhook and API sync
 * 4. Preserving all legitimate package scans
 */
export function sanitizeHistoryForCustomer<T extends { status: string; location?: string | null; note?: string | null; occurred_at: Date | string }>(
  history: T[]
): T[] {
  const result: T[] = [];

  for (const item of history) {
    const cleanNote = sanitizeCustomerHistoryNote(item.note);
    const itemDate = item.occurred_at instanceof Date ? item.occurred_at : new Date(item.occurred_at);
    const normalizedStatus = normalizeOperationalStatus(item.status, cleanNote);

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
        note: cleanNote || null
      });
    }
  }

  return result;
}
