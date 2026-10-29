// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DelhiveryB2BProvider } from './delhivery-b2b';

describe('Delhivery B2B Tracking Provider: Status Mapping', () => {
  let provider: DelhiveryB2BProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DELHIVERY_B2B_USERNAME = 'test_b2b_user';
    process.env.DELHIVERY_B2B_PASSWORD = 'test_b2b_password';
    process.env.DELHIVERY_B2B_LOGIN_URL = 'https://ltl-clients-api.delhivery.com/ums/login';
    process.env.DELHIVERY_B2B_API_URL = 'https://ltl-clients-api.delhivery.com/lrn/track';

    provider = new DelhiveryB2BProvider();
  });

  const createFetchMock = (rawB2BResponse: any) => {
    return vi.fn().mockImplementation((url: string) => {
      if (url.includes('/ums/login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { jwt: 'mocked-jwt-token-12345' }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => rawB2BResponse
      });
    });
  };

  it('maps a Manifested event with StatusType "UD" to "Manifested", not "UD", preserving note, location, and timestamp', async () => {
    // Actual Delhivery B2B response schema from Delhivery One
    const rawB2BResponse = {
      success: true,
      data: {
        wbns: [
          {
            wbn: 'LR9876543210',
            Status: 'Manifested',
            StatusType: 'UD',
            status: 'UD',
            scan_remark: 'Manifest uploaded',
            location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
            scan_timestamp: '2026-10-28T14:30:00',
            promised_delivery_date: '2026-11-02T18:00:00'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawB2BResponse));

    const result = await provider.trackShipment('LR9876543210');

    // Expected human-readable status must be Manifested, not the internal code "UD"
    expect(result.current_status).toBe('Manifested');
    expect(result.current_status).not.toBe('UD');

    // Verify TrackingEvent mapping
    expect(result.events).toHaveLength(1);
    const event = result.events[0];
    expect(event.status).toBe('Manifested');
    expect(event.status).not.toBe('UD');

    // Verify note/instruction, location, and timestamp remain unaltered
    expect(event.note).toBe('Manifest uploaded');
    expect(event.location).toBe('Hyderabad_BalanagarPhase2_L (Telangana)');
    expect(result.current_location).toBe('Hyderabad_BalanagarPhase2_L (Telangana)');

    // Timestamp parsing (+05:30 IST)
    const expectedTime = new Date('2026-10-28T14:30:00+05:30');
    expect(event.occurred_at.getTime()).toBe(expectedTime.getTime());

    // Estimated delivery parsed
    expect(result.estimated_delivery).not.toBeNull();
    const expectedED = new Date('2026-11-02T18:00:00+05:30');
    expect(result.estimated_delivery?.getTime()).toBe(expectedED.getTime());
  });

  it('does NOT hardcode UD to Manifested when shipment is In Transit', async () => {
    const rawInTransitResponse = {
      success: true,
      data: {
        wbns: [
          {
            wbn: 'LR9876543211',
            Status: 'In Transit',
            StatusType: 'UD',
            status: 'UD',
            scan_remark: 'Vehicle departed to next facility',
            location: 'Hyderabad Hub',
            scan_timestamp: '2026-10-28T18:45:00'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawInTransitResponse));

    const result = await provider.trackShipment('LR9876543211');

    expect(result.current_status).toBe('In Transit');
    expect(result.current_status).not.toBe('Manifested');
    expect(result.current_status).not.toBe('UD');
    expect(result.events[0].status).toBe('In Transit');
    expect(result.events[0].note).toBe('Vehicle departed to next facility');
    expect(result.events[0].location).toBe('Hyderabad Hub');
  });

  it('does not infer Manifested for ambiguous remark "Manifest error - returned to warehouse" with bare UD', async () => {
    const rawAmbiguousManifestResponse = {
      success: true,
      data: {
        wbns: [
          {
            wbn: 'LR9876543212',
            status: 'UD',
            StatusType: 'UD',
            scan_remark: 'Manifest error - returned to warehouse',
            location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
            scan_timestamp: '2026-10-28T14:30:00'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawAmbiguousManifestResponse));

    const result = await provider.trackShipment('LR9876543212');

    // Must NOT invent "Manifested" merely because remark contains the word "Manifest"
    expect(result.current_status).toBe('In Transit');
    expect(result.current_status).not.toBe('Manifested');
    expect(result.current_status).not.toBe('UD');
    expect(result.events[0].status).toBe('In Transit');
    expect(result.events[0].note).toBe('Manifest error - returned to warehouse');
  });

  it('does not infer Delivered for ambiguous remark "Delivery attempted - customer absent" with bare UD', async () => {
    const rawAmbiguousDeliveryResponse = {
      success: true,
      data: {
        wbns: [
          {
            wbn: 'LR9876543213',
            status: 'UD',
            StatusType: 'UD',
            scan_remark: 'Delivery attempted - customer absent',
            location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
            scan_timestamp: '2026-10-28T14:30:00'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawAmbiguousDeliveryResponse));

    const result = await provider.trackShipment('LR9876543213');

    // Must NOT invent "Delivered" merely because remark contains the word "Delivery"
    expect(result.current_status).toBe('In Transit');
    expect(result.current_status).not.toBe('Delivered');
    expect(result.current_status).not.toBe('UD');
    expect(result.events[0].status).toBe('In Transit');
    expect(result.events[0].note).toBe('Delivery attempted - customer absent');
  });

  it('uses established normalizeDelhiveryStatus instruction mappings like "Out for delivery" with bare UD', async () => {
    const rawOFDResponse = {
      success: true,
      data: {
        wbns: [
          {
            wbn: 'LR9876543214',
            status: 'UD',
            StatusType: 'UD',
            scan_remark: 'Out for delivery',
            location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
            scan_timestamp: '2026-10-28T14:30:00'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawOFDResponse));

    const result = await provider.trackShipment('LR9876543214');

    expect(result.current_status).toBe('Out For Delivery');
    expect(result.events[0].status).toBe('Out For Delivery');
    expect(result.events[0].note).toBe('Out for delivery');
  });

  it('correctly maps terminal states like Delivered with StatusType "DL"', async () => {
    const rawDeliveredResponse = {
      success: true,
      data: {
        wbns: [
          {
            wbn: 'LR9876543215',
            Status: 'Delivered',
            StatusType: 'DL',
            status: 'DL',
            scan_remark: 'Delivered to consignee',
            location: 'Secunderabad Facility',
            scan_timestamp: '2026-10-29T11:20:00'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawDeliveredResponse));

    const result = await provider.trackShipment('LR9876543215');

    expect(result.current_status).toBe('Delivered');
    expect(result.events[0].status).toBe('Delivered');
    expect(result.events[0].note).toBe('Delivered to consignee');
  });

  it('maps "Vehicle departed from client location" (real LR 322021467 payload) to "Vehicle Departed", never "UD"', async () => {
    // Real Delhivery B2B payload structure returned for LR 322021467
    const rawB2BResponse = {
      success: true,
      request_id: 'e7e418fa-ddfe-4b9e-af58-9e568d7cb86b',
      data: {
        lrnum: '322021467',
        status: 'PICKED_UP',
        mcount: 9,
        wbns: [
          {
            status: 'PICKED_UP',
            location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
            wbn: '63308610000346',
            count: 1,
            lrnum: '322021467',
            estimated_date: '2026-11-03T23:59:59',
            promised_delivery_date: '2026-11-03T23:59:59',
            pickup_date: '2026-10-29T14:43:12',
            manifested_date: '2026-10-28T19:49:51',
            scan_remark: 'Vehicle departed from client location',
            scan_timestamp: '2026-10-29T14:48:52'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawB2BResponse));

    const result = await provider.trackShipment('322021467');

    expect(result.current_status).toBe('Vehicle Departed');
    expect(result.current_status).not.toBe('UD');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].status).toBe('Vehicle Departed');
    expect(result.events[0].status).not.toBe('UD');
    expect(result.events[0].note).toBe('Vehicle departed from client location');
    expect(result.events[0].location).toBe('Hyderabad_BalanagarPhase2_L (Telangana)');
    expect(result.events[0].raw_status).toBe('PICKED_UP');
  });

  it('maps a bare "UD" event with remark "Vehicle departed from client location" to "Vehicle Departed", never "UD"', async () => {
    const rawResponse = {
      success: true,
      data: {
        wbns: [
          {
            wbn: 'LR322021467',
            status: 'UD',
            StatusType: 'UD',
            scan_remark: 'Vehicle departed from client location',
            location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
            scan_timestamp: '2026-10-29T14:48:52'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawResponse));

    const result = await provider.trackShipment('LR322021467');

    expect(result.current_status).toBe('Vehicle Departed');
    expect(result.current_status).not.toBe('UD');
    expect(result.events[0].status).toBe('Vehicle Departed');
    expect(result.events[0].status).not.toBe('UD');
    expect(result.events[0].note).toBe('Vehicle departed from client location');
  });

  it('maps "Shipment picked up" event to "Picked Up", never "UD"', async () => {
    const rawResponse = {
      success: true,
      data: {
        wbns: [
          {
            wbn: 'LR322021468',
            status: 'UD',
            StatusType: 'UD',
            scan_remark: 'Shipment picked up',
            location: 'Hyderabad_BalanagarPhase2_L (Telangana)',
            scan_timestamp: '2026-10-29T14:43:12'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawResponse));

    const result = await provider.trackShipment('LR322021468');

    expect(result.current_status).toBe('Picked Up');
    expect(result.current_status).not.toBe('UD');
    expect(result.events[0].status).toBe('Picked Up');
    expect(result.events[0].status).not.toBe('UD');
    expect(result.events[0].note).toBe('Shipment picked up');
  });

  it('safely defaults an event containing only UD and an ambiguous remark to In Transit without inventing milestones', async () => {
    const rawAmbiguousResponse = {
      success: true,
      data: {
        wbns: [
          {
            wbn: 'LR322021469',
            status: 'UD',
            StatusType: 'UD',
            scan_remark: 'Operational network delay at transit junction',
            location: 'Nagpur Transshipment Hub',
            scan_timestamp: '2026-10-29T16:00:00'
          }
        ]
      }
    };

    vi.stubGlobal('fetch', createFetchMock(rawAmbiguousResponse));

    const result = await provider.trackShipment('LR322021469');

    // Must not be UD, and must not invent Manifested or Delivered
    expect(result.current_status).toBe('In Transit');
    expect(result.current_status).not.toBe('UD');
    expect(result.current_status).not.toBe('Manifested');
    expect(result.current_status).not.toBe('Delivered');
    expect(result.events[0].status).toBe('In Transit');
    expect(result.events[0].note).toBe('Operational network delay at transit junction');
  });

  it('maps short internal status-type codes DL, RT, OFD, PU, CAN to human-readable statuses', async () => {
    const provider = new DelhiveryB2BProvider();

    // 1. DL -> Delivered
    const dlResponse = {
      success: true,
      data: {
        wbns: [{ wbn: 'LR1', status: 'DL', scan_remark: 'Delivered', scan_timestamp: '2026-10-30T10:00:00' }]
      }
    };
    vi.stubGlobal('fetch', createFetchMock(dlResponse));
    const dlResult = await provider.trackShipment('LR1');
    expect(dlResult.current_status).toBe('Delivered');
    expect(dlResult.events[0].status).toBe('Delivered');

    // 2. RT -> Returned
    const rtResponse = {
      success: true,
      data: {
        wbns: [{ wbn: 'LR2', status: 'RT', scan_remark: 'Package returned', scan_timestamp: '2026-10-30T10:00:00' }]
      }
    };
    vi.stubGlobal('fetch', createFetchMock(rtResponse));
    const rtResult = await provider.trackShipment('LR2');
    expect(rtResult.current_status).toBe('Returned');
    expect(rtResult.events[0].status).toBe('Returned');

    // 3. OFD -> Out For Delivery
    const ofdResponse = {
      success: true,
      data: {
        wbns: [{ wbn: 'LR3', status: 'OFD', scan_remark: 'Out for delivery', scan_timestamp: '2026-10-30T10:00:00' }]
      }
    };
    vi.stubGlobal('fetch', createFetchMock(ofdResponse));
    const ofdResult = await provider.trackShipment('LR3');
    expect(ofdResult.current_status).toBe('Out For Delivery');
    expect(ofdResult.events[0].status).toBe('Out For Delivery');

    // 4. PU -> Picked Up
    const puResponse = {
      success: true,
      data: {
        wbns: [{ wbn: 'LR4', status: 'PU', scan_remark: 'Picked up', scan_timestamp: '2026-10-30T10:00:00' }]
      }
    };
    vi.stubGlobal('fetch', createFetchMock(puResponse));
    const puResult = await provider.trackShipment('LR4');
    expect(puResult.current_status).toBe('Picked Up');
    expect(puResult.events[0].status).toBe('Picked Up');

    // 5. CAN -> Cancelled
    const canResponse = {
      success: true,
      data: {
        wbns: [{ wbn: 'LR5', status: 'CAN', scan_remark: 'Order cancelled', scan_timestamp: '2026-10-30T10:00:00' }]
      }
    };
    vi.stubGlobal('fetch', createFetchMock(canResponse));
    const canResult = await provider.trackShipment('LR5');
    expect(canResult.current_status).toBe('Cancelled');
    expect(canResult.events[0].status).toBe('Cancelled');

    // 6. Unknown short code XX -> In Transit (never Delivered)
    const xxResponse = {
      success: true,
      data: {
        wbns: [{ wbn: 'LR6', status: 'XX', scan_remark: 'Unknown internal scan', scan_timestamp: '2026-10-30T10:00:00' }]
      }
    };
    vi.stubGlobal('fetch', createFetchMock(xxResponse));
    const xxResult = await provider.trackShipment('LR6');
    expect(xxResult.current_status).toBe('In Transit');
    expect(xxResult.current_status).not.toBe('Delivered');
    expect(xxResult.events[0].status).toBe('In Transit');
  });
});
