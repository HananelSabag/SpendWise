/**
 * Main application file - Production Ready
 * Entry point for the server, sets up middleware and routes
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import routes
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const exportRoutes = require('./routes/exportRoutes'); // ✅ ADD: Export routes
const onboardingRoutes = require('./routes/onboarding'); // ✅ ADD: Onboarding routes
const healthRoutes = require('./routes/healthRoutes'); // ✅ ADD: Health check routes

// Initialize express app
const app = express();

// ❌ CORS Configuration moved to index.js - We're using the one in index.js now
// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests with no origin (mobile apps, curl, etc.)
//     if (!origin) return callback(null, true);
//     
//     const allowedOrigins = process.env.ALLOWED_ORIGINS 
//       ? process.env.ALLOWED_ORIGINS.split(',')
//       : ['http://localhost:5173', 'http://localhost:3000'];
//     
//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// };

// Middleware
// app.use(cors(corsOptions)); // ❌ REMOVED - We're using the one in index.js now
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP for now to avoid issues with email links
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Rate limiting - apply to all requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Health check routes (before auth middleware - no rate limiting)
app.use('/health', healthRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Handle client-side routing - IMPORTANT: This catches all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Log iPhone specific requests for debugging
    const userAgent = req.get('User-Agent');
    if (userAgent && userAgent.includes('iPhone')) {
      console.log('iPhone request to:', req.path, 'User-Agent:', userAgent);
    }
    
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/export', exportRoutes); // ✅ ADD: Register export routes
app.use('/api/v1/onboarding', onboardingRoutes); // ✅ ADD: Register onboarding routes

// Error handling middleware
app.use(errorHandler);

// Export the app for testing and deployment
module.exports = app;