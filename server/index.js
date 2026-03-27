/**
 * SpendWise Server - Production Ready
 * Complete financial management API with Supabase integration
 */

// ✅ EMERGENCY: Log BEFORE anything else to catch early crashes
console.log('========================================');
console.log('🚨 SERVER STARTING - EMERGENCY DIAGNOSTICS');
console.log('========================================');
console.log('Node Version:', process.version);
console.log('Working Directory:', process.cwd());
console.log('========================================');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');

// Load environment configuration
console.log('📦 Loading environment variables...');
dotenv.config();
console.log('✅ Environment loaded');
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);

// Load core modules
console.log('📦 Loading logger...');
const logger = require('./utils/logger');
console.log('✅ Logger loaded');

console.log('📦 Loading middleware...');

console.log('  ↳ Loading rateLimiter...');
const { apiLimiter } = require('./middleware/rateLimiter');
console.log('  ✅ rateLimiter loaded');

console.log('  ↳ Loading requestId...');
const requestId = require('./middleware/requestId');
console.log('  ✅ requestId loaded');

console.log('  ↳ Loading auth...');
let optionalAuth;
try {
  const authModule = require('./middleware/auth');
  optionalAuth = authModule.optionalAuth;
  if (!optionalAuth) {
    console.error('❌ optionalAuth not found in auth module exports!');
    console.error('Available exports:', Object.keys(authModule));
    // Create dummy middleware to prevent crash
    optionalAuth = (req, res, next) => next();
  }
  console.log('  ✅ auth loaded');
} catch (authError) {
  console.error('❌ CRITICAL: Failed to load auth middleware!');
  console.error('Error:', authError.message);
  console.error('Stack:', authError.stack);
  // Create dummy middleware to allow server to start
  optionalAuth = (req, res, next) => next();
  console.log('  ⚠️ Using fallback auth middleware');
}

console.log('  ↳ Loading maintenance...');
const { maintenanceGate } = require('./middleware/maintenance');
console.log('  ✅ maintenance loaded');

console.log('✅ All middleware loaded');

console.log('📦 Loading database config...');
const db = require('./config/db');
console.log('✅ Database config loaded');

console.log('📦 Loading scheduler...');
const scheduler = require('./utils/scheduler');
console.log('✅ Scheduler loaded');

console.log('📦 Loading keepAlive...');
const keepAlive = require('./utils/keepAlive');
console.log('✅ KeepAlive loaded');

// Initialize Express app
console.log('📦 Creating Express app...');
const app = express();
console.log('✅ Express app created');
console.log('========================================');
console.log('✅ ALL MODULES LOADED SUCCESSFULLY');
console.log('========================================');



// Trust proxy for production
app.set('trust proxy', 1);

// Set up security headers (advancedSecurityHeaders from security middleware)
const { advancedSecurityHeaders } = require('./middleware/security');
try {
  app.use(advancedSecurityHeaders);
} catch (error) {
  logger.error('❌ Helmet setup failed:', error.message);
  // Don't exit - helmet failure is not critical for startup
  logger.warn('⚠️ Continuing without full helmet protection');
}

// Set up compression
app.use(compression());

// Set up CORS
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
      
      // Allow dev servers (development only)
      if (process.env.NODE_ENV !== 'production' && (origin.includes(':5173') || origin.includes(':3000'))) {
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
} catch (error) {
  logger.error('❌ CORS setup failed:', error.message);
  // Don't exit - CORS failure is not critical for startup
  logger.warn('⚠️ Continuing with default CORS settings');
}

// Set up body parser
// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set up static files
// Serve static files from uploads directory
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Set up request middleware
// Request ID middleware
app.use(requestId);

// Set up API rate limiter
// API rate limiter
app.use('/api', apiLimiter);

// Load user context early so admins can bypass maintenance
app.use(optionalAuth);
// Global maintenance gate (place before route handlers)
app.use(maintenanceGate);

// Legacy request logging (keeping for compatibility)
if (process.env.NODE_ENV !== 'production') {
  logger.info('🔍 Enhanced debugging enabled for development');
}

// Set up routes
// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
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

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    name: 'SpendWise API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/v1',
      docs: '/api/v1/docs'
    }
  });
});

// API routes with versioning
const API_VERSION = '/api/v1';
try {
  logger.debug('Loading user routes...');
  app.use(`${API_VERSION}/users`, require('./routes/userRoutes'));
  logger.debug('✅ User routes loaded');
  
  logger.debug('Loading transaction routes...');
  app.use(`${API_VERSION}/transactions`, require('./routes/transactionRoutes'));
  logger.debug('✅ Transaction routes loaded');
  
  logger.debug('Loading category routes...');
  app.use(`${API_VERSION}/categories`, require('./routes/categoryRoutes'));
  logger.debug('✅ Category routes loaded');
  
  logger.debug('Loading export routes...');
  app.use(`${API_VERSION}/export`, require('./routes/exportRoutes'));
  logger.debug('✅ Export routes loaded');

  // ✅ FIXED: Re-enable analytics routes 
  try {
    logger.debug('Loading analytics routes...');
    app.use(`${API_VERSION}/analytics`, require('./routes/analyticsRoutes'));
    logger.debug('✅ Analytics routes loaded');
  } catch (error) {
    logger.error('❌ Analytics routes failed:', error.message);
  }

  // ✅ ADMIN ROUTES - Add missing admin routes
  try {
    logger.debug('Loading admin routes...');
    app.use(`${API_VERSION}/admin`, require('./routes/adminRoutes'));
    logger.debug('✅ Admin routes loaded');
  } catch (error) {
    logger.error('❌ Admin routes failed:', error.message);
  }

  // 🔐 NEW: Bulletproof authentication status detection
  try {
    logger.debug('Loading auth status routes...');
    app.use(`${API_VERSION}/auth-status`, require('./routes/authStatusRoutes'));
    logger.debug('✅ Auth status routes loaded');
  } catch (error) {
    logger.error('❌ Auth status routes failed:', error.message);
  }

  // Health and performance monitoring routes
  try {
    app.use(`${API_VERSION}/health`, require('./routes/healthRoutes'));
    logger.debug('✅ Health routes loaded');
  } catch (error) {
    logger.error('❌ Health routes failed:', error.message);
  }

  try {
    app.use(`${API_VERSION}/performance`, require('./routes/performance'));
    logger.debug('✅ Performance routes loaded');
  } catch (error) {
    logger.error('❌ Performance routes failed:', error.message);
  }
} catch (error) {
  logger.error('❌ API routes loading failed:', error.message, { stack: error.stack });
  // Don't exit - server can still respond to health checks
  logger.warn('⚠️ Server starting with limited API functionality');
}

// Safe onboarding routes with error handling
try {
  app.use(`${API_VERSION}/onboarding`, require('./routes/onboarding'));
  logger.debug('✅ Onboarding routes loaded');
} catch (error) {
  logger.error('❌ CRITICAL: Onboarding routes failed to load:', error.message, { stack: error.stack });
  
  // ❌ NO FAKE FALLBACKS! Fail properly so we can fix the real issue
  app.post(`${API_VERSION}/onboarding/complete`, (req, res) => {
    logger.error('❌ CRITICAL: Onboarding completion attempted but routes failed to load!');
    logger.error('❌ CRITICAL: This should never happen in production!');
    logger.error('❌ CRITICAL: Check server logs and fix the onboarding route loading issue!');
    
    res.status(503).json({ 
      success: false, 
      error: { 
        code: 'SERVICE_UNAVAILABLE',
        message: 'Onboarding service temporarily unavailable. Please contact support.',
        details: 'Server configuration error - onboarding routes failed to load'
      }
    });
  });
  
  logger.error('❌ CRITICAL: Added ERROR fallback for onboarding (this indicates a serious problem)');
  logger.error('❌ CRITICAL: Fix required: Check why ./routes/onboarding.js is failing to load');
}

// 404 handler - Fixed to prevent hanging requests
app.use((req, res, next) => {
  try {
    res.status(404).json({ 
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Cannot ${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    // Fallback if 404 handler fails
    logger.error('404 handler error:', error.message);
    res.status(404).end('Not Found');
  }
});

// Centralized error handling
const { errorHandler, corsErrorHandler } = require('./middleware/errorHandler');
app.use(corsErrorHandler);
app.use(errorHandler);

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

      // Stop scheduled jobs before closing the DB pool
      scheduler.stop();
      logger.info('Scheduler stopped');

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
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (err) {
    logger.error('❌ Failed to start server with Supabase:', err);
    logger.error('💡 Check your DATABASE_URL and network connection');
    process.exit(1);
  }
};

// ✅ DIAGNOSTIC: Log environment status before starting
logger.info('========================================');
logger.info('🚀 SPENDWISE SERVER STARTUP DIAGNOSTIC');
logger.info('========================================');
logger.info('Node Version:', process.version);
logger.info('Environment:', process.env.NODE_ENV || 'not set');
logger.info('Port:', process.env.PORT || '5000 (default)');
logger.info('DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING');
logger.info('JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ MISSING');
logger.info('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS || 'not set (using defaults)');
logger.info('========================================');

// Abort startup if critical secrets are missing
const missingSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'].filter(k => !process.env[k]);
if (missingSecrets.length > 0) {
  logger.error(`FATAL: Missing required environment variables: ${missingSecrets.join(', ')}`);
  logger.error('Server cannot start without these secrets. Add them to your .env file.');
  process.exit(1);
}

logger.info('STARTING SERVER...');
startServer();

module.exports = app;