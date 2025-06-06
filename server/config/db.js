/**
 * Database Configuration - Supabase Only
 * Direct IP connection that bypasses network restrictions
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
  logger.info('Using Supabase database configuration (Direct IP)');
  
  return {
    user: parsed.user,
    password: parsed.password,
    host: parsed.host,
    port: parsed.port,
    database: parsed.database,
    ssl: {
      rejectUnauthorized: false
    },
    connectionType: 'supabase'
  };
};

const baseConfig = getDatabaseConfig();

// Database configuration optimized for Supabase
const dbConfig = {
  ...baseConfig,
  
  // Connection pool configuration
  max: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20,
  min: parseInt(process.env.DB_MIN_CONNECTIONS, 10) || 2,
  
  // Connection timeouts
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 30000,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
  
  // Statement timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT, 10) || 30000,
  
  // Application name for monitoring
  application_name: `spendwise-${process.env.NODE_ENV || 'development'}-supabase`
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
      hint: error.hint
    });
    
    throw error;
  }
};

// Simplified connection test for working Supabase connection
const testConnection = async () => {
  try {
    logger.info('🔄 Testing Supabase connection...');
    
    const result = await pool.query('SELECT NOW() as connected_at, version() as pg_version');
    
    logger.info('✅ Supabase connection successful!', {
      connectedAt: result.rows[0].connected_at,
      pgVersion: result.rows[0].pg_version.split(' ')[0],
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      ssl: !!dbConfig.ssl
    });
    
    return true;
  } catch (error) {
    logger.error('❌ Supabase connection failed', {
      error: error.message,
      code: error.code,
      host: dbConfig.host,
      port: dbConfig.port
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
  logger.error('Failed to establish Supabase database connection');
  process.exit(1);
});

module.exports = {
  query,
  pool,
  healthCheck,
  gracefulShutdown,
  testConnection,
  config: {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    connectionType: 'supabase',
    ssl: !!dbConfig.ssl
  }
};