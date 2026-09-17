import { CourierProvider, TrackingResponse, KSRTrackingStatus } from '../types';

// Module-level cache for the JWT, kept only in server memory.
let cachedJwt: string | null = null;

export class DelhiveryB2BProvider implements CourierProvider {
  
  private async getJwt(): Promise<string> {
    if (cachedJwt) {
      return cachedJwt;
    }

    const username = process.env.DELHIVERY_B2B_USERNAME;
    const password = process.env.DELHIVERY_B2B_PASSWORD;

    if (!username || !password) {
      throw new Error("DELHIVERY_B2B_USERNAME and DELHIVERY_B2B_PASSWORD environment variables are not configured.");
    }

    // Attempting login via standard login paths for B2B APIs.
    // Ensure you define DELHIVERY_B2B_LOGIN_URL in your .env if it differs from this default.
    const loginUrl = process.env.DELHIVERY_B2B_LOGIN_URL || 'https://ltl-clients-api.delhivery.com/ums/login';

    let response: Response;
    try {
      response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
    } catch (err: any) {
      throw new Error(`Delhivery B2B Login network request failed: ${err.message}`);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (err: any) {
      if (!response.ok) {
        throw new Error(`Delhivery B2B Login failed with status: ${response.status} ${response.statusText}`);
      }
      throw new Error("Delhivery B2B Login returned invalid JSON.");
    }

    if (!response.ok) {
      console.error(`[Delhivery B2B LOGIN ERROR RESPONSE]:`, JSON.stringify(data));
      throw new Error(`Delhivery B2B Login failed: ${response.status} - ${data?.error?.message || response.statusText}`);
    }

    if (data && data.success === true && data.data && data.data.jwt) {
      cachedJwt = data.data.jwt;
      return data.data.jwt;
    } else {
      throw new Error("Delhivery B2B Login returned an unrecognized payload structure.");
    }
  }

  async trackShipment(identifier: string): Promise<TrackingResponse> {
    if (!identifier || identifier.trim() === '') {
      throw new Error("Delhivery B2B requires a valid LR Number.");
    }

    return this.executeTrackRequest(identifier, false);
  }

  private async executeTrackRequest(identifier: string, isRetry: boolean): Promise<TrackingResponse> {
    const jwt = await this.getJwt();
    const baseUrl = process.env.DELHIVERY_B2B_API_URL || 'https://ltl-clients-api.delhivery.com/lrn/track';
    const apiUrl = `${baseUrl}?lrnum=${encodeURIComponent(identifier.trim())}`;

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Accept': 'application/json'
        }
      });
    } catch (err: any) {
      throw new Error(`Delhivery B2B network request failed: ${err.message}`);
    }

    if (response.status === 401) {
      if (!isRetry) {
        // Token might have expired. Discard cached JWT and retry exactly once.
        cachedJwt = null;
        return this.executeTrackRequest(identifier, true);
      } else {
        // Retry also failed with 401. Authentication is genuinely failing.
        throw new Error("Delhivery B2B API authentication failed even after token refresh.");
      }
    }

    let rawData: any;
    try {
      rawData = await response.json();
    } catch (err: any) {
      if (!response.ok) {
        throw new Error(`Delhivery B2B API returned error status: ${response.status} ${response.statusText}`);
      }
      throw new Error("Delhivery B2B API returned invalid JSON.");
    }

    if (!response.ok) {
      // 4xx, 5xx errors with JSON body
      console.error(`[Delhivery B2B Error Response for ${identifier}]:`, JSON.stringify(rawData));
      const errMsg = rawData?.error?.message || response.statusText;
      throw new Error(`Delhivery B2B API Error: ${response.status} - ${errMsg}`);
    }

    // =========================================================================
    // RESPONSE PARSING - PENDING VERIFICATION
    // The exact JSON structure is currently undocumented.
    // Do NOT guess fields like data.status, location, messages, etc.
    // Wait for a real test response to complete this section properly.
    // =========================================================================
    
    // TEMPORARY: Log the raw data to console during the real test phase
    console.log(`[Delhivery B2B Raw Response for ${identifier}]:`, JSON.stringify(rawData));

    // Throwing a controlled error here to stop execution cleanly until we inspect
    // the real payload structure and know how to extract status/timestamp/location.
    throw new Error("Delhivery B2B API response structure is pending inspection. View server logs for the raw payload.");
  }
}
