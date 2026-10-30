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

export function getStatusRank(status: string | null | undefined): number {
  if (!status) return 0;
  // Unknown or unmapped statuses like 'Pending' default to rank 0
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
