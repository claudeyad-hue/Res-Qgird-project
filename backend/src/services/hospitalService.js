// Hospital Service
// Implements business logic and dynamic nearest hospital triage.
import hospitalRepository from '../repositories/hospitalRepository.js';
import { validateCoordinates, isPointInOperationalArea, calculateDistance } from '../utils/geoUtils.js';

class HospitalService {
  async getHospitals(query = {}) {
    return hospitalRepository.findAll(query);
  }

  async getHospitalById(id) {
    const hospital = await hospitalRepository.findById(id);
    if (!hospital) {
      const err = new Error(`Hospital with ID '${id}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'HOSPITAL_NOT_FOUND';
      throw err;
    }
    return hospital;
  }

  /**
   * Phase G: Find Nearest Eligible Hospital
   * Validates coordinates, filters eligible hospitals in Ghaziabad,
   * excludes unavailable/closed hospitals, computes straight-line distance (Haversine),
   * and returns ranked list with nearest hospital.
   */
  async findNearestHospital({ latitude, longitude }) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      const err = new Error('Query parameters latitude and longitude must be valid numbers.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_COORDINATES';
      throw err;
    }

    const geoCheck = validateCoordinates({ latitude: lat, longitude: lng });
    if (!geoCheck.insideArea) {
      const err = new Error(geoCheck.error || 'Requested coordinates are outside the operational area (Ghaziabad).');
      err.statusCode = 400;
      err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
      throw err;
    }

    const { data: allHospitals } = await hospitalRepository.findAll({ limit: 100 });

    // Filter candidate hospitals in Ghaziabad and exclude unavailable/closed/diverting
    const eligible = allHospitals.filter((h) => {
      if (typeof h.latitude !== 'number' || typeof h.longitude !== 'number') return false;
      if (!isPointInOperationalArea({ latitude: h.latitude, longitude: h.longitude })) return false;

      const status = String(h.status || '').toLowerCase();
      if (status === 'unavailable' || status === 'closed' || status === 'diverting') {
        return false;
      }
      return true;
    });

    if (eligible.length === 0) {
      const err = new Error('No eligible operational hospitals available within the Ghaziabad boundary.');
      err.statusCode = 404;
      err.errorCode = 'NO_ELIGIBLE_HOSPITAL';
      throw err;
    }

    const scored = eligible.map((hospital) => {
      const distance = calculateDistance({ latitude: lat, longitude: lng }, hospital);
      return {
        hospital,
        distance,
        distanceUnit: 'km',
        distanceType: 'straight-line',
      };
    });

    // Sort ascending by straight-line distance
    scored.sort((a, b) => a.distance - b.distance);

    return {
      hospital: scored[0].hospital,
      distanceKm: scored[0].distance,
      distanceType: 'straight-line',
      distanceUnit: 'km',
      candidateCount: scored.length,
      origin: { latitude: lat, longitude: lng },
      candidates: scored.map((s) => ({
        id: s.hospital.id,
        name: s.hospital.name,
        distanceKm: s.distance,
        status: s.hospital.status,
      })),
    };
  }

  async createHospital(payload) {
    const totalBeds = Number(payload.totalBeds ?? payload.bedsTotal);
    const availableBeds = Number(payload.availableBeds ?? payload.bedsAvail);
    const totalICUBeds = Number(payload.totalICUBeds ?? payload.icuTotal);
    const availableICUBeds = Number(payload.availableICUBeds ?? payload.icuAvail);
    if ([totalBeds, availableBeds, totalICUBeds, availableICUBeds].some((value) => !Number.isFinite(value) || value < 0)) {
      const err = new Error('Bed capacity values must be non-negative numbers.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_BED_COUNTS';
      throw err;
    }
    if (availableBeds > totalBeds) {
      const err = new Error('Available beds cannot exceed total beds.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_BEDS_RANGE';
      throw err;
    }
    if (availableICUBeds > totalICUBeds) {
      const err = new Error('Available ICU beds cannot exceed total ICU beds.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_ICU_BEDS_RANGE';
      throw err;
    }

    const latitude = parseFloat(payload.latitude);
    const longitude = parseFloat(payload.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      const err = new Error('Valid latitude and longitude coordinates are required.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_COORDINATES';
      throw err;
    }

    const geoCheck = validateCoordinates({ latitude, longitude });
    if (!geoCheck.insideArea) {
      const err = new Error(geoCheck.error || 'Hospital coordinates fall outside the operational area (Ghaziabad).');
      err.statusCode = 400;
      err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
      throw err;
    }

    return hospitalRepository.create(payload);
  }

  async updateHospital(id, payload) {
    const existing = await this.getHospitalById(id);

    const totalBeds = Number(payload.totalBeds ?? payload.bedsTotal ?? existing.bedsTotal ?? existing.totalBeds);
    const availableBeds = Number(payload.availableBeds ?? payload.bedsAvail ?? existing.bedsAvail ?? existing.availableBeds);
    const totalICUBeds = Number(payload.totalICUBeds ?? payload.icuTotal ?? existing.icuTotal ?? existing.totalICUBeds);
    const availableICUBeds = Number(payload.availableICUBeds ?? payload.icuAvail ?? existing.icuAvail ?? existing.availableICUBeds);
    if ([totalBeds, availableBeds, totalICUBeds, availableICUBeds].some((value) => !Number.isFinite(value) || value < 0)) {
      const err = new Error('Bed capacity values must be non-negative numbers.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_BED_COUNTS';
      throw err;
    }
    if (availableBeds > totalBeds || availableICUBeds > totalICUBeds) {
      const err = new Error('Available beds cannot exceed total bed capacity.');
      err.statusCode = 400;
      err.errorCode = availableBeds > totalBeds ? 'INVALID_BEDS_RANGE' : 'INVALID_ICU_BEDS_RANGE';
      throw err;
    }

    if (payload.latitude !== undefined || payload.longitude !== undefined) {
      const lat = payload.latitude !== undefined ? parseFloat(payload.latitude) : existing.latitude;
      const lng = payload.longitude !== undefined ? parseFloat(payload.longitude) : existing.longitude;
      const geoCheck = validateCoordinates({ latitude: lat, longitude: lng });
      if (!geoCheck.insideArea) {
        const err = new Error(geoCheck.error || 'Updated coordinates fall outside the operational area (Ghaziabad).');
        err.statusCode = 400;
        err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
        throw err;
      }
    }

    return hospitalRepository.update(id, {
      ...payload,
      bedsTotal: totalBeds,
      bedsAvail: availableBeds,
      icuTotal: totalICUBeds,
      icuAvail: availableICUBeds,
    });
  }

  async updateHospitalStatus(id, status) {
    if (!status) {
      const err = new Error('Status field is required.');
      err.statusCode = 400;
      err.errorCode = 'MISSING_STATUS';
      throw err;
    }
    return this.updateHospital(id, { status });
  }

  async deleteHospital(id) {
    await this.getHospitalById(id);
    const deleted = await hospitalRepository.delete(id);
    if (!deleted) {
      const err = new Error(`Could not delete hospital '${id}'.`);
      err.statusCode = 500;
      throw err;
    }
    return { id, message: `Hospital '${id}' deleted successfully.` };
  }
}

export const hospitalService = new HospitalService();
export default hospitalService;
