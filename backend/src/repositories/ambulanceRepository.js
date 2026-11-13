import Ambulance from '../models/Ambulance.js';
import { GHAZIABAD_AMBULANCES } from '../data/ghaziabadAmbulances.js';
import { codeQuery, matchesText, mongoIsReady, paginate, serializeDocument } from './mongoRepositoryUtils.js';

const asRecord = (doc) => serializeDocument(doc);
const copySeed = () => GHAZIABAD_AMBULANCES.map((record) => ({ ...record, facilities: [...record.facilities], lastVerifiedAt: new Date(record.lastVerifiedAt) }));

class AmbulanceRepository {
  constructor() { this.records = copySeed(); }

  async findAll(query = {}) {
    const { page = 1, limit = 50, category, serviceType, search, area, verificationStatus } = query;
    const test = (record) => (!category || record.category === category)
      && (!serviceType || String(record.serviceType).toLowerCase().includes(String(serviceType).toLowerCase()))
      && (!verificationStatus || record.verificationStatus === verificationStatus)
      && (!area || [record.address, record.city, record.district, record.state].some((value) => String(value || '').toLowerCase().includes(String(area).toLowerCase())))
      && matchesText(record, ['name', 'providerName', 'category', 'serviceType', 'address', 'city', 'district', 'contactNumber'], search);
    if (mongoIsReady()) {
      const records = (await Ambulance.find({}).sort({ providerName: 1, name: 1 })).map(asRecord);
      return paginate(records.filter(test), page, limit);
    }
    return paginate(this.records.filter(test), page, limit);
  }

  async findById(id) {
    if (!id) return null;
    if (mongoIsReady()) return asRecord(await Ambulance.findOne(codeQuery(Ambulance, 'recordCode', id)));
    return this.records.find((record) => String(record.id || record.recordCode).toLowerCase() === String(id).toLowerCase()) || null;
  }

  async create(payload) {
    if (mongoIsReady()) return asRecord(await Ambulance.create(payload));
    if (this.records.some((record) => record.recordCode === payload.recordCode || (record.name.toLowerCase() === payload.name.toLowerCase() && record.providerName.toLowerCase() === payload.providerName.toLowerCase()))) {
      const error = new Error('An ambulance record with this code or provider name already exists.'); error.code = 11000; error.keyValue = { recordCode: payload.recordCode }; throw error;
    }
    const record = { ...payload, id: payload.recordCode, createdAt: new Date(), updatedAt: new Date() };
    this.records.push(record);
    return record;
  }

  async update(id, updates) {
    if (mongoIsReady()) {
      const doc = await Ambulance.findOne(codeQuery(Ambulance, 'recordCode', id));
      if (!doc) return null;
      doc.set(updates);
      await doc.save();
      return asRecord(doc);
    }
    const index = this.records.findIndex((record) => String(record.id || record.recordCode).toLowerCase() === String(id).toLowerCase());
    if (index < 0) return null;
    if (this.records.some((record, candidate) => candidate !== index && (record.recordCode === updates.recordCode || (updates.name && updates.providerName && record.name.toLowerCase() === updates.name.toLowerCase() && record.providerName.toLowerCase() === updates.providerName.toLowerCase())))) {
      const error = new Error('An ambulance record with this code or provider name already exists.'); error.code = 11000; error.keyValue = { recordCode: updates.recordCode }; throw error;
    }
    this.records[index] = { ...this.records[index], ...updates, updatedAt: new Date() };
    return this.records[index];
  }

  async delete(id) {
    if (mongoIsReady()) return Boolean(await Ambulance.findOneAndDelete(codeQuery(Ambulance, 'recordCode', id)));
    const index = this.records.findIndex((record) => String(record.id || record.recordCode).toLowerCase() === String(id).toLowerCase());
    if (index < 0) return false;
    this.records.splice(index, 1);
    return true;
  }

  async findNearby(longitude, latitude, maxDistance) {
    if (mongoIsReady()) {
      return (await Ambulance.find({ location: { $near: { $geometry: { type: 'Point', coordinates: [longitude, latitude] }, $maxDistance: maxDistance } } }).limit(100)).map(asRecord);
    }
    const distance = (record) => {
      const [lon, lat] = record.location.coordinates;
      const rad = (d) => d * Math.PI / 180;
      const a = Math.sin(rad(lat - latitude) / 2) ** 2 + Math.cos(rad(latitude)) * Math.cos(rad(lat)) * Math.sin(rad(lon - longitude) / 2) ** 2;
      return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    return this.records.filter((record) => record.location?.coordinates).map((record) => ({ record, distance: distance(record) })).filter((item) => item.distance <= maxDistance).sort((a, b) => a.distance - b.distance).slice(0, 100).map(({ record, distance: distanceMeters }) => ({ ...record, distanceMeters }));
  }

  async upsertSourceRecords(records) {
    if (!mongoIsReady()) return records.map((record) => {
      const index = this.records.findIndex((current) => current.recordCode === record.recordCode);
      if (index < 0) this.records.push({ ...record, id: record.recordCode, createdAt: new Date(), updatedAt: new Date() });
      else this.records[index] = { ...this.records[index], ...record, updatedAt: new Date() };
      return this.records[index];
    });
    return Promise.all(records.map((record) => {
      const sourced = { ...record, identityKey: `${record.providerName.trim().toLowerCase()}|${record.name.trim().toLowerCase()}` };
      return Ambulance.findOneAndUpdate({ recordCode: record.recordCode }, { $set: sourced }, { upsert: true, new: true, runValidators: true }).then(asRecord);
    }));
  }
}

export const ambulanceRepository = new AmbulanceRepository();
export default ambulanceRepository;
