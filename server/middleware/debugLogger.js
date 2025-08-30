/**
 * 🔍 COMPREHENSIVE DEBUG LOGGER - Production Safe
 * Advanced debugging and monitoring for all server operations
 * @module middleware/debugLogger
 * @version 1.0.0 - COMPREHENSIVE DEBUGGING
 */

const logger = require('../utils/logger');
const { LRUCache } = require('lru-cache');

// Request tracking cache for duplicate detection
const requestTracker = new LRUCache({
  max: 10000,
  ttl: 5 * 60 * 1000, // 5 minutes TTL
});

// Performance metrics tracking
const performanceTracker = new LRUCache({
  max: 1000,
  ttl: 60 * 60 * 1000, // 1 hour TTL
});

// Error frequency tracking for spam detection
const errorTracker = new LRUCache({
  max: 5000,
  ttl: 10 * 60 * 1000, // 10 minutes TTL
});

/**
 * 🔍 Comprehensive Request Debug Middleware
 * Logs every aspect of requests for debugging and monitoring
 */
const debugLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.id;
  
  // Enhanced request info gathering
  const requestInfo = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    origin: req.headers.origin,
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
    authorization: req.get('authorization') ? '[TOKEN PROVIDED]' : '[NO TOKEN]',
    cookies: Object.keys(req.cookies || {}).length > 0 ? '[COOKIES PRESENT]' : '[NO COOKIES]',
    forwardedFor: req.get('x-forwarded-for'),
    realIp: req.get('x-real-ip'),
    protocol: req.protocol,
    secure: req.secure,
    xhr: req.xhr
  };

  // User context if available
  if (req.user) {
    requestInfo.userId = req.user.id;
    requestInfo.userRole = req.user.role;
    requestInfo.userEmail = req.user.email?.replace(/(.{2}).*(@.*)/, '$1***$2'); // Partially mask email
  }

  // Duplicate request detection
  const requestSignature = `${req.method}:${req.path}:${req.ip}:${req.user?.id || 'anonymous'}`;
  const lastRequest = requestTracker.get(requestSignature);
  const isDuplicate = lastRequest && (startTime - lastRequest) < 1000; // Within 1 second
  
  if (isDuplicate) {
    requestInfo.duplicateDetected = true;
    requestInfo.timeSinceLastRequest = `${startTime - lastRequest}ms`;
  }
  
  requestTracker.set(requestSignature, startTime);

  // Log detailed request start
  logger.info('🔍 REQUEST STARTED', requestInfo);

  // Special logging for critical paths
  if (req.path.includes('/auth') || req.path.includes('/login') || req.path.includes('/google')) {
    logger.info('🔐 AUTH REQUEST DETECTED', {
      requestId,
      authPath: req.path,
      hasToken: !!req.get('authorization'),
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  }

  // Log body for POST/PUT requests (safely)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const safeBody = sanitizeRequestBody(req.body);
    logger.debug('📝 REQUEST BODY', {
      requestId,
      body: safeBody,
      bodySize: JSON.stringify(req.body).length
    });
  }

  // Enhanced response tracking
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody = null;
  let responseSize = 0;

  // Intercept response to log it
  res.send = function(data) {
    responseBody = data;
    responseSize = Buffer.byteLength(data || '', 'utf8');
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    responseBody = data;
    responseSize = Buffer.byteLength(JSON.stringify(data || {}), 'utf8');
    return originalJson.call(this, data);
  };

  // Track response completion
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const responseInfo = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: `${responseSize} bytes`,
      userId: req.user?.id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    };

    // Performance warning for slow requests
    if (duration > 5000) {
      responseInfo.performanceWarning = 'SLOW_REQUEST';
      logger.warn('⚠️ SLOW REQUEST DETECTED', responseInfo);
    }

    // Error tracking and spam detection
    if (res.statusCode >= 400) {
      const errorKey = `${req.ip}:${res.statusCode}`;
      const errorCount = errorTracker.get(errorKey) || 0;
      errorTracker.set(errorKey, errorCount + 1);
      
      if (errorCount > 10) {
        responseInfo.spamWarning = 'HIGH_ERROR_FREQUENCY';
        logger.warn('🚨 POTENTIAL SPAM/ATTACK DETECTED', {
          ...responseInfo,
          errorCount: errorCount + 1,
          ip: req.ip
        });
      }

      // Log error responses with more detail
      if (responseBody && typeof responseBody === 'object') {
        responseInfo.errorDetails = {
          code: responseBody.error?.code,
          message: responseBody.error?.message
        };
      }
      
      logger.error('❌ ERROR RESPONSE', responseInfo);
    } else {
      logger.info('✅ REQUEST COMPLETED', responseInfo);
    }

    // Update performance tracking
    updatePerformanceMetrics(req.path, duration, res.statusCode);
  });

  // Track request errors/timeouts
  res.on('close', () => {
    if (!res.finished) {
      logger.warn('🔌 REQUEST CLOSED UNEXPECTEDLY', {
        requestId,
        method: req.method,
        url: req.url,
        duration: `${Date.now() - startTime}ms`,
        userId: req.user?.id
      });
    }
  });

  next();
};

/**
 * 🧹 Sanitize request body for safe logging
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = [
    'password', 'password_hash', 'token', 'refreshToken', 'accessToken',
    'authorization', 'credit_card', 'ccv', 'ssn', 'api_key',
    'client_secret', 'private_key'
  ];
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(body)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * 📊 Update performance metrics
 */
function updatePerformanceMetrics(path, duration, statusCode) {
  const key = `perf:${path}`;
  const existing = performanceTracker.get(key) || {
    count: 0,
    totalDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,
    errorCount: 0,
    successCount: 0
  };
  
  existing.count++;
  existing.totalDuration += duration;
  existing.maxDuration = Math.max(existing.maxDuration, duration);
  existing.minDuration = Math.min(existing.minDuration, duration);
  
  if (statusCode >= 400) {
    existing.errorCount++;
  } else {
    existing.successCount++;
  }
  
  existing.avgDuration = existing.totalDuration / existing.count;
  existing.errorRate = (existing.errorCount / existing.count) * 100;
  
  performanceTracker.set(key, existing);
}

/**
 * 🔐 Google OAuth Specific Debug Middleware
 */
const googleOAuthDebugger = (req, res, next) => {
  if (req.path.includes('/google') || req.path.includes('/oauth')) {
    logger.info('🔍 GOOGLE OAUTH REQUEST', {
      requestId: req.id,
      path: req.path,
      method: req.method,
      query: req.query,
      hasCode: !!req.query.code,
      hasState: !!req.query.state,
      hasError: !!req.query.error,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      referer: req.get('referer')
    });
    
    if (req.query.error) {
      logger.error('🚨 GOOGLE OAUTH ERROR', {
        requestId: req.id,
        error: req.query.error,
        errorDescription: req.query.error_description,
        state: req.query.state
      });
    }
  }
  
  next();
};

/**
 * 📊 Get debug statistics
 */
const getDebugStats = () => {
  const stats = {
    requestTracker: {
      size: requestTracker.size,
      calculatedSize: requestTracker.calculatedSize
    },
    performanceTracker: {
      size: performanceTracker.size,
      calculatedSize: performanceTracker.calculatedSize
    },
    errorTracker: {
      size: errorTracker.size,
      calculatedSize: errorTracker.calculatedSize
    }
  };
  
  // Get top performance metrics
  const performanceMetrics = {};
  for (const [key, value] of performanceTracker.entryCache) {
    if (key.startsWith('perf:')) {
      const path = key.replace('perf:', '');
      performanceMetrics[path] = value;
    }
  }
  
  stats.topPerformanceMetrics = Object.entries(performanceMetrics)
    .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
    .slice(0, 10)
    .reduce((obj, [key, value]) => {
      obj[key] = {
        avgDuration: Math.round(value.avgDuration),
        count: value.count,
        errorRate: Math.round(value.errorRate)
      };
      return obj;
    }, {});
  
  return stats;
};

/**
 * 🧹 Clear debug caches (for maintenance)
 */
const clearDebugCaches = () => {
  requestTracker.clear();
  performanceTracker.clear();
  errorTracker.clear();
  logger.info('🧹 Debug caches cleared');
};

module.exports = {
  debugLogger,
  googleOAuthDebugger,
  getDebugStats,
  clearDebugCaches
};
