// Hospital Repository
// In-memory data repository with clean interface compatible with future MongoDB integration.
import { GHAZIABAD_HOSPITALS as SEED_HOSPITALS } from '../../../src/data/ghaziabadHospitals.js';
import Hospital from '../models/Hospital.js';
import { codeQuery, matchesText, mongoIsReady, paginate, serializeDocument } from './mongoRepositoryUtils.js';

function hospitalRecord(document) {
  const record = serializeDocument(document);
  if (!record) return null;
  return {
    ...record,
    address: record.address || record.location || null,
    bedsTotal: record.totalBeds ?? null,
    bedsAvail: record.availableBeds ?? null,
    icuTotal: record.totalICUBeds ?? null,
    icuAvail: record.availableICUBeds ?? null,
    status: record.emergencyStatus || 'unknown',
    availabilityLabel: record.liveAvailability?.updatedAt ? undefined : 'Live availability not connected',
  };
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
    const { status, emergencyStatus, search, category, ownership, emergencyServiceListed, page = 1, limit = 50 } = query;
    const matchesFilters = (hospital) => {
      const wantedStatus = String(status || emergencyStatus || '').toLowerCase().trim();
      const emergencyFilter = emergencyServiceListed === undefined || emergencyServiceListed === ''
        ? null
        : String(emergencyServiceListed).toLowerCase() === 'true';
      return (!wantedStatus || String(hospital.status || '').toLowerCase() === wantedStatus) &&
        (!category || String(hospital.category || '').toLowerCase() === String(category).toLowerCase()) &&
        (!ownership || String(hospital.ownership || '').toLowerCase() === String(ownership).toLowerCase()) &&
        (emergencyFilter === null || hospital.emergencyServiceListed === emergencyFilter) &&
        matchesText(hospital, ['id', 'name', 'address', 'location'], search);
    };
    if (mongoIsReady()) {
      const records = (await Hospital.find({}).sort({ name: 1 })).map(hospitalRecord);
      const filtered = records.filter(matchesFilters);
      return paginate(filtered, page, limit);
    }
    const results = this.hospitals.filter(matchesFilters);

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
    const newRecord = {
      ...payload,
      id: payload.id || `GZB-LOCAL-${Date.now()}`,
      name: payload.name,
      latitude: payload.latitude == null ? null : Number(payload.latitude),
      longitude: payload.longitude == null ? null : Number(payload.longitude),
      address: payload.address || payload.location || null,
      location: payload.location || payload.address || null,
      status: payload.status || payload.emergencyStatus || 'unknown',
      bedsTotal: payload.bedsTotal ?? payload.totalBeds ?? null,
      bedsAvail: payload.bedsAvail ?? payload.availableBeds ?? null,
      icuTotal: payload.icuTotal ?? payload.totalICUBeds ?? null,
      icuAvail: payload.icuAvail ?? payload.availableICUBeds ?? null,
      ambulances: payload.ambulances ?? null,
      contact: payload.contact || null,
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
      bedsTotal: updates.bedsTotal ?? updates.totalBeds ?? existing.bedsTotal ?? null,
      bedsAvail: updates.bedsAvail ?? updates.availableBeds ?? existing.bedsAvail ?? null,
      icuTotal: updates.icuTotal ?? updates.totalICUBeds ?? existing.icuTotal ?? null,
      icuAvail: updates.icuAvail ?? updates.availableICUBeds ?? existing.icuAvail ?? null,
      status: updates.status ?? updates.emergencyStatus ?? existing.status ?? 'unknown',
      id: existing.id,
    };

    this.hospitals[index] = updated;
    return updated;
  }

  async updateAvailability(id, availability) {
    const hospital = await this.findById(id);
    if (!hospital) return null;
    const updated = { ...hospital, liveAvailability: availability, availabilityLabel: undefined };
    if (mongoIsReady()) {
      const document = await Hospital.findOne(codeQuery(Hospital, 'hospitalCode', id));
      document.liveAvailability = availability;
      document.availabilitySource = availability.source;
      if (availability.emergencyStatus) document.emergencyStatus = availability.emergencyStatus;
      await document.save();
      return hospitalRecord(document);
    }
    const index = this.hospitals.findIndex((entry) => String(entry.id).toLowerCase() === String(id).toLowerCase());
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
