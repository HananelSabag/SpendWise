/**
 * Database Configuration - Production Ready
 * PostgreSQL connection pool with enhanced error handling and monitoring
 * @module config/db
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');
const dotenv = require('dotenv');

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('Missing required database environment variables', { missingVars });
  process.exit(1);
}

// Database configuration with production optimizations
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  
  // Connection pool configuration
  max: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20,
  min: parseInt(process.env.DB_MIN_CONNECTIONS, 10) || 2,
  
  // Connection timeouts
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 30000,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
  
  // Statement timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT, 10) || 30000,
  
  // Application name for monitoring
  application_name: `spendwise-${process.env.NODE_ENV || 'development'}`
};

// Create connection pool
const pool = new Pool(dbConfig);

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

// Enhanced query wrapper with logging and error handling
const query = async (text, params, name = 'unnamed') => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Database query executed', {
      queryName: name,
      duration: `${duration}ms`,
      rowCount: result.rowCount,
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error('Database query failed', {
      queryName: name,
      duration: `${duration}ms`,
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });
    
    throw error;
  }
};

// Test initial connection
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as connected_at, version() as pg_version');
    logger.info('Database connection established', {
      connectedAt: result.rows[0].connected_at,
      pgVersion: result.rows[0].pg_version.split(' ')[0],
      host: dbConfig.host,
      database: dbConfig.database,
      ssl: !!dbConfig.ssl
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
      code: error.code,
      host: dbConfig.host,
      database: dbConfig.database
    });
    throw error;
  }
};

// Graceful shutdown handler
const gracefulShutdown = async () => {
  logger.info('Closing database connection pool');
  
  try {
    await pool.end();
    logger.info('Database connection pool closed successfully');
  } catch (error) {
    logger.error('Error closing database connection pool', {
      error: error.message
    });
    throw error;
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const result = await pool.query('SELECT 1 as healthy, NOW() as timestamp');
    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp,
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      code: error.code
    };
  }
};

// Initialize connection test
testConnection().catch(() => {
  logger.error('Failed to establish initial database connection');
  process.exit(1);
});

module.exports = {
  query,
  pool,
  healthCheck,
  gracefulShutdown,
  testConnection,
  // Export sanitized config (without sensitive data) for monitoring
  config: {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    max: dbConfig.max,
    min: dbConfig.min,
    ssl: !!dbConfig.ssl
  }
};