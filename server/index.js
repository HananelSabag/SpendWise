const db = require('./config/db');
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');  
const { apiLimiter } = require('./middleware/rateLimiter');
const app = express();

// CORS configuration
// We define specific origins for development - in production this should be your domain
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
    console.log('Request received:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.method === 'POST' ? req.body : undefined
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
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

module.exports = app;