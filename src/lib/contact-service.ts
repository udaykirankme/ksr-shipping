import { apiFetch, API_HOST } from './api-client';
const API_BASE = `${API_HOST}/api/admin`;

export interface ContactHistoryEvent {
  id: string;
  contact_submission_id?: string;
  status: string;
  occurred_at: string;
  note?: string | null;
  updated_by?: string | null;
}

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
  history?: ContactHistoryEvent[];
}

export const contactService = {
  async getMessages(params?: Record<string, string | number | boolean>): Promise<{ items: ContactMessage[], totalPages: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query.append(key, String(value));
        }
      });
    }

    const res = await apiFetch(`${API_BASE}/contact-messages?${query.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res as { items: ContactMessage[]; totalPages: number; };
  },

  async getMessage(id: string): Promise<ContactMessage> {
    const res = await apiFetch(`${API_BASE}/contact-messages/${id}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res as ContactMessage;
  },

  async markResponded(id: string, responded: boolean): Promise<ContactMessage> {
    const res = await apiFetch(`${API_BASE}/contact-messages/${id}/respond`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responded })
    });
    return res as ContactMessage;
  },

  async addActivity(id: string, data: { action: string; note?: string }): Promise<ContactMessage> {
    const res = await apiFetch(`${API_BASE}/contact-messages/${id}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res as ContactMessage;
  },

  async toggleStar(id: string, is_starred?: boolean): Promise<ContactMessage> {
    const res = await apiFetch(`${API_BASE}/contact-messages/${id}/star`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_starred })
    });
    return res as ContactMessage;
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
  },

  async respondBulk(ids: string[], responded: boolean) {
    return apiFetch(`${API_BASE}/contact-messages/respond-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, responded })
    });
  },

  async markAllContactsAsRead() {
    return apiFetch(`${API_BASE}/contact-messages/read-all`, {
      method: 'PATCH'
    });
  }
};
