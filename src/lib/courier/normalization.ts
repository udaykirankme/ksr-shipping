import { KSRTrackingStatus } from './types';

export function normalizeDelhiveryStatus(rawStatus: string | null | undefined, instruction: string | null | undefined): KSRTrackingStatus | string {
  const status = (rawStatus || '').trim();
  const note = (instruction || '').trim();

  if (!status) return 'Unknown';

  const statusLower = status.toLowerCase();
  const noteLower = note.toLowerCase();

  // 1. Pending Normalizations
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

  // Preserve all other statuses as-is to avoid destroying legitimate provider states (e.g. Delivered, RTO)
  return status;
}
