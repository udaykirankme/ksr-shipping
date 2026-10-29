import { CourierProvider, TrackingResponse, TrackingEvent, KSRTrackingStatus } from '../types';

/**
 * Maps Delhivery B2B tracking status and scan remark to a human-readable KSR tracking status.
 *
 * Rules:
 * 1. Use the actual human-readable status supplied by Delhivery whenever available.
 * 2. Correctly map valid B2B event statuses across all events (Manifested, Picked Up, Vehicle Departed, In Transit, Out For Delivery, Delivered).
 * 3. Never hardcode UD to Manifested.
 * 4. Never blindly convert every UD event to In Transit when a more accurate event status is available.
 * 5. If an event has only a status code (e.g. UD), use explicit, verified remark mappings. Do not invent milestones from ambiguous remarks.
 */
export function mapDelhiveryB2BStatus(
  statusCandidate: string | null | undefined,
  scanRemark: string | null | undefined,
  statusType?: string | null
): KSRTrackingStatus {
  const candidate = (statusCandidate || '').trim();
  const remark = (scanRemark || '').trim().toLowerCase();
  const stType = (statusType || '').trim().toUpperCase();
  const candidateUpper = candidate.toUpperCase();

  // Distinguish actual human-readable status from status direction code (e.g. "UD") or status_type
  const isBareDirectionCode = !candidate || candidateUpper === 'UD' || candidateUpper === stType;

  // 1. Explicit mappings for known status strings and courier abbreviations
  if (candidateUpper === 'DELIVERED' || candidateUpper === 'DL') return 'Delivered';
  if (candidateUpper === 'OUT_FOR_DELIVERY' || candidateUpper === 'OUT FOR DELIVERY' || candidateUpper === 'OFD') return 'Out For Delivery';
  if (candidateUpper === 'RETURNED' || candidateUpper === 'RTO' || candidateUpper === 'RT') return 'Returned';
  if (candidateUpper === 'CANCELLED' || candidateUpper === 'CAN') return 'Cancelled';
  if (candidateUpper === 'MANIFESTED') return 'Manifested';
  if (
    candidateUpper === 'PICKED_UP' ||
    candidateUpper === 'PICKED UP' ||
    candidateUpper === 'SHIPMENT PICKED UP' ||
    candidateUpper === 'PU' ||
    candidateUpper === 'PUD'
  ) {
    if (remark.includes('vehicle departed')) {
      return 'Vehicle Departed';
    }
    return 'Picked Up';
  }
  if (candidateUpper === 'IN_TRANSIT' || candidateUpper === 'IN TRANSIT') return 'In Transit';
  if (candidateUpper === 'DISPATCHED') return 'Dispatched';
  if (candidateUpper === 'AT HUB' || candidateUpper === 'AT_HUB') return 'At Hub';
  if (candidate.toLowerCase().includes('vehicle departed')) return 'Vehicle Departed';

  // 2. If status was only an internal direction code (e.g. "UD") or missing, use explicit verified mappings:
  if (remark.includes('vehicle departed')) {
    return 'Vehicle Departed';
  }

  if (remark === 'shipment picked up' || remark.startsWith('shipment picked up') || remark === 'picked up') {
    return 'Picked Up';
  }

  if (remark === 'manifest uploaded' || remark === 'manifested') {
    return 'Manifested';
  }

  if (remark.includes('out for delivery')) {
    return 'Out For Delivery';
  }

  if (remark === 'delivered' || remark.startsWith('delivered to')) {
    return 'Delivered';
  }

  // 3. Ambiguous notes with bare UD code (e.g. "Manifest error - returned to warehouse", "Delivery attempted - customer absent"):
  // Fall back to generic 'In Transit' rather than inventing a milestone like Manifested or Delivered.
  return 'In Transit';
}

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
        body: JSON.stringify({ username, password }),
        cache: 'no-store'
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
        },
        cache: 'no-store'
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

    // Parse the actual response structure
    const data = rawData?.data;
    if (!data || !data.wbns || !Array.isArray(data.wbns) || data.wbns.length === 0) {
      throw new Error(`Delhivery B2B API returned no tracking information for LR: ${identifier}`);
    }

    const latest = data.wbns[0];
    
    // Resolve human-readable status, distinguishing actual status from status-type/direction code (e.g. "UD")
    const statusType = (latest.StatusType || latest.status_type || '').trim();
    const rawStatus = (
      (latest.Status && latest.Status !== 'UD' && latest.Status !== statusType ? latest.Status : '') ||
      (latest.status && latest.status !== 'UD' && latest.status !== statusType ? latest.status : '') ||
      latest.Status ||
      latest.status ||
      ''
    ).trim();

    if (!rawStatus) {
      throw new Error("Delhivery B2B API returned missing status field.");
    }

    const current_status = mapDelhiveryB2BStatus(rawStatus, latest.scan_remark, statusType);
    const current_location = latest.location || '';
    
    // Attempt to parse the timestamp safely. If missing, fallback to current time since it's the latest known state.
    let occurred_at = new Date();
    if (latest.scan_timestamp) {
      let ts = latest.scan_timestamp;
      if (typeof ts === 'string' && !/(Z|[+-]\d{2}:?\d{2})$/i.test(ts)) {
        ts += '+05:30';
      }
      const parsed = new Date(ts);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1970) {
        occurred_at = parsed;
      }
    }

    let estimated_delivery: Date | null = null;
    const ed_raw = latest.estimated_date || latest.promised_delivery_date;
    if (ed_raw) {
      let ed = ed_raw;
      if (!ed.includes('Z') && !ed.includes('+')) {
        ed += '+05:30';
      }
      const d = new Date(ed);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
        estimated_delivery = d;
      }
    }
    // We yield a single event for the sync engine because the API only gives the latest state.
    // Sync logic will deduplicate based on time/status/location.
    const events: TrackingEvent[] = [
      {
        status: current_status,
        location: current_location,
        occurred_at,
        note: latest.scan_remark || '',
        raw_status: rawStatus.toUpperCase() !== 'UD' ? rawStatus : current_status
      }
    ];

    return {
      current_status,
      current_location,
      estimated_delivery,
      events
    };
  }
}
