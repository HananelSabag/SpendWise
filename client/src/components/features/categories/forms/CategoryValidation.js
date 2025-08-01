/**
 * ✅ CATEGORY VALIDATION - CENTRALIZED LOGIC
 * Single source of truth for all category validation
 * Features: Comprehensive validation, Internationalization, Custom rules
 * @version 3.0.0 - NEW CLEAN ARCHITECTURE
 */

import { getIconComponent } from '../../../../config/categoryIcons';

/**
 * 📋 Validation Rules Configuration
 */
const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_&]+$/
  },
  description: {
    required: false,
    maxLength: 200
  },
  icon: {
    required: true,
    validator: (icon) => {
      // Icon validation simplified - getIconComponent always returns a valid component
      return !!icon;
    }
  },
  color: {
    required: true,
    pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  type: {
    required: true,
    options: ['expense', 'income']
  }
};

/**
 * 🏷️ Validate Name Field
 */
export const validateName = (name, existingNames = [], t) => {
  const errors = [];
  
  if (!name || name.trim() === '') {
    errors.push(t('validation.name.required', { fallback: 'Category name is required' }));
    return errors;
  }

  const trimmed = name.trim();
  
  if (trimmed.length < VALIDATION_RULES.name.minLength) {
    errors.push(t('validation.name.tooShort', { 
      fallback: `Name must be at least ${VALIDATION_RULES.name.minLength} characters`,
      min: VALIDATION_RULES.name.minLength 
    }));
  }

  if (trimmed.length > VALIDATION_RULES.name.maxLength) {
    errors.push(t('validation.name.tooLong', { 
      fallback: `Name cannot exceed ${VALIDATION_RULES.name.maxLength} characters`,
      max: VALIDATION_RULES.name.maxLength 
    }));
  }

  if (!VALIDATION_RULES.name.pattern.test(trimmed)) {
    errors.push(t('validation.name.invalidCharacters', { 
      fallback: 'Name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands' 
    }));
  }

  // Check for duplicates (case-insensitive)
  if (existingNames.some(existing => 
    existing.toLowerCase() === trimmed.toLowerCase()
  )) {
    errors.push(t('validation.name.duplicate', { 
      fallback: 'A category with this name already exists' 
    }));
  }

  return errors;
};

/**
 * 📝 Validate Description Field
 */
export const validateDescription = (description, t) => {
  const errors = [];
  
  if (description && description.trim().length > VALIDATION_RULES.description.maxLength) {
    errors.push(t('validation.description.tooLong', { 
      fallback: `Description cannot exceed ${VALIDATION_RULES.description.maxLength} characters`,
      max: VALIDATION_RULES.description.maxLength 
    }));
  }

  return errors;
};

/**
 * 🎨 Validate Icon Field
 */
export const validateIcon = (icon, t) => {
  const errors = [];
  
  if (!icon) {
    errors.push(t('validation.icon.required', { fallback: 'Icon is required' }));
    return errors;
  }

  // Use the validator function to check if icon is valid
  if (!VALIDATION_RULES.icon.validator(icon)) {
    errors.push(t('validation.icon.invalid', { 
      fallback: 'Selected icon is not valid' 
    }));
  }

  return errors;
};

/**
 * 🎨 Validate Color Field
 */
export const validateColor = (color, t) => {
  const errors = [];
  
  if (!color) {
    errors.push(t('validation.color.required', { fallback: 'Color is required' }));
    return errors;
  }

  if (!VALIDATION_RULES.color.pattern.test(color)) {
    errors.push(t('validation.color.invalid', { 
      fallback: 'Color must be a valid hex code (e.g., #3B82F6)' 
    }));
  }

  return errors;
};

/**
 * 📊 Validate Type Field
 */
export const validateType = (type, t) => {
  const errors = [];
  
  if (!type) {
    errors.push(t('validation.type.required', { fallback: 'Category type is required' }));
    return errors;
  }

  if (!VALIDATION_RULES.type.options.includes(type)) {
    errors.push(t('validation.type.invalid', { 
      fallback: 'Invalid category type selected' 
    }));
  }

  return errors;
};

/**
 * 🔍 Main Validation Function
 */
export const validateCategory = (formData, existingCategories = [], t = (key, options) => options?.fallback || key) => {
  const errors = {};
  let isValid = true;

  // Get existing category names for duplicate checking
  const existingNames = existingCategories.map(cat => cat.name);

  // Validate name
  const nameErrors = validateName(formData.name, existingNames, t);
  if (nameErrors.length > 0) {
    errors.name = nameErrors;
    isValid = false;
  }

  // Validate description
  const descriptionErrors = validateDescription(formData.description, t);
  if (descriptionErrors.length > 0) {
    errors.description = descriptionErrors;
    isValid = false;
  }

  // Validate icon
  const iconErrors = validateIcon(formData.icon, t);
  if (iconErrors.length > 0) {
    errors.icon = iconErrors;
    isValid = false;
  }

  // Validate color
  const colorErrors = validateColor(formData.color, t);
  if (colorErrors.length > 0) {
    errors.color = colorErrors;
    isValid = false;
  }

  // Validate type
  const typeErrors = validateType(formData.type, t);
  if (typeErrors.length > 0) {
    errors.type = typeErrors;
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