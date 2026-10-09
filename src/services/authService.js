// Client Authentication Service
// Communicates with backend REST API endpoints (/api/auth/login, /api/auth/me, /api/health)
// Manages authentication tokens and user profiles in local storage.

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'resquard_auth_token';
const USER_KEY = 'resquard_auth_user';
const REMEMBER_EMAIL_KEY = 'resquard_remember_email';

export const authService = {
  /**
   * Log in user via backend REST API
   * @param {Object} credentials - { email, password }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }

    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };

    let response;
    try {
      response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (networkErr) {
      console.error('[AuthService] Network error during login:', networkErr);
      throw new Error('Unable to connect to authentication server. Please check your network connection or verify that the API server is running.');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      const msg = data?.message || data?.error?.message || 'Authentication failed. Please check your credentials.';
      const err = new Error(msg);
      err.statusCode = response.status;
      err.errorCode = data?.error?.code || 'AUTH_ERROR';
      throw err;
    }

    const { user, token } = data.data || {};
    if (!token || !user) {
      throw new Error('Authentication response is missing user credentials.');
    }

    // Persist to storage
    this.saveSession(token, user);
    return { user, token };
  },

  /**
   * Fetch current authenticated user profile using Bearer token
   */
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          this.saveUser(data.data);
          return data.data;
        }
      }
    } catch (err) {
      console.warn('[AuthService] Could not refresh user profile from backend:', err.message);
    }

    return this.getUser();
  },

  /**
   * Check backend system operational status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        const data = await response.json();
        return {
          online: true,
          status: 'System Operational',
          data: data.data,
        };
      }
    } catch {
      // Backend not currently reachable
    }
    return {
      online: false,
      status: 'Standby / Offline',
      data: null,
    };
  },

  saveSession(token, user) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore quota errors
    }
  },

  saveUser(user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore
    }
  },

  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  },

  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore
    }
  },

  getRememberedEmail() {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  },

  setRememberedEmail(email) {
    try {
      if (email) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      // Ignore
    }
  },
};

export default authService;
