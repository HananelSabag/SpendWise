// src/utils/validationSchemas.js - Zod validation schemas
import { z } from 'zod';

/**
 * User schemas
 */
export const userSchemas = {
  login: z.object({
    email: z.string()
      .email('Invalid email address')
      .max(254, 'Email too long'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password too long')
  }),
  
  register: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username too long')
      .regex(/^[a-zA-Z0-9\s]+$/, 'Username can only contain letters, numbers and spaces'),
    email: z.string()
      .email('Invalid email address')
      .max(254, 'Email too long'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(16, 'Password must be at most 16 characters')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
  
  updateProfile: z.object({
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username too long')
      .optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(16, 'Password must be at most 16 characters')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .optional(),
  }).refine((data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  }, {
    message: "Current password required to change password",
    path: ["currentPassword"],
  }),
  
  // ✅ JSONB preferences validation - פתרון מלא לפער
  preferences: {
    // Profile picture validation - רק זה קיים
    profilePicture: {
      required: false,
      fileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
      message: 'Invalid image file'
    },
    
    // Notification preferences (nested JSONB)
    notifications: {
      email: { type: 'boolean', default: true },
      push: { type: 'boolean', default: true },
      sms: { type: 'boolean', default: false },
      marketing: { type: 'boolean', default: false },
      updates: { type: 'boolean', default: true },
      reminders: { type: 'boolean', default: true }
    },
    
    // Privacy preferences (nested JSONB)  
    privacy: {
      showProfile: { type: 'boolean', default: true },
      showStats: { type: 'boolean', default: false },
      allowAnalytics: { type: 'boolean', default: true }
    },

    // ✅ Custom preferences validator
    custom: {
      validateCustomKey: (key) => {
        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key) && key.length <= 50;
      },
      validateCustomValue: (value, type) => {
        switch (type) {
          case 'string':
            return typeof value === 'string' && value.length <= 500;
          case 'number':
            return typeof value === 'number' && !isNaN(value);
          case 'boolean':
            return typeof value === 'boolean';
          case 'json':
            try {
              if (typeof value === 'string') JSON.parse(value);
              return true;
            } catch {
              return false;
            }
          default:
            return false;
        }
      }
    }
  }
};

/**
 * Transaction schemas
 */
export const transactionSchemas = {
  create: z.object({
    amount: z.number()
      .positive('Amount must be positive')
      .max(1000000, 'Amount too large'),
    description: z.string()
      .min(1, 'Description required')
      .max(255, 'Description too long'),
    date: z.date()
      .max(new Date(), 'Date cannot be in the future'),
    category_id: z.number().optional().nullable(),
    is_recurring: z.boolean().default(false),
    recurring_interval: z.enum(['daily', 'weekly', 'monthly']).optional(),
    day_of_month: z.number()
      .min(1)
      .max(31)
      .optional(),
    recurring_end_date: z.date().optional().nullable()
  }).refine((data) => {
    if (data.is_recurring && !data.recurring_interval) {
      return false;
    }
    return true;
  }, {
    message: "Recurring interval required for recurring transactions",
    path: ["recurring_interval"],
  }),
  
  update: z.object({
    amount: z.number()
      .positive('Amount must be positive')
      .max(1000000, 'Amount too large')
      .optional(),
    description: z.string()
      .min(1, 'Description required')
      .max(255, 'Description too long')
      .optional(),
    date: z.date()
      .max(new Date(), 'Date cannot be in the future')
      .optional(),
    category_id: z.number().optional().nullable(),
    updateFuture: z.boolean().optional()
  }),
  
  quickAdd: z.object({
    amount: z.string()
      .min(1, 'Amount is required')
      .transform(val => amountValidation.formatAmountInput(val))
      .refine(val => amountValidation.validateAmount(val), 'Invalid amount'),
    type: z.enum(['expense', 'income'])
  })
};

/**
 * Recurring template schemas
 */
export const templateSchemas = {
  create: z.object({
    type: z.enum(['expense', 'income']),
    amount: z.number()
      .positive('Amount must be positive')
      .max(1000000, 'Amount too large'),
    description: z.string()
      .min(1, 'Description required')
      .max(255, 'Description too long'),
    category_id: z.number().optional().nullable(),
    interval_type: z.enum(['daily', 'weekly', 'monthly']),
    day_of_month: z.number()
      .min(1)
      .max(31)
      .optional()
      .nullable(),
    day_of_week: z.number()
      .min(0)
      .max(6)
      .optional()
      .nullable(),
    start_date: z.date(),
    end_date: z.date().optional().nullable()
  }),
  
  skipDates: z.object({
    dates: z.array(z.date()).min(1, 'At least one date required')
  })
};

/**
 * Search schemas
 */
export const searchSchemas = {
  transactions: z.object({
    q: z.string().min(2, 'Search term must be at least 2 characters'),
    limit: z.number().min(1).max(100).default(50)
  }),
  
  filters: z.object({
    type: z.enum(['expense', 'income']).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    categoryId: z.number().optional(),
    templateId: z.number().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(50),
    sortBy: z.enum(['date', 'amount', 'description']).default('date'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC')
  })
};

/**
 * Preference schemas
 */
export const preferenceSchemas = {
  update: z.object({
    language: z.enum(['en', 'he']).optional(),
    currency: z.enum(['ILS', 'USD']).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      recurring: z.boolean().optional()
    }).optional(),
    privacy: z.object({
      showBalance: z.boolean().optional(),
      allowAnalytics: z.boolean().optional()
    }).optional()
  })
};

/**
 * Helper function to validate with Zod
 */
export const validate = (schema, data) => {
  try {
    return {
      success: true,
      data: schema.parse(data)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {})
      };
    }
    throw error;
  }
};

/**
 * React Hook Form resolver
 */
export const zodResolver = (schema) => async (data) => {
  try {
    const validated = await schema.parseAsync(data);
    return {
      values: validated,
      errors: {}
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        values: {},
        errors: error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = {
            type: err.code,
            message: err.message
          };
          return acc;
        }, {})
      };
    }
    throw error;
  }
};

/**
 * Amount validation helpers
 */
export const amountValidation = {
  formatAmountInput: (value) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  },
  
  validateAmount: (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 1000000;
  }
};

/**
 * Profile image validation helpers
 */
export const imageValidation = {
  validateFile: (file) => {
    if (!file) return { valid: false, error: 'No file provided' };
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG and WebP are allowed' };
    }
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    
    return { valid: true };
  },
  
  createImagePreview: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  
  // ✅ פונקציה נוספת לטיפול בתמונות
  getImageDimensions: (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
};