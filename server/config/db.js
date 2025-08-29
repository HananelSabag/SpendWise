/**
 * OPTIMIZED Database Configuration - Enhanced Performance Version
 * Optimized for Render + Supabase production deployment
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');
const dotenv = require('dotenv');
const { parse } = require('pg-connection-string');

dotenv.config();

// Parse Supabase DATABASE_URL
const getDatabaseConfig = () => {
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const parsed = parse(process.env.DATABASE_URL);
  logger.info('Using OPTIMIZED Supabase database configuration');
  
  return {
    user: parsed.user,
    password: parsed.password,
    host: parsed.host,
    port: parsed.port,
    database: parsed.database,
    ssl: {
      rejectUnauthorized: false
    },
    connectionType: 'supabase-optimized'
  };
};

const baseConfig = getDatabaseConfig();

// 🚀 OPTIMIZED Database configuration for production
const dbConfig = {
  ...baseConfig,
  
  // 🎯 Optimized for Render + Supabase limits
  max: 15,                        // Reduced from 20 (Render connection limits)
  min: 2,                         // Keep minimum alive
  
  // ⚡ Faster timeouts for production
  connectionTimeoutMillis: 20000,  // Reduced from 30s
  idleTimeoutMillis: 60000,        // Increased to 60s (keep connections longer)
  
  // 🔧 Query optimization
  statement_timeout: 45000,        // Increased for complex dashboard queries
  
  // 🚀 Production optimizations
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // 📊 Enhanced monitoring
  application_name: `spendwise-${process.env.NODE_ENV || 'development'}-optimized`
};

// Create optimized connection pool
const pool = new Pool(dbConfig);

// 📊 Performance tracking for query optimization
const queryStats = {
  totalQueries: 0,
  slowQueries: 0,
  averageTime: 0,
  longestQuery: 0,
  slowQueryThreshold: 1000, // 1 second
  lastReset: Date.now()
};

// Enhanced connection event handlers
pool.on('connect', (client) => {
  logger.info('New database client connected', {
    processId: client.processID,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

pool.on('acquire', (client) => {
  logger.debug('Client acquired from pool', {
    processId: client.processID,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount
  });
});

pool.on('remove', (client) => {
  logger.info('Client removed from pool', {
    processId: client.processID,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount
  });
});

pool.on('error', (err, client) => {
  logger.error('Database pool error', {
    error: err.message,
    code: err.code,
    processId: client?.processID,
    poolStats: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    }
  });
});

// 🚀 ENHANCED query wrapper with performance monitoring and optimization
const query = async (text, params, name = 'unnamed') => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // 📊 Update performance statistics
    queryStats.totalQueries++;
    queryStats.averageTime = (queryStats.averageTime * (queryStats.totalQueries - 1) + duration) / queryStats.totalQueries;
    if (duration > queryStats.longestQuery) {
      queryStats.longestQuery = duration;
    }
    
    // 🐌 Track slow queries for optimization
    if (duration > queryStats.slowQueryThreshold) {
      queryStats.slowQueries++;
      logger.warn('🐌 SLOW QUERY DETECTED', {
        queryName: name,
        duration: `${duration}ms`,
        rowCount: result.rowCount,
        query: text.substring(0, 150) + '...',
        poolStats: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        },
        recommendation: duration > 2000 ? 'Consider adding indexes or optimizing query' : 'Monitor for patterns'
      });
    }
    
    // 📈 Log successful queries in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('✅ Query executed', {
        queryName: name,
        duration: `${duration}ms`,
        rowCount: result.rowCount,
        performance: duration > 500 ? 'SLOW' : duration > 200 ? 'MEDIUM' : 'FAST'
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error('❌ Database query failed', {
      queryName: name,
      duration: `${duration}ms`,
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      query: text.substring(0, 100) + '...',
      suggestion: getErrorSuggestion(error.code)
    });
    
    throw error;
  }
};

// 💡 Smart error suggestions for common issues
const getErrorSuggestion = (errorCode) => {
  const suggestions = {
    '23505': 'Duplicate key - check for unique constraint violations',
    '23503': 'Foreign key violation - verify referenced record exists',
    '42P01': 'Table does not exist - check table name and schema',
    '42703': 'Column does not exist - verify column name',
    '57014': 'Query timeout - consider optimizing or adding indexes'
  };
  return suggestions[errorCode] || 'Check query syntax and database schema';
};

// 🔍 Enhanced connection test with performance benchmarking
const testConnection = async () => {
  try {
    logger.info('🔄 Testing OPTIMIZED Supabase connection...');
    
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as connected_at, version() as pg_version, pg_database_size(current_database()) as db_size');
    const connectionTime = Date.now() - start;
    
    logger.info('✅ OPTIMIZED Supabase connection successful!', {
      connectedAt: result.rows[0].connected_at,
      pgVersion: result.rows[0].pg_version.split(' ')[0],
      dbSize: formatBytes(result.rows[0].db_size),
      connectionTime: `${connectionTime}ms`,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      ssl: !!dbConfig.ssl,
      optimizations: 'Enhanced connection pooling, query monitoring, performance tracking'
    });
    
    return true;
  } catch (error) {
    logger.error('❌ OPTIMIZED Supabase connection failed', {
      error: error.message,
      code: error.code,
      host: dbConfig.host,
      port: dbConfig.port
    });
    throw error;
  }
};

// 🧹 Enhanced graceful shutdown with performance summary
const gracefulShutdown = async () => {
  logger.info('🔄 Closing optimized database connection pool');
  
  // 📊 Log final performance statistics
  logger.info('📊 Final database performance summary', {
    totalQueries: queryStats.totalQueries,
    averageQueryTime: Math.round(queryStats.averageTime),
    slowQueries: queryStats.slowQueries,
    slowQueryPercentage: queryStats.totalQueries > 0 ? Math.round((queryStats.slowQueries / queryStats.totalQueries) * 100) : 0,
    longestQuery: queryStats.longestQuery,
    uptime: Math.round((Date.now() - queryStats.lastReset) / 1000 / 60) // minutes
  });
  
  try {
    await pool.end();
    logger.info('✅ Optimized database connection pool closed successfully');
  } catch (error) {
    logger.error('❌ Error closing optimized database connection pool', {
      error: error.message
    });
    throw error;
  }
};

// 🏥 Enhanced health check with performance metrics
const healthCheck = async () => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT 1 as healthy, NOW() as timestamp');
    const queryTime = Date.now() - start;
    
    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp,
      queryTime: `${queryTime}ms`,
      performance: queryTime < 100 ? 'excellent' : queryTime < 500 ? 'good' : 'needs-attention',
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
        utilization: Math.round(((pool.totalCount - pool.idleCount) / pool.totalCount) * 100)
      },
      queryStats: {
        totalQueries: queryStats.totalQueries,
        averageTime: Math.round(queryStats.averageTime),
        slowQueries: queryStats.slowQueries,
        slowQueryRate: queryStats.totalQueries > 0 ? Math.round((queryStats.slowQueries / queryStats.totalQueries) * 100) : 0
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      code: error.code,
      performance: 'critical'
    };
  }
};

// 📊 Get performance statistics (useful for monitoring endpoints)
const getPerformanceStats = () => {
  return {
    ...queryStats,
    poolStats: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
      utilization: pool.totalCount > 0 ? Math.round(((pool.totalCount - pool.idleCount) / pool.totalCount) * 100) : 0
    },
    uptime: Math.round((Date.now() - queryStats.lastReset) / 1000 / 60) // minutes
  };
};

// 🔧 Utility function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Initialize optimized connection test
testConnection().catch(() => {
  logger.error('Failed to establish OPTIMIZED Supabase database connection');
  process.exit(1);
});

// 🔗 Get client from pool for transactions
const getClient = async () => {
  try {
    const client = await pool.connect();
    logger.debug('Database client acquired from pool', {
      processId: client.processID,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount
    });
    return client;
  } catch (error) {
    logger.error('Failed to acquire database client', {
      error: error.message,
      code: error.code,
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });
    throw error;
  }
};

module.exports = {
  query,
  pool,
  getClient,
  healthCheck,
  gracefulShutdown,
  testConnection,
  getPerformanceStats,
  queryStats,
  config: {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    connectionType: 'supabase-optimized',
    ssl: !!dbConfig.ssl,
    maxConnections: dbConfig.max,
    optimizations: [
      'Enhanced connection pooling',
      'Query performance monitoring', 
      'Slow query detection',
      'Performance statistics tracking',
      'Optimized timeouts for production'
    ]
  }
};