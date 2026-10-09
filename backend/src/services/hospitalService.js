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
    await this.getHospitalById(id);

    if (payload.latitude !== undefined || payload.longitude !== undefined) {
      const lat = parseFloat(payload.latitude);
      const lng = parseFloat(payload.longitude);
      const geoCheck = validateCoordinates({ latitude: lat, longitude: lng });
      if (!geoCheck.insideArea) {
        const err = new Error(geoCheck.error || 'Updated coordinates fall outside the operational area (Ghaziabad).');
        err.statusCode = 400;
        err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
        throw err;
      }
    }

    return hospitalRepository.update(id, payload);
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
