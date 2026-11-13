import { parseCalendarDate } from '@/lib/datetime';

/**
 * Standard dynamic Estimated Delivery Date fields recognized across courier APIs and webhooks.
 * Ordered by precedence.
 */
export const DYNAMIC_EDD_KEYS = [
  'estimated_date',
  'expected_delivery_date',
  'expected_date',
  'revised_delivery_date',
  'edd',
  'ExpectedDeliveryDate',
] as const;

/**
 * Static booking SLA delivery date fields.
 * These represent the initial contractual promise, NOT a dynamic routing revision.
 */
export const STATIC_SLA_KEYS = [
  'promised_delivery_date',
  'promised_date',
  'sla_delivery_date',
] as const;

/**
 * Safely extracts the first genuinely valid calendar date from an object by iterating
 * candidate keys in order and parsing each through parseCalendarDate.
 *
 * Prevents invalid truthy strings (e.g. "N/A", "null", "undefined") from short-circuiting
 * a subsequent valid date candidate.
 */
export function extractFirstValidCalendarDate(
  source: Record<string, any> | null | undefined,
  keys: readonly string[]
): Date | null {
  if (!source || typeof source !== 'object') return null;
  for (const key of keys) {
    const rawVal = source[key];
    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
      const parsed = parseCalendarDate(rawVal);
      if (parsed) {
        return parsed;
      }
    }
  }
  return null;
}

/**
 * Checks whether an extracted candidate dynamic date is merely an echo of the static
 * booking SLA date (e.g., both are 2026-11-07).
 */
export function isStaticSlaEcho(
  dynamicDate: Date | null | undefined,
  source: Record<string, any> | null | undefined
): boolean {
  if (!dynamicDate) return false;
  const staticSla = extractFirstValidCalendarDate(source, STATIC_SLA_KEYS);
  if (!staticSla) return false;
  return dynamicDate.getTime() === staticSla.getTime();
}

