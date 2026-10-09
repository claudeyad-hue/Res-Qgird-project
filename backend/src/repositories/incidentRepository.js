// Incident Repository
// In-memory data repository with clean interface compatible with future MongoDB integration.
import { SEED_INCIDENTS } from '../data/ghaziabadSeed.js';

class IncidentRepository {
  constructor() {
    this.incidents = JSON.parse(JSON.stringify(SEED_INCIDENTS));
  }

  async findAll(query = {}) {
    const { status, severity, type, search, page = 1, limit = 50 } = query;
    let results = [...this.incidents];

    if (status) {
      const s = status.toLowerCase().trim();
      results = results.filter((inc) => String(inc.status || '').toLowerCase() === s);
    }

    if (severity) {
      const sev = severity.toLowerCase().trim();
      results = results.filter((inc) => String(inc.severity || '').toLowerCase() === sev);
    }

    if (type) {
      const t = type.toLowerCase().trim();
      results = results.filter((inc) => String(inc.type || '').toLowerCase() === t);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter((inc) => {
        const text = `${inc.id || ''} ${inc.title || ''} ${inc.type || ''} ${inc.address || inc.location || ''}`.toLowerCase();
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
    return this.incidents.find((inc) => String(inc.id).toLowerCase() === strId) || null;
  }

  async create(payload) {
    const maxNum = this.incidents.reduce((max, i) => {
      const num = parseInt(String(i.id).replace('INC-', ''), 10);
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 1000);

    const now = new Date().toISOString();
    const newRecord = {
      id: payload.id || `INC-${maxNum + 1}`,
      type: payload.type || 'Other',
      title: payload.title || `${payload.type || 'Disaster'} Incident`,
      description: payload.description || payload.desc || 'No description provided.',
      latitude: parseFloat(payload.latitude),
      longitude: parseFloat(payload.longitude),
      severity: payload.severity || 'Medium',
      status: payload.status || 'Reported',
      reportedAt: payload.reportedAt || now,
      updatedAt: now,
      address: payload.address || payload.location || 'Ghaziabad, UP',
      location: payload.location || payload.address || 'Ghaziabad, UP',
      reportedBy: payload.reportedBy || 'Public / Field Report',
      assignedTeamId: payload.assignedTeamId || null,
      team: payload.team || null,
      affectedPeople: parseInt(payload.affectedPeople || payload.affected, 10) || 0,
      priority: payload.priority || (payload.severity === 'Critical' ? 1 : 2),
      time: 'Just now',
    };

    this.incidents.unshift(newRecord);
    return newRecord;
  }

  async update(id, updates) {
    const index = this.incidents.findIndex((inc) => String(inc.id).toLowerCase() === String(id).toLowerCase());
    if (index === -1) return null;

    const existing = this.incidents[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // prevent ID change
      updatedAt: new Date().toISOString(),
    };

    this.incidents[index] = updated;
    return updated;
  }

  async delete(id) {
    const index = this.incidents.findIndex((inc) => String(inc.id).toLowerCase() === String(id).toLowerCase());
    if (index === -1) return false;
    this.incidents.splice(index, 1);
    return true;
  }

  reset() {
    this.incidents = JSON.parse(JSON.stringify(SEED_INCIDENTS));
  }
}

export const incidentRepository = new IncidentRepository();
export default incidentRepository;
