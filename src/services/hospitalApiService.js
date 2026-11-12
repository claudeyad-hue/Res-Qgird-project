import { API_BASE, apiUrl } from './apiConfig.js';

export const hospitalApiService = {
  async getHospitals() {
    if (!API_BASE) return null;
    const response = await fetch(apiUrl('hospitals'));
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Could not load hospitals.');
    return Array.isArray(payload.data) ? payload.data.map((hospital) => ({
      ...hospital,
      bedsTotal: hospital.bedsTotal ?? hospital.totalBeds ?? 0,
      bedsAvail: hospital.bedsAvail ?? hospital.availableBeds ?? 0,
      icuTotal: hospital.icuTotal ?? hospital.totalICUBeds ?? 0,
      icuAvail: hospital.icuAvail ?? hospital.availableICUBeds ?? 0,
      address: hospital.address ?? hospital.location ?? '',
      status: hospital.status ?? hospital.emergencyStatus ?? 'active',
      distance: hospital.distance ?? 'In Ghaziabad District',
    })) : [];
  },
};

export default hospitalApiService;
