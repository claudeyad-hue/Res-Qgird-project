import { errorResponse } from '../utils/apiResponse.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication required for this operation.',
        errorCode: 'UNAUTHORIZED',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

    // Admin has full access to all roles
    if (userRole === 'admin' || normalizedAllowedRoles.includes(userRole)) {
      return next();
    }

    return errorResponse(res, {
      statusCode: 403,
      message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
      errorCode: 'FORBIDDEN',
    });
  };
}

export default {
  authorize,
};
