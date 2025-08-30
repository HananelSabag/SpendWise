/**
 * 🔍 DEBUG MONITORING ROUTES
 * Real-time server monitoring and debugging endpoints
 * @module routes/debugRoutes
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { getDebugStats, clearDebugCaches } = require('../middleware/debugLogger');
const { getAuthCacheStats } = require('../middleware/auth');
const { routeLogger, adminOperationLogger } = require('../middleware/routeLogger');

/**
 * 📊 GET /debug/stats - Get comprehensive server stats
 */
router.get('/stats', 
  routeLogger('DEBUG_STATS'),
  async (req, res) => {
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        debugStats: getDebugStats(),
        authStats: getAuthCacheStats(),
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
      };

      logger.info('📊 Debug stats requested', {
        requestId: req.id,
        userId: req.user?.id,
        userRole: req.user?.role
      });

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('❌ Debug stats error', {
        requestId: req.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'DEBUG_STATS_ERROR',
          message: 'Failed to retrieve debug statistics'
        }
      });
    }
  }
);

/**
 * 🔄 GET /debug/health - Comprehensive health check
 */
router.get('/health',
  routeLogger('DEBUG_HEALTH'),
  async (req, res) => {
    try {
      const db = require('../config/db');
      
      // Test database connection
      let dbHealth = false;
      let dbLatency = null;
      
      try {
        const dbStart = Date.now();
        await db.query('SELECT 1', [], 'health_check');
        dbLatency = Date.now() - dbStart;
        dbHealth = true;
      } catch (dbError) {
        logger.error('❌ Database health check failed', {
          requestId: req.id,
          error: dbError.message
        });
      }

      const health = {
        timestamp: new Date().toISOString(),
        status: dbHealth ? 'healthy' : 'degraded',
        services: {
          database: {
            status: dbHealth ? 'up' : 'down',
            latency: dbLatency ? `${dbLatency}ms` : null
          },
          cache: {
            status: 'up',
            stats: getAuthCacheStats()
          },
          logs: {
            status: 'up'
          }
        },
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      };

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      logger.error('❌ Health check error', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Health check failed'
        }
      });
    }
  }
);

/**
 * 📝 GET /debug/logs - Get recent logs (admin only)
 */
router.get('/logs',
  routeLogger('DEBUG_LOGS'),
  adminOperationLogger('VIEW_LOGS'),
  async (req, res) => {
    try {
      // Check admin permissions
      if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ADMIN_REQUIRED',
            message: 'Admin privileges required to view logs'
          }
        });
      }

      const fs = require('fs').promises;
      const path = require('path');
      
      const logsDir = path.join(process.cwd(), 'logs');
      const limit = parseInt(req.query.limit) || 100;
      const level = req.query.level || 'info';
      
      // Get today's log file
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(logsDir, `combined-${today}.log`);
      
      let logs = [];
      
      try {
        const logContent = await fs.readFile(logFile, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        
        logs = lines
          .slice(-limit)
          .map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return { message: line, timestamp: new Date().toISOString() };
            }
          })
          .filter(log => log.level === level || level === 'all')
          .reverse();
          
      } catch (fileError) {
        logger.warn('📝 Log file not found', {
          requestId: req.id,
          logFile,
          error: fileError.message
        });
      }

      res.json({
        success: true,
        data: {
          logs,
          count: logs.length,
          level,
          limit
        }
      });

    } catch (error) {
      logger.error('❌ Log retrieval error', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'LOG_RETRIEVAL_ERROR',
          message: 'Failed to retrieve logs'
        }
      });
    }
  }
);

/**
 * 🧹 POST /debug/clear-cache - Clear debug caches (admin only)
 */
router.post('/clear-cache',
  routeLogger('DEBUG_CLEAR_CACHE'),
  adminOperationLogger('CLEAR_DEBUG_CACHE'),
  async (req, res) => {
    try {
      // Check admin permissions
      if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ADMIN_REQUIRED',
            message: 'Admin privileges required to clear caches'
          }
        });
      }

      clearDebugCaches();
      
      logger.info('🧹 Debug caches cleared by admin', {
        requestId: req.id,
        adminUserId: req.user.id,
        adminEmail: req.user.email
      });

      res.json({
        success: true,
        message: 'Debug caches cleared successfully'
      });

    } catch (error) {
      logger.error('❌ Cache clear error', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'CACHE_CLEAR_ERROR',
          message: 'Failed to clear caches'
        }
      });
    }
  }
);

/**
 * 🔍 GET /debug/request-trace/:requestId - Trace specific request
 */
router.get('/request-trace/:requestId',
  routeLogger('DEBUG_REQUEST_TRACE'),
  async (req, res) => {
    try {
      const { requestId } = req.params;
      
      // This would require implementing request trace storage
      // For now, return a placeholder response
      logger.info('🔍 Request trace requested', {
        requestId: req.id,
        traceRequestId: requestId,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'Request tracing not yet implemented',
        requestId
      });

    } catch (error) {
      logger.error('❌ Request trace error', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'REQUEST_TRACE_ERROR',
          message: 'Failed to trace request'
        }
      });
    }
  }
);

/**
 * 📊 GET /debug/performance - Get performance metrics
 */
router.get('/performance',
  routeLogger('DEBUG_PERFORMANCE'),
  async (req, res) => {
    try {
      const stats = getDebugStats();
      
      const performance = {
        timestamp: new Date().toISOString(),
        topSlowRoutes: stats.topPerformanceMetrics,
        systemMetrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        },
        cacheStats: stats
      };

      res.json({
        success: true,
        data: performance
      });

    } catch (error) {
      logger.error('❌ Performance metrics error', {
        requestId: req.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'PERFORMANCE_METRICS_ERROR',
          message: 'Failed to retrieve performance metrics'
        }
      });
    }
  }
);

module.exports = router;
