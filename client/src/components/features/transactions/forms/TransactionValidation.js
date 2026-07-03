/**
 * ✅ TRANSACTION VALIDATION - CENTRALIZED LOGIC
 * Single source of truth for all transaction validation
 * Features: Comprehensive validation, Internationalization, Custom rules
 * @version 3.0.0 - NEW CLEAN ARCHITECTURE
 */

/**
 * 📋 Validation Rules Configuration
 */
const VALIDATION_RULES = {
  amount: {
    required: true,
    min: 0.01,
    max: 1000000,
    pattern: /^\d*\.?\d{0,2}$/
  },
  description: {
    required: true,
    minLength: 1,
    maxLength: 255
  },
  date: {
    required: true,
    // Date should not be more than 1 year in the future
    maxFuture: 365,
    // Date should not be more than 5 years in the past
    maxPast: 1825
  }
};

/**
 * 🔍 Validate Amount Field
 */
export const validateAmount = (amount, t) => {
  const errors = [];
  
  if (!amount || amount === '') {
    errors.push(t('validation.amount.required', { fallback: 'Amount is required' }));
    return errors;
  }

  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    errors.push(t('validation.amount.invalid', { fallback: 'Amount must be a valid number' }));
    return errors;
  }

  if (numAmount < VALIDATION_RULES.amount.min) {
    errors.push(t('validation.amount.tooSmall', { 
      fallback: `Amount must be at least ${VALIDATION_RULES.amount.min}`,
      min: VALIDATION_RULES.amount.min 
    }));
  }

  if (numAmount > VALIDATION_RULES.amount.max) {
    errors.push(t('validation.amount.tooLarge', { 
      fallback: `Amount cannot exceed ${VALIDATION_RULES.amount.max}`,
      max: VALIDATION_RULES.amount.max 
    }));
  }

  if (!VALIDATION_RULES.amount.pattern.test(amount)) {
    errors.push(t('validation.amount.format', { 
      fallback: 'Amount can have at most 2 decimal places' 
    }));
  }

  return errors;
};

/**
 * 📝 Validate Description Field
 */
export const validateDescription = (description, t) => {
  const errors = [];
  
  if (!description || description.trim() === '') {
    errors.push(t('validation.description.required', { 
      fallback: 'Description is required' 
    }));
    return errors;
  }

  const trimmed = description.trim();
  
  if (trimmed.length < VALIDATION_RULES.description.minLength) {
    errors.push(t('validation.description.tooShort', { 
      fallback: 'Description is too short',
      min: VALIDATION_RULES.description.minLength 
    }));
  }

  if (trimmed.length > VALIDATION_RULES.description.maxLength) {
    errors.push(t('validation.description.tooLong', { 
      fallback: `Description cannot exceed ${VALIDATION_RULES.description.maxLength} characters`,
      max: VALIDATION_RULES.description.maxLength 
    }));
  }

  return errors;
};

/**
 * 📅 Validate Date Field
 */
export const validateDate = (date, t) => {
  const errors = [];
  
  if (!date) {
    errors.push(t('validation.date.required', { fallback: 'Date is required' }));
    return errors;
  }

  const transactionDate = new Date(date);
  const today = new Date();
  const maxFutureDate = new Date();
  const maxPastDate = new Date();
  
  maxFutureDate.setDate(today.getDate() + VALIDATION_RULES.date.maxFuture);
  maxPastDate.setDate(today.getDate() - VALIDATION_RULES.date.maxPast);

  if (isNaN(transactionDate.getTime())) {
    errors.push(t('validation.date.invalid', { fallback: 'Date is invalid' }));
    return errors;
  }

  if (transactionDate > maxFutureDate) {
    errors.push(t('validation.date.tooFuture', { 
      fallback: 'Date cannot be more than 1 year in the future' 
    }));
  }

  if (transactionDate < maxPastDate) {
    errors.push(t('validation.date.tooPast', { 
      fallback: 'Date cannot be more than 5 years in the past' 
    }));
  }

  return errors;
};

/**
 * 🔍 Main Validation Function
 */
export const validateTransaction = (formData, t = (key, options) => options?.fallback || key) => {
  const errors = {};
  let isValid = true;

  // Validate amount
  const amountErrors = validateAmount(formData.amount, t);
  if (amountErrors.length > 0) {
    errors.amount = amountErrors;
    isValid = false;
  }

  // Validate description
  const descriptionErrors = validateDescription(formData.description, t);
  if (descriptionErrors.length > 0) {
    errors.description = descriptionErrors;
    isValid = false;
  }

  // Validate date
  const dateErrors = validateDate(formData.date, t);
  if (dateErrors.length > 0) {
    errors.date = dateErrors;
    isValid = false;
  }

  return {
    isValid,
    errors,
    hasErrors: !isValid
  };
};

/**
 * 📋 Get Validation Errors for Display
 */
export const getValidationErrors = (errors) => {
  const flatErrors = {};
  
  Object.keys(errors).forEach(field => {
    if (Array.isArray(errors[field])) {
      flatErrors[field] = errors[field][0]; // First error for display
    } else {
      flatErrors[field] = errors[field];
    }
  });
  
  return flatErrors;
};

/**
 * ✅ Check if Field has Error
 */
export const hasFieldError = (field, errors) => {
  return errors[field] && errors[field].length > 0;
};

/**
 * 📝 Get Field Error Message
 */
export const getFieldError = (field, errors) => {
  if (!hasFieldError(field, errors)) return null;
  return Array.isArray(errors[field]) ? errors[field][0] : errors[field];
};

/**
 * 🎯 Validation Rules Export for Components
 */
export { VALIDATION_RULES }; 