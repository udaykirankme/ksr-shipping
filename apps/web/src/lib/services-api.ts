import { apiFetch, API_HOST } from './api-client';
const API_BASE = `${API_HOST}/api/admin`;

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  is_enabled: boolean;
}

export const ServicesApi = {
  getServices: async (): Promise<ServiceItem[]> => {
    return apiFetch(`${API_BASE}/services`, { credentials: 'include' });
  },
  createService: async (data: Partial<ServiceItem>) => {
    return apiFetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
  },
  updateService: async (id: string, data: Partial<ServiceItem>) => {
    return apiFetch(`${API_BASE}/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
  },
  deleteService: async (id: string) => {
    return apiFetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },
  reorderServices: async (items: {id: string, display_order: number}[]) => {
    return apiFetch(`${API_BASE}/services/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ items })
    });
  }
};

export const ServiceThroughApi = {
  getItems: async (): Promise<ServiceItem[]> => {
    return apiFetch(`${API_BASE}/service-through`, { credentials: 'include' });
  },
  createItem: async (data: Partial<ServiceItem>) => {
    return apiFetch(`${API_BASE}/service-through`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
  },
  updateItem: async (id: string, data: Partial<ServiceItem>) => {
    return apiFetch(`${API_BASE}/service-through/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
  },
  deleteItem: async (id: string) => {
    return apiFetch(`${API_BASE}/service-through/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },
  reorderItems: async (items: {id: string, display_order: number}[]) => {
    return apiFetch(`${API_BASE}/service-through/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ items })
    });
  }
};
