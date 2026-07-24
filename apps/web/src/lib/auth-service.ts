import { apiFetch, API_HOST } from './api-client';
const API_BASE = `${API_HOST}/api/auth`;
const USE_MOCK = false; // Toggle this to true if backend is not available for UI testing

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const authService = {
  /**
   * Login with email/username and password
   */
  async login(credentials: Record<string, string>) {
    if (USE_MOCK) {
      await delay(1000);
      if (credentials.email === 'error@test.com') throw new Error('Invalid credentials');
      if (typeof window !== 'undefined') {
        document.cookie = "auth_token=mock-jwt-token; path=/";
      }
      return { success: true, token: 'mock-jwt-token' };
    }
    
    return apiFetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials),
      skipAuthRedirect: true
    });
  },

  /**
   * Logout user
   */
  async logout() {
    if (USE_MOCK) {
      await delay(500);
      if (typeof window !== 'undefined') {
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      return { success: true };
    }
    return apiFetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
      skipAuthRedirect: true
    });
  },
  
  /**
   * Verify session token (for initial load)
   */
  async verifySession() {
    if (USE_MOCK) {
      await delay(500);
      const isAuth = typeof window !== 'undefined' && document.cookie.includes('auth_token=');
      if (!isAuth) throw new Error('Unauthorized');
      return { user: { name: 'Admin', role: 'admin' } };
    }
    return apiFetch(`${API_BASE}/me`, {
      credentials: 'include',
      skipAuthRedirect: true
    });
  }
};
