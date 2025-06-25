const express = require('express');
const router = express.Router();

// Simple health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check with database
router.get('/detailed', async (req, res) => {
  try {
    // Check database connection using the proper healthCheck method
    const db = require('../config/db');
    const dbHealth = await db.healthCheck();
    
    if (dbHealth.status === 'healthy') {
      res.status(200).json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        dbTimestamp: dbHealth.timestamp,
        poolStats: dbHealth.poolStats
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: dbHealth.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 