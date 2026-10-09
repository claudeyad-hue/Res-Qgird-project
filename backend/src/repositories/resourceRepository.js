// Resource Repository
// In-memory data repository with clean interface compatible with future MongoDB integration.
import { SEED_RESOURCES } from '../data/ghaziabadSeed.js';

class ResourceRepository {
  constructor() {
    this.resources = JSON.parse(JSON.stringify(SEED_RESOURCES));
  }

  async findAll(query = {}) {
    const { type, status, search, page = 1, limit = 50 } = query;
    let results = [...this.resources];

    if (type) {
      const t = type.toLowerCase().trim();
      results = results.filter((r) => String(r.type || '').toLowerCase().includes(t));
    }

    if (status) {
      const s = status.toLowerCase().trim();
      results = results.filter((r) => String(r.status || '').toLowerCase() === s);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter((r) => {
        const text = `${r.id || ''} ${r.type || ''} ${r.location || ''}`.toLowerCase();
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
    return this.resources.find((r) => String(r.id).toLowerCase() === strId) || null;
  }

  async create(payload) {
    const maxNum = this.resources.reduce((max, r) => {
      const num = parseInt(String(r.id).replace('RES-', ''), 10);
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 10);

    const newRecord = {
      id: payload.id || `RES-0${maxNum + 1}`,
      type: payload.type || 'Emergency Supplies',
      amount: parseInt(payload.amount, 10) || 1000,
      unit: payload.unit || 'units',
      location: payload.location || 'Ghaziabad Logistics Base',
      status: payload.status || 'available',
      latitude: parseFloat(payload.latitude),
      longitude: parseFloat(payload.longitude),
    };

    this.resources.push(newRecord);
    return newRecord;
  }

  async update(id, updates) {
    const index = this.resources.findIndex((r) => String(r.id).toLowerCase() === String(id).toLowerCase());
    if (index === -1) return null;

    const existing = this.resources[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    this.resources[index] = updated;
    return updated;
  }

  async delete(id) {
    const index = this.resources.findIndex((r) => String(r.id).toLowerCase() === String(id).toLowerCase());
    if (index === -1) return false;
    this.resources.splice(index, 1);
    return true;
  }

  reset() {
    this.resources = JSON.parse(JSON.stringify(SEED_RESOURCES));
  }
}

export const resourceRepository = new ResourceRepository();
export default resourceRepository;
