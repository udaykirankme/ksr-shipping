// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DelhiveryB2CProvider } from './delhivery-b2c';

describe('Delhivery B2C Tracking Provider', () => {
  let provider: DelhiveryB2CProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DELHIVERY_B2C_API_KEY = 'test_b2c_key_123';
    process.env.DELHIVERY_B2C_API_URL = 'https://track.delhivery.com/api/v1/packages/json/';
    provider = new DelhiveryB2CProvider();
  });

  it('maps Delhivery B2C full scan history correctly with normalized statuses and dates', async () => {
    const rawB2CResponse = {
      ShipmentData: [
        {
          Shipment: {
            AWB: '57869610000033',
            Status: {
              Instructions: 'Delivered to consignee - Code Verified delivery',
              Status: 'Delivered',
              StatusCode: 'EOD-135',
              StatusDateTime: '2026-09-25T14:53:08.002',
              StatusLocation: 'Kolkata_Santoshpur_D (West Bengal)'
            },
            Scans: [
              {
                ScanDetail: {
                  Scan: 'Manifested',
                  ScanDateTime: '2026-09-18T13:32:21.698',
                  ScannedLocation: 'Hyderabad_Chikdply_C (Telangana)',
                  Instructions: 'Manifest uploaded'
                }
              },
              {
                ScanDetail: {
                  Scan: 'In Transit',
                  ScanDateTime: '2026-09-18T14:03:08',
                  ScannedLocation: 'Hyderabad_Chikdply_C (Telangana)',
                  Instructions: 'Shipment picked up'
                }
              },
              {
                ScanDetail: {
                  Scan: 'Dispatched',
                  ScanDateTime: '2026-09-25T10:38:27.777',
                  ScannedLocation: 'Kolkata_Santoshpur_D (West Bengal)',
                  Instructions: 'Out for delivery'
                }
              },
              {
                ScanDetail: {
                  Scan: 'Delivered',
                  ScanDateTime: '2026-09-25T14:53:08.002',
                  ScannedLocation: 'Kolkata_Santoshpur_D (West Bengal)',
                  Instructions: 'Delivered to consignee - Code Verified delivery'
                }
              }
            ],
            ExpectedDeliveryDate: '2026-09-25T00:00:00'
          }
        }
      ]
    };

    let requestedHeaders: any = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options: any) => {
      requestedHeaders = options?.headers;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => rawB2CResponse
      });
    }));

    const result = await provider.trackShipment('57869610000033');

    expect(requestedHeaders?.['Authorization']).toBe('Token test_b2c_key_123');
    expect(result.current_status).toBe('Delivered');
    expect(result.current_location).toBe('Kolkata_Santoshpur_D (West Bengal)');
    expect(result.estimated_delivery).toBeInstanceOf(Date);
    expect(result.events.length).toBe(4);

    // Event 0: Manifested
    expect(result.events[0].status).toBe('Manifested');
    expect(result.events[0].location).toBe('Hyderabad_Chikdply_C (Telangana)');
    expect(result.events[0].note).toBe('Manifest uploaded');

    // Event 2: Out for delivery mapped via normalizeDelhiveryStatus
    expect(result.events[2].status).toBe('Out For Delivery');
    expect(result.events[2].location).toBe('Kolkata_Santoshpur_D (West Bengal)');

    // Event 3: Delivered
    expect(result.events[3].status).toBe('Delivered');
  });

  it('normalizes current_status from Status object using Instructions override', async () => {
    const rawB2CResponse = {
      ShipmentData: [
        {
          Shipment: {
            AWB: '57869610000034',
            Status: {
              Instructions: 'Out for delivery to receiver',
              Status: 'Dispatched',
              StatusDateTime: '2026-10-29T09:00:00',
              StatusLocation: 'Mumbai Hub'
            },
            Scans: []
          }
        }
      ]
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => rawB2CResponse
    }));

    const result = await provider.trackShipment('57869610000034');

    expect(result.current_status).toBe('Out For Delivery');
    expect(result.current_location).toBe('Mumbai Hub');
    expect(result.events.length).toBe(1);
    expect(result.events[0].status).toBe('Out For Delivery');
  });

  it('sanitizes quotes and whitespace from DELHIVERY_B2C_API_KEY in the Authorization header', async () => {
    process.env.DELHIVERY_B2C_API_KEY = '  "secret-token-with-quotes"  ';

    let capturedAuth: string | null = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options: any) => {
      capturedAuth = options?.headers?.['Authorization'];
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          ShipmentData: [{
            Shipment: {
              AWB: '123',
              Status: { Status: 'Delivered' },
              Scans: []
            }
          }]
        })
      });
    }));

    await provider.trackShipment('123');

    expect(capturedAuth).toBe('Token secret-token-with-quotes');
  });

  it('throws a descriptive error when DELHIVERY_B2C_API_KEY is not configured', async () => {
    delete process.env.DELHIVERY_B2C_API_KEY;

    await expect(provider.trackShipment('123')).rejects.toThrow(
      'DELHIVERY_B2C_API_KEY environment variable is not configured.'
    );
  });

  it('throws when AWB is empty or whitespace', async () => {
    await expect(provider.trackShipment('')).rejects.toThrow(
      'Delhivery B2C requires a valid AWB Number.'
    );
    await expect(provider.trackShipment('   ')).rejects.toThrow(
      'Delhivery B2C requires a valid AWB Number.'
    );
  });

  it('handles graceful waybill not found error responses from Delhivery B2C API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        Success: false,
        Error: 'Data does not exists for provided Waybill(s)',
        rmk: 'Some error has occurred.'
      })
    }));

    await expect(provider.trackShipment('999999999999')).rejects.toThrow(
      'Delhivery B2C API Error: Data does not exists for provided Waybill(s)'
    );
  });

  it('handles HTTP error statuses from Delhivery B2C API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        Error: 'Login or API Key Required'
      })
    }));

    await expect(provider.trackShipment('123')).rejects.toThrow(
      'Delhivery B2C API Error: 401 - Login or API Key Required'
    );
  });
});

