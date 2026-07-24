import { apiFetch } from './api-client';
const API_BASE = 'http://localhost:5000/api/admin';

export interface ReportFilters {
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
}

export const reportsService = {
  async getAnalytics(filters?: ReportFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    try {
      return await apiFetch(`${API_BASE}/reports/analytics?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (err) {
      console.error('Network error fetching analytics:', err);
      return null;
    }
  },

  exportReport(entity: string, filters?: ReportFilters) {
    const params = new URLSearchParams();
    params.append('entity', entity);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    // We navigate to the export URL to trigger download, passing auth cookies automatically
    window.location.href = `${API_BASE}/reports/export?${params.toString()}`;
  }
};
