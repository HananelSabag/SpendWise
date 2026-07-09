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
  
  // Registration-time password policy — same bar as password set/change/reset
  // (8+ chars, at least one letter and one number). Login deliberately does
  // NOT use this: existing accounts with older, shorter passwords must still
  // be able to sign in.
  password: (password) => {
    if (!password || password.length < 8) return false;
    if (password.length > 128) return false; // Prevent DoS
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return false;
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
  
  // Generic positive-integer ID validator (Postgres int4 range). Used for
  // transaction IDs and any other numeric route param — not category-specific
  // despite the name history (categories were dropped in the bank-sync refactor).
  positiveInt: (id) => {
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
    const { email, password, firstName, lastName } = req.body;
    // Auto-generate username from firstName+lastName when not explicitly provided
    if (!req.body.username && (firstName || lastName)) {
      const base = `${(firstName || '').trim()}${(lastName || '').trim()}`
        .replace(/\s+/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'user';
      req.body.username = base + Math.floor(1000 + Math.random() * 9000);
    }
    const { username } = req.body;
    
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

    // Normalize email to lowercase for consistent handling
    req.body.email = email.toLowerCase().trim();

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
        'Password must be 8-128 characters and include at least one letter and one number'
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

    // Normalize email to lowercase for consistent handling
    req.body.email = email.toLowerCase().trim();

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

    // Normalize email to lowercase for consistent handling
    req.body.email = email.toLowerCase().trim();

    next();
  },

  /**
   * Validate transaction creation/update
   */
  transaction: (req, res, next) => {
    const { amount, description, date } = req.body;

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
    
    if (!validators.positiveInt(id)) {
      return res.status(400).json(createValidationError(
        'INVALID_TRANSACTION_ID',
        'Invalid transaction ID'
      ));
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
   * Validate Google OAuth authentication
   */
  googleAuth: (req, res, next) => {
    const { idToken, email, name, picture } = req.body;

    // Check required fields
    if (!idToken) {
      return res.status(400).json(createValidationError(
        'MISSING_ID_TOKEN',
        'Google ID token is required'
      ));
    }

    // ✅ Email is not strictly required - server can extract from idToken
    // Only validate email format if provided
    if (email && !validators.email(email)) {
      return res.status(400).json(createValidationError(
        'INVALID_EMAIL',
        'Invalid email format'
      ));
    }

    // Normalize email if provided
    if (email) {
      req.body.email = email.toLowerCase().trim();
    }

    // Validate ID token format (basic check)
    if (typeof idToken !== 'string' || idToken.length < 50) {
      return res.status(400).json(createValidationError(
        'INVALID_ID_TOKEN',
        'Invalid Google ID token format'
      ));
    }

    // Validate name if provided
    if (name && (typeof name !== 'string' || name.length > 100)) {
      return res.status(400).json(createValidationError(
        'INVALID_NAME',
        'Name must be a string with maximum 100 characters'
      ));
    }

    // Validate picture URL if provided
    if (picture && (typeof picture !== 'string' || !picture.startsWith('http'))) {
      return res.status(400).json(createValidationError(
        'INVALID_PICTURE_URL',
        'Picture must be a valid URL'
      ));
    }

    next();
  },

  /**
   * Validate email verification request
   */
  emailVerification: (req, res, next) => {
    const { token, email } = req.body;

    if (!token) {
      return res.status(400).json(createValidationError(
        'MISSING_TOKEN',
        'Verification token is required'
      ));
    }

    if (typeof token !== 'string' || token.length < 10) {
      return res.status(400).json(createValidationError(
        'INVALID_TOKEN',
        'Invalid verification token format'
      ));
    }

    if (email) {
      if (!validators.email(email)) {
        return res.status(400).json(createValidationError(
          'INVALID_EMAIL',
          'Invalid email format'
        ));
      }
      req.body.email = email.toLowerCase().trim();
    }

    next();
  },

  /**
   * Validate profile update request
   */
  profileUpdate: (req, res, next) => {
    const {
      username, email, first_name, last_name, firstName, lastName, phone, bio,
      location, website, birthday, preferences, billing_cycle_day
    } = req.body;

    // ✅ NORMALIZE: Handle both camelCase and snake_case field names
    if (firstName !== undefined) req.body.first_name = firstName;
    if (lastName !== undefined) req.body.last_name = lastName;

    // Validate username if provided
    if (username !== undefined) {
      if (!validators.username(username)) {
        return res.status(400).json(createValidationError(
          'INVALID_USERNAME',
          'Username must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and underscores'
        ));
      }
      req.body.username = username.toLowerCase().trim();
    }

    // Validate email if provided
    if (email !== undefined) {
      if (!validators.email(email)) {
        return res.status(400).json(createValidationError(
          'INVALID_EMAIL',
          'Invalid email format'
        ));
      }
      req.body.email = email.toLowerCase().trim();
    }

    // ✅ FIXED: Validate names after normalization - check both original and normalized values
    const finalFirstName = req.body.first_name || first_name;
    const finalLastName = req.body.last_name || last_name;

    if (finalFirstName !== undefined && (typeof finalFirstName !== 'string' || finalFirstName.length > 100)) {
      return res.status(400).json(createValidationError(
        'INVALID_FIRST_NAME',
        'First name must be a string with maximum 100 characters'
      ));
    }

    if (finalLastName !== undefined && (typeof finalLastName !== 'string' || finalLastName.length > 100)) {
      return res.status(400).json(createValidationError(
        'INVALID_LAST_NAME',
        'Last name must be a string with maximum 100 characters'
      ));
    }

    // Validate phone if provided
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 20)) {
      return res.status(400).json(createValidationError(
        'INVALID_PHONE',
        'Phone must be a string with maximum 20 characters'
      ));
    }

    // Validate bio if provided
    if (bio !== undefined && (typeof bio !== 'string' || bio.length > 500)) {
      return res.status(400).json(createValidationError(
        'INVALID_BIO',
        'Bio must be a string with maximum 500 characters'
      ));
    }

    // Validate location if provided
    if (location !== undefined && (typeof location !== 'string' || location.length > 255)) {
      return res.status(400).json(createValidationError(
        'INVALID_LOCATION',
        'Location must be a string with maximum 255 characters'
      ));
    }

    // Validate website if provided
    if (website !== undefined && (typeof website !== 'string' || !website.match(/^https?:\/\/.+/))) {
      return res.status(400).json(createValidationError(
        'INVALID_WEBSITE',
        'Website must be a valid URL starting with http:// or https://'
      ));
    }

    // Validate birthday if provided
    if (birthday !== undefined && !validators.date(birthday)) {
      return res.status(400).json(createValidationError(
        'INVALID_BIRTHDAY',
        'Birthday must be a valid date'
      ));
    }

    // Validate billing_cycle_day if provided — the day of the month that
    // starts the user's financial period (e.g. salary day), used instead of
    // a rolling calendar-day window for dashboard calculations.
    if (billing_cycle_day !== undefined) {
      const day = Number(billing_cycle_day);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        return res.status(400).json(createValidationError(
          'INVALID_BILLING_CYCLE_DAY',
          'billing_cycle_day must be an integer between 1 and 31'
        ));
      }
      req.body.billing_cycle_day = day;
    }

    // Validate preferences if provided
    if (preferences !== undefined) {
      try {
        if (typeof preferences === 'string') {
          JSON.parse(preferences);
        } else if (typeof preferences !== 'object') {
          throw new Error('Invalid format');
        }
      } catch (e) {
        return res.status(400).json(createValidationError(
          'INVALID_PREFERENCES',
          'Preferences must be a valid JSON object'
        ));
      }
    }

    next();
  },

  // ✅ Password Set Validation (for OAuth users setting first password)
  passwordSet: (req, res, next) => {
    const { newPassword } = req.body;

    // Required fields check
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password is required',
          details: {
            newPassword: 'New password is required'
          }
        }
      });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters long',
          details: { newPassword: 'Password too short' }
        }
      });
    }

    // Additional password strength checks
    if (!/(?=.*[a-z])/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must contain at least one lowercase letter',
          details: { newPassword: 'Missing lowercase letter' }
        }
      });
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must contain at least one uppercase letter',
          details: { newPassword: 'Missing uppercase letter' }
        }
      });
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must contain at least one number',
          details: { newPassword: 'Missing number' }
        }
      });
    }

    next();
  },

  // ✅ Password Change Validation
  passwordChange: (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    // Required fields check
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current password and new password are required',
          details: {
            currentPassword: !currentPassword ? 'Current password is required' : null,
            newPassword: !newPassword ? 'New password is required' : null
          }
        }
      });
    }

    // Password strength validation
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password must be at least 8 characters long',
          details: { newPassword: 'Password too short' }
        }
      });
    }

    // Password complexity check
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password must contain at least one letter and one number',
          details: { newPassword: 'Password not complex enough' }
        }
      });
    }

    // Prevent same password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password must be different from current password',
          details: { newPassword: 'New password cannot be same as current' }
        }
      });
    }

    next();
  }
};

module.exports = validate;