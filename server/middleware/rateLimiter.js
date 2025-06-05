/**
 * Rate Limiter Middleware
 * Protects API from abuse
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again in a minute',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth endpoints limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Too many authentication attempts, please try again later',
      retryAfter: 900
    }
  },
  skipSuccessfulRequests: true
});

// Transaction creation limiter
const createTransactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    error: {
      code: 'TRANSACTION_LIMIT',
      message: 'Too many transactions created, please slow down',
      retryAfter: 60
    }
  }
});

// Dashboard/summary limiter
const getSummaryLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5,
  message: {
    error: {
      code: 'SUMMARY_LIMIT',
      message: 'Too many summary requests, please wait',
      retryAfter: 10
    }
  }
});

// General GET requests limiter
const getTransactionsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  message: {
    error: {
      code: 'QUERY_LIMIT',
      message: 'Too many queries, please try again later',
      retryAfter: 60
    }
  }
});

// Manual recurring generation limiter (strict)
const generateRecurringLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Only 3 manual generations per 5 minutes
  message: {
    error: {
      code: 'GENERATION_LIMIT',
      message: 'Too many manual generations. Please wait before trying again.',
      retryAfter: 300
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// NEW: Email verification limiter (prevent spam)
const emailVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 requests per 5 minutes
  message: {
    error: {
      code: 'VERIFICATION_LIMIT',
      message: 'Too many verification attempts, please try again later',
      retryAfter: 300
    }
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  createTransactionLimiter,
  getSummaryLimiter,
  getTransactionsLimiter,
  generateRecurringLimiter,
  emailVerificationLimiter // NEW: Add email verification limiter
};