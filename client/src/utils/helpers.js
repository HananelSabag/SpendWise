/**
 * 🛠️ UTILITY HELPERS - Core utilities for SpendWise
 * Includes className merging, date formatting, and validation helpers
 * @module utils/helpers
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatRelative, formatDistance, isToday, isYesterday, isTomorrow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

/**
 * 🎨 Merge CSS class names intelligently
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs) {
  try {
    const result = twMerge(clsx(inputs));
    return result;
  } catch (error) {
    console.error('🎨 cn() error:', error);
    return '';
  }
}

/**
 * Currency formatting utilities
 */
export const currency = {
  format: (amount, currencyCode = 'ILS', locale = 'he-IL') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },
  
  formatCompact: (amount, currencyCode = 'ILS') => {
    const formatter = new Intl.NumberFormat('en', {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    
    const symbol = currencyCode === 'ILS' ? '₪' : '$';
    return symbol + formatter.format(amount);
  },
  
  parse: (value) => {
    // Remove all non-numeric characters except decimal point
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }
};

/**
 * Date formatting utilities
 */
export const dateHelpers = {
  // ✅ FIX: Enhanced format function with better error handling
  format: (date, formatString = 'PP', locale = 'en') => {
    if (!date) {
      console.warn('dateHelpers.format: No date provided');
      return '';
    }

    try {
      // Convert to Date object if it's a string
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('dateHelpers.format: Invalid date provided:', date);
        return 'Invalid Date';
      }

      const formatLocale = locale === 'he' ? he : enUS;
      return format(dateObj, formatString, { locale: formatLocale });
    } catch (error) {
      console.error('dateHelpers.format error:', error, 'Date:', date, 'Format:', formatString);
      return 'Invalid Date';
    }
  },
  
  formatRelative: (date, locale = 'he') => {
    const dateLocale = locale === 'he' ? he : enUS;
    const dateObj = new Date(date);
    
    if (isToday(dateObj)) {
      return locale === 'he' ? 'היום' : 'Today';
    }
    if (isYesterday(dateObj)) {
      return locale === 'he' ? 'אתמול' : 'Yesterday';
    }
    if (isTomorrow(dateObj)) {
      return locale === 'he' ? 'מחר' : 'Tomorrow';
    }
    
    return formatRelative(dateObj, new Date(), { locale: dateLocale });
  },
  
  formatDistance: (date, locale = 'he') => {
    const dateLocale = locale === 'he' ? he : enUS;
    return formatDistance(new Date(date), new Date(), { 
      addSuffix: true,
      locale: dateLocale 
    });
  },
  
  normalize: (date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return d;
  },
  
  // ✅ FIXED: Use local timezone methods instead of UTC to prevent date shifts
  toISODate: (date) => {
    if (!date) return null;
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('[helpers] Invalid date provided:', date);
      return null;
    }
    
    // Use local timezone methods to prevent timezone shifts
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
};

/**
 * Number utilities
 */
export const numbers = {
  formatPercent: (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  },
  
  formatCompact: (value) => {
    return new Intl.NumberFormat('en', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  },
  
  clamp: (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  },
  
  formatAmount: (amount) => {
    // Check if amount is null, undefined or NaN
    if (amount == null || isNaN(amount)) {
      return '0';
    }
    
    // Convert to number and handle decimals
    const num = parseFloat(amount);
    return num.toFixed(Math.abs(num) < 1000 ? 2 : 0);
  },

  parseAmount: (value) => {
    if (!value) return 0;
    // Remove all non-numeric characters except decimal point and minus
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  },
  
  // ✅ הוספת פונקציות חדשות לעיבוד נתוני dashboard
  ensureNumber: (value, defaultValue = 0) => {
    if (value == null || isNaN(value)) return defaultValue;
    return typeof value === 'number' ? value : parseFloat(value) || defaultValue;
  },
  
  // עיבוד balance data מהשרת
  processBalanceData: (rawBalance) => {
    if (!rawBalance || typeof rawBalance !== 'object') {
      return { income: 0, expenses: 0, balance: 0, total: 0 };
    }
    
    const income = numbers.ensureNumber(rawBalance.income);
    const expenses = numbers.ensureNumber(rawBalance.expenses);
    const balance = numbers.ensureNumber(rawBalance.balance, income - expenses);
    
    return {
      income,
      expenses,
      balance,
      total: balance // for backward compatibility
    };
  },
  
    // Extract transactions array from various response formats
  ensureTransactionsArray: (data) => {
    if (Array.isArray(data)) return data;
    if (data?.transactions && Array.isArray(data.transactions)) return data.transactions;
    if (data?.data?.transactions && Array.isArray(data.data.transactions)) return data.data.transactions;
    return [];
  },
  
  // ✅ ADD: Optimize data processing
  memoizeDataTransform: (data, transformFn, dependencies = []) => {
    // Simple memoization for data transforms
    const cacheKey = JSON.stringify(dependencies);
    const cached = window._dataCache?.[cacheKey];
    
    if (cached && cached.data === data) {
      return cached.result;
    }
    
    const result = transformFn(data);
    
    if (!window._dataCache) window._dataCache = {};
    window._dataCache[cacheKey] = { data, result };
    
    return result;
  },

  // Performance monitoring utility (production-safe)
  monitorPerformance: (componentName = 'Unknown') => {
    if (process.env.NODE_ENV === 'production') return { end: () => {} };
    
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Only log in development
        if (process.env.NODE_ENV !== 'production' && duration > 100) {
          console.warn(`Component ${componentName} took ${duration.toFixed(2)}ms to render`);
        }
      }
    };
  },



};

/**
 * String utilities
 */
export const strings = {
  truncate: (str, length = 50, suffix = '...') => {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },
  
  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  
  slugify: (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
};

/**
 * Array utilities
 */
export const arrays = {
  groupBy: (array, key) => {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  },
  
  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  unique: (array, key) => {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const val = item[key];
        if (seen.has(val)) return false;
        seen.add(val);
        return true;
      });
    }
    return [...new Set(array)];
  }
};

/**
 * Color utilities
 */
export const colors = {
  // Generate color from string (for avatars, categories, etc.)
  fromString: (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  },
  
  // Get contrasting text color
  getContrastColor: (bgColor) => {
    // Convert to RGB
    const color = bgColor.charAt(0) === '#' ? bgColor.substring(1, 7) : bgColor;
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }
};

/**
 * Storage utilities with expiration
 */
export const storage = {
  set: (key, value, expirationMinutes = null) => {
    const item = {
      value,
      timestamp: Date.now(),
      expiration: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  
  get: (key) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    try {
      const item = JSON.parse(itemStr);
      
      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch {
      return null;
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.clear();
  }
};

/**
 * Debounce function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * 🚀 PRODUCTION-SAFE LOGGING UTILITIES
 * @version 2.0.0
 */

// Development-only logger
export const devLogger = {
  log: (...args) => {
    if (import.meta.env.MODE === 'development') {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (import.meta.env.MODE === 'development') {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    if (import.meta.env.MODE === 'development') {
      console.error(...args);
    }
  },
  
  group: (...args) => {
    if (import.meta.env.MODE === 'development') {
      console.group(...args);
    }
  },
  
  groupEnd: () => {
    if (import.meta.env.MODE === 'development') {
      console.groupEnd();
    }
  },
  
  table: (...args) => {
    if (import.meta.env.MODE === 'development') {
      console.table(...args);
    }
  }
};

// Performance-aware logger
export const perfLogger = {
  time: (label) => {
    if (import.meta.env.MODE === 'development') {
      console.time(label);
    }
  },
  
  timeEnd: (label) => {
    if (import.meta.env.MODE === 'development') {
      console.timeEnd(label);
    }
  },
  
  logPerformance: (operation, duration, threshold = 100) => {
    if (import.meta.env.MODE === 'development' && duration > threshold) {
      console.warn(`⚠️ Slow operation detected: ${operation} took ${duration}ms`);
    }
  }
};

// Export all utilities
export default {
  currency,
  dateHelpers,
  numbers,
  strings,
  arrays,
  colors,
  storage,
  debounce,
  cn,
  generateId,
  deepClone,
  isEmpty
};