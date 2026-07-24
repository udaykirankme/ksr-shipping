import { apiFetch } from './api-client';
const API_BASE = 'http://localhost:5000/api/admin';

export interface ContactMessage {
  id: string;
  contact_id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  responded: boolean;
  responded_at: string | null;
  is_starred: boolean;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export const contactService = {
  async getMessages(params?: Record<string, string | number | boolean>) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query.append(key, String(value));
        }
      });
    }

    return apiFetch(`${API_BASE}/contact-messages?${query.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async getMessage(id: string) {
    return apiFetch(`${API_BASE}/contact-messages/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async markResponded(id: string, responded: boolean) {
    return apiFetch(`${API_BASE}/contact-messages/${id}/respond`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responded })
    });
  },

  async toggleStar(id: string, is_starred?: boolean) {
    return apiFetch(`${API_BASE}/contact-messages/${id}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_starred })
    });
  },

  async deleteMessage(id: string) {
    return apiFetch(`${API_BASE}/contact-messages/${id}`, {
      method: 'DELETE'
    });
  },

  async deleteBulk(ids: string[]) {
    return apiFetch(`${API_BASE}/contact-messages/delete-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
  }
};
