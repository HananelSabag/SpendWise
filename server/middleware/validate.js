/**
 * Validation Middleware
 * Input validation for requests
 * @module middleware/validate
 */

const errorCodes = require('../utils/errorCodes');

const validate = {
  /**
   * Validate user registration/login
   */
  user: (req, res, next) => {
    const { email, password, username } = req.body;
    
    // Email validation
    if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      });
    }

    // Password validation
    if (password && password.length < 6) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters'
        }
      });
    }

    // Username validation (if provided)
    if (username !== undefined && username.length < 2) {
      return res.status(400).json({
        error: {
          code: 'INVALID_USERNAME',
          message: 'Username must be at least 2 characters'
        }
      });
    }

    next();
  },

  /**
   * Validate transaction creation/update
   */
  transaction: (req, res, next) => {
    const { amount, description, date } = req.body;

    // Amount validation
    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number'
        }
      });
    }

    // Description validation
    if (description !== undefined && !description.trim()) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DESCRIPTION',
          message: 'Description cannot be empty'
        }
      });
    }

    // Date validation
    if (date && isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format'
        }
      });
    }

    next();
  },

  /**
   * Validate recurring transaction
   */
  recurring: (req, res, next) => {
    const { is_recurring, recurring_interval, day_of_month } = req.body;

    if (is_recurring) {
      // Interval validation
      if (!recurring_interval || !['daily', 'weekly', 'monthly'].includes(recurring_interval)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INTERVAL',
            message: 'Invalid recurring interval. Must be daily, weekly, or monthly'
          }
        });
      }

      // Day of month validation for monthly
      if (recurring_interval === 'monthly' && day_of_month) {
        if (!Number.isInteger(day_of_month) || day_of_month < 1 || day_of_month > 31) {
          return res.status(400).json({
            error: {
              code: 'INVALID_DAY',
              message: 'Day of month must be between 1 and 31'
            }
          });
        }
      }
    }

    next();
  }
};

module.exports = validate;