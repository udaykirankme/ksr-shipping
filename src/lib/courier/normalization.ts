import { KSRTrackingStatus } from './types';

export function normalizeDelhiveryStatus(rawStatus: string | null | undefined, instruction: string | null | undefined): KSRTrackingStatus | string {
  const status = (rawStatus || '').trim();
  const note = (instruction || '').trim();

  if (!status) return 'Unknown';

  const statusLower = status.toLowerCase();
  const noteLower = note.toLowerCase();

  // 1. Stage 1: Shipment Created / Manifested Normalizations
  // Manifested / Ready to Ship / Order Created must NEVER advance to Shipped or In Transit
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

  // 2. Out For Delivery Normalizations
  if (noteLower.includes('out for delivery') || statusLower === 'out for delivery' || statusLower === 'ofd') {
    return 'Out For Delivery';
  }

  // 3. Delivered Normalizations
  if (
    statusLower === 'dl' ||
    (statusLower === 'delivered' && !statusLower.includes('out for delivery'))
  ) {
    return 'Delivered';
  }

  // 4. Pending Normalizations
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

  // 5. In Transit Normalizations (e.g., explicit instruction overrides)
  if (statusLower === 'in transit') {
    if (noteLower.includes('vehicle departed')) {
      return 'In Transit';
    }
  }

  // 6. Raw Provider Status Code Mappings for internal courier providers
  if (statusLower === 'left_origin' || statusLower === 'left origin') {
    return 'Vehicle Departed';
  }

  if (statusLower === 'ud') {
    if (noteLower.includes('manifest uploaded') || noteLower.includes('ready to ship')) return 'Shipment Created';
    if (noteLower.includes('pick') || noteLower.includes('collected')) return 'Picked Up';
    if (noteLower.includes('depart')) return 'Vehicle Departed';
    if (noteLower.includes('out for delivery') || noteLower.includes('ofd')) return 'Out For Delivery';
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

  const statusLower = status.toLowerCase();
  const noteLower = note.toLowerCase();

  // If note or status indicates Manifest / Ready to Ship, never present as In Transit
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

  if (!status) return 'In Transit';

  if (statusLower === 'out for delivery' || statusLower === 'ofd' || noteLower.includes('out for delivery')) {
    return 'Out For Delivery';
  }

  if (statusLower === 'left_origin' || statusLower === 'left origin') {
    return 'Vehicle Departed';
  }

  if (statusLower === 'ud') {
    if (noteLower.includes('manifest uploaded') || noteLower.includes('ready to ship')) return 'Manifest Uploaded';
    if (noteLower.includes('depart')) return 'Vehicle Departed';
    if (noteLower.includes('pick') || noteLower.includes('collected')) return 'Picked Up';
    if (noteLower.includes('hub') || noteLower.includes('arrived') || noteLower.includes('reached')) return 'At Hub';
    if (noteLower.includes('out for delivery') || noteLower.includes('ofd')) return 'Out For Delivery';
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

/**
 * Returns the milestone stage index (0 to 4) for a given status and operational remark note.
 * Stage 0: Shipment Created (Manifested, Ready to Ship, Order Created)
 * Stage 1: Shipped (Confirmed physical courier pickup)
 * Stage 2: In Transit (Vehicle Departed, Hub scan, Bag Added, Dispatched)
 * Stage 3: Out for Delivery (OFD)
 * Stage 4: Delivered (DL, Successfully Delivered)
 */
export function getMilestoneStageIndex(
  status: string | null | undefined,
  note?: string | null | undefined
): number {
  if (!status && !note) return 0;
  const s = (status || '').trim().toLowerCase();
  const n = (note || '').trim().toLowerCase();

  // Stage 0: Shipment Created & Manifested
  // Manifested / Ready to Ship / Order Created must NEVER advance to Shipped or In Transit
  if (
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

  // Stage 4: Delivered
  if (
    s === 'delivered' ||
    s === 'dl' ||
    s === 'successfully delivered' ||
    (s.includes('deliver') &&
      !s.includes('out for delivery') &&
      !s.includes('ofd') &&
      !s.includes('undelivered') &&
      !s.includes('attempted') &&
      !s.includes('attempt')) ||
    (n.includes('delivered') &&
      !n.includes('out for delivery') &&
      !n.includes('ofd') &&
      !n.includes('undelivered') &&
      !n.includes('attempted') &&
      !n.includes('attempt'))
  ) {
    return 4;
  }

  // Stage 3: Out For Delivery
  if (s === 'out for delivery' || s === 'ofd' || n.includes('out for delivery') || n.includes('ofd')) {
    return 3;
  }

  // Stage 2: In Transit / Vehicle Departed / Hub
  if (
    s === 'vehicle departed' ||
    s === 'vehicle departed from client location' ||
    s === 'left origin' ||
    s === 'left_origin' ||
    s === 'dispatched' ||
    s === 'at hub' ||
    s === 'arrived at hub' ||
    s === 'arrived at destination hub' ||
    s === 'bag added to trip' ||
    s === 'trip arrived' ||
    n.includes('vehicle departed') ||
    n.includes('left origin') ||
    n.includes('bag added to trip') ||
    n.includes('trip arrived') ||
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

  // Generic in transit with explicit transit note
  if ((s === 'in transit' || s === 'in_transit') && (n.includes('trip') || n.includes('transit') || n.includes('depart'))) {
    return 2;
  }

  // Unknown or ambiguous statuses must not advance the milestone
  return 0;
}

/**
 * Resolves the milestone stage (0 to 4) by evaluating the complete shipment history and current status.
 * Ensures:
 * 1. An older event arriving late never regresses the highest achieved milestone.
 * 2. Manifested / Ready to Ship never marks Shipped or In Transit.
 * 3. Stale DB statuses (e.g. In Transit for a manifested shipment) are corrected using history.
 * 4. Bag Added to Trip and Bag Received at Facility are interpreted using operational sequence
 *    and context, not blindly mapped to In Transit.
 * 5. Distinct stages are achieved only with reliable operational confirmation.
 */
export function resolveMilestoneFromHistory(
  currentStatus: string | null | undefined,
  history?: Array<{ status: string; note?: string | null; location?: string | null; occurred_at?: Date | string }> | null,
  customerUpdate?: string | null | undefined
): number {
  if (!history || history.length === 0) {
    return getMilestoneStageIndex(currentStatus, customerUpdate);
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

  for (const evt of chronological) {
    const s = (evt.status || '').trim().toLowerCase();
    const n = (evt.note || '').trim().toLowerCase();

    // 1. Delivered (Stage 4)
    if (
      s === 'delivered' ||
      s === 'dl' ||
      s === 'successfully delivered' ||
      (s.includes('deliver') &&
        !s.includes('out for delivery') &&
        !s.includes('ofd') &&
        !s.includes('undelivered') &&
        !s.includes('attempted') &&
        !s.includes('attempt')) ||
      (n.includes('delivered') &&
        !n.includes('out for delivery') &&
        !n.includes('ofd') &&
        !n.includes('undelivered') &&
        !n.includes('attempted') &&
        !n.includes('attempt'))
    ) {
      maxStage = Math.max(maxStage, 4);
      hasConfirmedTransit = true;
      hasConfirmedPickup = true;
      continue;
    }

    // 2. Out for Delivery (Stage 3)
    if (s === 'out for delivery' || s === 'ofd' || n.includes('out for delivery') || n.includes('ofd')) {
      maxStage = Math.max(maxStage, 3);
      hasConfirmedTransit = true;
      hasConfirmedPickup = true;
      continue;
    }

    // 3. Genuine Departure or Transit Linehaul Trip (Stage 2)
    const isDepartureOrTrip =
      s === 'vehicle departed' ||
      s === 'vehicle departed from client location' ||
      s === 'left origin' ||
      s === 'left_origin' ||
      s === 'dispatched' ||
      s === 'at hub' ||
      s === 'arrived at hub' ||
      s === 'arrived at destination hub' ||
      s === 'trip arrived' ||
      n.includes('vehicle departed') ||
      n.includes('left origin') ||
      n.includes('bag added to trip') ||
      n.includes('trip arrived') ||
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

    // 5. Bag Received at Facility & In Transit scans evaluated using sequence & operational context:
    // If departure or trip already confirmed -> In Transit (Stage 2)
    // If pickup confirmed but no departure -> Shipped (Stage 1)
    // If neither pickup nor departure occurred -> Origin Stage 0 (Shipment Created)
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
        // Origin facility scan without confirmed pickup or departure does not advance
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

  // If no departure/trip transit evidence exists in history, currentStatus cannot claim In Transit
  if (!hasConfirmedTransit) {
    if (hasConfirmedPickup) {
      return Math.min(maxStage, 1);
    }
    return 0;
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
