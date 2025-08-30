/**
 * SpendWise Server - Production Ready
 * Complete financial management API with Supabase integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config();

// Load core modules
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const requestId = require('./middleware/requestId');
const { optionalAuth } = require('./middleware/auth');
const { maintenanceGate } = require('./middleware/maintenance');
const scheduler = require('./utils/scheduler');
const db = require('./config/db');
const keepAlive = require('./utils/keepAlive');

// Initialize Express app
const app = express();



// Trust proxy for production
app.set('trust proxy', 1);

// Set up helmet security
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
} catch (error) {
  console.error('❌ Helmet setup failed:', error.message);
  process.exit(1);
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
} catch (error) {
  console.error('❌ CORS setup failed:', error.message);
  process.exit(1);
}

// Set up body parser
// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set up static files
// Serve static files from uploads directory
app.use('/uploads', express.static('uploads', {
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

// Set up request logging
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

// Set up routes
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
    console.error('❌ Analytics routes failed:', error.message);
  }

  // ✅ ADMIN ROUTES - Add missing admin routes
  try {
    logger.debug('Loading admin routes...');
    app.use(`${API_VERSION}/admin`, require('./routes/adminRoutes'));
    logger.debug('✅ Admin routes loaded');
  } catch (error) {
    console.error('❌ Admin routes failed:', error.message);
  }

  // 🔐 NEW: Bulletproof authentication status detection
  try {
    logger.debug('Loading auth status routes...');
    app.use(`${API_VERSION}/auth-status`, require('./routes/authStatusRoutes'));
    logger.debug('✅ Auth status routes loaded');
  } catch (error) {
    console.error('❌ Auth status routes failed:', error.message);
  }
} catch (error) {
  console.error('❌ API routes loading failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Safe onboarding routes with error handling
try {
  app.use(`${API_VERSION}/onboarding`, require('./routes/onboarding'));
  logger.debug('✅ Onboarding routes loaded');
} catch (error) {
  console.error('❌ CRITICAL: Onboarding routes failed to load:', error.message);
  console.error('❌ CRITICAL: Onboarding route error stack:', error.stack);
  
  // ❌ NO FAKE FALLBACKS! Fail properly so we can fix the real issue
  app.post(`${API_VERSION}/onboarding/complete`, (req, res) => {
    console.error('❌ CRITICAL: Onboarding completion attempted but routes failed to load!');
    console.error('❌ CRITICAL: This should never happen in production!');
    console.error('❌ CRITICAL: Check server logs and fix the onboarding route loading issue!');
    
    res.status(503).json({ 
      success: false, 
      error: { 
        code: 'SERVICE_UNAVAILABLE',
        message: 'Onboarding service temporarily unavailable. Please contact support.',
        details: 'Server configuration error - onboarding routes failed to load'
      }
    });
  });
  
  console.error('❌ CRITICAL: Added ERROR fallback for onboarding (this indicates a serious problem)');
  console.error('❌ CRITICAL: Fix required: Check why ./routes/onboarding.js is failing to load');
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
    console.error('404 handler error:', error.message);
    res.status(404).end('Not Found');
  }
});

// FIXED: Simple, working global response handler (replaces problematic ./middleware/errorHandler.js)
app.use((err, req, res, next) => {
  try {
    // Safe logging
    console.error('Request processing issue:', err.message);
    if (logger && typeof logger.error === 'function') {
      logger.error('Request processing issue:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
      });
    }

    // Handle specific response types
    const status = err.status || err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    
    res.status(status).json({
      error: {
        code,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (handlerError) {
    // Fallback if response handler itself fails
    console.error('Response handler failed:', handlerError.message);
    res.status(500).json({
      error: {
        code: 'HANDLER_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      }
    });
  }
});

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

logger.info('STARTING SERVER...');
startServer();

module.exports = app;