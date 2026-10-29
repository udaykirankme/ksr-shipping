import { KSRTrackingStatus } from './types';

export function normalizeDelhiveryStatus(rawStatus: string | null | undefined, instruction: string | null | undefined): KSRTrackingStatus | string {
  const status = (rawStatus || '').trim();
  const note = (instruction || '').trim();

  if (!status) return 'Unknown';

  const statusLower = status.toLowerCase();
  const noteLower = note.toLowerCase();

  // 1. Out For Delivery Normalizations
  if (noteLower.includes('out for delivery') || statusLower === 'out for delivery') {
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

  // 2. In Transit Normalizations (e.g., explicit instruction overrides)
  if (statusLower === 'in transit') {
    if (noteLower.includes('vehicle departed')) {
      return 'In Transit';
    }
  }

  const statusUpper = status.toUpperCase();

  // 3. Delivered Normalization
  if (statusUpper === 'DELIVERED' || statusUpper === 'DL' || noteLower.includes('delivered to') || noteLower === 'delivered') {
    return 'Delivered';
  }

  // 4. Returned / RTO Normalization
  if (statusUpper === 'RETURNED' || statusUpper === 'RTO' || statusUpper === 'RT' || noteLower.includes('returned to origin')) {
    return 'RTO';
  }

  // 5. Cancelled Normalization
  if (statusUpper === 'CANCELLED' || statusUpper === 'CAN' || noteLower.includes('cancelled')) {
    return 'Cancelled';
  }

  // 6. Picked Up Normalization
  if (noteLower.includes('picked up') || statusUpper === 'PICKED_UP' || statusUpper === 'PICKED UP' || statusUpper === 'PU' || statusUpper === 'PUD') {
    return 'Picked Up';
  }

  // 7. Dispatched Normalization (preserve legitimate courier status)
  if (statusLower === 'dispatched') {
    return 'Dispatched';
  }

  // 8. Vehicle Departed Normalization (for UD/pickup events where vehicle departed)
  if (noteLower.includes('vehicle departed')) {
    return 'Vehicle Departed';
  }

  // 9. Resolve bare internal courier codes like "UD" or short unmapped status types
  if (statusUpper === 'UD' || /^[A-Z0-9]{1,3}$/.test(statusUpper)) {
    return 'In Transit';
  }

  // Preserve all other statuses as-is to avoid destroying legitimate provider states (e.g. Delivered, RTO)
  return status;
}
