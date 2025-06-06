/**
 * Validation Middleware - Production Ready
 * Comprehensive input validation with security
 * @module middleware/validate
 */

const errorCodes = require('../utils/errorCodes');
const logger = require('../utils/logger');

/**
 * Validation helper functions
 */
const validators = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  password: (password) => {
    if (!password || password.length < 6) return false;
    if (password.length > 128) return false; // Prevent DoS
    return true;
  },
  
  username: (username) => {
    if (!username || username.length < 2) return false;
    if (username.length > 50) return false;
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(username)) return false;
    return true;
  },
  
  amount: (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 999999999.99;
  },
  
  description: (description) => {
    if (!description || typeof description !== 'string') return false;
    if (description.trim().length === 0) return false;
    if (description.length > 500) return false;
    return true;
  },
  
  date: (date) => {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime()) && dateObj.getFullYear() >= 1900 && dateObj.getFullYear() <= 2100;
  },
  
  categoryId: (id) => {
    const num = parseInt(id);
    return !isNaN(num) && num > 0 && num <= 2147483647;
  }
};

/**
 * Create validation error response
 */
const createValidationError = (code, message, details = null) => {
  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  };
};

const validate = {
  /**
   * Validate user registration
   */
  userRegistration: (req, res, next) => {
    const { email, password, username } = req.body;
    
    // Email validation
    if (!email) {
      return res.status(400).json(createValidationError(
        'MISSING_EMAIL',
        'Email is required'
      ));
    }
    
    if (!validators.email(email)) {
      return res.status(400).json(createValidationError(
        'INVALID_EMAIL',
        'Invalid email format'
      ));
    }

    // Password validation
    if (!password) {
      return res.status(400).json(createValidationError(
        'MISSING_PASSWORD',
        'Password is required'
      ));
    }
    
    if (!validators.password(password)) {
      return res.status(400).json(createValidationError(
        'WEAK_PASSWORD',
        'Password must be 6-128 characters long'
      ));
    }

    // Username validation
    if (!username) {
      return res.status(400).json(createValidationError(
        'MISSING_USERNAME',
        'Username is required'
      ));
    }
    
    if (!validators.username(username)) {
      return res.status(400).json(createValidationError(
        'INVALID_USERNAME',
        'Username must be 2-50 characters, alphanumeric only'
      ));
    }

    next();
  },

  /**
   * Validate user login
   */
  userLogin: (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json(createValidationError(
        'MISSING_CREDENTIALS',
        'Email and password are required'
      ));
    }

    if (!validators.email(email)) {
      return res.status(400).json(createValidationError(
        'INVALID_EMAIL',
        'Invalid email format'
      ));
    }

    next();
  },

  /**
   * Validate email for resend verification
   */
  resendVerification: (req, res, next) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json(createValidationError(
        'MISSING_EMAIL',
        'Email is required'
      ));
    }

    if (!validators.email(email)) {
      return res.status(400).json(createValidationError(
        'INVALID_EMAIL',
        'Invalid email format'
      ));
    }

    next();
  },

  /**
   * Validate transaction creation/update
   */
  transaction: (req, res, next) => {
    const { amount, description, date, category_id } = req.body;

    // Amount validation (required for creation, optional for update)
    if (amount !== undefined) {
      if (!validators.amount(amount)) {
        return res.status(400).json(createValidationError(
          'INVALID_AMOUNT',
          'Amount must be a positive number up to 999,999,999.99'
        ));
      }
    }

    // Description validation
    if (description !== undefined) {
      if (!validators.description(description)) {
        return res.status(400).json(createValidationError(
          'INVALID_DESCRIPTION',
          'Description must be 1-500 characters long'
        ));
      }
    }

    // Date validation
    if (date !== undefined) {
      if (!validators.date(date)) {
        return res.status(400).json(createValidationError(
          'INVALID_DATE',
          'Invalid date format or date out of range (1900-2100)'
        ));
      }
    }

    // Category ID validation
    if (category_id !== undefined && category_id !== null) {
      if (!validators.categoryId(category_id)) {
        return res.status(400).json(createValidationError(
          'INVALID_CATEGORY',
          'Invalid category ID'
        ));
      }
    }

    next();
  },

  /**
   * Validate recurring transaction parameters
   */
  recurring: (req, res, next) => {
    const { is_recurring, recurring_interval, day_of_month, day_of_week } = req.body;

    if (is_recurring) {
      // Interval validation
      if (!recurring_interval) {
        return res.status(400).json(createValidationError(
          'MISSING_INTERVAL',
          'Recurring interval is required for recurring transactions'
        ));
      }
      
      if (!['daily', 'weekly', 'monthly'].includes(recurring_interval)) {
        return res.status(400).json(createValidationError(
          'INVALID_INTERVAL',
          'Interval must be daily, weekly, or monthly'
        ));
      }

      // Day of month validation for monthly
      if (recurring_interval === 'monthly' && day_of_month !== undefined) {
        const day = parseInt(day_of_month);
        if (isNaN(day) || day < 1 || day > 31) {
          return res.status(400).json(createValidationError(
            'INVALID_DAY_OF_MONTH',
            'Day of month must be between 1 and 31'
          ));
        }
      }

      // Day of week validation for weekly
      if (recurring_interval === 'weekly' && day_of_week !== undefined) {
        const day = parseInt(day_of_week);
        if (isNaN(day) || day < 0 || day > 6) {
          return res.status(400).json(createValidationError(
            'INVALID_DAY_OF_WEEK',
            'Day of week must be between 0 (Sunday) and 6 (Saturday)'
          ));
        }
      }
    }

    next();
  },

  /**
   * Validate transaction type parameter
   */
  transactionType: (req, res, next) => {
    const { type } = req.params;
    
    if (!type || !['expense', 'income'].includes(type)) {
      return res.status(400).json(createValidationError(
        'INVALID_TRANSACTION_TYPE',
        'Transaction type must be expense or income'
      ));
    }

    next();
  },

  /**
   * Validate numeric ID parameters
   */
  transactionId: (req, res, next) => {
    const { id } = req.params;
    
    if (!validators.categoryId(id)) {
      return res.status(400).json(createValidationError(
        'INVALID_TRANSACTION_ID',
        'Invalid transaction ID'
      ));
    }

    next();
  },

  /**
   * Validate category ID parameter
   */
  categoryId: (req, res, next) => {
    const { id } = req.params;
    
    if (!validators.categoryId(id)) {
      return res.status(400).json(createValidationError(
        'INVALID_CATEGORY_ID',
        'Invalid category ID'
      ));
    }

    next();
  },

  /**
   * Validate template ID parameter
   */
  templateId: (req, res, next) => {
    const { id } = req.params;
    
    if (!validators.categoryId(id)) {
      return res.status(400).json(createValidationError(
        'INVALID_TEMPLATE_ID',
        'Invalid template ID'
      ));
    }

    next();
  },

  /**
   * Validate category creation
   */
  categoryCreate: (req, res, next) => {
    const { name, type, description } = req.body;
    
    // Name validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json(createValidationError(
        'MISSING_CATEGORY_NAME',
        'Category name is required'
      ));
    }
    
    if (name.length > 100) {
      return res.status(400).json(createValidationError(
        'CATEGORY_NAME_TOO_LONG',
        'Category name must be less than 100 characters'
      ));
    }

    // Type validation
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json(createValidationError(
        'INVALID_CATEGORY_TYPE',
        'Category type must be income or expense'
      ));
    }

    // Description validation (optional)
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string' || description.length > 500) {
        return res.status(400).json(createValidationError(
          'INVALID_CATEGORY_DESCRIPTION',
          'Category description must be less than 500 characters'
        ));
      }
    }

    next();
  },

  /**
   * Validate category update
   */
  categoryUpdate: (req, res, next) => {
    const { name, type, description } = req.body;
    
    // At least one field must be provided
    if (name === undefined && type === undefined && description === undefined) {
      return res.status(400).json(createValidationError(
        'NO_UPDATE_DATA',
        'At least one field must be provided for update'
      ));
    }

    // Name validation (if provided)
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
        return res.status(400).json(createValidationError(
          'INVALID_CATEGORY_NAME',
          'Category name must be 1-100 characters'
        ));
      }
    }

    // Type validation (if provided)
    if (type !== undefined && !['income', 'expense'].includes(type)) {
      return res.status(400).json(createValidationError(
        'INVALID_CATEGORY_TYPE',
        'Category type must be income or expense'
      ));
    }

    // Description validation (if provided)
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string' || description.length > 500) {
        return res.status(400).json(createValidationError(
          'INVALID_CATEGORY_DESCRIPTION',
          'Category description must be less than 500 characters'
        ));
      }
    }

    next();
  },

  /**
   * Validate date range query parameters
   */
  dateRange: (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    if (startDate && !validators.date(startDate)) {
      return res.status(400).json(createValidationError(
        'INVALID_START_DATE',
        'Invalid start date format'
      ));
    }

    if (endDate && !validators.date(endDate)) {
      return res.status(400).json(createValidationError(
        'INVALID_END_DATE',
        'Invalid end date format'
      ));
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json(createValidationError(
        'INVALID_DATE_RANGE',
        'Start date must be before end date'
      ));
    }

    next();
  },

  /**
   * Validate search query
   */
  searchQuery: (req, res, next) => {
    const { q, limit } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json(createValidationError(
        'INVALID_SEARCH_QUERY',
        'Search query must be at least 2 characters'
      ));
    }

    if (q.length > 100) {
      return res.status(400).json(createValidationError(
        'SEARCH_QUERY_TOO_LONG',
        'Search query must be less than 100 characters'
      ));
    }

    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json(createValidationError(
          'INVALID_LIMIT',
          'Limit must be between 1 and 100'
        ));
      }
    }

    next();
  },

  /**
   * Validate period parameter
   */
  periodParam: (req, res, next) => {
    const { period } = req.params;
    
    if (!['day', 'week', 'month', 'year', '3months'].includes(period)) {
      return res.status(400).json(createValidationError(
        'INVALID_PERIOD',
        'Period must be day, week, month, year, or 3months'
      ));
    }

    next();
  },

  /**
   * Validate skip dates
   */
  skipDates: (req, res, next) => {
    const { dates } = req.body;
    
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json(createValidationError(
        'INVALID_SKIP_DATES',
        'Dates must be a non-empty array'
      ));
    }

    if (dates.length > 100) {
      return res.status(400).json(createValidationError(
        'TOO_MANY_SKIP_DATES',
        'Cannot skip more than 100 dates at once'
      ));
    }

    for (const date of dates) {
      if (!validators.date(date)) {
        return res.status(400).json(createValidationError(
          'INVALID_SKIP_DATE',
          'All dates must be valid date strings'
        ));
      }
    }

    next();
  },

  /**
   * Validate skip date (single)
   */
  skipDate: (req, res, next) => {
    const { skipDate } = req.body;
    
    if (!skipDate) {
      return res.status(400).json(createValidationError(
        'MISSING_SKIP_DATE',
        'Skip date is required'
      ));
    }

    if (!validators.date(skipDate)) {
      return res.status(400).json(createValidationError(
        'INVALID_SKIP_DATE',
        'Invalid skip date format'
      ));
    }

    next();
  },

  /**
   * Validate transaction filters
   */
  transactionFilters: (req, res, next) => {
    const { type, page, limit, sortBy, sortOrder } = req.query;
    
    // Type validation
    if (type && !['expense', 'income'].includes(type)) {
      return res.status(400).json(createValidationError(
        'INVALID_TYPE_FILTER',
        'Type filter must be expense or income'
      ));
    }

    // Pagination validation
    if (page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json(createValidationError(
          'INVALID_PAGE',
          'Page must be a positive integer'
        ));
      }
    }

    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json(createValidationError(
          'INVALID_LIMIT',
          'Limit must be between 1 and 100'
        ));
      }
    }

    // Sort validation
    if (sortBy && !['date', 'amount', 'description', 'created_at'].includes(sortBy)) {
      return res.status(400).json(createValidationError(
        'INVALID_SORT_BY',
        'Sort by must be date, amount, description, or created_at'
      ));
    }

    if (sortOrder && !['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      return res.status(400).json(createValidationError(
        'INVALID_SORT_ORDER',
        'Sort order must be ASC or DESC'
      ));
    }

    next();
  },

  /**
   * Validate category filters
   */
  categoryFilters: (req, res, next) => {
    const { type } = req.query;
    
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json(createValidationError(
        'INVALID_CATEGORY_TYPE_FILTER',
        'Category type filter must be income or expense'
      ));
    }

    next();
  }
};

module.exports = validate;