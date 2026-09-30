import env from '../config/env.js';

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || (res.statusCode !== 200 && res.statusCode !== 204 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let details = err.details || null;

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.value}`;
    errorCode = 'INVALID_ID';
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    errorCode = 'VALIDATION_ERROR';
    details = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
  }

  // Handle MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'record';
    const duplicatedValue = err.keyValue ? err.keyValue[duplicatedField] : '';
    message = `A record with this ${duplicatedField} ('${duplicatedValue}') already exists.`;
    errorCode = 'DUPLICATE_RECORD';
  }

  // Handle JWT errors if passed to error handler
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Fallback for uncaught 500
  if (statusCode === 500) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err);
    if (env.isProduction) {
      message = 'An unexpected internal server error occurred.';
    }
  }

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

  // Never expose stack trace in production
  if (!env.isProduction && err.stack) {
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

export default errorHandler;
