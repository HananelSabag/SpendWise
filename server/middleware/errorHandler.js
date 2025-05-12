// middleware/errorHandler.js

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response format
 * @param {Error} err - Error object
 * @param {string} errorCode - Error code for client
 * @returns {Object} Formatted error response
 */
const formatError = (err, errorCode = 'unknown_error') => ({
  error: errorCode,
  message: err.message || 'An unexpected error occurred',
  ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
});

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    code: err.errorCode,
    message: err.message,
    stack: err.stack,
    path: req.path
  });

  // Handle known error types
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(formatError(err, err.errorCode));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(formatError(err, 'invalid_token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(formatError(err, 'token_expired'));
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json(formatError(err, 'validation_error'));
  }

  // Handle database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json(formatError(
      new Error('This record already exists'),
      'duplicate_record'
    ));
  }

  // Handle rate limit errors
  if (err.type === 'rate_limit_exceeded') {
    return res.status(429).json(formatError(err, 'rate_limit_exceeded'));
  }

  // Default server error
  res.status(500).json(formatError(
    new Error('An unexpected error occurred. Please try again later'),
    'server_error'
  ));
};

module.exports = { AppError, errorHandler };