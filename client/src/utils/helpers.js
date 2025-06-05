// src/utils/helpers.js - Enhanced utility functions
import { format, formatDistance, formatRelative, isToday, isYesterday, isTomorrow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

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
  format: (date, formatStr = 'PPP', locale = 'he') => {
    const dateLocale = locale === 'he' ? he : enUS;
    return format(new Date(date), formatStr, { locale: dateLocale });
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
  
  // ✅ הוסף פונקציית דיבאג חדשה
  debugHookUsage: () => {
    console.group('🔍 [HOOK-DEBUG] Dashboard Hook Analysis');
    console.log('📊 Active hooks in useDashboard:', window._dashboardHookCount || 0);
    console.log('🎯 Primary hook ID:', window._primaryDashboardHook || 'none');
    console.log('📋 All components using dashboard data:');
    
    // בדוק אילו קומפוננטים עשויים להשתמש בהוק
    const possibleComponents = [
      'BalancePanel',
      'RecentTransactions', 
      'ActionsPanel',
      'QuickActionsBar',
      'Dashboard'
    ];
    
    possibleComponents.forEach(comp => {
      const elements = document.querySelectorAll(`[data-component="${comp}"]`);
      if (elements.length > 0) {
        console.log(`   ✅ ${comp}: ${elements.length} instance(s)`);
      }
    });
    
    console.groupEnd();
  },

  // ✅ הוסף פונקציות debug נוספות
  validateTransactionsList: (data, componentName = 'Unknown') => {
    console.group(`🔍 [${componentName}] Transaction Data Validation`);
    
    console.log('Raw data:', data);
    console.log('Is array:', Array.isArray(data));
    console.log('Length:', data?.length);
    console.log('Type:', typeof data);
    
    if (data && !Array.isArray(data)) {
      console.error('❌ Expected array but got:', typeof data);
      console.log('Data keys:', Object.keys(data));
    }
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('✅ Sample transaction:', data[0]);
    }
    
    console.groupEnd();
    
    return Array.isArray(data) ? data : [];
  },

  // ✅ פונקציה לתיקון נתוני transactions
  ensureTransactionsArray: (data) => {
    if (Array.isArray(data)) return data;
    if (data?.transactions && Array.isArray(data.transactions)) return data.transactions;
    if (data?.data?.transactions && Array.isArray(data.data.transactions)) return data.data.transactions;
    
    console.warn('[helpers] Could not extract transactions array from:', data);
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

  // ✅ IMPROVED: Better API call debugging
  debugAPIUsage: (componentName = 'Unknown') => {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.group(`🔍 [API-DEBUG] ${componentName} Hook Usage`);
    
    // Track React Query cache
    const queryCache = window.queryClient?.getQueryCache();
    if (queryCache) {
      const queries = queryCache.getAll();
      console.log('📊 Active queries:', queries.length);
      
      const dashboardQueries = queries.filter(q => 
        q.queryKey[0] === 'dashboard'
      );
      console.log('🏠 Dashboard queries:', dashboardQueries.length);
      
      if (dashboardQueries.length > 1) {
        console.warn('⚠️ Multiple dashboard queries detected!');
        dashboardQueries.forEach((q, i) => {
          console.log(`   ${i + 1}. Key:`, q.queryKey, 'State:', q.state.status);
        });
      }
    }
    
    console.groupEnd();
  },

  // ✅ ADD: Performance monitoring utility
  monitorPerformance: (componentName = 'Unknown') => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (duration > 100) { // Log only slow renders
          console.warn(`⚠️ [PERF] ${componentName} took ${duration.toFixed(2)}ms to render`);
        } else if (duration > 50) {
          console.log(`🟡 [PERF] ${componentName} took ${duration.toFixed(2)}ms to render`);
        }
      }
    };
  },

  // ✅ ENHANCED: Real-time cache monitoring with automatic tracking
  trackCacheHits: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const queryCache = window.queryClient?.getQueryCache();
    if (!queryCache) {
      console.warn('📊 [CACHE-STATS] QueryClient not found on window');
      return;
    }
    
    const queries = queryCache.getAll();
    const now = Date.now();
    
    // ✅ IMPROVED: Better freshness calculation based on actual staleTime
    const freshQueries = queries.filter(q => {
      if (!q.state.data) return false;
      
      const dataAge = now - q.state.dataUpdatedAt;
      const queryType = q.queryKey[0];
      
      // Use actual staleTime from query or default
      const staleTime = q.options?.staleTime || 5 * 60 * 1000;
      
      return dataAge < staleTime;
    });
    
    const cacheStats = {
      total: queries.length,
      fresh: freshQueries.length,
      stale: queries.filter(q => q.state.isStale).length,
      loading: queries.filter(q => q.state.isFetching).length,
      cached: queries.filter(q => q.state.data && !q.state.isFetching).length,
      withData: queries.filter(q => q.state.data).length
    };
    
    // ✅ IMPROVED: Query breakdown with age information
    const queryBreakdown = queries.reduce((acc, query) => {
      const queryType = query.queryKey[0] || 'unknown';
      const dataAge = query.state.data ? now - query.state.dataUpdatedAt : 0;
      
      if (!acc[queryType]) {
        acc[queryType] = { count: 0, avgAge: 0, fresh: 0 };
      }
      
      acc[queryType].count++;
      acc[queryType].avgAge += dataAge;
      
      if (freshQueries.includes(query)) {
        acc[queryType].fresh++;
      }
      
      return acc;
    }, {});
    
    // Calculate averages
    Object.keys(queryBreakdown).forEach(type => {
      const typeData = queryBreakdown[type];
      typeData.avgAge = Math.round(typeData.avgAge / typeData.count / 1000); // Convert to seconds
      typeData.freshRate = Math.round((typeData.fresh / typeData.count) * 100);
    });
    
    // ✅ IMPROVED: Better hit rate calculation
    const relevantQueries = queries.filter(q => q.state.data); // Only count queries with data
    const hitRate = relevantQueries.length > 0 
      ? (freshQueries.length / relevantQueries.length) * 100 
      : 0;
    
    console.group('📊 [CACHE-STATS] Query Cache Performance Analysis');
    console.log(`🎯 Total queries: ${cacheStats.total}`);
    console.log(`✅ Fresh data: ${cacheStats.fresh}`);
    console.log(`📦 Cached & ready: ${cacheStats.cached}`);
    console.log(`⚠️ Stale queries: ${cacheStats.stale}`);
    console.log(`🔄 Currently loading: ${cacheStats.loading}`);
    console.log(`🎉 Effective hit rate: ${hitRate.toFixed(1)}%`);
    console.log('📋 Query breakdown by type:');
    
    Object.entries(queryBreakdown).forEach(([type, data]) => {
      console.log(`   ${type}: ${data.count} queries, ${data.freshRate}% fresh, avg age: ${data.avgAge}s`);
    });
    
    // ✅ ADD: Memory usage estimation
    const estimatedMemory = queries.reduce((total, query) => {
      if (query.state.data) {
        return total + JSON.stringify(query.state.data).length;
      }
      return total;
    }, 0);
    
    console.log(`💾 Estimated cache memory: ${(estimatedMemory / 1024).toFixed(1)} KB`);
    
    // ✅ IMPROVED: Better performance insights
    if (hitRate < 50) {
      console.warn(`⚠️ Low cache hit rate (${hitRate.toFixed(1)}%). Consider increasing staleTime for frequently accessed data.`);
    } else if (hitRate > 80) {
      console.log(`🎉 Excellent cache performance! ${hitRate.toFixed(1)}% hit rate.`);
    }
    
    console.groupEnd();
    
    return {
      ...cacheStats,
      hitRate,
      queryBreakdown,
      estimatedMemoryKB: estimatedMemory / 1024
    };
  },

  // ✅ IMPROVED: Smarter cache monitoring with better thresholds
  startCacheMonitoring: () => {
    if (process.env.NODE_ENV !== 'development' || window._cacheMonitorActive) return;
    
    window._cacheMonitorActive = true;
    console.log('🚀 [CACHE-MONITOR] Starting automatic cache monitoring...');
    
    // Monitor every 30 seconds
    const interval = setInterval(() => {
      const stats = numbers.trackCacheHits();
      
      // ✅ IMPROVED: Better thresholds for warnings
      if (stats && stats.hitRate < 50 && stats.withData > 5) { // Only warn if we have enough data
        console.warn(`⚠️ [PERFORMANCE] Cache hit rate could be improved: ${stats.hitRate.toFixed(1)}%`);
      }
      
      // Alert if too many loading queries (reduced threshold)
      if (stats && stats.loading > 2) {
        console.warn(`⚠️ [PERFORMANCE] Multiple concurrent requests: ${stats.loading}`);
      }
      
      // ✅ ADD: Positive feedback for good performance
      if (stats && stats.hitRate > 80) {
        console.log(`🚀 [PERFORMANCE] Excellent cache performance: ${stats.hitRate.toFixed(1)}% hit rate`);
      }
    }, 30000);
    
    // Stop monitoring after 10 minutes
    setTimeout(() => {
      clearInterval(interval);
      window._cacheMonitorActive = false;
      console.log('⏹️ [CACHE-MONITOR] Stopped automatic monitoring');
    }, 10 * 60 * 1000);
    
    return interval;
  },

  // ✅ IMPROVED: Better navigation benchmarking with automatic start/stop
  benchmarkNavigation: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // ✅ ADD: Auto-timeout to prevent false slow navigation warnings
    let isActive = true;
    const timeout = setTimeout(() => {
      isActive = false;
    }, 10000); // 10 second timeout
    
    return {
      end: (routeName = 'Unknown') => {
        if (!isActive) {
          console.log(`⚡ [NAV-BENCHMARK] ${routeName} - Benchmark expired (user navigation)`);
          return { duration: -1, memoryDiff: 0 };
        }
        
        clearTimeout(timeout);
        
        const endTime = performance.now();
        const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        const duration = endTime - startTime;
        const memoryDiff = endMemory - startMemory;
        
        console.group(`⚡ [NAV-BENCHMARK] ${routeName} Performance`);
        console.log(`⏱️ Navigation time: ${duration.toFixed(2)}ms`);
        console.log(`💾 Memory change: ${(memoryDiff / 1024 / 1024).toFixed(2)} MB`);
        
        // ✅ IMPROVED: Better performance thresholds
        if (duration > 500) { // More reasonable threshold
          console.warn('⚠️ Navigation could be faster');
        } else if (duration < 100) {
          console.log('🚀 Excellent navigation speed!');
        } else {
          console.log('✅ Good navigation performance');
        }
        
        console.groupEnd();
        
        return { duration, memoryDiff };
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
 * Class names utility (like clsx)
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
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