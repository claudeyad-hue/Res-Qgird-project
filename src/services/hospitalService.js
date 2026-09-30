import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';

class HospitalService {
  async getHospitals(query = {}) {
    const {
      emergencyStatus,
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter = {};

    if (emergencyStatus) {
      filter.emergencyStatus = emergencyStatus.toLowerCase().trim();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { location: searchRegex },
        { hospitalCode: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ['createdAt', 'name', 'availableBeds', 'totalBeds', 'emergencyStatus', 'availableICUBeds'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const safeSortOrder = sortOrder === 'desc' || sortOrder === '-1' ? -1 : 1;

    const [data, total] = await Promise.all([
      Hospital.find(filter)
        .sort({ [safeSortBy]: safeSortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }),
      Hospital.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async getHospitalById(id) {
    let hospital = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      hospital = await Hospital.findById(id);
    }

    if (!hospital) {
      hospital = await Hospital.findOne({ hospitalCode: id });
    }

    if (!hospital) {
      const err = new Error(`Hospital with ID '${id}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'HOSPITAL_NOT_FOUND';
      throw err;
    }

    return hospital;
  }

  async createHospital(payload) {
    const totalBeds = Number(payload.totalBeds !== undefined ? payload.totalBeds : payload.bedsTotal);
    const availableBeds = Number(payload.availableBeds !== undefined ? payload.availableBeds : payload.bedsAvail);
    const totalICUBeds = Number(payload.totalICUBeds !== undefined ? payload.totalICUBeds : payload.icuTotal);
    const availableICUBeds = Number(payload.availableICUBeds !== undefined ? payload.availableICUBeds : payload.icuAvail);
    const latitude = parseFloat(payload.latitude);
    const longitude = parseFloat(payload.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      const err = new Error('Valid latitude and longitude coordinates are required.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_COORDINATES';
      throw err;
    }

    if ([totalBeds, availableBeds, totalICUBeds, availableICUBeds].some((v) => Number.isNaN(v) || v < 0)) {
      const err = new Error('All bed counts must be non-negative numbers.');
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

    const hospitalData = {
      name: payload.name,
      location: payload.location,
      latitude,
      longitude,
      contact: payload.contact,
      totalBeds,
      availableBeds,
      totalICUBeds,
      availableICUBeds,
      emergencyStatus: (payload.emergencyStatus || payload.status || 'active').toLowerCase(),
      ambulances: parseInt(payload.ambulances, 10) || 0,
    };

    if (payload.id && typeof payload.id === 'string' && payload.id.startsWith('HOSP-')) {
      hospitalData.hospitalCode = payload.id;
    }

    const hospital = await Hospital.create(hospitalData);
    return hospital;
  }

  async updateHospital(id, payload) {
    const hospital = await this.getHospitalById(id);

    const totalBeds = payload.totalBeds !== undefined
      ? Number(payload.totalBeds)
      : (payload.bedsTotal !== undefined ? Number(payload.bedsTotal) : hospital.totalBeds);

    const availableBeds = payload.availableBeds !== undefined
      ? Number(payload.availableBeds)
      : (payload.bedsAvail !== undefined ? Number(payload.bedsAvail) : hospital.availableBeds);

    const totalICUBeds = payload.totalICUBeds !== undefined
      ? Number(payload.totalICUBeds)
      : (payload.icuTotal !== undefined ? Number(payload.icuTotal) : hospital.totalICUBeds);

    const availableICUBeds = payload.availableICUBeds !== undefined
      ? Number(payload.availableICUBeds)
      : (payload.icuAvail !== undefined ? Number(payload.icuAvail) : hospital.availableICUBeds);

    if ([totalBeds, availableBeds, totalICUBeds, availableICUBeds].some((v) => Number.isNaN(v) || v < 0)) {
      const err = new Error('All bed counts must be non-negative numbers.');
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

    if (payload.name) hospital.name = payload.name;
    if (payload.location) hospital.location = payload.location;
    if (payload.contact) hospital.contact = payload.contact;
    if (payload.latitude !== undefined) hospital.latitude = parseFloat(payload.latitude);
    if (payload.longitude !== undefined) hospital.longitude = parseFloat(payload.longitude);
    if (payload.emergencyStatus) hospital.emergencyStatus = payload.emergencyStatus.toLowerCase();
    if (payload.status) hospital.emergencyStatus = payload.status.toLowerCase();
    if (payload.ambulances !== undefined) hospital.ambulances = parseInt(payload.ambulances, 10);

    hospital.totalBeds = totalBeds;
    hospital.availableBeds = availableBeds;
    hospital.totalICUBeds = totalICUBeds;
    hospital.availableICUBeds = availableICUBeds;

    await hospital.save();
    return hospital;
  }

  async updateHospitalStatus(id, newStatus) {
    if (!newStatus) {
      const err = new Error('Status field is required.');
      err.statusCode = 400;
      err.errorCode = 'STATUS_REQUIRED';
      throw err;
    }

    const hospital = await this.getHospitalById(id);
    const validStatuses = ['active', 'accepting', 'limited', 'full', 'diverting'];
    const s = newStatus.toLowerCase().trim();

    if (!validStatuses.includes(s)) {
      const err = new Error(`Invalid status '${newStatus}'. Allowed: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_STATUS';
      throw err;
    }

    hospital.emergencyStatus = s;
    await hospital.save();
    return hospital;
  }

  async deleteHospital(id) {
    const hospital = await this.getHospitalById(id);
    await Hospital.findByIdAndDelete(hospital._id);
    return { id: hospital.id, message: `Hospital ${hospital.id} deleted successfully.` };
  }
}

export const hospitalService = new HospitalService();
export default hospitalService;
