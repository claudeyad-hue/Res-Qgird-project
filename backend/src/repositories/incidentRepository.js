// Incident Repository
// In-memory data repository with clean interface compatible with future MongoDB integration.
import { SEED_INCIDENTS } from '../data/ghaziabadSeed.js';
import Incident from '../models/Incident.js';
import { codeQuery, matchesText, mongoIsReady, paginate, serializeDocument } from './mongoRepositoryUtils.js';

function toMongoIncident(payload = {}) {
  const fields = { ...payload };
  if (fields.id !== undefined && fields.incidentCode === undefined) fields.incidentCode = fields.id;
  if (fields.address !== undefined && fields.location === undefined) fields.location = fields.address;
  if (fields.desc !== undefined && fields.description === undefined) fields.description = fields.desc;
  if (fields.team !== undefined && fields.assignedTeamName === undefined) fields.assignedTeamName = fields.team;
  if (fields.severity !== undefined) fields.severity = String(fields.severity).toLowerCase();
  if (fields.status !== undefined) fields.status = String(fields.status).toLowerCase();
  delete fields.id;
  delete fields.address;
  delete fields.desc;
  delete fields.team;
  delete fields.assignedTeamId;
  delete fields.time;
  delete fields.reportedAt;
  delete fields.updatedAt;
  return fields;
}

class IncidentRepository {
  constructor() {
    this.incidents = JSON.parse(JSON.stringify(SEED_INCIDENTS));
  }

  async findAll(query = {}) {
    const { status, severity, type, search, page = 1, limit = 50 } = query;
    if (mongoIsReady()) {
      const records = (await Incident.find({}).sort({ createdAt: -1 })).map(serializeDocument);
      const filtered = records.filter((inc) =>
        (!status || String(inc.status || '').toLowerCase() === String(status).toLowerCase().trim()) &&
        (!severity || String(inc.severity || '').toLowerCase() === String(severity).toLowerCase().trim()) &&
        (!type || String(inc.type || '').toLowerCase() === String(type).toLowerCase().trim()) &&
        matchesText(inc, ['id', 'title', 'type', 'address', 'location'], search)
      );
      return paginate(filtered, page, limit);
    }
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
    if (mongoIsReady()) return serializeDocument(await Incident.findOne(codeQuery(Incident, 'incidentCode', id)));
    const strId = String(id).trim().toLowerCase();
    return this.incidents.find((inc) => String(inc.id).toLowerCase() === strId) || null;
  }

  async create(payload) {
    if (mongoIsReady()) {
      const incidentCode = payload.id || payload.incidentCode || `INC-${Date.now()}`;
      return serializeDocument(await Incident.create(toMongoIncident({ ...payload, incidentCode })));
    }
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
    if (mongoIsReady()) {
      const record = await Incident.findOne(codeQuery(Incident, 'incidentCode', id));
      if (!record) return null;
      record.set(toMongoIncident(updates));
      await record.save();
      return serializeDocument(record);
    }
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
    if (mongoIsReady()) return Boolean(await Incident.findOneAndDelete(codeQuery(Incident, 'incidentCode', id)));
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
