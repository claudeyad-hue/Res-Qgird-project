import { API_BASE, apiUrl } from './apiConfig.js';

export function readSessionToken() {
  try { return sessionStorage.getItem('resquard_auth_token'); } catch { return null; }
}

export async function apiFetch(path, options = {}) {
  const token = readSessionToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(apiUrl(path), { ...options, headers });
}

export function requireApi() {
  if (!API_BASE) throw new Error('The API is not configured. Set VITE_API_BASE_URL to the backend URL.');
}

export async function readApiResponse(response, fallback = 'The request could not be completed.') {
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const error = new Error(payload?.message || `${fallback} (${response.status}).`);
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

export const apiClient = { apiFetch, readApiResponse, requireApi, readSessionToken };
export default apiClient;
