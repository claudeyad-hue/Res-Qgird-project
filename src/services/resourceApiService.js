import { API_BASE } from './apiConfig.js';
import { apiFetch } from './apiClient.js';

async function readResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Resource request failed.');
  return payload.data;
}

export const resourceApiService = {
  async getResources() {
    if (!API_BASE) return null;
    const data = await readResponse(await apiFetch('resources'));
    return Array.isArray(data) ? data.map((resource) => ({
      ...resource,
      amount: resource.amount == null && resource.availableQuantity == null ? null : Number(resource.amount ?? resource.availableQuantity),
    })) : [];
  },

  async allocate(resource, amount, destination, priority) {
    if (!API_BASE) return null;
    const response = await apiFetch(`resources/${encodeURIComponent(resource.id)}/allocations`, {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount), destination, priority }),
    });
    const saved = await readResponse(response);
    return { ...resource, ...saved, amount: Number(saved.amount ?? saved.availableQuantity ?? resource.amount) };
  },
};

export default resourceApiService;
