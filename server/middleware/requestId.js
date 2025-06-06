/**
 * Request ID Middleware - Production Ready
 * Generates unique request IDs for tracing and logging
 * @module middleware/requestId
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Request ID middleware
 * Assigns unique ID to each request for tracing
 */
const requestId = (req, res, next) => {
  // Generate or use existing request ID
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  
  // Set response header for client tracking
  res.setHeader('x-request-id', req.id);
  
  // Add request start time for performance tracking
  req.startTime = Date.now();
  
  // Enhanced logger with request context
  req.log = {
    info: (message, meta = {}) => {
      logger.info(message, { 
        requestId: req.id, 
        method: req.method,
        url: req.url,
        ...meta 
      });
    },
    
    error: (message, error, meta = {}) => {
      logger.error(message, { 
        requestId: req.id,
        method: req.method,
        url: req.url,
        error: error?.message || error,
        stack: error?.stack,
        ...meta 
      });
    },
    
    warn: (message, meta = {}) => {
      logger.warn(message, { 
        requestId: req.id,
        method: req.method,
        url: req.url,
        ...meta 
      });
    },
    
    debug: (message, meta = {}) => {
      logger.debug(message, { 
        requestId: req.id,
        method: req.method,
        url: req.url,
        ...meta 
      });
    }
  };
  
  // Log request start
  req.log.info('Request started', {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentLength: req.get('content-length')
  });
  
  // Track response completion
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    req.log.info('Request completed', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
  });
  
  next();
};

module.exports = requestId;