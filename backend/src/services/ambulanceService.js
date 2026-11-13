import ambulanceRepository from '../repositories/ambulanceRepository.js';
import { AMBULANCE_CATEGORIES, AMBULANCE_VERIFICATION } from '../models/Ambulance.js';

const fields = ['recordCode', 'name', 'providerName', 'ownership', 'category', 'serviceType', 'contactNumber', 'alternateContact', 'address', 'city', 'district', 'state', 'location', 'vehicleType', 'facilities', 'operatingHours', 'availabilityStatus', 'verificationStatus', 'sourceUrl', 'sourcePublishedAt', 'lastVerifiedAt', 'scope', 'publishedFleetCount'];
function httpError(statusCode, errorCode, message) { const error = new Error(message); error.statusCode = statusCode; error.errorCode = errorCode; return error; }
function validateQuery(query) {
  const page = Number(query.page ?? 1); const limit = Number(query.limit ?? 50);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw httpError(400, 'INVALID_PAGINATION', 'page must be >= 1 and limit must be between 1 and 100.');
  if (query.category && !AMBULANCE_CATEGORIES.includes(query.category)) throw httpError(400, 'INVALID_CATEGORY', 'Unknown ambulance category.');
  if (query.verificationStatus && !AMBULANCE_VERIFICATION.includes(query.verificationStatus)) throw httpError(400, 'INVALID_VERIFICATION_STATUS', 'Unknown verification status.');
  for (const key of ['search', 'area', 'serviceType']) if (query[key] && String(query[key]).length > 120) throw httpError(400, 'INVALID_QUERY', `${key} must be 120 characters or fewer.`);
  return { ...query, page, limit };
}
function normalizePayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw httpError(400, 'INVALID_BODY', 'A JSON object is required.');
  const result = {};
  for (const field of fields) if (Object.hasOwn(payload, field)) result[field] = payload[field];
  if (!partial) for (const key of ['recordCode', 'name', 'providerName', 'category', 'serviceType', 'sourceUrl']) if (!String(result[key] || '').trim()) throw httpError(400, 'REQUIRED_FIELD', `${key} is required.`);
  const maxLength = { recordCode: 80, name: 180, providerName: 180, serviceType: 100, address: 300, city: 100, district: 100, state: 100, contactNumber: 40, alternateContact: 40, sourceUrl: 1000, vehicleType: 100, operatingHours: 120 };
  for (const [key, max] of Object.entries(maxLength)) {
    if (result[key] != null) { if (typeof result[key] !== 'string' || !result[key].trim() || result[key].length > max) throw httpError(400, 'INVALID_FIELD', `${key} must be a non-empty string of ${max} characters or fewer.`); result[key] = result[key].trim(); }
  }
  if (result.category != null && !AMBULANCE_CATEGORIES.includes(result.category)) throw httpError(400, 'INVALID_CATEGORY', 'Unknown ambulance category.');
  if (result.ownership != null && !['government', 'private', 'unknown'].includes(result.ownership)) throw httpError(400, 'INVALID_OWNERSHIP', 'ownership must be government, private or unknown.');
  if (result.verificationStatus != null && !AMBULANCE_VERIFICATION.includes(result.verificationStatus)) throw httpError(400, 'INVALID_VERIFICATION_STATUS', 'Unknown verification status.');
  if (result.availabilityStatus != null && !['unknown', 'available', 'unavailable'].includes(result.availabilityStatus)) throw httpError(400, 'INVALID_AVAILABILITY', 'availabilityStatus must be unknown, available or unavailable.');
  if (result.location != null && (result.location.type !== 'Point' || !Array.isArray(result.location.coordinates) || result.location.coordinates.length !== 2 || !result.location.coordinates.every(Number.isFinite) || Math.abs(result.location.coordinates[0]) > 180 || Math.abs(result.location.coordinates[1]) > 90)) throw httpError(400, 'INVALID_LOCATION', 'location must be a GeoJSON Point with in-range [longitude, latitude] numeric coordinates.');
  if (result.scope != null && !['provider-location', 'district-service'].includes(result.scope)) throw httpError(400, 'INVALID_SCOPE', 'scope must be provider-location or district-service.');
  if ((result.scope === 'district-service') && result.location) throw httpError(400, 'DISTRICT_SERVICE_CANNOT_BE_MAPPED', 'District-level services cannot be mapped as provider or vehicle locations.');
  if (result.contactNumber && !/^[\d+()\-\s]{3,40}$/.test(result.contactNumber)) throw httpError(400, 'INVALID_CONTACT', 'contactNumber contains unsupported characters.');
  if (result.alternateContact && !/^[\d+()\-\s]{3,40}$/.test(result.alternateContact)) throw httpError(400, 'INVALID_CONTACT', 'alternateContact contains unsupported characters.');
  if (result.facilities && (!Array.isArray(result.facilities) || result.facilities.length > 40 || result.facilities.some((value) => typeof value !== 'string' || value.length > 100))) throw httpError(400, 'INVALID_FACILITIES', 'facilities must be an array of up to 40 strings.');
  if (result.publishedFleetCount != null && (!Number.isInteger(Number(result.publishedFleetCount)) || Number(result.publishedFleetCount) < 0)) throw httpError(400, 'INVALID_FLEET_COUNT', 'publishedFleetCount must be a non-negative integer or null.');
  if (result.sourceUrl && !/^https:\/\//i.test(result.sourceUrl)) throw httpError(400, 'INVALID_SOURCE_URL', 'sourceUrl must use HTTPS.');
  for (const key of ['sourcePublishedAt', 'lastVerifiedAt']) {
    if (result[key] !== undefined && result[key] !== null) {
      const date = new Date(result[key]);
      if (Number.isNaN(date.getTime())) throw httpError(400, 'INVALID_DATE', `${key} must be a valid date or null.`);
      result[key] = date;
    }
  }
  if (result.publishedFleetCount != null) result.publishedFleetCount = Number(result.publishedFleetCount);
  return result;
}

class AmbulanceService {
  async getAll(query = {}) { return ambulanceRepository.findAll(validateQuery(query)); }
  async getById(id) { const record = await ambulanceRepository.findById(id); if (!record) throw httpError(404, 'AMBULANCE_NOT_FOUND', `Ambulance provider '${id}' not found.`); return record; }
  async create(payload) {
    const record = normalizePayload(payload);
    return ambulanceRepository.create({
      city: 'Ghaziabad', district: 'Ghaziabad', state: 'Uttar Pradesh',
      ownership: 'unknown', availabilityStatus: 'unknown', verificationStatus: 'unverified', scope: 'provider-location', facilities: [],
      ...record,
    });
  }
  async update(id, payload) { const updates = normalizePayload(payload, { partial: true }); if (!Object.keys(updates).length) throw httpError(400, 'EMPTY_UPDATE', 'Provide at least one supported field.'); await this.getById(id); return ambulanceRepository.update(id, updates); }
  async remove(id) { await this.getById(id); await ambulanceRepository.delete(id); return { id }; }
  async setVerification(id, status, sourceUrl) {
    if (!AMBULANCE_VERIFICATION.includes(status)) throw httpError(400, 'INVALID_VERIFICATION_STATUS', 'Unknown verification status.');
    const record = await this.getById(id);
    const update = { verificationStatus: status, lastVerifiedAt: new Date() };
    if (sourceUrl !== undefined) update.sourceUrl = normalizePayload({ sourceUrl }, { partial: true }).sourceUrl;
    else update.sourceUrl = record.sourceUrl;
    return ambulanceRepository.update(id, update);
  }
  async nearby(query = {}) {
    const longitude = Number(query.longitude); const latitude = Number(query.latitude); const radiusKm = Number(query.radiusKm ?? 25);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 100) throw httpError(400, 'INVALID_NEARBY_QUERY', 'Provide valid longitude, latitude and radiusKm (0 to 100).');
    const records = await ambulanceRepository.findNearby(longitude, latitude, radiusKm * 1000);
    return records.filter((record) => record.verificationStatus === 'official-source' || record.verificationStatus === 'provider-confirmed' || record.verificationStatus === 'directory-listed');
  }
}
export const ambulanceService = new AmbulanceService();
export default ambulanceService;
