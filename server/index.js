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

console.log('5. Setting up middleware...');
app.use(express.json());
app.use(cors());

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
});

console.log('9. Server setup complete');

module.exports = app;