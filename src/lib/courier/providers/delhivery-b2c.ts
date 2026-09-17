import { CourierProvider, TrackingResponse } from '../types';

export class DelhiveryB2CProvider implements CourierProvider {
  async trackShipment(awb: string): Promise<TrackingResponse> {
    // TODO: Implement actual Delhivery B2C API integration when credentials are provided.
    // For now, return a controlled error to satisfy the architecture.
    throw new Error("Delhivery B2C API integration is not configured yet.");
  }
}
