import { API_BASE, apiUrl, authHeaders } from './apiConfig.js';

async function readResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Resource request failed.');
  return payload.data;
}

export const resourceApiService = {
  async getResources() {
    if (!API_BASE) return null;
    const data = await readResponse(await fetch(apiUrl('resources')));
    return Array.isArray(data) ? data.map((resource) => ({
      ...resource,
      amount: Number(resource.amount ?? resource.availableQuantity ?? 0),
    })) : [];
  },

  async allocate(resource, amount) {
    if (!API_BASE) return null;
    const nextAmount = Number(resource.amount) - Number(amount);
    const status = nextAmount <= 0 ? 'depleted' : nextAmount < 1000 ? 'low' : 'available';
    const response = await fetch(apiUrl(`resources/${encodeURIComponent(resource.id)}`), {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ amount: nextAmount, availableQuantity: nextAmount, status }),
    });
    const saved = await readResponse(response);
    return { ...resource, ...saved, amount: Number(saved.amount ?? saved.availableQuantity ?? nextAmount) };
  },
};

export default resourceApiService;
