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
  n = n.replace(/^\[id:[^\]]+\]\s*/, '');
  n = n.replace(/^webhook update:\s*/, '');
  n = n.replace(/^external update:\s*/, '');
  n = n.replace(/^updated by automated sync\s*/, '');
  return n.trim();
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
  const timeMatches = Math.abs(existingEvent.occurred_at.getTime() - incomingEvent.occurred_at.getTime()) < 60000;
  if (!timeMatches) return false;

  const statusMatches = existingEvent.status === incomingEvent.status;
  if (!statusMatches) return false;

  const existingLoc = (existingEvent.location || '').trim().toLowerCase();
  const incomingLoc = (incomingEvent.location || '').trim().toLowerCase();
  if (existingLoc !== incomingLoc) return false;

  const normalizedExistingNote = normalizeNoteForComparison(existingEvent.note);
  const normalizedIncomingNote = normalizeNoteForComparison(incomingEvent.note || incomingEvent.raw_status);

  // Both notes are empty (or were just prefixes), rely on time/status/loc
  if (!normalizedExistingNote && !normalizedIncomingNote) return true;

  // If the core instructions differ, they are distinctly different events (e.g. "Added to Bag" vs "Bag Added To Trip")
  return normalizedExistingNote === normalizedIncomingNote;
}
