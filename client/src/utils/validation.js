// src/utils/validation.js

// Known email providers
const VALID_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'zoho.com',
  'mail.com'
];

// Business domains (optional)
const VALID_BUSINESS_DOMAINS = [
  'microsoft.com',
  'icloud.com',
  'amazon.com',
  'google.com',
  'facebook.com',
  'intel.com',
  'ibm.com'
];

// Email validation constants
const EMAIL_MAX_LENGTH = 254; // RFC 5321
const LOCAL_PART_MAX_LENGTH = 64; // RFC 5321
const MIN_DOMAIN_PARTS = 2;
const MIN_TLD_LENGTH = 2;
const MAX_TLD_LENGTH = 6;

// Transaction validation constants
const MAX_AMOUNT = 1000000; // 1 million (adjust as needed)
const MAX_DECIMAL_PLACES = 2;

/**
 * Advanced email validation
 * @param {string} email - Email to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
const validateEmail = (email) => {
  // Basic checks
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  if (email.length > EMAIL_MAX_LENGTH) {
    return { isValid: false, error: 'Email is too long' };
  }

  // Split email into local part and domain
  const [localPart, domain] = email.split('@');
  
  if (!localPart || !domain) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Local part validation
  if (localPart.length > LOCAL_PART_MAX_LENGTH) {
    return { isValid: false, error: 'Username part is too long' };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(localPart)) {
    return { isValid: false, error: 'Username contains invalid characters' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, error: 'Username cannot start or end with a dot' };
  }

  if (localPart.includes('..')) {
    return { isValid: false, error: 'Username cannot contain consecutive dots' };
  }

  // Domain validation
  const domainParts = domain.split('.');
  
  if (domainParts.length < MIN_DOMAIN_PARTS) {
    return { isValid: false, error: 'Invalid domain format' };
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < MIN_TLD_LENGTH || tld.length > MAX_TLD_LENGTH) {
    return { isValid: false, error: 'Invalid top-level domain' };
  }

  if (!/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, error: 'Top-level domain must contain only letters' };
  }

  // Known domains validation
  const isKnownDomain = [...VALID_EMAIL_DOMAINS, ...VALID_BUSINESS_DOMAINS].includes(domain.toLowerCase());
  if (!isKnownDomain) {
    return { 
      isValid: false, 
      error: 'Please use a known email provider (e.g., Gmail, Outlook, Yahoo)' 
    };
  }

  return { isValid: true, error: null };
};

// Username validation
const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 50) {
    return { isValid: false, error: 'Username is too long' };
  }

  if (!/^[a-zA-Z0-9\s]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers and spaces' };
  }

  return { isValid: true, error: null };
};

// Password validation
const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 16) {
    return { isValid: false, error: 'Password is too long' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true, error: null };
};

// Single field validation - for registration
const validateField = (field, value, language = 'en', password = '') => {
  switch (field) {
    case 'username': {
      const result = validateUsername(value);
      return result.error ? (language === 'he' ? 'שם משתמש לא תקין' : result.error) : null;
    }

    case 'email': {
      const result = validateEmail(value);
      return result.error ? (language === 'he' ? 'כתובת אימייל לא תקינה' : result.error) : null;
    }

    case 'password': {
      const result = validatePassword(value);
      return result.error ? (language === 'he' ? 'סיסמה לא תקינה' : result.error) : null;
    }

    case 'confirmPassword': {
      if (value !== password) {
        return language === 'he' ? 'הסיסמאות אינן תואמות' : 'Passwords do not match';
      }
      break;
    }
  }
  return null;
};

// Validation for login form
const validateLoginField = (field, value, language) => {
  if (!value) {
    return language === 'he' ? 'שדה זה נדרש' : 'This field is required';
  }

  if (field === 'email') {
    const result = validateEmail(value);
    return result.error ? (language === 'he' ? 'כתובת אימייל לא תקינה' : result.error) : null;
  }

  if (field === 'password' && value.length < 8) {
    return language === 'he' ? 'הסיסמה חייבת להיות באורך של 8 תווים לפחות' : 'Password must be at least 8 characters';
  }

  return null;
};

// Full form validation for registration
const validateRegistration = (formData, language = 'en') => {
  const errors = {};

  // Username validation
  const usernameError = validateField('username', formData.username, language);
  if (usernameError) errors.username = usernameError;

  // Email validation
  const emailError = validateField('email', formData.email, language);
  if (emailError) errors.email = emailError;

  // Password validation
  const passwordError = validateField('password', formData.password, language);
  if (passwordError) errors.password = passwordError;

  // Confirm password validation
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = language === 'he'
      ? 'הסיסמאות אינן תואמות'
      : 'Passwords do not match';
  }

  return errors;
};

/**
 * Validates a transaction amount
 * @param {string|number} amount - Amount to validate
 * @param {string} language - Language code (en/he)
 * @returns {string|null} Error message or null if valid
 */
const validateTransactionAmount = (amount, language = 'en') => {
  // Basic validation - must be a number
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return language === 'he' ? 'סכום נדרש' : 'Amount is required';
  }

  // Check for max amount
  if (parseFloat(amount) > MAX_AMOUNT) {
    return language === 'he'
      ? `סכום לא תקין (מקסימום: ${MAX_AMOUNT})` 
      : `Invalid amount (Max: ${MAX_AMOUNT})`;
  }

  // Check decimal places
  if (String(amount).includes('.')) {
    const decimalPart = String(amount).split('.')[1];
    if (decimalPart && decimalPart.length > MAX_DECIMAL_PLACES) {
      return language === 'he'
        ? `סכום לא תקין (מקסימום ${MAX_DECIMAL_PLACES} ספרות אחרי הנקודה)`
        : `Invalid amount (Max ${MAX_DECIMAL_PLACES} decimal places)`;
    }
  }

  return null; // No error
};

/**
 * Formats an input as a currency amount
 * Limits decimal places and prevents invalid characters
 * @param {string} value - Current input value
 * @returns {string} Formatted value
 */
const formatAmountInput = (value) => {
  // Remove all non-numeric characters except decimal point
  let formatted = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const decimalPointCount = (formatted.match(/\./g) || []).length;
  if (decimalPointCount > 1) {
    const parts = formatted.split('.');
    formatted = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places
  if (formatted.includes('.')) {
    const [whole, decimal] = formatted.split('.');
    formatted = whole + '.' + decimal.slice(0, MAX_DECIMAL_PLACES);
  }
  
  return formatted;
};

export {
  validateField,
  validateLoginField,
  validateRegistration,
  validateEmail,
  validateUsername,
  validatePassword,
  validateTransactionAmount,
  formatAmountInput,
  MAX_AMOUNT,
  MAX_DECIMAL_PLACES
};