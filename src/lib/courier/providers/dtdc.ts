import { CourierProvider, TrackingResponse } from '../types';

export class DTDCProvider implements CourierProvider {
  async trackShipment(awb: string): Promise<TrackingResponse> {
    // TODO: Implement actual API integration when credentials are provided.
    // For now, return a controlled error to satisfy the architecture.
    throw new Error("DTDC API integration is not configured yet.");
  }
}
