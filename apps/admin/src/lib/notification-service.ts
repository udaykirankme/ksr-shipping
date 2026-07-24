import { apiFetch } from './api-client';
const API_BASE = 'http://localhost:5000/api/admin';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  related_entity_id: string | null;
  target_url: string | null;
  read_at: string | null;
  is_starred: boolean;
  created_at: string;
}

export interface NotificationResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
}

export const notificationService = {
  async getNotifications(filters?: NotificationFilters): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    try {
      return await apiFetch(`${API_BASE}/notifications?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      return { items: [], total: 0, page: 1, totalPages: 1, unreadCount: 0 };
    }
  },

  async getNotification(id: string): Promise<NotificationItem> {
    return apiFetch(`${API_BASE}/notifications/${id}`, {
      credentials: 'include'
    });
  },

  async markAsRead(id: string) {
    return apiFetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      credentials: 'include'
    });
  },

  async markAllAsRead() {
    return apiFetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      credentials: 'include'
    });
  },

  async markBulkAsRead(ids: string[]) {
    return apiFetch(`${API_BASE}/notifications/read-bulk`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
  },

  async toggleStar(id: string, is_starred?: boolean) {
    return apiFetch(`${API_BASE}/notifications/${id}/star`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_starred })
    });
  },
  
  async deleteNotification(id: string) {
    return apiFetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },

  async deleteBulk(ids: string[]) {
    return apiFetch(`${API_BASE}/notifications/delete-bulk`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
  },

  async deleteAllRead() {
    return apiFetch(`${API_BASE}/notifications/read-all`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },

  async cleanupOld() {
    return apiFetch(`${API_BASE}/notifications/cleanup`, {
      method: 'DELETE',
      credentials: 'include'
    });
  }
};
