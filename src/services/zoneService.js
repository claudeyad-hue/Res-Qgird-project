import { DEMO_ZONES } from '../data/demoZones.js';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';

export const zoneService = {
  async getZones() {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/zones`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend /api/zones unavailable, using local disaster zones:', err.message);
      }
    }
    return [...DEMO_ZONES];
  },
};

export default zoneService;
