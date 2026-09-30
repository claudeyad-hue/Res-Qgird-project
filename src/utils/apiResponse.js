/**
 * API Response Formatting Utilities
 * Standardizes responses across all endpoints according to the API contract.
 */

export function successResponse(res, { statusCode = 200, message = 'Operation successful', data = {} }) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function paginatedResponse(res, {
  statusCode = 200,
  message = 'Records fetched successfully',
  data = [],
  page = 1,
  limit = 20,
  total = 0,
}) {
  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages,
    },
  });
}

export function errorResponse(res, {
  statusCode = 500,
  message = 'Operation failed',
  errorCode = 'INTERNAL_ERROR',
  details = null,
}) {
  const payload = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
  };

  if (details) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
}

export default {
  successResponse,
  paginatedResponse,
  errorResponse,
};
