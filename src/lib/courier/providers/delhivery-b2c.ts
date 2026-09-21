import { CourierProvider, TrackingResponse, TrackingEvent } from '../types';

export class DelhiveryB2CProvider implements CourierProvider {
  async trackShipment(awb: string): Promise<TrackingResponse> {
    const apiKey = process.env.DELHIVERY_B2C_API_KEY;
    if (!apiKey) {
      throw new Error("DELHIVERY_B2C_API_KEY environment variable is not configured.");
    }

    if (!awb || awb.trim() === '') {
      throw new Error("Delhivery B2C requires a valid AWB Number.");
    }

    const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${encodeURIComponent(awb.trim())}`;
    
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });
    } catch (err: any) {
      throw new Error(`Delhivery B2C network request failed: ${err.message}`);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (err: any) {
      if (!response.ok) {
         throw new Error(`Delhivery B2C API failed with status: ${response.status} ${response.statusText}`);
      }
      throw new Error("Delhivery B2C API returned invalid JSON.");
    }

    if (!response.ok) {
       console.error(`[Delhivery B2C API Error for ${awb}]:`, JSON.stringify(data));
       const errMsg = data?.Error || data?.rmk || response.statusText;
       throw new Error(`Delhivery B2C API Error: ${response.status} - ${errMsg}`);
    }

    // Check if the API returned a failure condition gracefully (like waybill not found)
    if (data.Success === false && data.Error) {
       throw new Error(`Delhivery B2C API Error: ${data.Error}`);
    }

    if (!data.ShipmentData || !Array.isArray(data.ShipmentData) || data.ShipmentData.length === 0) {
      throw new Error(`Delhivery B2C API returned no shipment data for AWB: ${awb}`);
    }

    const shipmentInfo = data.ShipmentData[0].Shipment;
    if (!shipmentInfo) {
      throw new Error("Delhivery B2C API returned unrecognized shipment structure.");
    }

    // B2C exposes scans in an array (sometimes `Scans`, sometimes inside `Status`)
    // Depending on the version, scans might be an array of objects under `Scans`.
    const events: TrackingEvent[] = [];
    
    if (shipmentInfo.Scans && Array.isArray(shipmentInfo.Scans)) {
      for (const scanItem of shipmentInfo.Scans) {
        const scan = scanItem.ScanDetail;
        if (!scan || !scan.Scan) continue;
        
        let occurred_at = new Date();
        if (scan.ScanDateTime) {
          let dt = scan.ScanDateTime;
          if (!dt.includes('Z') && !dt.includes('+')) {
            dt += '+05:30';
          }
          const parsed = new Date(dt);
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1970) {
            occurred_at = parsed;
          }
        }
        
        events.push({
          status: scan.Scan,
          location: scan.ScannedLocation || '',
          occurred_at,
          note: scan.Instructions || '',
          raw_status: scan.Scan
        });
      }
    }

    // If Scans array is empty or missing, fallback to current Status object
    if (events.length === 0 && shipmentInfo.Status) {
      const statusObj = shipmentInfo.Status;
      
      let occurred_at = new Date();
      if (statusObj.StatusDateTime) {
        let dt = statusObj.StatusDateTime;
        if (!dt.includes('Z') && !dt.includes('+')) {
          dt += '+05:30';
        }
        const parsed = new Date(dt);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1970) {
          occurred_at = parsed;
        }
      }
      
      events.push({
        status: statusObj.Status || 'Unknown',
        location: statusObj.StatusLocation || '',
        occurred_at,
        note: statusObj.Instructions || '',
        raw_status: statusObj.Status || 'Unknown'
      });
    }

    // Sort events by date ascending (oldest first), if any, because syncEngine might expect it,
    // though the DB will sort by occurred_at desc for display anyway.
    events.sort((a, b) => a.occurred_at.getTime() - b.occurred_at.getTime());

    const current_status = shipmentInfo.Status?.Status || events[events.length - 1]?.status || 'Unknown';
    const current_location = shipmentInfo.Status?.StatusLocation || events[events.length - 1]?.location || '';
    
    let estimated_delivery: Date | null = null;
    if (shipmentInfo.ExpectedDeliveryDate) {
      let ed = shipmentInfo.ExpectedDeliveryDate;
      // If there's no timezone info (Z or +), append +05:30 as Delhivery times are typically IST
      if (!ed.includes('Z') && !ed.includes('+')) {
        ed += '+05:30';
      }
      const d = new Date(ed);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
        estimated_delivery = d;
      }
    }

    return {
      current_status,
      current_location,
      estimated_delivery,
      events
    };
  }
}
