/**
 * SpendWise Server - Production Ready + Mobile Support
 * Main server entry point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const requestId = require('./middleware/requestId');
const scheduler = require('./utils/scheduler');
const db = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Trust proxy for Railway deployment
app.set('trust proxy', 1); // Trust first proxy

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5000", "http://localhost:3000", "http://localhost:5173"], // Add localhost origins
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Add this line
}));

app.use(compression());

// ✅ ENHANCED CORS - Mobile + Network Support
const isLocalNetworkIP = (origin) => {
  if (!origin) return false;
  
  // חילוץ ה-IP מה-origin
  const match = origin.match(/^https?:\/\/([^:]+)/);
  if (!match) return false;
  
  const host = match[1];
  
  // בדיקת רשתות מקומיות
  const localNetworkPatterns = [
    /^192\.168\.\d{1,3}\.\d{1,3}$/,  // 192.168.x.x
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,  // 10.x.x.x
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,  // 172.16-31.x.x
    /^localhost$/,
    /^127\.0\.0\.1$/
  ];
  
  return localNetworkPatterns.some(pattern => pattern.test(host));
};

const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || []) 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // ✅ אפשר בקשות ללא origin (mobile apps, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // ✅ בדוק origins מורשים
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // ✅ NEW: אפשר רשת מקומית בפיתוח
    if (process.env.NODE_ENV !== 'production' && isLocalNetworkIP(origin)) {
      logger.info(`🌐 Allowing local network origin: ${origin}`);
      return callback(null, true);
    }
    
    // ✅ NEW: אפשר כל localhost:5173 (כולל IP)
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
  exposedHeaders: ['Content-Disposition'] // Add for file downloads
}));

// ✅ OPTIONS preflight handler
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.includes(origin) || 
      (process.env.NODE_ENV !== 'production' && isLocalNetworkIP(origin)) ||
      origin.includes(':5173') || origin.includes(':3000')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    res.status(200).end();
  } else {
    res.status(403).end();
  }
});

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add CORS headers specifically for static files before serving them
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests from allowed origins or no origin (direct access)
  if (!origin || allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && isLocalNetworkIP(origin)) ||
      (origin && (origin.includes(':5173') || origin.includes(':3000')))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin'); // Add this
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Serve static files from uploads directory with security headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Remove X-Frame-Options for images to prevent blocking
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Reduce cache time for development
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Add this
  }
}));

// Request ID middleware
app.use(requestId);

// API rate limiter
app.use('/api', apiLimiter);

// Request logging (production-safe)
if (process.env.NODE_ENV !== 'production') { // Reduce logging in production
  app.use((req, res, next) => {
    req.log.info('Request received', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      origin: req.headers.origin
    });
    next();
  });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck(); // Use dedicated health check
    res.json({ 
      status: 'healthy',
      database: dbHealth.status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0' // Include version
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString()
    });
  }
});

// API routes with versioning
const API_VERSION = '/api/v1';
app.use(`${API_VERSION}/users`, require('./routes/userRoutes'));
app.use(`${API_VERSION}/transactions`, require('./routes/transactionRoutes'));
app.use(`${API_VERSION}/categories`, require('./routes/categoryRoutes'));
app.use(`${API_VERSION}/export`, require('./routes/exportRoutes'));

// ✅ SAFE: Add onboarding routes with error handling for deployment
try {
  app.use(`${API_VERSION}/onboarding`, require('./routes/onboarding'));
  logger.info('✅ Onboarding routes loaded successfully');
} catch (error) {
  logger.error('⚠️ Failed to load onboarding routes:', error.message);
  // Add fallback onboarding endpoint
  app.post(`${API_VERSION}/onboarding/complete`, (req, res) => {
    res.json({ success: true, message: 'Onboarding completed (fallback mode)' });
  });
}

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

// Global error handler
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
      }
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

// Start server
startServer();

module.exports = app;