import { CourierProvider, TrackingResponse, TrackingEvent, KSRTrackingStatus } from '../types';
import { normalizeDelhiveryStatus } from '../normalization';

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

    // Extract fields using established normalization logic.
    let normalized = normalizeDelhiveryStatus(rawStatus, latest.scan_remark);
    if (typeof normalized === 'string' && normalized.toUpperCase() === 'UD') {
      const remarkLower = (latest.scan_remark || '').toLowerCase();
      if (
        remarkLower.includes('manifest uploaded') ||
        remarkLower.includes('ready to ship') ||
        (remarkLower.includes('manifest') && !remarkLower.includes('error'))
      ) {
        normalized = 'Manifested';
      } else if (remarkLower.includes('pick') || remarkLower.includes('collected')) {
        normalized = 'Picked Up';
      } else if (remarkLower.includes('depart')) {
        normalized = 'Vehicle Departed';
      } else if (remarkLower.includes('out for delivery') || remarkLower.includes('ofd')) {
        normalized = 'Out For Delivery';
      } else if (
        (remarkLower === 'delivered' || remarkLower.includes('delivered successfully') || remarkLower.includes('successfully delivered')) &&
        !remarkLower.includes('attempt') &&
        !remarkLower.includes('failed') &&
        !remarkLower.includes('undeliver')
      ) {
        normalized = 'Delivered';
      } else {
        normalized = 'In Transit';
      }
    }

    const current_status = (normalized as KSRTrackingStatus) || 'Shipment Created';
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

    // Generate events for each package scan present in data.wbns
    const events: TrackingEvent[] = [];
    for (const wbnItem of data.wbns) {
      if (!wbnItem) continue;
      const wbnStatusType = (wbnItem.StatusType || wbnItem.status_type || '').trim();
      const wbnRawStatus = (
        (wbnItem.Status && wbnItem.Status !== 'UD' && wbnItem.Status !== wbnStatusType ? wbnItem.Status : '') ||
        (wbnItem.status && wbnItem.status !== 'UD' && wbnItem.status !== wbnStatusType ? wbnItem.status : '') ||
        wbnItem.Status ||
        wbnItem.status ||
        rawStatus
      ).trim();

      let itemNormalized = normalizeDelhiveryStatus(wbnRawStatus, wbnItem.scan_remark || latest.scan_remark);
      if (typeof itemNormalized === 'string' && itemNormalized.toUpperCase() === 'UD') {
        const itemRemarkLower = (wbnItem.scan_remark || latest.scan_remark || '').toLowerCase();
        if (
          itemRemarkLower.includes('manifest uploaded') ||
          itemRemarkLower.includes('ready to ship') ||
          (itemRemarkLower.includes('manifest') && !itemRemarkLower.includes('error'))
        ) {
          itemNormalized = 'Manifested';
        } else if (itemRemarkLower.includes('pick') || itemRemarkLower.includes('collected')) {
          itemNormalized = 'Picked Up';
        } else if (itemRemarkLower.includes('depart')) {
          itemNormalized = 'Vehicle Departed';
        } else if (itemRemarkLower.includes('out for delivery') || itemRemarkLower.includes('ofd')) {
          itemNormalized = 'Out For Delivery';
        } else if (
          (itemRemarkLower === 'delivered' || itemRemarkLower.includes('delivered successfully') || itemRemarkLower.includes('successfully delivered')) &&
          !itemRemarkLower.includes('attempt') &&
          !itemRemarkLower.includes('failed') &&
          !itemRemarkLower.includes('undeliver')
        ) {
          itemNormalized = 'Delivered';
        } else {
          itemNormalized = 'In Transit';
        }
      }

      let itemOccurredAt = occurred_at;
      if (wbnItem.scan_timestamp) {
        let ts = wbnItem.scan_timestamp;
        if (typeof ts === 'string' && !/(Z|[+-]\d{2}:?\d{2})$/i.test(ts)) {
          ts += '+05:30';
        }
        const parsed = new Date(ts);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1970) {
          itemOccurredAt = parsed;
        }
      }

      const cleanRemark = wbnItem.scan_remark || latest.scan_remark || '';

      events.push({
        status: (itemNormalized as KSRTrackingStatus) || current_status,
        location: wbnItem.location || current_location,
        occurred_at: itemOccurredAt,
        note: cleanRemark,
        raw_status: wbnRawStatus.toUpperCase() !== 'UD' ? wbnRawStatus : current_status,
        provider_event_id: wbnItem.wbn || undefined
      });
    }

    if (events.length === 0) {
      events.push({
        status: current_status,
        location: current_location,
        occurred_at,
        note: latest.scan_remark || '',
        raw_status: rawStatus.toUpperCase() !== 'UD' ? rawStatus : current_status
      });
    }

    return {
      current_status,
      current_location,
      estimated_delivery,
      events
    };
  }
}
