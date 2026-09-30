import { verifyToken } from '../utils/generateToken.js';
import User from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

export async function protect(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Access denied. No authentication token provided.',
      errorCode: 'UNAUTHORIZED',
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id || decoded.userId).select('-password');

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'The user associated with this token no longer exists.',
        errorCode: 'UNAUTHORIZED_USER_NOT_FOUND',
      });
    }

    if (!user.isActive) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Your account has been deactivated.',
        errorCode: 'ACCOUNT_DEACTIVATED',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication token has expired. Please sign in again.',
        errorCode: 'TOKEN_EXPIRED',
      });
    }
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid authentication token.',
      errorCode: 'INVALID_TOKEN',
    });
  }
}

export async function optionalProtect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id || decoded.userId).select('-password');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Silently continue for optional auth
  }
  next();
}

export default {
  protect,
  optionalProtect,
};
