import authService from '../services/authService.js';
import { successResponse } from '../utils/apiResponse.js';

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

export default {
  register,
  login,
  getMe,
};
