/**
 * Enhanced Error Handler Middleware
 * Centralized error handling with logging
 * @module middleware/errorHandler
 */

const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

/**
 * Format error response
 */
const formatError = (err) => {
  // Known error codes
  if (err.code && Object.values(errorCodes).some(ec => ec.code === err.code)) {
    return {
      error: {
        code: err.code,
        message: err.message || err.details,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Database errors
  if (err.code === '23505') { // Unique violation
    return {
      error: {
        code: 'ALREADY_EXISTS',
        message: 'This record already exists',
        field: err.detail?.match(/Key \((.*?)\)/)?.[1] || 'unknown',
        timestamp: new Date().toISOString()
      }
    };
  }

  if (err.code === '23503') { // Foreign key violation
    return {
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Invalid reference to related data',
        timestamp: new Date().toISOString()
      }
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return {
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        timestamp: new Date().toISOString()
      }
    };
  }

  if (err.name === 'TokenExpiredError') {
    return {
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token expired',
        timestamp: new Date().toISOString()
      }
    };
  }

  // Default error
  return {
    error: {
      code: 'UNKNOWN_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Request error:', {
    error: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?.id || 'anonymous'
  });

  // Determine status code
  let status = err.status || 500;
  
  // Map error codes to status
  if (err.code) {
    const errorDef = Object.values(errorCodes).find(ec => ec.code === err.code);
    if (errorDef) {
      status = errorDef.status;
    }
  }

  // Send response
  res.status(status).json(formatError(err));
};

/**
 * Async handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Not found handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = { errorHandler, asyncHandler, notFound };