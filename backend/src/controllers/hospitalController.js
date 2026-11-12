import hospitalService from '../services/hospitalService.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export async function getHospitals(req, res, next) {
  try {
    const result = await hospitalService.getHospitals(req.query);
    return paginatedResponse(res, {
      statusCode: 200,
      message: 'Hospitals fetched successfully',
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getNearestHospital(req, res, next) {
  try {
    const { latitude, longitude } = req.query;
    const result = await hospitalService.findNearestHospital({ latitude, longitude });
    return successResponse(res, {
      statusCode: 200,
      message: 'Nearest eligible hospital retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getHospitalById(req, res, next) {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id);
    return successResponse(res, {
      statusCode: 200,
      message: 'Hospital fetched successfully',
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
}

export async function createHospital(req, res, next) {
  try {
    const hospital = await hospitalService.createHospital(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Hospital registered successfully',
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateHospital(req, res, next) {
  try {
    const hospital = await hospitalService.updateHospital(req.params.id, req.body);
    return successResponse(res, {
      statusCode: 200,
      message: 'Hospital updated successfully',
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateHospitalStatus(req, res, next) {
  try {
    const status = req.body.status || req.body.emergencyStatus;
    const hospital = await hospitalService.updateAvailability(req.params.id, {
      emergencyStatus: status,
      source: req.body.source,
    }, req.user);
    return successResponse(res, {
      statusCode: 200,
      message: 'Hospital emergency status recorded with source and timestamp.',
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateHospitalAvailability(req, res, next) {
  try {
    const hospital = await hospitalService.updateAvailability(req.params.id, req.body, req.user);
    return successResponse(res, {
      statusCode: 200,
      message: 'Hospital availability update recorded with source and timestamp.',
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteHospital(req, res, next) {
  try {
    const result = await hospitalService.deleteHospital(req.params.id);
    return successResponse(res, {
      statusCode: 200,
      message: result.message,
      data: { id: result.id },
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getHospitals,
  getNearestHospital,
  getHospitalById,
  createHospital,
  updateHospital,
  updateHospitalStatus,
  updateHospitalAvailability,
  deleteHospital,
};
