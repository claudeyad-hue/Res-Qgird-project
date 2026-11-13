import { API_BASE } from './apiConfig.js';
import { apiFetch } from './apiClient.js';

export const hospitalApiService = {
  async getHospitals() {
    if (!API_BASE) return null;
    const response = await apiFetch('hospitals');
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Could not load hospitals.');
    return Array.isArray(payload.data) ? payload.data.map((hospital) => ({
      ...hospital,
      bedsTotal: hospital.bedsTotal ?? hospital.totalBeds ?? null,
      bedsAvail: hospital.bedsAvail ?? hospital.availableBeds ?? null,
      icuTotal: hospital.icuTotal ?? hospital.totalICUBeds ?? null,
      icuAvail: hospital.icuAvail ?? hospital.availableICUBeds ?? null,
      address: hospital.address ?? hospital.location ?? null,
      status: hospital.status ?? hospital.emergencyStatus ?? 'unknown',
      liveAvailability: hospital.liveAvailability ?? null,
      availabilityLabel: hospital.liveAvailability?.updatedAt ? null : 'Live availability not connected',
    })) : [];
  },

  async updateAvailability(hospitalId, availability) {
    if (!API_BASE) throw new Error('Hospital updates require a connected API.');
    const response = await apiFetch(`hospitals/${encodeURIComponent(hospitalId)}/availability`, {
      method: 'PATCH',
      body: JSON.stringify(availability),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Could not update hospital availability.');
    return payload.data;
  },
};

export default hospitalApiService;
