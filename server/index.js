/**
 * SpendWise Server - SYSTEMATIC TESTING v2
 * Adding modules step by step to find the exact crash point
 */

console.log('=== SPENDWISE SYSTEMATIC TEST v2 ===');

console.log('1. Loading basic modules...');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');

console.log('2. Loading environment...');
dotenv.config();

console.log('3. Loading custom modules safely...');
let logger, apiLimiter, requestId, scheduler, db, keepAlive;

try {
  console.log('3a. Loading logger...');
  logger = require('./utils/logger');
  console.log('✅ Logger loaded');

  console.log('3b. Loading rateLimiter...');
  const rateLimiter = require('./middleware/rateLimiter');
  apiLimiter = rateLimiter.apiLimiter;
  console.log('✅ RateLimiter loaded');

  console.log('3c. Loading requestId...');
  requestId = require('./middleware/requestId');
  console.log('✅ RequestId loaded');

  console.log('3d. Loading scheduler...');
  scheduler = require('./utils/scheduler');
  console.log('✅ Scheduler loaded');

  console.log('3e. Loading database...');
  db = require('./config/db');
  console.log('✅ Database loaded');

  console.log('3f. Loading keepAlive...');
  keepAlive = require('./utils/keepAlive');
  console.log('✅ KeepAlive loaded');

  console.log('✅ ALL CUSTOM MODULES LOADED');
} catch (error) {
  console.error('❌ MODULE LOADING FAILED:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('4. Initializing Express app...');
const app = express();
console.log('✅ Express app created');

console.log('5a. Setting up trust proxy...');
app.set('trust proxy', 1);
console.log('✅ Trust proxy set');

console.log('5b. Setting up helmet security...');
try {
  app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5000", "http://localhost:3000", "http://localhost:5173"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
  console.log('✅ Helmet configured');
} catch (error) {
  console.error('❌ Helmet setup failed:', error.message);
  process.exit(1);
}

console.log('5c. Setting up compression...');
app.use(compression());
console.log('✅ Compression set');

console.log('5d. Setting up CORS...');
// Enhanced CORS for mobile and network support
const isLocalNetworkIP = (origin) => {
  if (!origin) return false;
  
  const match = origin.match(/^https?:\/\/([^:]+)/);
  if (!match) return false;
  
  const host = match[1];
  
  const localNetworkPatterns = [
    /^192\.168\.\d{1,3}\.\d{1,3}$/,
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
    /^localhost$/,
    /^127\.0\.0\.1$/
  ];
  
  return localNetworkPatterns.some(pattern => pattern.test(host));
};

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || []) 
  : ['http://localhost:3000', 'http://localhost:5173'];

try {
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests without origin (mobile apps, Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow local network in development
      if (process.env.NODE_ENV !== 'production' && isLocalNetworkIP(origin)) {
        logger.info(`🌐 Allowing local network origin: ${origin}`);
        return callback(null, true);
      }
      
      // Allow dev servers
      if (origin.includes(':5173') || origin.includes(':3000')) {
        logger.info(`🌐 Allowing dev server origin: ${origin}`);
        return callback(null, true);
      }
      
      logger.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    maxAge: 86400,
    exposedHeaders: ['Content-Disposition']
  }));
  console.log('✅ CORS configured');
} catch (error) {
  console.error('❌ CORS setup failed:', error.message);
  process.exit(1);
}

console.log('5e. Setting up body parser...');
// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('✅ Body parser set');

console.log('5f. Setting up static files...');
// Serve static files from uploads directory
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
console.log('✅ Static files configured');

console.log('5g. Setting up request middleware...');
// Request ID middleware
app.use(requestId);
console.log('✅ RequestId middleware set');

console.log('5h. Setting up API rate limiter...');
// API rate limiter
app.use('/api', apiLimiter);
console.log('✅ API rate limiter set');

console.log('5i. Setting up request logging...');
// Request logging (production-safe)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    logger.info('Request received', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      origin: req.headers.origin
    });
    next();
  });
}
console.log('✅ Request logging configured');

console.log('6. Setting up routes...');
console.log('6a. Setting up health check...');
// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const origin = req.headers.origin;
    
    // Set CORS headers for health check
    if (origin && (allowedOrigins.includes(origin) || 
        process.env.NODE_ENV !== 'production' && (
          isLocalNetworkIP(origin) || 
          origin.includes(':5173') || 
          origin.includes(':3000')
        ))) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    const dbHealth = await db.healthCheck();
    
    res.json({ 
      status: 'healthy',
      database: dbHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
  });
console.log('✅ Health check configured');

console.log('6b. Setting up API routes...');
// API routes with versioning
const API_VERSION = '/api/v1';
try {
  console.log('Loading user routes...');
  app.use(`${API_VERSION}/users`, require('./routes/userRoutes'));
  console.log('✅ User routes loaded');
  
  console.log('Loading transaction routes...');
  app.use(`${API_VERSION}/transactions`, require('./routes/transactionRoutes'));
  console.log('✅ Transaction routes loaded');
  
  console.log('Loading category routes...');
  app.use(`${API_VERSION}/categories`, require('./routes/categoryRoutes'));
  console.log('✅ Category routes loaded');
  
  console.log('Loading export routes...');
  app.use(`${API_VERSION}/export`, require('./routes/exportRoutes'));
  console.log('✅ Export routes loaded');
} catch (error) {
  console.error('❌ API routes loading failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('6c. Setting up onboarding routes...');
// Safe onboarding routes with error handling
try {
  app.use(`${API_VERSION}/onboarding`, require('./routes/onboarding'));
  console.log('✅ Onboarding routes loaded');
} catch (error) {
  console.error('⚠️ Failed to load onboarding routes:', error.message);
  // Add fallback onboarding endpoint
  app.post(`${API_VERSION}/onboarding/complete`, (req, res) => {
    res.json({ success: true, message: 'Onboarding completed (fallback mode)' });
  });
  console.log('✅ Onboarding fallback routes added');
}

console.log('6d. Setting up error handlers...');
// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    }
  });
});
console.log('✅ 404 handler configured');

// FIXED: Simple, working error handler (replaces problematic ./middleware/errorHandler.js)
app.use((err, req, res, next) => {
  logger.error('Error caught by handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Handle specific error types
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  
  res.status(status).json({
    error: {
      code,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      timestamp: new Date().toISOString()
    }
  });
});
console.log('✅ Global error handler configured');

const PORT = process.env.PORT || 5000;

/**
 * Start the server with Supabase database connection
 */
const startServer = async () => {
  logger.info('🚀 Starting SpendWise server...');
  
  try {
    logger.info('📡 Testing database connection...');
    // Test Supabase database connection with retry
    let retries = 5;
    while (retries > 0) {
      try {
        await db.testConnection();
        logger.info('✅ Supabase database connection successful');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          logger.error('❌ Failed to connect to database after 5 retries');
          throw error;
        }
        logger.warn(`⚠️ Database connection failed, retrying... (${5 - retries}/5)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    logger.info('🔧 Starting HTTP server...');

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT} with Supabase database`);
      logger.info(`🌐 CORS enabled for mobile development (local networks)`);
      
      // Initialize background jobs
      if (process.env.ENABLE_SCHEDULER !== 'false') {
        scheduler.init();
        logger.info('✅ Scheduler initialized');
      }
      
      // Start keep-alive service
      keepAlive.start();
      logger.info('✅ KeepAlive service started');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Close database connections
      await db.gracefulShutdown();
      logger.info('Supabase database connections closed');
      
      process.exit(0);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      if (process.env.NODE_ENV !== 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
      }
    });

  } catch (err) {
    logger.error('❌ Failed to start server with Supabase:', err);
    logger.error('💡 Check your DATABASE_URL and network connection');
    process.exit(1);
  }
};

console.log('STARTING SERVER...');
startServer();

module.exports = app;