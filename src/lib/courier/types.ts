export type KSRTrackingStatus = 
  | 'Shipment Created' 
  | 'Picked Up' 
  | 'Shipment Bagged' 
  | 'Shipment Received' 
  | 'Dispatched' 
  | 'In Transit' 
  | 'At Hub' 
  | 'Out For Delivery' 
  | 'Delivered' 
  | 'Cancelled' 
  | 'Returned'
  | 'RTO';

export const STATUS_RANKS: Record<KSRTrackingStatus, number> = {
  'Shipment Created': 10,
  'Picked Up': 20,
  'Shipment Bagged': 30,
  'Shipment Received': 40,
  'Dispatched': 50,
  'In Transit': 60,
  'At Hub': 70,
  'Out For Delivery': 80,
  'Delivered': 100,
  'Cancelled': 100,
  'Returned': 100,
  'RTO': 100,
};

export function getStatusRank(status: string | null | undefined, note?: string | null | undefined): number {
  if (!status) return 0;
  const s = status.trim().toLowerCase();
  const n = (note || '').trim().toLowerCase();

  // If note or status indicates Manifest / Ready to Ship / Order Created,
  // it must NEVER advance the shipment to Shipped or In Transit (Stage 1 / Rank 10)
  if (
    n.includes('manifest') ||
    n.includes('ready to ship') ||
    n.includes('label created') ||
    n.includes('order created') ||
    s === 'manifested' ||
    s === 'manifest uploaded' ||
    s === 'ready to ship' ||
    s === 'label created' ||
    s === 'order created' ||
    s === 'shipment created'
  ) {
    return 10;
  }

  // Facility scans at origin center must NOT independently imply pickup
  if ((s.includes('origin') || n.includes('origin')) && (s.includes('receiv') || n.includes('receiv') || s.includes('center') || n.includes('center'))) {
    if (!s.includes('pick') && !n.includes('pick') && !s.includes('depart') && !n.includes('depart')) {
      return 10;
    }
  }

  // Delivered (Terminal - Rank 100)
  if (
    s === 'delivered' ||
    s === 'dl' ||
    s === 'successfully delivered' ||
    (s.includes('deliver') && !s.includes('out for delivery') && !s.includes('ofd')) ||
    (n.includes('delivered') && !n.includes('out for delivery') && !n.includes('ofd'))
  ) {
    return 100;
  }

  // Terminal exception statuses
  if (s === 'cancelled' || s === 'returned' || s === 'rto') {
    return 100;
  }

  // Out For Delivery (Rank 80)
  if (s === 'out for delivery' || s === 'ofd' || n.includes('out for delivery') || n.includes('ofd')) {
    return 80;
  }

  // At Hub (Rank 70)
  if (s === 'at hub' || s === 'arrived at hub' || s === 'arrived at destination hub' || s === 'reached_destination' || s === 'reached destination') {
    return 70;
  }

  // In Transit / Vehicle Departed (Rank 60)
  if (
    s === 'vehicle departed' ||
    s === 'vehicle departed from client location' ||
    s === 'left origin' ||
    s === 'left_origin' ||
    s === 'in transit' ||
    s === 'in_transit' ||
    s === 'dispatched' ||
    s === 'bag added to trip' ||
    s === 'bag received at facility' ||
    n.includes('vehicle departed') ||
    n.includes('left origin') ||
    n.includes('bag added to trip') ||
    n.includes('trip arrived')
  ) {
    return 60;
  }

  // Dispatched (Rank 50)
  if (s === 'dispatched' || n.includes('dispatched')) {
    return 50;
  }

  // Shipment Received (Rank 40)
  if (s === 'shipment received') {
    return 40;
  }

  // Shipment Bagged (Rank 30)
  if (s === 'shipment bagged') {
    return 30;
  }

  // Confirmed Courier Pickup (Stage 2 - Rank 20)
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
    return 20;
  }

  return STATUS_RANKS[status as KSRTrackingStatus] || 0;
}

export interface TrackingEvent {
  status: KSRTrackingStatus;
  location: string;
  note: string;
  occurred_at: Date;
  raw_status?: string; // For debugging/logging if an unknown status arrives
  provider_event_id?: string; // Stable ID from the courier API, if available
}

export interface TrackingResponse {
  current_status: KSRTrackingStatus;
  current_location?: string;
  estimated_delivery?: Date | null;
  events: TrackingEvent[];
}

export interface CourierProvider {
  /**
   * Fetch tracking information from the external courier API.
   * @param awb The official tracking number (AWB) from the courier
   * @throws Error if the API call fails or is not configured
   */
  trackShipment(awb: string): Promise<TrackingResponse>;
}
