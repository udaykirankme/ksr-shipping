import {
  formatBusinessDate,
  formatBusinessDateTime,
  toBusinessDateInput,
} from './datetime';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | Date): string {
  return formatBusinessDate(dateString);
}

export function formatDateTime(dateString: string | Date): string {
  return formatBusinessDateTime(dateString);
}

export function formatDateToYYYYMMDD(date: Date): string {
  return toBusinessDateInput(date);
}

/**
 * Formats a status string into Title Case where the first letter of each word
 * is capitalized and the remaining letters are lowercase.
 * Handles spaces, underscores, and hyphenated status names.
 *
 * Examples:
 *   MANIFESTED       → Manifested
 *   IN TRANSIT       → In Transit
 *   OUT FOR DELIVERY → Out For Delivery
 *   DELIVERED        → Delivered
 *   SHIPMENT CREATED → Shipment Created
 *   OUT-FOR-DELIVERY → Out-For-Delivery
 *   PRE-DISPATCH     → Pre-Dispatch
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  const normalized = str.replace(/_/g, ' ');
  return normalized.replace(/[A-Za-z0-9]+/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Formats customer-facing tracking history status labels into Title Case,
 * ensuring internal provider codes (such as "UD", "RT", "DL", or any unmapped short code)
 * are resolved to their human-readable status using verified event notes rather than
 * exposed as internal identifiers or unreadable abbreviations.
 *
 * Examples:
 *   "MANIFESTED"                                        → "Manifested"
 *   "IN TRANSIT"                                        → "In Transit"
 *   "UD", note: "Vehicle departed from client location" → "Vehicle Departed"
 *   "UD", note: "Shipment picked up"                    → "Picked Up"
 *   "UD", note: "Manifest uploaded"                     → "Manifested"
 *   "UD", note: "Out for delivery"                      → "Out For Delivery"
 *   "UD", note: "Delivered to consignee"                → "Delivered"
 *   "UD", note: "Weather delay at transit hub"          → "In Transit"
 *   "DL", note: "Delivered"                             → "Delivered"
 *   "RT", note: "Returned to warehouse"                 → "Returned"
 *   "OFD", note: "Out for delivery"                     → "Out For Delivery"
 *   "XX", note: "Ambiguous scan"                        → "In Transit"
 */
export function formatCustomerHistoryStatus(status: string | null | undefined, note?: string | null): string {
  const s = (status || '').trim();
  const n = (note || '').trim().toLowerCase();
  const sUpper = s.toUpperCase();

  // 1. Explicit internal courier code mappings
  if (sUpper === 'UD') {
    if (n.includes('vehicle departed')) return 'Vehicle Departed';
    if (n.includes('picked up') || n.includes('pickup')) return 'Picked Up';
    if (n === 'manifest uploaded' || n === 'manifested' || n.includes('manifest uploaded')) return 'Manifested';
    if (n.includes('out for delivery')) return 'Out For Delivery';
    if (n === 'delivered' || n.startsWith('delivered to')) return 'Delivered';
    return 'In Transit';
  }

  if (sUpper === 'DL') {
    if (n.includes('out for delivery')) return 'Out For Delivery';
    return 'Delivered';
  }

  if (sUpper === 'RT' || sUpper === 'RTO') {
    return 'Returned';
  }

  if (sUpper === 'PU' || sUpper === 'PUD') {
    if (n.includes('vehicle departed')) return 'Vehicle Departed';
    return 'Picked Up';
  }

  if (sUpper === 'OFD') {
    return 'Out For Delivery';
  }

  if (sUpper === 'CAN') {
    return 'Cancelled';
  }

  // 2. Any other unmapped short code (<= 4 chars, e.g. "XX", "DIS", "FDL", "RAD")
  // Check if note provides a reliable milestone
  if (/^[A-Z0-9]{1,4}$/i.test(s) && !['AIR', 'HUB'].includes(sUpper)) {
    if (n.includes('vehicle departed')) return 'Vehicle Departed';
    if (n.includes('picked up') || n.includes('pickup')) return 'Picked Up';
    if (n === 'manifest uploaded' || n === 'manifested' || n.includes('manifest uploaded')) return 'Manifested';
    if (n.includes('out for delivery')) return 'Out For Delivery';
    if (n.includes('delivered')) return 'Delivered';
    if (n.includes('returned') || n.includes('rto')) return 'Returned';
    if (n.includes('cancelled')) return 'Cancelled';
    // Safe customer-friendly fallback for unknown short code: In Transit (never Delivered)
    return 'In Transit';
  }

  // 3. Known status overrides from note if candidate status was generic or secondary
  if (sUpper === 'PICKED_UP' || sUpper === 'PICKED UP') {
    if (n.includes('vehicle departed')) return 'Vehicle Departed';
    return 'Picked Up';
  }

  return toTitleCase(s);
}
