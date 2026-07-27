import { apiFetch, API_HOST } from './api-client';
const API_BASE = `${API_HOST}/api/admin`;

export interface SettingsMap {
  [key: string]: string;
}

export const SettingsService = {
  getSettings: async (): Promise<SettingsMap> => {
    return apiFetch(`${API_BASE}/settings`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
  },

  updateSettings: async (updates: SettingsMap): Promise<{ success: boolean; message: string }> => {
    return apiFetch(`${API_BASE}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
  }
};
