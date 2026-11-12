import hospitalRepository from '../repositories/hospitalRepository.js';
import { validateCoordinates, isPointInOperationalArea, calculateDistance } from '../utils/geoUtils.js';

function httpError(statusCode, errorCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  return error;
}

function validateCount(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw httpError(400, 'INVALID_BED_COUNTS', `${field} must be a non-negative number or blank.`);
  return number;
}

class HospitalService {
  async getHospitals(query = {}) { return hospitalRepository.findAll(query); }

  async getHospitalById(id) {
    const hospital = await hospitalRepository.findById(id);
    if (!hospital) throw httpError(404, 'HOSPITAL_NOT_FOUND', `Hospital with ID '${id}' not found.`);
    return hospital;
  }

  async findNearestHospital({ latitude, longitude }) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw httpError(400, 'INVALID_COORDINATES', 'Query parameters latitude and longitude must be valid numbers.');
    const geoCheck = validateCoordinates({ latitude: lat, longitude: lng });
    if (!geoCheck.insideArea) throw httpError(400, 'OUT_OF_OPERATIONAL_AREA', geoCheck.error || 'Requested coordinates are outside Ghaziabad.');

    const { data: allHospitals } = await hospitalRepository.findAll({ limit: 100 });
    const eligible = allHospitals.filter((hospital) => (
      Number.isFinite(hospital.latitude) && Number.isFinite(hospital.longitude)
      && isPointInOperationalArea(hospital)
      && !['unavailable', 'closed', 'diverting'].includes(String(hospital.status || '').toLowerCase())
    ));
    if (!eligible.length) throw httpError(404, 'NO_MAPPED_HOSPITAL', 'No hospital with verified coordinates is currently mapped in the Ghaziabad operational area.');
    const candidates = eligible.map((hospital) => ({
      hospital,
      distanceKm: calculateDistance({ latitude: lat, longitude: lng }, hospital),
    })).sort((a, b) => a.distanceKm - b.distanceKm);
    return {
      hospital: candidates[0].hospital,
      distanceKm: candidates[0].distanceKm,
      distanceType: 'straight-line',
      distanceUnit: 'km',
      candidateCount: candidates.length,
      origin: { latitude: lat, longitude: lng },
      availabilityStatus: 'Live availability not connected',
      candidates: candidates.map(({ hospital, distanceKm }) => ({
        id: hospital.id,
        name: hospital.name,
        distanceKm,
        status: hospital.status || 'unknown',
        availability: hospital.availabilityLabel || 'Live availability not connected',
      })),
    };
  }

  async createHospital(payload) {
    if (!payload.name?.trim()) throw httpError(400, 'HOSPITAL_NAME_REQUIRED', 'Official hospital name is required.');
    const hasLat = payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== '';
    const hasLng = payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== '';
    if (hasLat !== hasLng) throw httpError(400, 'INCOMPLETE_COORDINATES', 'Latitude and longitude must both be supplied, or both left blank.');
    if (hasLat) {
      const check = validateCoordinates({ latitude: Number(payload.latitude), longitude: Number(payload.longitude) });
      if (!check.insideArea) throw httpError(400, 'OUT_OF_OPERATIONAL_AREA', check.error || 'Hospital coordinates fall outside Ghaziabad.');
    }
    const counts = {
      totalBeds: validateCount(payload.totalBeds ?? payload.bedsTotal, 'totalBeds'),
      availableBeds: validateCount(payload.availableBeds ?? payload.bedsAvail, 'availableBeds'),
      totalICUBeds: validateCount(payload.totalICUBeds ?? payload.icuTotal, 'totalICUBeds'),
      availableICUBeds: validateCount(payload.availableICUBeds ?? payload.icuAvail, 'availableICUBeds'),
      ambulances: validateCount(payload.ambulances, 'ambulances'),
    };
    if (counts.totalBeds !== null && counts.availableBeds !== null && counts.availableBeds > counts.totalBeds) throw httpError(400, 'INVALID_BEDS_RANGE', 'Available beds cannot exceed total beds.');
    if (counts.totalICUBeds !== null && counts.availableICUBeds !== null && counts.availableICUBeds > counts.totalICUBeds) throw httpError(400, 'INVALID_ICU_BEDS_RANGE', 'Available ICU beds cannot exceed total ICU beds.');
    return hospitalRepository.create({
      ...payload,
      latitude: hasLat ? Number(payload.latitude) : null,
      longitude: hasLng ? Number(payload.longitude) : null,
      emergencyStatus: 'unknown',
      totalBeds: payload.totalBeds ?? payload.bedsTotal ?? null,
      availableBeds: payload.availableBeds ?? payload.bedsAvail ?? null,
      totalICUBeds: payload.totalICUBeds ?? payload.icuTotal ?? null,
      availableICUBeds: payload.availableICUBeds ?? payload.icuAvail ?? null,
      ambulances: payload.ambulances ?? null,
    });
  }

  async updateHospital(id, payload) {
    const existing = await this.getHospitalById(id);
    const totalBeds = validateCount(payload.totalBeds ?? payload.bedsTotal, 'totalBeds');
    const availableBeds = validateCount(payload.availableBeds ?? payload.bedsAvail, 'availableBeds');
    const totalICUBeds = validateCount(payload.totalICUBeds ?? payload.icuTotal, 'totalICUBeds');
    const availableICUBeds = validateCount(payload.availableICUBeds ?? payload.icuAvail, 'availableICUBeds');
    if (totalBeds !== null && availableBeds !== null && availableBeds > totalBeds) throw httpError(400, 'INVALID_BEDS_RANGE', 'Available beds cannot exceed total beds.');
    if (totalICUBeds !== null && availableICUBeds !== null && availableICUBeds > totalICUBeds) throw httpError(400, 'INVALID_ICU_BEDS_RANGE', 'Available ICU beds cannot exceed total ICU beds.');
    const update = { ...payload };
    if (payload.latitude !== undefined || payload.longitude !== undefined) {
      const lat = payload.latitude !== undefined ? Number(payload.latitude) : existing.latitude;
      const lng = payload.longitude !== undefined ? Number(payload.longitude) : existing.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw httpError(400, 'INVALID_COORDINATES', 'Both valid coordinates are required to update a mapped location.');
      const check = validateCoordinates({ latitude: lat, longitude: lng });
      if (!check.insideArea) throw httpError(400, 'OUT_OF_OPERATIONAL_AREA', check.error || 'Updated coordinates fall outside Ghaziabad.');
    }
    if (totalBeds !== null) update.bedsTotal = totalBeds;
    if (availableBeds !== null) update.bedsAvail = availableBeds;
    if (totalICUBeds !== null) update.icuTotal = totalICUBeds;
    if (availableICUBeds !== null) update.icuAvail = availableICUBeds;
    return hospitalRepository.update(id, update);
  }

  async updateHospitalStatus(id, status) {
    if (!status) throw httpError(400, 'MISSING_STATUS', 'Status field is required.');
    const value = String(status).toLowerCase().trim();
    if (!['active', 'accepting', 'limited', 'full', 'diverting', 'unknown'].includes(value)) throw httpError(400, 'INVALID_STATUS', 'Status must be active, accepting, limited, full, diverting or unknown.');
    return this.updateHospital(id, { status: value });
  }

  async updateAvailability(id, payload, user) {
    await this.getHospitalById(id);
    const role = String(user?.role || '').toLowerCase();
    const assignedIds = (user?.hospitalIds || []).map(String);
    if (role !== 'admin' && (role !== 'hospital_admin' || !assignedIds.includes(String(id)))) {
      throw httpError(403, 'HOSPITAL_SCOPE_FORBIDDEN', 'Hospital administrators may update only a hospital assigned to their account.');
    }
    if (!payload.source?.trim()) throw httpError(400, 'AVAILABILITY_SOURCE_REQUIRED', 'A source for this availability update is required.');
    const availability = {};
    for (const field of ['beds', 'icuBeds', 'oxygen', 'ambulances']) availability[field] = validateCount(payload[field], field);
    const status = payload.emergencyStatus ? String(payload.emergencyStatus).toLowerCase() : null;
    if (status && !['accepting', 'limited', 'full', 'diverting'].includes(status)) throw httpError(400, 'INVALID_EMERGENCY_STATUS', 'Emergency status must be accepting, limited, full or diverting.');
    availability.emergencyStatus = status;
    availability.updatedAt = new Date();
    availability.updatedBy = user?._id || user?.id || null;
    availability.source = payload.source.trim();
    return hospitalRepository.updateAvailability(id, availability);
  }

  async deleteHospital(id) {
    await this.getHospitalById(id);
    if (!await hospitalRepository.delete(id)) throw httpError(500, 'HOSPITAL_DELETE_FAILED', `Could not delete hospital '${id}'.`);
    return { id, message: `Hospital '${id}' deleted successfully.` };
  }
}

export const hospitalService = new HospitalService();
export default hospitalService;
