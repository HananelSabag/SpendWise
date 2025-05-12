const db = require('./config/db');
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');  
const { apiLimiter } = require('./middleware/rateLimiter');
// Add the scheduler import
const scheduler = require('./utils/scheduler'); 
const logger = require('./utils/logger');
const app = express();

// CORS configuration
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware for parsing JSON bodies
app.use(express.json());

// Rate limiting for API routes
app.use('/api', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
    logger.info('Request received:', {
        method: req.method,
        url: req.url,
        ip: req.ip
    });
    next();
});

// API Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

// 404 Handler - for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

// Custom function to ensure database is ready before starting
const startServer = async () => {
  try {
    // Test database connection
    await db.pool.query('SELECT NOW()');
    logger.info('Database connection successful');
    
    // Start the Express server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      
      // Initialize the scheduler after server is running
      scheduler.init();
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('HTTP server closed');
        db.pool.end();
      });
    });

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;