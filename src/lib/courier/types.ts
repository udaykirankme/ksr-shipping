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
  | 'Returned';

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
