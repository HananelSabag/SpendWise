/**
 * 🛡️ ENHANCED SECURITY MIDDLEWARE
 * Comprehensive protection against modern attack vectors
 * @module middleware/security
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss');
const logger = require('../utils/logger');

/**
 * 🚨 BUFFER OVERFLOW PROTECTION
 * Prevents large payloads from crashing the server
 */
const bufferOverflowProtection = {
  // JSON payload limiter
  jsonLimiter: (req, res, next) => {
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
      logger.warn('🚨 SECURITY ALERT: Oversized request blocked', {
        ip: req.ip,
        size: req.headers['content-length'],
        userAgent: req.get('user-agent'),
        endpoint: req.path
      });
      
      return res.status(413).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload too large',
          maxSize: `${maxSize / (1024 * 1024)}MB`
        }
      });
    }
    
    next();
  },
  
  // Request complexity limiter  
  complexityLimiter: (req, res, next) => {
    const complexity = JSON.stringify(req.body || {}).length;
    const maxComplexity = 50000; // 50KB JSON complexity
    
    if (complexity > maxComplexity) {
      logger.warn('🚨 SECURITY ALERT: Complex request blocked', {
        ip: req.ip,
        complexity,
        userAgent: req.get('user-agent'),
        endpoint: req.path
      });
      
      return res.status(413).json({
        error: {
          code: 'REQUEST_TOO_COMPLEX',
          message: 'Request structure too complex'
        }
      });
    }
    
    next();
  }
};

/**
 * 🔒 ENHANCED INPUT SANITIZATION
 * Prevents XSS, SQL injection, and NoSQL injection attacks
 */
const inputSanitization = {
  // XSS protection
  xssProtection: (req, res, next) => {
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        return xss(value, {
          whiteList: {}, // No HTML allowed
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script', 'style'],
          css: false
        });
      }
      
      if (typeof value === 'object' && value !== null) {
        for (const key in value) {
          value[key] = sanitizeValue(value[key]);
        }
      }
      
      return value;
    };
    
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }
    
    next();
  },
  
  // SQL injection prevention
  sqlInjectionProtection: (req, res, next) => {
    const checkForSQLInjection = (value) => {
      if (typeof value !== 'string') return false;
      
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(--|#|\/\*|\*\/)/g,
        /('|(\\)|(;)|(,)|(\|)|(\*)|(%)|(<)|(>)|(\?)|(\[)|(\]))/g
      ];
      
      return sqlPatterns.some(pattern => pattern.test(value));
    };
    
    const scanObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string' && checkForSQLInjection(obj[key])) {
          return true;
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (scanObject(obj[key])) return true;
        }
      }
      return false;
    };
    
    // Check request body and query for SQL injection
    if ((req.body && scanObject(req.body)) || (req.query && scanObject(req.query))) {
      logger.warn('🚨 SECURITY ALERT: SQL injection attempt blocked', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        error: {
          code: 'MALICIOUS_INPUT',
          message: 'Invalid characters detected in request'
        }
      });
    }
    
    next();
  },
  
  // NoSQL injection prevention
  noSQLInjectionProtection: (req, res, next) => {
    const forbidden = ['$where', '$ne', '$gt', '$lt', '$regex', '$eval', '$expr', '$jsonSchema'];
    const requestStr = JSON.stringify({ body: req.body, query: req.query });
    
    if (forbidden.some(op => requestStr.includes(op))) {
      logger.warn('🚨 SECURITY ALERT: NoSQL injection attempt blocked', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path
      });
      
      return res.status(400).json({
        error: {
          code: 'MALICIOUS_INPUT',
          message: 'Invalid operators detected in request'
        }
      });
    }
    
    next();
  }
};

/**
 * 🚦 PRODUCTION-GRADE RATE LIMITING
 * Enhanced rate limiting for different endpoint types
 */
const enhancedRateLimiting = {
  // Strict API limiter for production
  strictApiLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 requests per 15 minutes (much stricter)
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: '15 minutes'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1'
    // Note: onLimitReached removed - deprecated in express-rate-limit v7
  }),
  
  // Ultra-strict auth limiter
  ultraStrictAuthLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Only 3 attempts per hour
    skipSuccessfulRequests: true,
    message: {
      error: {
        code: 'AUTH_RATE_LIMIT',
        message: 'Too many authentication attempts. Try again in 1 hour.',
        retryAfter: '1 hour'
      }
    }
    // Note: onLimitReached removed - deprecated in express-rate-limit v7
  }),
  
  // Export protection limiter
  exportLimiter: rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3, // Only 3 exports per day
    message: {
      error: {
        code: 'EXPORT_LIMIT',
        message: 'Daily export limit reached. Please try again tomorrow.',
        retryAfter: '24 hours'
      }
    },
    keyGenerator: (req) => `export_${req.user?.id || req.ip}`
    // Note: onLimitReached removed - deprecated in express-rate-limit v7
  }),
  
  // Suspicious activity detector
  suspiciousActivityLimiter: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1, // 1 request per minute for certain sensitive endpoints
    skipFailedRequests: false,
    message: {
      error: {
        code: 'SUSPICIOUS_ACTIVITY',
        message: 'Suspicious activity detected. Access temporarily restricted.',
        retryAfter: '1 minute'
      }
    }
    // Note: onLimitReached removed - deprecated in express-rate-limit v7
  })
};

/**
 * 🛡️ ADVANCED SECURITY HEADERS
 * Comprehensive security headers for production
 */
const advancedSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.spendwise.com"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
  hidePoweredBy: true,
  dnsPrefetchControl: true
});

/**
 * 🔍 REQUEST FINGERPRINTING
 * Track suspicious patterns and potential attacks
 */
const requestFingerprinting = (req, res, next) => {
  const fingerprint = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    acceptLanguage: req.get('accept-language'),
    acceptEncoding: req.get('accept-encoding'),
    contentType: req.get('content-type'),
    timestamp: Date.now(),
    endpoint: req.path,
    method: req.method
  };
  
  // Store fingerprint for analysis
  req.securityFingerprint = fingerprint;
  
  // Basic suspicious pattern detection
  const suspiciousPatterns = [
    // Automated tools
    /postman/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /burp/i,
    /zap/i,
    /sqlmap/i,
    /nikto/i,
    
    // Security scanners
    /nessus/i,
    /openvas/i,
    /acunetix/i,
    /nmap/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(fingerprint.userAgent || '')
  );
  
  if (isSuspicious) {
    logger.warn('🚨 SUSPICIOUS REQUEST PATTERN DETECTED', {
      ...fingerprint,
      severity: 'MEDIUM',
      reason: 'Automated tool detected in User-Agent'
    });
    
    // Add delay for suspicious requests
    setTimeout(() => next(), 2000); // 2 second delay
  } else {
    next();
  }
};

/**
 * 🛠️ SECURITY MIDDLEWARE COMPOSER
 * Combines all security measures into easy-to-use middleware
 */
const securityMiddleware = {
  // Basic security for all routes
  basic: [
    advancedSecurityHeaders,
    bufferOverflowProtection.jsonLimiter,
    bufferOverflowProtection.complexityLimiter,
    requestFingerprinting,
    inputSanitization.xssProtection,
    inputSanitization.sqlInjectionProtection,
    inputSanitization.noSQLInjectionProtection
  ],
  
  // Enhanced security for API routes
  api: [
    ...securityMiddleware.basic,
    enhancedRateLimiting.strictApiLimiter
  ],
  
  // Maximum security for auth routes
  auth: [
    ...securityMiddleware.basic,
    enhancedRateLimiting.ultraStrictAuthLimiter,
    enhancedRateLimiting.suspiciousActivityLimiter
  ],
  
  // Special protection for export routes
  export: [
    ...securityMiddleware.basic,
    enhancedRateLimiting.exportLimiter
  ],
  
  // Critical endpoint protection
  critical: [
    ...securityMiddleware.basic,
    enhancedRateLimiting.suspiciousActivityLimiter
  ]
};

module.exports = {
  securityMiddleware,
  bufferOverflowProtection,
  inputSanitization,
  enhancedRateLimiting,
  advancedSecurityHeaders,
  requestFingerprinting
}; 