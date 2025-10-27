/**
 * errorCodes.js
 * Centralized error code definitions for SpendWise
 * Exports all error codes with standard structure.
 *
 * Each code contains:
 *   code   - unique string identifier
 *   message - default message (can be overridden)
 *   status  - HTTP status code
 */

module.exports = {
  // --- General/Validation ---
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    status: 400
  },
  MISSING_REQUIRED: {
    code: 'MISSING_REQUIRED',
    message: 'Missing required fields',
    status: 400
  },
  INVALID_INPUT: {
    code: 'INVALID_INPUT',
    message: 'Invalid input provided',
    status: 400
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    status: 404
  },
  ALREADY_EXISTS: {
    code: 'ALREADY_EXISTS',
    message: 'Resource already exists',
    status: 409
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized access',
    status: 401
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Forbidden',
    status: 403
  },

  // --- Authentication ---
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    status: 401
  },
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Invalid authentication token',
    status: 401
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: 'Authentication token expired',
    status: 401
  },
  GOOGLE_ONLY_USER: {
    code: 'GOOGLE_ONLY_USER',
    message: 'This account uses Google sign-in. Please use the Google login button.',
    status: 400
  },
  PASSWORD_NOT_SET: {
    code: 'PASSWORD_NOT_SET',
    message: 'Password not set for this account. Please set a password in your profile or login with Google.',
    status: 400
  },
  EMAIL_NOT_VERIFIED: {
    code: 'EMAIL_NOT_VERIFIED',
    message: 'Please verify your email before logging in',
    status: 403
  },
  ACCOUNT_LOCKED: {
    code: 'ACCOUNT_LOCKED',
    message: 'Account is temporarily locked due to multiple failed login attempts',
    status: 403
  },
  ACCOUNT_DEACTIVATED: {
    code: 'ACCOUNT_DEACTIVATED',
    message: 'Account is deactivated. Please contact support.',
    status: 403
  },

  // --- Rate Limiting ---
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
    status: 429
  },
  AUTH_RATE_LIMIT: {
    code: 'AUTH_RATE_LIMIT',
    message: 'Too many authentication attempts, try again later',
    status: 429
  },
  TRANSACTION_LIMIT: {
    code: 'TRANSACTION_LIMIT',
    message: 'Too many transactions created, please slow down',
    status: 429
  },
  SUMMARY_LIMIT: {
    code: 'SUMMARY_LIMIT',
    message: 'Too many summary requests, please wait',
    status: 429
  },
  QUERY_LIMIT: {
    code: 'QUERY_LIMIT',
    message: 'Too many queries, please try again later',
    status: 429
  },

  // --- Database ---
  DB_ERROR: {
    code: 'DB_ERROR',
    message: 'Database error',
    status: 500
  },
  SQL_AMBIGUOUS_COLUMN: {
    code: 'SQL_AMBIGUOUS_COLUMN',
    message: 'Database query contains ambiguous column references',
    status: 500
  },
  CREATE_FAILED: {
    code: 'CREATE_FAILED',
    message: 'Failed to create resource',
    status: 500
  },
  UPDATE_FAILED: {
    code: 'UPDATE_FAILED',
    message: 'Failed to update resource',
    status: 500
  },
  DELETE_FAILED: {
    code: 'DELETE_FAILED',
    message: 'Failed to delete resource',
    status: 500
  },
  FETCH_FAILED: {
    code: 'FETCH_FAILED',
    message: 'Failed to fetch data',
    status: 500
  },
  SEARCH_FAILED: {
    code: 'SEARCH_FAILED',
    message: 'Failed to search data',
    status: 500
  },
  STATS_FAILED: {
    code: 'STATS_FAILED',
    message: 'Failed to fetch statistics',
    status: 500
  },
  SQL_ERROR: {
    code: 'SQL_ERROR',
    message: 'Database query error',
    status: 500
  },

  // --- Recurring ---
  INVALID_INTERVAL: {
    code: 'INVALID_INTERVAL',
    message: 'Invalid recurring interval. Must be daily, weekly, or monthly',
    status: 400
  },
  INVALID_DAY: {
    code: 'INVALID_DAY',
    message: 'Day of month must be between 1 and 31',
    status: 400
  },

  // --- Default fallback ---
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    status: 500
  },

  CATEGORY_IN_USE: {
    code: 'CATEGORY_IN_USE',
    message: 'Category is currently in use by transactions or templates',
    status: 400
  }
};
