// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import * as syncModule from '@/lib/courier/sync';
import { apiFetch } from '@/lib/api-client';

vi.mock('@/lib/courier/sync', () => ({
  syncTracking: vi.fn(),
}));

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const VALID_UUID = '00000000-0000-0000-0000-000000000001';

describe('Admin Manual Tracking Sync API & Response Envelope', () => {
  const adminToken = jwt.sign({ id: 'admin-1', role: 'admin' }, JWT_SECRET);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthorized requests without auth cookie', async () => {
    const res = await request(app)
      .post(`/api/admin/shipments/${VALID_UUID}/sync`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Unauthorized' });
  });

  it('rejects requests with invalid UUID format before calling sync', async () => {
    const res = await request(app)
      .post('/api/admin/shipments/invalid-uuid/sync')
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Invalid ID format' });
    expect(syncModule.syncTracking).not.toHaveBeenCalled();
  });

  it('returns { success: true, data: result } envelope when courier sync succeeds', async () => {
    const mockSyncResult = {
      success: true,
      shipment_id: 'KSR-DEL-001',
      new_events: 2,
      current_status: 'Manifested'
    };

    vi.mocked(syncModule.syncTracking).mockResolvedValueOnce(mockSyncResult);

    const res = await request(app)
      .post(`/api/admin/shipments/${VALID_UUID}/sync`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(200);
    // Verifies the response envelope required by client apiFetch
    expect(res.body).toEqual({
      success: true,
      data: mockSyncResult
    });
    expect(syncModule.syncTracking).toHaveBeenCalledWith(VALID_UUID);
  });

  it('returns HTTP 500 with error message when courier sync fails', async () => {
    vi.mocked(syncModule.syncTracking).mockRejectedValueOnce(
      new Error('Courier API rate limit exceeded')
    );

    const res = await request(app)
      .post(`/api/admin/shipments/${VALID_UUID}/sync`)
      .set('Cookie', [`auth_token=${adminToken}`]);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: 'Courier API rate limit exceeded'
    });
  });

  it('apiFetch correctly unwraps the success response envelope to the sync result', async () => {
    const mockSyncResult = {
      success: true,
      shipment_id: 'KSR-DEL-001',
      new_events: 1,
      current_status: 'Manifested'
    };

    // Simulate fetch returning the exact HTTP envelope { success: true, data: mockSyncResult }
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({ success: true, data: mockSyncResult }),
      text: async () => JSON.stringify({ success: true, data: mockSyncResult }),
    } as any);

    try {
      const unwrapped = await apiFetch(`/api/admin/shipments/${VALID_UUID}/sync`, {
        method: 'POST'
      });
      // Verifies apiFetch unwraps data.data, avoiding the undefined bug
      expect(unwrapped).toEqual(mockSyncResult);
      expect((unwrapped as any).current_status).toBe('Manifested');
      expect((unwrapped as any).new_events).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('apiFetch throws the error message on failure response envelope', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: {
        get: (h: string) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({ success: false, message: 'Courier synchronization failed' }),
      text: async () => JSON.stringify({ success: false, message: 'Courier synchronization failed' }),
    } as any);

    try {
      await expect(
        apiFetch(`/api/admin/shipments/${VALID_UUID}/sync`, { method: 'POST' })
      ).rejects.toThrow('Courier synchronization failed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
