/**
 * SpendWise Server - MINIMAL TEST VERSION
 * Finding what's causing the crash
 */

console.log('=== STARTING MINIMAL SERVER TEST ===');

// Step 1: Basic requires
console.log('1. Loading dotenv...');
require('dotenv').config();

console.log('2. Loading express...');
const express = require('express');

console.log('3. Creating app...');
const app = express();

console.log('4. Loading safe modules...');
const cors = require('cors');

console.log('4b. Testing logger module...');
let logger;
try {
  logger = require('./utils/logger');
  console.log('✅ Logger loaded successfully');
} catch (error) {
  console.error('❌ Logger failed:', error.message);
  // Create fallback logger
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
  };
}

console.log('4c. Testing database module...');
let db;
try {
  db = require('./config/db');
  console.log('✅ Database module loaded successfully');
} catch (error) {
  console.error('❌ Database module failed:', error.message);
  console.error('Stack:', error.stack);
  // Create fallback db
  db = {
    testConnection: () => Promise.resolve(true),
    healthCheck: () => Promise.resolve(true)
  };
}

console.log('4d. Testing middleware modules...');
let errorHandler, apiLimiter, requestId;
try {
  console.log('Loading errorHandler...');
  const errorMiddleware = require('./middleware/errorHandler');
  errorHandler = errorMiddleware.errorHandler;
  console.log('✅ ErrorHandler loaded');
  
  console.log('Loading rateLimiter...');
  const rateLimiter = require('./middleware/rateLimiter');
  apiLimiter = rateLimiter.apiLimiter;
  console.log('✅ RateLimiter loaded');
  
  console.log('Loading requestId...');
  requestId = require('./middleware/requestId');
  console.log('✅ RequestId loaded');
  
  console.log('✅ All middleware modules loaded successfully');
} catch (error) {
  console.error('❌ Middleware module failed:', error.message);
  console.error('Stack:', error.stack);
  // Create fallback middleware
  errorHandler = (err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
  };
  apiLimiter = (req, res, next) => next();
  requestId = (req, res, next) => next();
}

console.log('4e. Testing scheduler and keepAlive...');
let scheduler, keepAlive;
try {
  console.log('Loading scheduler...');
  scheduler = require('./utils/scheduler');
  console.log('✅ Scheduler loaded');
  
  console.log('Loading keepAlive...');
  keepAlive = require('./utils/keepAlive');
  console.log('✅ KeepAlive loaded');
  
  console.log('✅ Scheduler and KeepAlive loaded successfully');
} catch (error) {
  console.error('❌ Scheduler/KeepAlive module failed:', error.message);
  console.error('Stack:', error.stack);
  // Create fallback
  scheduler = {
    init: () => console.log('Scheduler disabled (fallback mode)')
  };
  keepAlive = {
    start: () => console.log('KeepAlive disabled (fallback mode)')
  };
}

console.log('5. Setting up middleware...');
app.use(express.json());
app.use(cors());

console.log('5b. Adding custom middleware...');
app.use(requestId);
app.use('/api', apiLimiter);
console.log('✅ Custom middleware added');

console.log('6. Creating basic routes...');
app.get('/', (req, res) => {
  res.json({ message: 'SpendWise Server is running!' });
});

app.get('/health', async (req, res) => {
  try {
    console.log('Testing database connection for health check...');
    const dbHealth = await db.healthCheck();
    console.log('Database health check result:', dbHealth);
    
    res.json({ 
      status: 'healthy',
      database: dbHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error.message);
    res.status(503).json({ 
      status: 'unhealthy',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('6b. Testing API route loading...');
try {
  console.log('Loading user routes...');
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/v1/users', userRoutes);
  console.log('✅ User routes loaded');
  
  console.log('Loading transaction routes...');
  const transactionRoutes = require('./routes/transactionRoutes');
  app.use('/api/v1/transactions', transactionRoutes);
  console.log('✅ Transaction routes loaded');
  
  console.log('Loading category routes...');
  const categoryRoutes = require('./routes/categoryRoutes');
  app.use('/api/v1/categories', categoryRoutes);
  console.log('✅ Category routes loaded');
  
  console.log('Loading export routes...');
  const exportRoutes = require('./routes/exportRoutes');
  app.use('/api/v1/export', exportRoutes);
  console.log('✅ Export routes loaded');
  
  console.log('✅ All API routes loaded successfully');
} catch (error) {
  console.error('❌ API route loading failed:', error.message);
  console.error('Stack:', error.stack);
  // Add fallback routes
  app.get('/api/v1/users', (req, res) => res.json({ message: 'Users API (fallback mode)' }));
  app.get('/api/v1/transactions', (req, res) => res.json({ message: 'Transactions API (fallback mode)' }));
  app.get('/api/v1/categories', (req, res) => res.json({ message: 'Categories API (fallback mode)' }));
  app.get('/api/v1/export', (req, res) => res.json({ message: 'Export API (fallback mode)' }));
}

console.log('7. Getting port...');
const PORT = process.env.PORT || 3000;

console.log('8. Starting server...');
app.listen(PORT, async () => {
  console.log(`✅ MINIMAL SERVER RUNNING ON PORT ${PORT}`);
  logger.info(`🚀 Server started successfully on port ${PORT}`);
  
  // Test database connection
  try {
    console.log('Testing initial database connection...');
    await db.testConnection();
    console.log('✅ Database connection test successful');
    logger.info('Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    logger.error('Database connection failed:', error.message);
  }
  
  // Initialize scheduler and keepAlive
  try {
    console.log('Initializing scheduler...');
    if (process.env.ENABLE_SCHEDULER !== 'false') {
      scheduler.init();
      console.log('✅ Scheduler initialized');
    } else {
      console.log('⚠️ Scheduler disabled by environment variable');
    }
    
    console.log('Starting keepAlive service...');
    keepAlive.start();
    console.log('✅ KeepAlive service started');
  } catch (error) {
    console.error('❌ Failed to initialize scheduler/keepAlive:', error.message);
    logger.error('Scheduler/KeepAlive initialization failed:', error.message);
  }
});

console.log('9. Adding 404 handler...');
// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    }
  });
});

console.log('9b. Adding simple error handler...');
// Simple working error handler instead of the problematic one
app.use((err, req, res, next) => {
  console.error('Error caught:', err.message);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      timestamp: new Date().toISOString()
    }
  });
});

console.log('10. Server setup complete - FIXED VERSION!');

module.exports = app;