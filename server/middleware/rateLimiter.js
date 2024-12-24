const rateLimit = require('express-rate-limit');

// Create a limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // Limit each IP to 100 requests per window
    message: {
        error: 'Too many requests, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false
});

// Specific limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // Limit each IP to 5 login attempts per hour
    message: {
        error: 'Too many login attempts, please try again later.'
    }
});

module.exports = {
    apiLimiter,
    authLimiter
};