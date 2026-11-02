import { toTitleCase } from './aggregation';
import { KSRTrackingStatus } from './types';

export const EXCEPTION_PATTERNS = [
  /\bdamag/i,
  /\bmiss/i,
  /\blost\b/i,
  /\bmisplac/i,
  /\bheld\b/i,
  /\bhold\b/i,
  /\bcancel/i,
  /\breject/i,
  /\brefus/i,
  /\bundeliver/i,
  /\bdelivery\s+exception/i,
  /\battempt/i,
  /\bfailed\b/i,
  /\bdestroyed\b/i,
  /\bconfiscat/i,
  /\bshort/i,
  /\bpilfer/i,
  /\bseiz/i,
  /\binvestigat/i,
  /\blogistics\s+exception/i,
  /\babnormal/i,
  /\bincident/i,
];

export const RETURN_PATTERNS = [
  /\brto\b/i,
  /\breturn/i,
  /\bconsignor\s+location\b/i,
  /\bdistribution\s+center\s+nearest\b/i,
];

export const ROUTINE_STATUS_PATTERNS = [
  /\bmanifest/i,
  /\bready\s+to\s+ship/i,
  /\blabel\s+created/i,
  /\border\s+created/i,
  /\bshipment\s+created/i,
  /\bnot\s+picked/i,
  /\bpick/i,
  /\bcollect/i,
  /\bshipped/i,
  /\bdepart/i,
  /\bleft\s+origin/i,
  /\bdispatched/i,
  /\bin\s+transit/i,
  /\bbag/i,
  /\btrip/i,
  /\breceiv/i,
  /\bat\s+hub/i,
  /\breached/i,
  /\binward/i,
  /\bout\s+for\s+delivery/i,
  /\bofd\b/i,
  /\bdeliver/i,
  /\bdl\b/i,
  /\bpending\b/i,
];

const INTERNAL_CODES = new Set([
  'LEFT_ORIGIN',
  'LEFT ORIGIN',
  'UD',
  'MANIFESTED',
  'DL',
  'OFD',
  'IN_TRANSIT',
  'REACHED_DESTINATION',
  'PENDING'
]);

function isInternalCode(str: string | null | undefined): boolean {
  if (!str) return false;
  const s = str.trim().toUpperCase();
  return INTERNAL_CODES.has(s) || (s.includes('_') && !s.includes(' '));
}

/**
 * Multi-attribute exception classifier.
 * Checks status, instruction note, and provider StatusType (e.g. LT).
 */
export function isExceptionStatus(
  status: string | null | undefined,
  note?: string | null | undefined,
  statusType?: string | null | undefined
): boolean {
  const st = (statusType || '').trim().toUpperCase();
  if (st === 'LT') return true;

  const s = (status || '').trim();
  const n = (note || '').trim();
  const text = `${s} ${n} ${st}`;
  if (!text.trim()) return false;
  return EXCEPTION_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Checks whether an event represents a return journey (RT / RTO).
 */
export function isReturnStatus(
  status: string | null | undefined,
  note?: string | null | undefined,
  statusType?: string | null | undefined
): boolean {
  const st = (statusType || '').trim().toUpperCase();
  if (st === 'RT' || st === 'RTO') return true;

  const s = (status || '').trim();
  const n = (note || '').trim();
  const text = `${s} ${n} ${st}`;
  if (!text.trim()) return false;
  return RETURN_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Resolves return journey descriptions according to official carrier semantics.
 */
export function resolveReturnDescription(
  status: string | null | undefined,
  note?: string | null | undefined,
  statusType?: string | null | undefined
): string {
  const s = (status || '').trim().toLowerCase();
  const n = (note || '').trim().toLowerCase();
  const text = `${s} ${n}`;

  if (text.includes('out for delivery') || text.includes('ofd') || text.includes('dispatched') || text.includes('dispatch')) {
    return 'Return Out For Delivery';
  }
  if (
    (text.includes('delivered') || text.includes('dl') || text.includes('completed') || text.includes('rto delivered')) &&
    !text.includes('out for delivery')
  ) {
    return 'Returned to Origin';
  }
  if (text.includes('distribution center') || text.includes('hub') || text.includes('pending') || text.includes('reached')) {
    return 'Return at Hub';
  }
  return 'Return In Transit';
}

/**
 * Positive whitelist classifier for routine operational events.
 * Returns false for unverified, ambiguous, or exception events.
 */
export function isRoutineOperationalStatus(
  status: string | null | undefined,
  note?: string | null | undefined,
  statusType?: string | null | undefined
): boolean {
  if (isExceptionStatus(status, note, statusType)) {
    return false;
  }
  if (isReturnStatus(status, note, statusType)) {
    return true;
  }
  const s = (status || '').trim();
  const n = (note || '').trim();
  const text = `${s} ${n}`;
  if (!text.trim()) return false;
  return ROUTINE_STATUS_PATTERNS.some(pattern => pattern.test(text));
}

export function resolveExceptionDescription(
  status: string | null | undefined,
  note?: string | null | undefined,
  statusType?: string | null | undefined
): string {
  const s = (status || '').trim();
  const n = (note || '').trim();
  const st = (statusType || '').trim().toUpperCase();
  const text = `${s} ${n} ${st}`.toLowerCase();

  if (st === 'LT' || text.includes('lost')) return 'Shipment Lost';
  if (text.includes('damag')) return 'Shipment Damaged';
  if (text.includes('miss')) return 'Shipment Missing';
  if (text.includes('misplac')) return 'Shipment Misplaced';
  if (text.includes('held') || text.includes('hold')) return 'Shipment Held';
  if (text.includes('cancel')) return 'Shipment Cancelled';
  if (text.includes('reject') || text.includes('refus')) return 'Shipment Rejected';
  if (text.includes('investigat')) return 'Shipment Under Investigation';
  if (text.includes('undeliver') || text.includes('delivery exception') || text.includes('attempt') || text.includes('failed')) return 'Delivery Exception';

  return s || 'Delivery Exception';
}

/**
 * Normalizes Delhivery B2B carrier statuses and remarks into canonical KSR statuses.
 */
export function normalizeDelhiveryStatus(
  rawStatus: string | null | undefined,
  instruction?: string | null | undefined,
  statusType?: string | null | undefined
): KSRTrackingStatus | string {
  const status = (rawStatus || '').trim();
  const note = (instruction || '').trim();
  const st = (statusType || '').trim().toUpperCase();

  if (!status && !st) return 'Unknown';

  if (isExceptionStatus(rawStatus, instruction, statusType)) {
    return resolveExceptionDescription(rawStatus, instruction, statusType);
  }

  if (isReturnStatus(rawStatus, instruction, statusType)) {
    return resolveReturnDescription(rawStatus, instruction, statusType);
  }

  const statusLower = status.toLowerCase();
  const noteLower = note.toLowerCase();

  // Official Delhivery B2B: Not Picked -> Stage 0 (Shipment Created)
  if (statusLower === 'not picked' || statusLower === 'not_picked' || noteLower.includes('not picked')) {
    return 'Shipment Created';
  }

  // Stage 0: Manifested / Ready to Ship / Order Created
  if (
    noteLower.includes('manifest uploaded') ||
    noteLower.includes('ready to ship') ||
    noteLower.includes('label created') ||
    noteLower.includes('order created') ||
    (noteLower.includes('manifest') && !noteLower.includes('error'))
  ) {
    if (statusLower === 'manifested') return 'Manifested';
    return 'Shipment Created';
  }

  if (statusLower === 'manifested') {
    return 'Manifested';
  }

  if (
    statusLower === 'ready to ship' ||
    statusLower === 'label created' ||
    statusLower === 'order created' ||
    statusLower === 'shipment created'
  ) {
    return 'Shipment Created';
  }

  // Official Delhivery B2B: Dispatched -> Out For Delivery (Stage 3)
  if (statusLower === 'dispatched' || noteLower.includes('dispatched')) {
    return 'Out For Delivery';
  }

  // Out For Delivery
  if (noteLower.includes('out for delivery') || statusLower === 'out for delivery' || statusLower === 'ofd') {
    return 'Out For Delivery';
  }

  // Delivered
  if (
    statusLower === 'dl' ||
    (statusLower === 'delivered' && !statusLower.includes('out for delivery'))
  ) {
    return 'Delivered';
  }

  // Official Delhivery B2B: Pending
  if (statusLower === 'pending') {
    if (
      noteLower.includes('trip arrived') ||
      noteLower.includes('bag received') ||
      noteLower.includes('shipment received at facility') ||
      noteLower.includes('destination') ||
      noteLower.includes('hub') ||
      noteLower.includes('facility')
    ) {
      return 'In Transit';
    }
    if (noteLower.includes('pickup') || noteLower.includes('origin')) {
      return 'Shipment Created';
    }
    return 'In Transit';
  }

  // In Transit
  if (statusLower === 'in transit' || statusLower === 'in_transit') {
    return 'In Transit';
  }

  // Raw Provider Status Code Mappings
  if (statusLower === 'left_origin' || statusLower === 'left origin') {
    return 'Vehicle Departed';
  }

  if (statusLower === 'ud') {
    if (noteLower.includes('manifest uploaded') || noteLower.includes('ready to ship')) return 'Shipment Created';
    if (noteLower.includes('pick') || noteLower.includes('collected')) return 'Picked Up';
    if (noteLower.includes('depart')) return 'Vehicle Departed';
    if (noteLower.includes('out for delivery') || noteLower.includes('ofd') || noteLower.includes('dispatched') || noteLower === 'dispatch') return 'Out For Delivery';
    if (
      (noteLower === 'delivered' || noteLower.includes('delivered successfully') || noteLower.includes('successfully delivered')) &&
      !noteLower.includes('attempt') &&
      !noteLower.includes('failed') &&
      !noteLower.includes('undeliver')
    ) {
      return 'Delivered';
    }
    return 'In Transit';
  }

  if (statusLower === 'reached_destination' || statusLower === 'reached destination') {
    return 'At Hub';
  }

  if (statusLower === 'ofd') {
    return 'Out For Delivery';
  }

  // If status is recognized on positive routine whitelist, preserve
  if (isRoutineOperationalStatus(rawStatus, instruction, statusType)) {
    return status;
  }

  return 'Unknown';
}

/**
 * Normalizes any courier status or raw internal provider code (e.g. LEFT_ORIGIN, UD, MANIFESTED)
 * into a customer-friendly, human-readable operational description.
 * Internal provider codes are NEVER exposed to customers.
 */
export function normalizeOperationalStatus(
  rawStatus: string | null | undefined,
  instruction?: string | null | undefined,
  statusType?: string | null | undefined
): string {
  const status = (rawStatus || '').trim();
  const note = (instruction || '').trim();
  const st = (statusType || '').trim().toUpperCase();

  if (isExceptionStatus(rawStatus, instruction, statusType)) {
    return resolveExceptionDescription(rawStatus, instruction, statusType);
  }

  if (isReturnStatus(rawStatus, instruction, statusType)) {
    return resolveReturnDescription(rawStatus, instruction, statusType);
  }

  const statusLower = status.toLowerCase();
  const noteLower = note.toLowerCase();

  // Manifest / Ready to ship
  if (
    noteLower.includes('manifest uploaded') ||
    noteLower.includes('ready to ship') ||
    noteLower.includes('label created') ||
    noteLower.includes('order created') ||
    (noteLower.includes('manifest') && !noteLower.includes('error')) ||
    statusLower === 'manifested' ||
    statusLower === 'manifest uploaded' ||
    statusLower === 'ready to ship' ||
    statusLower === 'label created' ||
    statusLower === 'order created'
  ) {
    return 'Manifest Uploaded';
  }

  if (statusLower === 'not picked' || statusLower === 'not_picked' || noteLower.includes('not picked')) {
    return 'Shipment Created';
  }

  if (!status) return 'In Transit';

  if (statusLower === 'out for delivery' || statusLower === 'ofd' || noteLower.includes('out for delivery')) {
    return 'Out For Delivery';
  }

  if (statusLower === 'left_origin' || statusLower === 'left origin') {
    return 'Vehicle Departed';
  }

  if (statusLower === 'dispatched' || noteLower.includes('dispatched')) {
    return 'Out For Delivery';
  }

  if (statusLower === 'ud') {
    if (noteLower.includes('manifest uploaded') || noteLower.includes('ready to ship')) return 'Manifest Uploaded';
    if (noteLower.includes('depart')) return 'Vehicle Departed';
    if (noteLower.includes('pick') || noteLower.includes('collected')) return 'Picked Up';
    if (noteLower.includes('hub') || noteLower.includes('arrived') || noteLower.includes('reached')) return 'At Hub';
    if (noteLower.includes('out for delivery') || noteLower.includes('ofd') || noteLower.includes('dispatched') || noteLower === 'dispatch') return 'Out For Delivery';
    if (
      (noteLower === 'delivered' || noteLower.includes('delivered successfully') || noteLower.includes('successfully delivered')) &&
      !noteLower.includes('attempt') &&
      !noteLower.includes('failed') &&
      !noteLower.includes('undeliver')
    ) {
      return 'Delivered';
    }
    if (noteLower.includes('bag') || noteLower.includes('trip') || noteLower.includes('receiv') || noteLower.includes('transit')) return 'In Transit';
    return 'In Transit';
  }

  if (statusLower === 'reached_destination' || statusLower === 'reached destination') {
    return 'At Hub';
  }

  if (
    statusLower === 'dl' ||
    (statusLower.includes('deliver') &&
      !statusLower.includes('out for delivery') &&
      !statusLower.includes('attempt') &&
      !statusLower.includes('failed') &&
      !statusLower.includes('undeliver'))
  ) {
    return 'Delivered';
  }

  if (statusLower === 'in_transit') {
    return 'In Transit';
  }

  if (statusLower === 'picked_up' || statusLower === 'picked up') {
    return 'Picked Up';
  }

  const normalized = normalizeDelhiveryStatus(rawStatus, instruction, statusType);
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
    if (normUpper === 'UNKNOWN') return 'Unknown';
    return normalized;
  }

  return status;
}

/**
 * Returns the milestone stage index (0 to 4) for a given status and operational remark note.
 * Stage 0: Shipment Created (Manifested, Ready to Ship, Order Created, Not Picked)
 * Stage 1: Shipped (Confirmed physical courier pickup)
 * Stage 2: In Transit (Vehicle Departed, Hub scan, Bag Added, Dispatched)
 * Stage 3: Out for Delivery (OFD)
 * Stage 4: Delivered (DL, Successfully Delivered to Consignee)
 *
 * NOTE: RTO and Return events must NEVER advance to Stage 4 (Delivered).
 */
/**
 * Returns the milestone stage index (0 to 4) for non-Delhivery shipments.
 * Stage 0: Shipment Created (or Manifested)
 * Stage 1: Picked Up, Shipment Bagged
 * Stage 2: Dispatched, In Transit, At Hub, Shipment Received
 * Stage 3: Out For Delivery (OFD)
 * Stage 4: Delivered (DL)
 */
export function getNonDelhiveryMilestoneStage(
  status: string | null | undefined,
  note?: string | null | undefined
): number {
  if (!status && !note) return 0;
  if (isExceptionStatus(status, note)) return 0;
  if (isReturnStatus(status, note)) return 2;

  const s = (status || '').trim().toLowerCase();
  const n = (note || '').trim().toLowerCase();

  // Stage 4: Delivered
  if (
    s === 'delivered' ||
    s === 'dl' ||
    (s.includes('deliver') &&
      !s.includes('out for delivery') &&
      !s.includes('ofd') &&
      !s.includes('undelivered') &&
      !s.includes('attempt') &&
      !s.includes('return') &&
      !s.includes('rto'))
  ) {
    return 4;
  }

  // Stage 3: Out For Delivery
  if (
    s === 'out for delivery' ||
    s === 'ofd' ||
    n.includes('out for delivery') ||
    n.includes('ofd')
  ) {
    return 3;
  }

  // Stage 2: Dispatched, In Transit, At Hub, Shipment Received
  if (
    s === 'dispatched' ||
    s === 'in transit' ||
    s === 'in_transit' ||
    s === 'at hub' ||
    s === 'shipment received' ||
    s === 'vehicle departed' ||
    s === 'left origin' ||
    s === 'trip arrived' ||
    s.includes('hub') ||
    s.includes('transit') ||
    s.includes('dispatched') ||
    s.includes('received')
  ) {
    return 2;
  }

  // Stage 1: Picked Up, Shipment Bagged
  if (
    s === 'picked up' ||
    s === 'picked_up' ||
    s === 'shipped' ||
    s === 'shipment bagged' ||
    s.includes('pick') ||
    s.includes('shipped') ||
    s.includes('bag')
  ) {
    return 1;
  }

  // Stage 0: Shipment Created, Manifested, Ready to Ship
  return 0;
}

export function getMilestoneStageIndex(
  status: string | null | undefined,
  note?: string | null | undefined,
  statusType?: string | null | undefined,
  isDelhivery: boolean = false
): number {
  if (!isDelhivery) {
    return getNonDelhiveryMilestoneStage(status, note);
  }
  if (!status && !note) return 0;
  if (isExceptionStatus(status, note, statusType)) {
    return 0;
  }
  if (isReturnStatus(status, note, statusType)) {
    // Return journey: RTO must NEVER map to Stage 4 (Consignee Delivered)
    const s = (status || '').toLowerCase();
    const n = (note || '').toLowerCase();
    if (
      s.includes('out for delivery') ||
      n.includes('out for delivery') ||
      s.includes('dispatched') ||
      n.includes('dispatched') ||
      s.includes('dispatch') ||
      n.includes('dispatch')
    ) {
      return 3;
    }
    return 2;
  }

  const s = (status || '').trim().toLowerCase();
  const n = (note || '').trim().toLowerCase();

  // Stage 0: Shipment Created, Manifested, Not Picked
  if (
    s === 'not picked' ||
    s === 'not_picked' ||
    n.includes('not picked') ||
    n.includes('manifest uploaded') ||
    n.includes('ready to ship') ||
    n.includes('label created') ||
    n.includes('order created') ||
    (n.includes('manifest') && !n.includes('error')) ||
    s === 'manifested' ||
    s === 'manifest uploaded' ||
    s === 'ready to ship' ||
    s === 'label created' ||
    s === 'order created' ||
    s === 'shipment created'
  ) {
    return 0;
  }

  // Facility scans at origin center must NOT independently imply pickup or transit
  if ((s.includes('origin') || n.includes('origin')) && (s.includes('receiv') || n.includes('receiv') || s.includes('center') || n.includes('center'))) {
    if (!s.includes('pick') && !n.includes('pick') && !s.includes('depart') && !n.includes('depart')) {
      return 0;
    }
  }

  // Stage 4: Delivered (ONLY when delivered to intended consignee)
  if (
    s === 'delivered' ||
    s === 'dl' ||
    s === 'successfully delivered' ||
    (s.includes('deliver') &&
      !s.includes('out for delivery') &&
      !s.includes('ofd') &&
      !s.includes('undelivered') &&
      !s.includes('attempted') &&
      !s.includes('attempt') &&
      !s.includes('return') &&
      !s.includes('rto')) ||
    (n.includes('delivered') &&
      !n.includes('out for delivery') &&
      !n.includes('ofd') &&
      !n.includes('undelivered') &&
      !n.includes('attempted') &&
      !n.includes('attempt') &&
      !n.includes('return') &&
      !n.includes('rto'))
  ) {
    return 4;
  }

  // Stage 3: Out For Delivery / Dispatched
  if (
    s === 'out for delivery' ||
    s === 'ofd' ||
    s === 'dispatched' ||
    n.includes('out for delivery') ||
    n.includes('ofd') ||
    n.includes('dispatched')
  ) {
    return 3;
  }

  // Stage 2: In Transit / Vehicle Departed / Hub
  if (
    s === 'vehicle departed' ||
    s === 'vehicle departed from client location' ||
    s === 'left origin' ||
    s === 'left_origin' ||
    s === 'at hub' ||
    s === 'arrived at hub' ||
    s === 'arrived at destination hub' ||
    s === 'bag added to trip' ||
    s === 'trip arrived' ||
    s === 'shipment received at facility' ||
    n.includes('vehicle departed') ||
    n.includes('left origin') ||
    n.includes('bag added to trip') ||
    n.includes('trip arrived') ||
    n.includes('shipment received at facility') ||
    (s.includes('hub') && !n.includes('manifest')) ||
    (s.includes('depart') && !n.includes('manifest'))
  ) {
    return 2;
  }

  // Stage 1: Shipped (Confirmed physical courier pickup)
  if (
    s === 'picked up' ||
    s === 'picked_up' ||
    s === 'shipment picked up' ||
    s === 'picked up by courier' ||
    s === 'collected from client' ||
    s === 'shipped' ||
    n.includes('picked up') ||
    n.includes('collected from client') ||
    n.includes('shipment picked up')
  ) {
    return 1;
  }

  // Pending: destination facility -> Stage 2; origin -> Stage 0
  if (s === 'pending') {
    if (n.includes('destination') || n.includes('hub') || n.includes('trip') || n.includes('facility')) {
      return 2;
    }
    return 0;
  }

  // Generic in transit with explicit transit note
  if ((s === 'in transit' || s === 'in_transit') && (n.includes('trip') || n.includes('transit') || n.includes('depart') || n.includes('bag') || n.includes('receiv'))) {
    return 2;
  }

  // Unknown or ambiguous statuses must NOT advance milestone
  return 0;
}

/**
 * Resolves the milestone stage (0 to 4) by evaluating the complete shipment history and current status.
 * Ensures:
 * 1. An older event arriving late never regresses the highest achieved milestone.
 * 2. Manifested / Ready to Ship never marks Shipped or In Transit.
 * 3. Stale DB statuses (e.g. In Transit for a manifested shipment) are corrected using history.
 * 4. RTO / Return journey NEVER advances to Stage 4 (Consignee Delivered).
 * 5. Unknown events do NOT advance or regress milestones.
 */
export function resolveMilestoneFromHistory(
  currentStatus: string | null | undefined,
  history?: Array<{ status: string; note?: string | null; location?: string | null; occurred_at?: Date | string }> | null,
  customerUpdate?: string | null | undefined,
  isDelhivery: boolean = false
): number {
  if (!isDelhivery) {
    let maxStage = 0;

    if (history && history.length > 0) {
      for (const evt of history) {
        if (isExceptionStatus(evt.status, evt.note)) continue;
        const stage = getNonDelhiveryMilestoneStage(evt.status, evt.note);
        if (stage > maxStage) {
          maxStage = stage;
        }
      }
    }

    if (currentStatus && !isExceptionStatus(currentStatus, customerUpdate)) {
      const currentStage = getNonDelhiveryMilestoneStage(currentStatus, customerUpdate);
      if (currentStage > maxStage) {
        maxStage = currentStage;
      }
    }

    if (isReturnStatus(currentStatus, customerUpdate) || (history && history.some(e => isReturnStatus(e.status, e.note)))) {
      return Math.min(maxStage, 3);
    }

    return maxStage;
  }

  if (!history || history.length === 0) {
    return getMilestoneStageIndex(currentStatus, customerUpdate, undefined, true);
  }

  // Sort chronological ascending (oldest first) to evaluate operational sequence
  const chronological = [...history].sort((a, b) => {
    const da = a.occurred_at ? new Date(a.occurred_at).getTime() : 0;
    const db = b.occurred_at ? new Date(b.occurred_at).getTime() : 0;
    return da - db;
  });

  let maxStage = 0;
  let hasConfirmedPickup = false;
  let hasConfirmedTransit = false;
  let isReturnedShipment = isReturnStatus(currentStatus, customerUpdate);

  for (const evt of chronological) {
    if (isExceptionStatus(evt.status, evt.note)) {
      continue; // Exception events must never advance progressive milestones
    }
    if (isReturnStatus(evt.status, evt.note)) {
      isReturnedShipment = true;
      const returnStage = getMilestoneStageIndex(evt.status, evt.note);
      maxStage = Math.max(maxStage, returnStage);
      hasConfirmedTransit = true;
      hasConfirmedPickup = true;
      continue;
    }
    if (!isRoutineOperationalStatus(evt.status, evt.note)) {
      continue; // Unknown events must not advance milestones
    }

    const s = (evt.status || '').trim().toLowerCase();
    const n = (evt.note || '').trim().toLowerCase();

    // 1. Delivered to Consignee (Stage 4)
    if (
      s === 'delivered' ||
      s === 'dl' ||
      s === 'successfully delivered' ||
      (s.includes('deliver') &&
        !s.includes('out for delivery') &&
        !s.includes('ofd') &&
        !s.includes('undelivered') &&
        !s.includes('attempted') &&
        !s.includes('attempt') &&
        !s.includes('return') &&
        !s.includes('rto')) ||
      (n.includes('delivered') &&
        !n.includes('out for delivery') &&
        !n.includes('ofd') &&
        !n.includes('undelivered') &&
        !n.includes('attempted') &&
        !n.includes('attempt') &&
        !n.includes('return') &&
        !n.includes('rto'))
    ) {
      maxStage = Math.max(maxStage, 4);
      hasConfirmedTransit = true;
      hasConfirmedPickup = true;
      continue;
    }

    // 2. Out for Delivery / Dispatched (Stage 3)
    if (
      s === 'out for delivery' ||
      s === 'ofd' ||
      s === 'dispatched' ||
      n.includes('out for delivery') ||
      n.includes('ofd') ||
      n.includes('dispatched')
    ) {
      maxStage = Math.max(maxStage, 3);
      hasConfirmedTransit = true;
      hasConfirmedPickup = true;
      continue;
    }

    // 3. Genuine Departure, Transit Trip, or Hub scan (Stage 2)
    const isDepartureOrTrip =
      s === 'vehicle departed' ||
      s === 'vehicle departed from client location' ||
      s === 'left origin' ||
      s === 'left_origin' ||
      s === 'at hub' ||
      s === 'arrived at hub' ||
      s === 'arrived at destination hub' ||
      s === 'trip arrived' ||
      s === 'shipment received at facility' ||
      n.includes('vehicle departed') ||
      n.includes('left origin') ||
      n.includes('bag added to trip') ||
      n.includes('trip arrived') ||
      n.includes('shipment received at facility') ||
      (s.includes('hub') && !n.includes('manifest')) ||
      (s.includes('depart') && !n.includes('manifest'));

    if (isDepartureOrTrip) {
      maxStage = Math.max(maxStage, 2);
      hasConfirmedTransit = true;
      hasConfirmedPickup = true;
      continue;
    }

    // 4. Confirmed Physical Courier Pickup (Stage 1)
    const isPickup =
      s === 'picked up' ||
      s === 'picked_up' ||
      s === 'shipment picked up' ||
      s === 'picked up by courier' ||
      s === 'collected from client' ||
      s === 'shipped' ||
      n.includes('picked up') ||
      n.includes('collected from client') ||
      n.includes('shipment picked up');

    if (isPickup) {
      maxStage = Math.max(maxStage, 1);
      hasConfirmedPickup = true;
      continue;
    }

    // 5. Bag Received / Bagged
    const isFacilityOrBag =
      s === 'bag received at facility' ||
      s === 'shipment bagged' ||
      n.includes('bag received') ||
      n.includes('bagged');

    if (isFacilityOrBag) {
      if (hasConfirmedTransit) {
        maxStage = Math.max(maxStage, 2);
      } else if (hasConfirmedPickup) {
        maxStage = Math.max(maxStage, 1);
      } else {
        maxStage = Math.max(maxStage, 0);
      }
      continue;
    }

    // Generic In Transit status without explicit note
    if (s === 'in transit' || s === 'in_transit') {
      const isManifest = n.includes('manifest') || n.includes('ready to ship') || n.includes('order created');
      if (!isManifest) {
        if (hasConfirmedTransit) {
          maxStage = Math.max(maxStage, 2);
        } else if (hasConfirmedPickup) {
          maxStage = Math.max(maxStage, 1);
        } else {
          if (n.includes('transit') || n.includes('trip')) {
            maxStage = Math.max(maxStage, 2);
            hasConfirmedTransit = true;
            hasConfirmedPickup = true;
          }
        }
      }
    }
  }

  // RTO / Return Guard: Stage 4 is strictly reserved for consignee delivery
  if (isReturnedShipment) {
    return Math.min(maxStage, 3);
  }

  // If no departure/trip transit evidence exists in history, currentStatus cannot claim In Transit
  if (!hasConfirmedTransit) {
    if (hasConfirmedPickup) {
      return Math.min(maxStage, 1);
    }
    return 0;
  }

  // If current status or customer update is an exception, do not let it alter maxStage
  if (isExceptionStatus(currentStatus, customerUpdate)) {
    return maxStage;
  }

  // Check current status and customer update with manifest guard
  const isManifestOnly =
    (customerUpdate || '').toLowerCase().includes('manifest') ||
    (customerUpdate || '').toLowerCase().includes('ready to ship') ||
    (currentStatus || '').toLowerCase().includes('manifest');

  if (isManifestOnly && !hasConfirmedTransit && !hasConfirmedPickup) {
    return 0;
  }

  const currentStage = getMilestoneStageIndex(currentStatus, customerUpdate);
  if (currentStage > maxStage) {
    if (isManifestOnly && currentStage >= 2 && !hasConfirmedTransit) {
      return 0;
    }
    maxStage = currentStage;
  }

  return maxStage;
}

/**
 * Resolves the overall customer-facing shipment status for public display.
 * Guarantees that exceptions (Damaged, Missing, Lost, Misplaced, Held, etc.)
 * NEVER appear on customer tracking.
 * If raw status is an exception or unknown, derives status strictly from the
 * highest confirmed routine milestone achieved.
 */
export function resolveCustomerCurrentStatus(
  rawStatus: string | null | undefined,
  history?: Array<{ status: string; note?: string | null; location?: string | null; occurred_at?: Date | string }> | null,
  customerUpdate?: string | null | undefined,
  isDelhivery: boolean = false
): string {
  // Check if latest history event represents Return
  if (history && history.length > 0) {
    const sorted = [...history].sort((a, b) => {
      const da = a.occurred_at ? new Date(a.occurred_at).getTime() : 0;
      const db = b.occurred_at ? new Date(b.occurred_at).getTime() : 0;
      return db - da; // newest first
    });
    const latestEvent = sorted[0];
    if (latestEvent && isReturnStatus(latestEvent.status, latestEvent.note)) {
      return resolveReturnDescription(latestEvent.status, latestEvent.note);
    }
  }

  if (isReturnStatus(rawStatus, customerUpdate)) {
    return resolveReturnDescription(rawStatus, customerUpdate);
  }

  const cleanRaw = (rawStatus || '').trim();
  const isRawException = isExceptionStatus(cleanRaw);

  // 1. If raw status is NOT an exception and is on the confirmed routine whitelist, normalize it
  if (!isRawException && cleanRaw && isRoutineOperationalStatus(cleanRaw)) {
    if (!isDelhivery) {
      return toTitleCase(cleanRaw.replace(/_/g, ' '));
    }
    const normalized = normalizeOperationalStatus(cleanRaw);
    if (!isExceptionStatus(normalized) && isRoutineOperationalStatus(normalized)) {
      return normalized;
    }
  }

  // 2. If raw status is an exception OR unknown, derive the true operational status from the highest achieved routine milestone
  const stage = resolveMilestoneFromHistory(null, history, null, isDelhivery);
  switch (stage) {
    case 4: return 'Delivered';
    case 3: return 'Out For Delivery';
    case 2: return 'In Transit';
    case 1: return 'Shipped';
    case 0:
    default:
      return 'Shipment Created';
  }
}

/**
 * Resolves the eligible customer update message for the public tracking banner.
 * Completely excludes exceptions (e.g. "Shipment damaged", "Shipment missing", "Shipment lost").
 * If the shipment's customer_update is an exception, unknown, or empty, returns the latest
 * eligible routine operational update from history.
 */
export function resolveCustomerEligibleUpdate(
  customerUpdate: string | null | undefined,
  cleanedHistory?: Array<{ status: string; note?: string | null }> | null,
  isDelhivery: boolean = true
): string | null {
  // For shipments other than Delhivery B2B and B2C:
  // Shipment update MUST be exactly what was entered in the admin.
  // It should NOT be taken from the last update notes.
  // If nothing was entered in admin (or it is empty), return null so there is no space for shipment update.
  if (!isDelhivery) {
    const raw = (customerUpdate || '').trim();
    return raw !== '' ? raw : null;
  }

  // Delhivery B2B and B2C logic (100% untouched):
  const clean = (customerUpdate || '')
    .replace(/\[(?:ID|PKG|WBN|AWB):[^\]]+\]/gi, '')
    .trim();

  // If customer_update is present and NOT an exception, NOT internal code, and IS routine, preserve it
  if (
    clean &&
    !isExceptionStatus(clean) &&
    !isInternalCode(clean) &&
    isRoutineOperationalStatus(clean)
  ) {
    return clean;
  }

  // If customer_update was an exception (or empty/unknown), return the latest eligible routine operational update from history
  if (cleanedHistory && cleanedHistory.length > 0) {
    for (const evt of cleanedHistory) {
      if (!evt) continue;
      const note = (evt.note || '')
        .replace(/\[(?:ID|PKG|WBN|AWB):[^\]]+\]/gi, '')
        .trim();
      if (
        note &&
        !isExceptionStatus(evt.status, note) &&
        !isInternalCode(note) &&
        note.toLowerCase() !== 'status updated' &&
        isRoutineOperationalStatus(evt.status, note)
      ) {
        return note;
      }
    }
  }

  return null;
}
