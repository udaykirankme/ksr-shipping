import { apiFetch, API_HOST } from './api-client';
const API_BASE = `${API_HOST}/api/admin`;

export const shipmentService = {
  async getShipments(params: Record<string, string | number | boolean> = {}) {
    const url = new URL(`${API_BASE}/shipments`);
    Object.keys(params).forEach(key => url.searchParams.append(key, String(params[key])));
    
    return apiFetch(url.toString(), { credentials: 'include' });
  },

  async exportShipments(params: Record<string, string | number | boolean> = {}, exportType: string = 'current_month') {
    const url = new URL(`${API_BASE}/shipments/export`);
    Object.keys(params).forEach(key => url.searchParams.append(key, String(params[key])));
    
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to export');
    
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;

    const date = new Date();
    if (exportType === 'last_month') {
      date.setMonth(date.getMonth() - 1);
    }
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const filename = `shipments_${exportType}_${monthName}_${year}.csv`;

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  async getShipment(id: string) {
    return apiFetch(`${API_BASE}/shipments/${id}`, { credentials: 'include' });
  },

  async createShipment(data: Record<string, unknown>) {
    return apiFetch(`${API_BASE}/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
  },

  async updateShipment(id: string, data: Record<string, unknown>) {
    return apiFetch(`${API_BASE}/shipments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
  },

  async updateStatus(id: string, data: { status: string, location?: string, occurred_at?: string, note?: string, version: number }) {
    return apiFetch(`${API_BASE}/shipments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
  },

  async archiveShipment(id: string, is_active: boolean) {
    return apiFetch(`${API_BASE}/shipments/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
      credentials: 'include'
    });
  },

  async deleteShipment(id: string) {
    return apiFetch(`${API_BASE}/shipments/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },

  async deleteBulk(ids: string[]) {
    return apiFetch(`${API_BASE}/shipments/delete-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
      credentials: 'include'
    });
  }
};
