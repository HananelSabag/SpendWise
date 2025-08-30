/**
 * 🛣️ ROUTE-SPECIFIC LOGGING MIDDLEWARE
 * Detailed logging for specific routes and operations
 * @module middleware/routeLogger
 * @version 1.0.0
 */

const logger = require('../utils/logger');

/**
 * 🛣️ Route-specific operation logger
 */
const routeLogger = (routeName, operationDetails = {}) => {
  return (req, res, next) => {
    const requestId = req.id;
    const startTime = Date.now();
    
    // Log route entry
    logger.info(`🛣️ ROUTE ENTERED: ${routeName}`, {
      requestId,
      routeName,
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      userRole: req.user?.role,
      ip: req.ip,
      ...operationDetails
    });

    // Track route completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      const emoji = res.statusCode >= 400 ? '❌' : '✅';
      
      logger[logLevel](`${emoji} ROUTE COMPLETED: ${routeName}`, {
        requestId,
        routeName,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
        success: res.statusCode < 400
      });
    });

    next();
  };
};

/**
 * 🔐 Authentication operation logger
 */
const authLogger = (operation) => {
  return (req, res, next) => {
    logger.info(`🔐 AUTH OPERATION: ${operation}`, {
      requestId: req.id,
      operation,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      hasToken: !!req.get('authorization'),
      userId: req.user?.id
    });

    // Track auth results
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
      logAuthResult(operation, req, res, data);
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      logAuthResult(operation, req, res, data);
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * 📊 Database operation logger
 */
const dbOperationLogger = (operation, tableName) => {
  return (req, res, next) => {
    req.dbOperation = {
      operation,
      tableName,
      startTime: Date.now(),
      requestId: req.id
    };
    
    logger.debug(`📊 DB OPERATION START: ${operation}`, {
      requestId: req.id,
      operation,
      tableName,
      userId: req.user?.id,
      method: req.method,
      path: req.path
    });

    next();
  };
};

/**
 * 🔄 Transaction flow logger
 */
const transactionLogger = (operation) => {
  return (req, res, next) => {
    const transactionData = {
      operation,
      userId: req.user?.id,
      amount: req.body?.amount,
      type: req.body?.type,
      categoryId: req.body?.category_id,
      description: req.body?.description?.substring(0, 50) // First 50 chars only
    };

    logger.info(`💰 TRANSACTION OPERATION: ${operation}`, {
      requestId: req.id,
      ...transactionData,
      ip: req.ip
    });

    // Track transaction result
    res.on('finish', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        logger.info(`✅ TRANSACTION SUCCESS: ${operation}`, {
          requestId: req.id,
          ...transactionData,
          statusCode: res.statusCode
        });
      } else {
        logger.error(`❌ TRANSACTION FAILED: ${operation}`, {
          requestId: req.id,
          ...transactionData,
          statusCode: res.statusCode
        });
      }
    });

    next();
  };
};

/**
 * 👤 User operation logger
 */
const userOperationLogger = (operation) => {
  return (req, res, next) => {
    const userData = {
      operation,
      actorUserId: req.user?.id,
      actorRole: req.user?.role,
      targetUserId: req.params?.userId || req.params?.id,
      email: req.body?.email,
      role: req.body?.role
    };

    logger.info(`👤 USER OPERATION: ${operation}`, {
      requestId: req.id,
      ...userData,
      ip: req.ip
    });

    // Track user operation results
    res.on('finish', () => {
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      const emoji = res.statusCode >= 400 ? '❌' : '✅';
      
      logger[logLevel](`${emoji} USER OPERATION RESULT: ${operation}`, {
        requestId: req.id,
        ...userData,
        statusCode: res.statusCode
      });
    });

    next();
  };
};

/**
 * 📈 Analytics operation logger
 */
const analyticsLogger = (reportType) => {
  return (req, res, next) => {
    logger.info(`📈 ANALYTICS REQUEST: ${reportType}`, {
      requestId: req.id,
      reportType,
      userId: req.user?.id,
      dateRange: {
        startDate: req.query?.startDate,
        endDate: req.query?.endDate
      },
      filters: req.query
    });

    next();
  };
};

/**
 * 📤 Export operation logger
 */
const exportLogger = (exportType) => {
  return (req, res, next) => {
    logger.info(`📤 EXPORT REQUEST: ${exportType}`, {
      requestId: req.id,
      exportType,
      userId: req.user?.id,
      format: req.query?.format,
      dateRange: {
        startDate: req.query?.startDate,
        endDate: req.query?.endDate
      }
    });

    // Track export completion
    res.on('finish', () => {
      if (res.statusCode === 200) {
        logger.info(`✅ EXPORT COMPLETED: ${exportType}`, {
          requestId: req.id,
          exportType,
          userId: req.user?.id,
          responseSize: res.get('content-length')
        });
      } else {
        logger.error(`❌ EXPORT FAILED: ${exportType}`, {
          requestId: req.id,
          exportType,
          userId: req.user?.id,
          statusCode: res.statusCode
        });
      }
    });

    next();
  };
};

/**
 * 🚨 Admin operation logger (high security)
 */
const adminOperationLogger = (operation) => {
  return (req, res, next) => {
    // Log all admin operations with high priority
    logger.warn(`🚨 ADMIN OPERATION: ${operation}`, {
      requestId: req.id,
      operation,
      adminUserId: req.user?.id,
      adminEmail: req.user?.email,
      adminRole: req.user?.role,
      targetData: sanitizeAdminData(req.body),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Track admin operation results with security focus
    res.on('finish', () => {
      const logLevel = res.statusCode >= 400 ? 'error' : 'warn';
      const emoji = res.statusCode >= 400 ? '🚨' : '⚠️';
      
      logger[logLevel](`${emoji} ADMIN OPERATION RESULT: ${operation}`, {
        requestId: req.id,
        operation,
        adminUserId: req.user?.id,
        statusCode: res.statusCode,
        success: res.statusCode < 400,
        timestamp: new Date().toISOString()
      });
    });

    next();
  };
};

/**
 * 🔄 Bulk operation logger
 */
const bulkOperationLogger = (operation) => {
  return (req, res, next) => {
    const itemCount = Array.isArray(req.body) ? req.body.length : 
                     req.body?.ids?.length || req.body?.items?.length || 'unknown';

    logger.info(`🔄 BULK OPERATION: ${operation}`, {
      requestId: req.id,
      operation,
      userId: req.user?.id,
      itemCount,
      ip: req.ip
    });

    // Track bulk operation results
    res.on('finish', () => {
      const logLevel = res.statusCode >= 400 ? 'error' : 'info';
      const emoji = res.statusCode >= 400 ? '❌' : '✅';
      
      logger[logLevel](`${emoji} BULK OPERATION RESULT: ${operation}`, {
        requestId: req.id,
        operation,
        userId: req.user?.id,
        itemCount,
        statusCode: res.statusCode,
        success: res.statusCode < 400
      });
    });

    next();
  };
};

/**
 * Helper function to log authentication results
 */
function logAuthResult(operation, req, res, data) {
  const result = {
    requestId: req.id,
    operation,
    statusCode: res.statusCode,
    success: res.statusCode < 400,
    userId: req.user?.id
  };

  if (res.statusCode >= 400 && data) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      result.errorCode = parsed.error?.code;
      result.errorMessage = parsed.error?.message;
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  const logLevel = res.statusCode >= 400 ? 'error' : 'info';
  const emoji = res.statusCode >= 400 ? '🚫' : '✅';
  
  logger[logLevel](`${emoji} AUTH RESULT: ${operation}`, result);
}

/**
 * Helper function to sanitize admin operation data
 */
function sanitizeAdminData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret'];
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

module.exports = {
  routeLogger,
  authLogger,
  dbOperationLogger,
  transactionLogger,
  userOperationLogger,
  analyticsLogger,
  exportLogger,
  adminOperationLogger,
  bulkOperationLogger
};
