// Hospital Repository
// In-memory data repository with clean interface compatible with future MongoDB integration.
import { SEED_HOSPITALS } from '../data/ghaziabadSeed.js';
import Hospital from '../models/Hospital.js';
import { codeQuery, matchesText, mongoIsReady, paginate, serializeDocument } from './mongoRepositoryUtils.js';

function hospitalRecord(document) {
  const record = serializeDocument(document);
  if (!record) return null;
  return { ...record, address: record.location, bedsTotal: record.totalBeds, bedsAvail: record.availableBeds, icuTotal: record.totalICUBeds, icuAvail: record.availableICUBeds, status: record.emergencyStatus };
}

function toMongoHospital(payload = {}) {
  const fields = { ...payload };
  if (fields.id !== undefined && fields.hospitalCode === undefined) fields.hospitalCode = fields.id;
  if (fields.address !== undefined && fields.location === undefined) fields.location = fields.address;
  if (fields.status !== undefined && fields.emergencyStatus === undefined) fields.emergencyStatus = fields.status;
  fields.totalBeds = fields.totalBeds ?? fields.bedsTotal;
  fields.availableBeds = fields.availableBeds ?? fields.bedsAvail;
  fields.totalICUBeds = fields.totalICUBeds ?? fields.icuTotal;
  fields.availableICUBeds = fields.availableICUBeds ?? fields.icuAvail;
  delete fields.id; delete fields.address; delete fields.status;
  delete fields.bedsTotal; delete fields.bedsAvail; delete fields.icuTotal; delete fields.icuAvail;
  return fields;
}

class HospitalRepository {
  constructor() {
    this.hospitals = JSON.parse(JSON.stringify(SEED_HOSPITALS));
  }

  async findAll(query = {}) {
    const { status, emergencyStatus, search, page = 1, limit = 50 } = query;
    if (mongoIsReady()) {
      const records = (await Hospital.find({}).sort({ name: 1 })).map(hospitalRecord);
      const wantedStatus = String(status || emergencyStatus || '').toLowerCase().trim();
      const filtered = records.filter((hospital) =>
        (!wantedStatus || String(hospital.status || '').toLowerCase() === wantedStatus) &&
        matchesText(hospital, ['id', 'name', 'address', 'location'], search)
      );
      return paginate(filtered, page, limit);
    }
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
    if (mongoIsReady()) return hospitalRecord(await Hospital.findOne(codeQuery(Hospital, 'hospitalCode', id)));
    const strId = String(id).trim().toLowerCase();
    return this.hospitals.find((h) => String(h.id).toLowerCase() === strId) || null;
  }

  async create(payload) {
    if (mongoIsReady()) {
      const hospitalCode = payload.id || payload.hospitalCode || `HOSP-${Date.now()}`;
      return hospitalRecord(await Hospital.create(toMongoHospital({ ...payload, hospitalCode })));
    }
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
      status: payload.status || payload.emergencyStatus || 'accepting',
      bedsTotal: Number(payload.bedsTotal ?? payload.totalBeds ?? 100),
      bedsAvail: Number(payload.bedsAvail ?? payload.availableBeds ?? 20),
      icuTotal: Number(payload.icuTotal ?? payload.totalICUBeds ?? 10),
      icuAvail: Number(payload.icuAvail ?? payload.availableICUBeds ?? 2),
      ambulances: Number(payload.ambulances ?? 2),
      contact: payload.contact || '+91 120 000 0000',
    };

    this.hospitals.push(newRecord);
    return newRecord;
  }

  async update(id, updates) {
    if (mongoIsReady()) {
      const hospital = await Hospital.findOne(codeQuery(Hospital, 'hospitalCode', id));
      if (!hospital) return null;
      hospital.set(toMongoHospital(updates));
      await hospital.save();
      return hospitalRecord(hospital);
    }
    const index = this.hospitals.findIndex((h) => String(h.id).toLowerCase() === String(id).toLowerCase());
    if (index === -1) return null;

    const existing = this.hospitals[index];
    const updated = {
      ...existing,
      ...updates,
      bedsTotal: updates.bedsTotal ?? updates.totalBeds ?? existing.bedsTotal,
      bedsAvail: updates.bedsAvail ?? updates.availableBeds ?? existing.bedsAvail,
      icuTotal: updates.icuTotal ?? updates.totalICUBeds ?? existing.icuTotal,
      icuAvail: updates.icuAvail ?? updates.availableICUBeds ?? existing.icuAvail,
      status: updates.status ?? updates.emergencyStatus ?? existing.status,
      id: existing.id,
    };

    this.hospitals[index] = updated;
    return updated;
  }

  async delete(id) {
    if (mongoIsReady()) return Boolean(await Hospital.findOneAndDelete(codeQuery(Hospital, 'hospitalCode', id)));
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
