import authService from '../services/authService.js';
import { successResponse } from '../utils/apiResponse.js';
import User from '../models/User.js';
import hospitalService from '../services/hospitalService.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, role, phone, organization } = req.body;
    const result = await authService.registerUser({ name, email, password, role, phone, organization });
    return successResponse(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    return successResponse(res, {
      statusCode: 200,
      message: 'User logged in successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    return successResponse(res, {
      statusCode: 200,
      message: 'Current user profile fetched successfully',
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
}

export async function assignHospitalFacilities(req, res, next) {
  try {
    const { hospitalIds } = req.body;
    if (!Array.isArray(hospitalIds) || hospitalIds.some((id) => typeof id !== 'string')) {
      const error = new Error('hospitalIds must be an array of hospital IDs.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_HOSPITAL_ASSIGNMENT';
      throw error;
    }
    const account = await User.findById(req.params.userId);
    if (!account) {
      const error = new Error('User account was not found.');
      error.statusCode = 404;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }
    const uniqueIds = [...new Set(hospitalIds.map((id) => id.trim()).filter(Boolean))];
    for (const id of uniqueIds) await hospitalService.getHospitalById(id);
    if (account.role !== 'admin') account.role = uniqueIds.length ? 'hospital_admin' : 'viewer';
    account.hospitalIds = uniqueIds;
    await account.save();
    return successResponse(res, { statusCode: 200, message: 'Hospital administrator assignment updated.', data: account });
  } catch (error) {
    next(error);
  }
}

export default {
  register,
  login,
  getMe,
  assignHospitalFacilities,
};
