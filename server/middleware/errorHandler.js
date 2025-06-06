/**
 * Error Handler Middleware - Production Ready
 * Centralized error handling with user-friendly messages
 * @module middleware/errorHandler
 */

const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

/**
 * Production-safe error messages
 */
const productionErrors = {
  // Database errors
  '23505': {
    code: 'ALREADY_EXISTS',
    message: 'This record already exists',
    status: 409
  },
  '23503': {
    code: 'INVALID_REFERENCE',
    message: 'Invalid reference to related data',
    status: 400
  },
  '23502': {
    code: 'MISSING_REQUIRED',
    message: 'Required field is missing',
    status: 400
  },
  '22P02': {
    code: 'INVALID_INPUT',
    message: 'Invalid input format',
    status: 400
  },
  // JWT errors
  'JsonWebTokenError': {
    code: 'INVALID_TOKEN',
    message: 'Invalid authentication token',
    status: 401
  },
  'TokenExpiredError': {
    code: 'TOKEN_EXPIRED',
    message: 'Authentication token expired',
    status: 401
  },
  'NotBeforeError': {
    code: 'TOKEN_NOT_ACTIVE',
    message: 'Token not active yet',
    status: 401
  }
};

/**
 * Format error response for production
 */
const formatError = (err, isDevelopment = false) => {
  // Check if it's a known error code
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
  if (err.code && productionErrors[err.code]) {
    const prodError = productionErrors[err.code];
    return {
      error: {
        code: prodError.code,
        message: prodError.message,
        timestamp: new Date().toISOString()
      }
    };
  }

  // JWT errors
  if (err.name && productionErrors[err.name]) {
    const prodError = productionErrors[err.name];
    return {
      error: {
        code: prodError.code,
        message: prodError.message,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: isDevelopment ? err.details : undefined,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Default error (hide details in production)
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? (err.message || 'An unexpected error occurred') : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Check if response was already sent
  if (res.headersSent) {
    return next(err);
  }

  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Log error with appropriate detail level
  logger.logError(err, req, {
    body: isDevelopment ? req.body : undefined,
    query: isDevelopment ? req.query : undefined,
    params: isDevelopment ? req.params : undefined
  });

  // Determine status code
  let status = err.status || err.statusCode || 500;
  
  // Map error codes to status
  if (err.code) {
    const errorDef = Object.values(errorCodes).find(ec => ec.code === err.code);
    if (errorDef) {
      status = errorDef.status;
    } else if (productionErrors[err.code]) {
      status = productionErrors[err.code].status;
    }
  } else if (err.name && productionErrors[err.name]) {
    status = productionErrors[err.name].status;
  }

  // Special handling for specific errors
  if (err.name === 'CastError') {
    status = 400;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
  }

  // Send response
  res.status(status).json(formatError(err, isDevelopment));
};

/**
 * Async handler wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Add request start time for response time logging
  req.startTime = Date.now();
  
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Not found handler
 */
const notFound = (req, res) => {
  logger.info('404 Not Found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: {
        code: 'CORS_ERROR',
        message: 'Cross-origin request blocked',
        timestamp: new Date().toISOString()
      }
    });
  }
  next(err);
};

module.exports = { 
  errorHandler, 
  asyncHandler, 
  notFound,
  corsErrorHandler
};