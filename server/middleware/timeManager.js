// middleware/timeManager.js
const moment = require('moment-timezone');
const rateLimit = require('express-rate-limit');

const timeManager = {
  addTimezone: (req, res, next) => {
    const timezone = req.headers['x-timezone'] || 'Asia/Jerusalem';
    req.userTimezone = timezone;
    next();
  },

  calculatePeriods: (req, res, next) => {
    const now = moment().tz(req.userTimezone);
    
    req.timePeriods = {
      current: now.toDate(),
      startOfDay: now.clone().startOf('day').toDate(),
      startOfWeek: now.clone().startOf('week').toDate(),
      startOfMonth: now.clone().startOf('month').toDate(),
      startOfYear: now.clone().startOf('year').toDate(),
      nextReset: now.clone().endOf('day').toDate()
    };

    next();
  },

  // Updated balance rate limit - more conservative
  balanceRateLimit: rateLimit({
    windowMs: 5000, // 5 seconds
    max: 5, // 5 requests per 5 seconds
    message: {
      status: 429,
      error: 'Too many balance calculation requests, please wait a few seconds'
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many balance calculation requests, please wait a few seconds',
        retryAfter: Math.ceil(5000 / 1000) // Seconds until next window
      });
    }
  })
};

module.exports = timeManager;