// Hospital Repository
// In-memory data repository with clean interface compatible with future MongoDB integration.
import { SEED_HOSPITALS } from '../data/ghaziabadSeed.js';

class HospitalRepository {
  constructor() {
    this.hospitals = JSON.parse(JSON.stringify(SEED_HOSPITALS));
  }

  async findAll(query = {}) {
    const { status, emergencyStatus, search, page = 1, limit = 50 } = query;
    let results = [...this.hospitals];

    const filterStatus = status || emergencyStatus;
    if (filterStatus) {
      const s = filterStatus.toLowerCase().trim();
      results = results.filter((h) => String(h.status || '').toLowerCase() === s);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter((h) => {
        const text = `${h.id || ''} ${h.name || ''} ${h.address || h.location || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    const total = results.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const start = (pageNum - 1) * limitNum;
    const paginated = results.slice(start, start + limitNum);

    return {
      data: paginated,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findById(id) {
    if (!id) return null;
    const strId = String(id).trim().toLowerCase();
    return this.hospitals.find((h) => String(h.id).toLowerCase() === strId) || null;
  }

  async create(payload) {
    const maxNum = this.hospitals.reduce((max, h) => {
      const num = parseInt(String(h.id).replace('HOSP-', ''), 10);
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 10);

    const newRecord = {
      id: payload.id || `HOSP-0${maxNum + 1}`,
      name: payload.name || 'Emergency Medical Facility',
      latitude: parseFloat(payload.latitude),
      longitude: parseFloat(payload.longitude),
      address: payload.address || payload.location || 'Ghaziabad, UP',
      location: payload.location || payload.address || 'Ghaziabad, UP',
      status: payload.status || 'accepting',
      bedsTotal: parseInt(payload.bedsTotal, 10) || 100,
      bedsAvail: parseInt(payload.bedsAvail, 10) || 20,
      icuTotal: parseInt(payload.icuTotal, 10) || 10,
      icuAvail: parseInt(payload.icuAvail, 10) || 2,
      ambulances: parseInt(payload.ambulances, 10) || 2,
      contact: payload.contact || '+91 120 000 0000',
    };

    this.hospitals.push(newRecord);
    return newRecord;
  }

  async update(id, updates) {
    const index = this.hospitals.findIndex((h) => String(h.id).toLowerCase() === String(id).toLowerCase());
    if (index === -1) return null;

    const existing = this.hospitals[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    this.hospitals[index] = updated;
    return updated;
  }

  async delete(id) {
    const index = this.hospitals.findIndex((h) => String(h.id).toLowerCase() === String(id).toLowerCase());
    if (index === -1) return false;
    this.hospitals.splice(index, 1);
    return true;
  }

  reset() {
    this.hospitals = JSON.parse(JSON.stringify(SEED_HOSPITALS));
  }
}

export const hospitalRepository = new HospitalRepository();
export default hospitalRepository;
