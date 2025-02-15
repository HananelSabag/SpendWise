const rateLimit = require('express-rate-limit');

// General API Limiter
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100 // Limit each IP to 100 requests per minute
});

// Create specific limiters for different routes
const createTransactionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per minute
    message: {
        status: 429,
        error: 'Too many transactions created from this IP, please try again after a minute'
    }
});

const getSummaryLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 5, // Limit each IP to 5 requests per 10 seconds
    message: {
        status: 429,
        error: 'Too many summary requests from this IP, please try again after 10 seconds'
    }
});

const getTransactionsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // Limit each IP to 30 requests per minute
    message: {
        status: 429,
        error: 'Too many transaction requests from this IP, please try again after a minute'
    }
});

module.exports = {
    apiLimiter,
    createTransactionLimiter,
    getSummaryLimiter,
    getTransactionsLimiter
};