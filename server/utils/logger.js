/**
 * Logger Configuration - Production Ready
 * Centralized logging with appropriate levels for production
 * @module utils/logger
 */

const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path'); // Added for log directory

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      // Filter sensitive data in development logs
      const safeMetadata = filterSensitiveData(metadata);
      msg += ` ${JSON.stringify(safeMetadata)}`;
    }
    return msg;
  })
);

// Filter sensitive data from logs
function filterSensitiveData(obj) {
  const sensitiveKeys = ['password', 'password_hash', 'token', 'refreshToken', 'accessToken', 
                         'authorization', 'cookie', 'credit_card', 'ssn', 'api_key', 'email']; // Added email for privacy
  
  const filtered = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !(value instanceof Error)) { // Don't filter Error objects
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
}

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { 
    service: 'spendwise-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file (rotated daily)
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      zippedArchive: true
    }),
    // Combined log file (rotated daily)
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' // Less verbose in production
    })
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  }));
} else {
  // Minimal console logging in production
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: 'error' // Only errors to console in production
  }));
}

// Production performance: don't log debug in production
if (process.env.NODE_ENV === 'production') {
  logger.level = 'info';
}

// Create a child logger for specific modules
logger.child = (metadata) => {
  return winston.createLogger({
    level: logger.level,
    format: logFormat,
    defaultMeta: { ...logger.defaultMeta, ...metadata },
    transports: logger.transports
  });
};

// Utility methods for structured logging
logger.logRequest = (req, additionalData = {}) => {
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.id,
    userId: req.user?.id,
    ...additionalData
  };
  
  // Less verbose in production
  if (process.env.NODE_ENV === 'production') {
    delete logData.userAgent;
  }
  
  logger.info('HTTP Request', logData);
};

logger.logResponse = (req, res, additionalData = {}) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    requestId: req.id,
    userId: req.user?.id,
    responseTime: Date.now() - req.startTime,
    ...additionalData
  };
  
  // Only log non-200 responses in production
  if (process.env.NODE_ENV === 'production' && res.statusCode >= 200 && res.statusCode < 300) {
    return;
  }
  
  logger.info('HTTP Response', logData);
};

logger.logError = (error, req = null, additionalData = {}) => {
  const errorData = {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode || error.status,
    ...additionalData
  };

  // Only include stack trace in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    errorData.stack = error.stack;
  }

  if (req) {
    errorData.method = req.method;
    errorData.url = req.url;
    errorData.requestId = req.id;
    errorData.userId = req.user?.id;
  }

  logger.error('Application Error', errorData);
};

module.exports = logger;