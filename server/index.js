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

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000'
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Allow CORS for uploaded files
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Request ID middleware
app.use(requestId);

// API rate limiter
app.use('/api', apiLimiter);

// Request logging
app.use((req, res, next) => {
  req.log.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await db.pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes with versioning
const API_VERSION = '/api/v1';
app.use(`${API_VERSION}/users`, require('./routes/userRoutes'));
app.use(`${API_VERSION}/transactions`, require('./routes/transactionRoutes'));

// CRITICAL UPDATE: Add category routes - FIXES GAP #4
app.use(`${API_VERSION}/categories`, require('./routes/categoryRoutes'));

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
 * Start the server only when the database is ready
 */
const startServer = async () => {
  try {
    await db.pool.query('SELECT NOW()');
    logger.info('Database connection successful');

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      // Initialize background jobs
      scheduler.init();
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // Close database connections
      await db.pool.end();
      logger.info('Database connections closed');
      
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start server
startServer();

module.exports = app;