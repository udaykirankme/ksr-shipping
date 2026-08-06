import { apiFetch, API_HOST } from './api-client';
const API_BASE = `${API_HOST}/api/admin`;

export interface SettingsMap {
  [key: string]: string;
}

export const SettingsService = {
  getSettings: async (): Promise<SettingsMap> => {
    const res = await apiFetch(`${API_BASE}/settings`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    return res as SettingsMap;
  },

  updateSettings: async (updates: SettingsMap): Promise<{ success: boolean; message: string }> => {
    const res = await apiFetch(`${API_BASE}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    return res as { success: boolean; message: string };
  }
};
