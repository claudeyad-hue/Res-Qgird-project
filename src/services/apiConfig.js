const configuredBase = import.meta.env?.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') || '';

// Accept a host URL as well as the legacy documented host URL ending in /api.
export const API_BASE = configuredBase.replace(/\/api(?:\/v1)?$/i, '');

export function apiUrl(path) {
  return `${API_BASE}/api/${String(path).replace(/^\/+/, '')}`;
}

export default apiUrl;
