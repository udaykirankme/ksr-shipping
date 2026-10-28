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
});
