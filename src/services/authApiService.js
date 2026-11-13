import { API_BASE } from './apiConfig.js';
import { apiFetch, readApiResponse, requireApi } from './apiClient.js';

const TOKEN_KEY = 'resquard_auth_token';

function normalizeUser(user) {
  return {
    ...user,
    id: user?.id || user?._id,
    organization: user?.organization || user?.org || '',
    org: user?.organization || user?.org || '',
    hospitalIds: Array.isArray(user?.hospitalIds) ? user.hospitalIds : [],
  };
}

export const authApiService = {
  isConfigured: Boolean(API_BASE),

  async login(email, password) {
    requireApi();
    const response = await apiFetch('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const payload = await readApiResponse(response, 'Sign in failed');
    const { token, user } = payload.data || {};
    if (!token || !user) throw new Error('The authentication service returned an incomplete response.');
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch { throw new Error('This browser cannot store a sign-in session. Enable session storage and try again.'); }
    return normalizeUser(user);
  },

  async getCurrentUser() {
    const response = await apiFetch('auth/me');
    const payload = await readApiResponse(response, 'Your session could not be restored');
    return normalizeUser(payload.data);
  },

  clearSession() {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* Session storage may be unavailable. */ }
  },
};

export default authApiService;
