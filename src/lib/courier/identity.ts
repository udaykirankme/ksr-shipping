import { formatCustomerHistoryStatus } from '../format';

export interface IncomingTrackingEvent {
  status: string;
  location?: string | null;
  occurred_at: Date;
  note?: string | null;
  provider_event_id?: string | null;
  raw_status?: string | null;
}

export function normalizeNoteForComparison(note: string | null | undefined): string {
  if (!note) return '';
  let n = note.toLowerCase().trim();
  // Remove KSR prefixes to compare the core provider instruction
  n = n.replace(/^\[id:[^\]]+\]\s*/i, '');
  n = n.replace(/^webhook update:\s*/i, '');
  n = n.replace(/^external update:\s*/i, '');
  n = n.replace(/^updated by automated sync\s*/i, '');
  return n.trim();
}

/**
 * Sanitizes internal operational prefixes from history notes before exposing to customers.
 */
export function sanitizeCustomerHistoryNote(note: string | null | undefined): string {
  if (!note) return '';
  let n = note.trim();
  n = n.replace(/^\[id:[^\]]+\]\s*/i, '');
  n = n.replace(/^webhook update:\s*/i, '');
  n = n.replace(/^external update:\s*/i, '');
  n = n.replace(/^updated by automated sync\s*/i, '');
  return n.trim();
}

/**
 * Prepares history for customer display:
 * 1. Resolves internal courier status codes (e.g. "UD") and legacy all-caps statuses (e.g. "MANIFESTED")
 *    into clean, Title Case human-readable statuses using formatCustomerHistoryStatus.
 * 2. Cleans internal operational prefixes from notes.
 * 3. Deduplicates identical events (same resolved status, same location, same note, timestamp <= 1000ms),
 *    protecting against duplicate webhook/sync ingestion.
 * 4. Preserves distinct scans (e.g. multiple package pickup scans occurring seconds apart).
 */
export function sanitizeHistoryForCustomer<T extends { status: string; location?: string | null; note?: string | null; occurred_at: Date | string }>(
  history: T[]
): T[] {
  const result: T[] = [];
  for (const item of history) {
    const cleanNote = sanitizeCustomerHistoryNote(item.note);
    const resolvedStatus = formatCustomerHistoryStatus(item.status, cleanNote);
    const itemTime = new Date(item.occurred_at).getTime();
    const itemLoc = (item.location || '').trim().toLowerCase();
    const itemNoteNorm = cleanNote.toLowerCase();

    // Check if an identical event has already been recorded
    const isDuplicate = result.some(prev => {
      const prevTime = new Date(prev.occurred_at).getTime();
      const prevLoc = (prev.location || '').trim().toLowerCase();
      const prevNoteNorm = (prev.note || '').trim().toLowerCase();
      const prevStatusNorm = (prev.status || '').trim().toLowerCase();

      return (
        prevStatusNorm === resolvedStatus.trim().toLowerCase() &&
        prevLoc === itemLoc &&
        prevNoteNorm === itemNoteNorm &&
        Math.abs(prevTime - itemTime) <= 1000
      );
    });

    if (!isDuplicate) {
      result.push({
        ...item,
        status: resolvedStatus,
        note: cleanNote || null
      });
    }
  }
  return result;
}

export function isDuplicateEvent(
  existingEvent: { status: string; location: string | null; occurred_at: Date; note: string | null },
  incomingEvent: IncomingTrackingEvent
): boolean {
  // 1. If provider supplies a stable provider event identifier
  const existingNote = existingEvent.note || '';
  if (incomingEvent.provider_event_id) {
    if (existingNote.includes(`[ID:${incomingEvent.provider_event_id}]`)) {
      return true; // Exact ID match
    }
    
    // If incoming has an ID, and existing has a DIFFERENT ID, they are definitely different events.
    if (existingNote.match(/\[ID:[^\]]+\]/)) {
       return false;
    }
  }

  // 2. Deterministic composite identity fallback
  const diffMs = Math.abs(existingEvent.occurred_at.getTime() - incomingEvent.occurred_at.getTime());

  // Check if either timestamp was truncated to the exact minute (:00.000)
  const isTruncatedMinute = (d: Date) => d.getSeconds() === 0 && d.getMilliseconds() === 0;
  const eitherTruncated = isTruncatedMinute(existingEvent.occurred_at) || isTruncatedMinute(incomingEvent.occurred_at);

  const timeMatches = diffMs <= 1000 || (eitherTruncated && diffMs < 60000);
  if (!timeMatches) return false;

  const existingLoc = (existingEvent.location || '').trim().toLowerCase();
  const incomingLoc = (incomingEvent.location || '').trim().toLowerCase();
  if (existingLoc !== incomingLoc) return false;

  const normalizedExistingNote = normalizeNoteForComparison(existingEvent.note);
  const normalizedIncomingNote = normalizeNoteForComparison(incomingEvent.note || incomingEvent.raw_status);

  // If the core instructions differ, they are distinctly different events (e.g. "Added to Bag" vs "Bag Added To Trip")
  if (normalizedExistingNote !== normalizedIncomingNote) {
    if (normalizedExistingNote || normalizedIncomingNote) {
      return false;
    }
  }

  // Check status matching: direct equality or resolved human-readable match (e.g. "UD" vs "Vehicle Departed")
  const existingStatus = (existingEvent.status || '').trim().toLowerCase();
  const incomingStatus = (incomingEvent.status || '').trim().toLowerCase();
  if (existingStatus === incomingStatus) return true;

  const existingResolved = formatCustomerHistoryStatus(existingEvent.status, existingEvent.note).trim().toLowerCase();
  const incomingResolved = formatCustomerHistoryStatus(incomingEvent.status, incomingEvent.note || incomingEvent.raw_status).trim().toLowerCase();

  return existingResolved === incomingResolved;
}
