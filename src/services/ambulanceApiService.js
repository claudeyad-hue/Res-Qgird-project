import { API_BASE } from './apiConfig.js';
import { apiFetch, readApiResponse } from './apiClient.js';

export const ambulanceApiService = {
  async getAmbulances(params = {}) {
    if (!API_BASE) return null;
    const query = new URLSearchParams({ limit: '100', ...Object.fromEntries(Object.entries(params).filter(([, value]) => value && value !== 'all')) });
    const payload = await readApiResponse(await apiFetch(`ambulances${query.size ? `?${query}` : ''}`), 'Could not load ambulance services.');
    return Array.isArray(payload.data) ? payload.data : [];
  },
};
export default ambulanceApiService;
