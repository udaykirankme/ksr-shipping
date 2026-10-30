import { KSRTrackingStatus } from './types';

export function normalizeDelhiveryStatus(rawStatus: string | null | undefined, instruction: string | null | undefined): KSRTrackingStatus | string {
  const status = (rawStatus || '').trim();
  const note = (instruction || '').trim();

  if (!status) return 'Unknown';

  const statusLower = status.toLowerCase();
  const noteLower = note.toLowerCase();

  // 1. Out For Delivery Normalizations
  if (noteLower.includes('out for delivery') || statusLower === 'out for delivery' || statusLower === 'ofd') {
    return 'Out For Delivery';
  }

  // 2. Pending Normalizations
  if (statusLower === 'pending') {
    if (
      noteLower.includes('trip arrived') ||
      noteLower.includes('bag received') ||
      noteLower.includes('shipment received at facility') ||
      noteLower.includes('missing in audit') ||
      noteLower.includes('found in audit')
    ) {
      return 'In Transit';
    }
  }

  // 3. In Transit Normalizations (e.g., explicit instruction overrides)
  if (statusLower === 'in transit') {
    if (noteLower.includes('vehicle departed')) {
      return 'In Transit';
    }
  }

  // 4. Raw Provider Status Code Mappings for internal courier providers
  if (statusLower === 'left_origin' || statusLower === 'left origin') {
    return 'Vehicle Departed';
  }

  if (statusLower === 'ud') {
    if (noteLower.includes('depart')) return 'Vehicle Departed';
    if (noteLower.includes('pick')) return 'Picked Up';
    return 'In Transit';
  }

  if (statusLower === 'reached_destination') {
    return 'At Hub';
  }

  if (statusLower === 'dl') {
    return 'Delivered';
  }

  if (statusLower === 'ofd') {
    return 'Out For Delivery';
  }

  // Preserve all other statuses as-is to avoid destroying legitimate provider states (e.g. Delivered, RTO, Manifested)
  return status;
}

/**
 * Normalizes any courier status or raw internal provider code (e.g. LEFT_ORIGIN, UD, MANIFESTED)
 * into a customer-friendly, human-readable operational description.
 * Internal provider codes are NEVER exposed to customers.
 */
export function normalizeOperationalStatus(
  rawStatus: string | null | undefined,
  instruction?: string | null | undefined
): string {
  const status = (rawStatus || '').trim();
  const note = (instruction || '').trim();

  if (!status) return 'In Transit';

  const statusLower = status.toLowerCase();
  const noteLower = note.toLowerCase();

  if (statusLower === 'out for delivery' || statusLower === 'ofd' || noteLower.includes('out for delivery')) {
    return 'Out For Delivery';
  }

  if (statusLower === 'left_origin' || statusLower === 'left origin') {
    return 'Vehicle Departed';
  }

  if (statusLower === 'manifested') {
    return 'Manifest Uploaded';
  }

  if (statusLower === 'ud') {
    if (noteLower.includes('depart')) return 'Vehicle Departed';
    if (noteLower.includes('pick')) return 'Picked Up';
    if (noteLower.includes('hub') || noteLower.includes('arrived') || noteLower.includes('reached')) return 'At Hub';
    if (noteLower.includes('deliver')) return 'Delivered';
    return 'In Transit';
  }

  if (statusLower === 'reached_destination' || statusLower === 'reached destination') {
    return 'At Hub';
  }

  if (statusLower === 'dl') {
    return 'Delivered';
  }

  if (statusLower === 'in_transit') {
    return 'In Transit';
  }

  if (statusLower === 'picked_up') {
    return 'Picked Up';
  }

  const normalized = normalizeDelhiveryStatus(rawStatus, instruction);
  if (typeof normalized === 'string') {
    const normUpper = normalized.toUpperCase();
    if (normUpper === 'LEFT_ORIGIN') return 'Vehicle Departed';
    if (normUpper === 'MANIFESTED') return 'Manifest Uploaded';
    if (normUpper === 'UD') {
      if (noteLower.includes('depart')) return 'Vehicle Departed';
      if (noteLower.includes('pick')) return 'Picked Up';
      return 'In Transit';
    }
    if (normUpper === 'DL') return 'Delivered';
    if (normUpper === 'OFD') return 'Out For Delivery';
    return normalized;
  }

  return status;
}
