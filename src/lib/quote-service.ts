import { apiFetch, API_HOST } from './api-client';
const API_URL = `${API_HOST}/api/admin`;

interface QuoteStatusHistory {
  id: string;
  quote_request_id: string;
  status: string;
  occurred_at: string;
  note?: string;
  updated_by?: string;
  created_at: string;
}

export interface QuotationRequest {
  id: string;
  quote_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  pickup_location: string | null;
  drop_location: string | null;
  package_type: string | null;
  approx_weight: string | null;
  urgency: string | null;
  notes: string | null;
  preferred_courier: string | null;
  preferred_service: string | null;
  package_description: string | null;
  additional_requirements: string | null;
  internal_notes: string | null;
  status: string;
  expires_at: string | null;
  version: number;
  is_starred: boolean;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
  
  history?: QuoteStatusHistory[];
}

export interface GetQuotesResponse {
  quotations: QuotationRequest[];
  total: number;
  page: number;
  limit: number;
}

export async function getQuotes(params: Record<string, string | number | boolean | string[]> = {}): Promise<GetQuotesResponse> {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== '') {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).forEach(val => searchParams.append(key, val));
      } else {
        searchParams.append(key, String(params[key]));
      }
    }
  });
  const res = await apiFetch(`${API_URL}/quotations?${searchParams.toString()}`);
  return res as GetQuotesResponse;
}

export async function getQuote(id: string): Promise<QuotationRequest> {
  const res = await apiFetch(`${API_URL}/quotations/${id}`);
  return res as QuotationRequest;
}

export async function createQuote(data: Partial<QuotationRequest>): Promise<unknown> {
  return apiFetch(`${API_URL}/quotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function updateQuote(id: string, data: Partial<QuotationRequest>): Promise<unknown> {
  return apiFetch(`${API_URL}/quotations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function updateQuoteStatus(id: string, data: { status: string; note?: string; internal_notes?: string; version?: number }): Promise<QuotationRequest> {
  const res = await apiFetch(`${API_URL}/quotations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res as QuotationRequest;
}


export async function deleteQuote(id: string): Promise<void> {
  await apiFetch(`${API_URL}/quotations/${id}`, {
    method: 'DELETE'
  });
}

export async function deleteBulk(ids: string[]): Promise<void> {
  await apiFetch(`${API_URL}/quotations/delete-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
}

export async function respondBulk(ids: string[]): Promise<void> {
  await apiFetch(`${API_URL}/quotations/respond-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
}

export async function toggleStar(id: string, is_starred?: boolean): Promise<{ success: boolean; is_starred: boolean }> {
  const res = await apiFetch(`${API_URL}/quotations/${id}/star`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_starred })
  });
  return res as { success: boolean; is_starred: boolean };
}

export async function markAllQuotesAsRead(): Promise<void> {
  await apiFetch(`${API_URL}/quotations/read-all`, {
    method: 'PATCH',
  });
}
