// Backend-authenticated sessions only. The browser must never mint its own JWT.
import apiUrl from './apiConfig.js';

const TOKEN_KEY = 'resquard_auth_token';
const USER_KEY = 'resquard_auth_user';
const REMEMBER_EMAIL_KEY = 'resquard_remember_email';

export const authService = {
  async login({ email, password }) {
    if (!email?.trim() || !password) {
      throw new Error('Please provide both Operator ID/email and access key.');
    }

    let response;
    try {
      response = await fetch(apiUrl('auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
    } catch {
      throw new Error('Cannot reach the authentication service. Check the backend URL and connection.');
    }

    if (!(response.headers.get('content-type') || '').includes('application/json')) {
      throw new Error('Authentication service returned an unexpected response. Check the API deployment URL.');
    }

    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Authentication failed. Verify your credentials.');
    }

    const { user, token } = payload.data || {};
    if (!user || !token) throw new Error('Authentication service returned an incomplete session.');
    this.saveSession(token, user);
    return { user, token };
  },

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(apiUrl('auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) {
        this.clearSession();
        return null;
      }
      const payload = await response.json();
      if (!payload?.success || !payload.data) {
        this.clearSession();
        return null;
      }
      this.saveUser(payload.data);
      return payload.data;
    } catch {
      this.clearSession();
      return null;
    }
  },

  async checkHealth() {
    try {
      const response = await fetch(apiUrl('health'));
      if (response.ok && (response.headers.get('content-type') || '').includes('application/json')) {
        const payload = await response.json();
        return { online: true, isLocal: false, status: 'System Operational — Ghaziabad Region', data: payload.data };
      }
    } catch {
      // Health display only; authentication still requires the backend.
    }
    return { online: false, isLocal: true, status: 'Authentication service unavailable', data: null };
  },

  saveSession(token, user) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage quota errors; the current session remains usable in memory.
    }
  },

  saveUser(user) {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* Ignore storage errors. */ }
  },

  getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || null; } catch { return null; }
  },

  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch { /* Ignore storage errors. */ }
  },

  getRememberedEmail() {
    try { return localStorage.getItem(REMEMBER_EMAIL_KEY) || ''; } catch { return ''; }
  },

  setRememberedEmail(email) {
    try {
      if (email) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      else localStorage.removeItem(REMEMBER_EMAIL_KEY);
    } catch { /* Ignore storage errors. */ }
  },
};

export default authService;
