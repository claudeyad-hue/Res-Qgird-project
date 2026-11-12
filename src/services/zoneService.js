import { DEMO_ZONES } from '../data/demoZones.js';
export const zoneService = {
  async getZones() {
    // Zones are currently a static demonstration layer; no backend endpoint exists.
    return [...DEMO_ZONES];
  },
};

export default zoneService;
