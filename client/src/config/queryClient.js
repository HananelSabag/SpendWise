/**
 * React Query Configuration - Production Optimized
 * Smart caching, deduplication, and performance monitoring
 */

import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Environment config
const isDevelopment = process.env.NODE_ENV === 'development';
const enableQueryLogging = isDevelopment && localStorage.getItem('debug_queries') === 'true';

// Cache time configurations for different data types
export const cacheConfigs = {
  // Static data - very long cache
  static: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  },
  
  // User data - medium cache
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  },
  
  // Dynamic data - short cache
  dynamic: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  },
  
  // Real-time data - minimal cache
  realtime: {
    staleTime: 0,
    cacheTime: 1 * 60 * 1000, // 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  }
};

// Query-specific configurations
export const queryConfigs = {
  // Dashboard - frequently accessed
  dashboard: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // Categories - rarely change
  categories: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // Profile - important but stable
  profile: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // Recurring transactions
  recurring: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // Transaction lists
  transactions: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // Templates
  templates: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // Exchange rates
  exchangeRates: {
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    cacheTime: 12 * 60 * 60 * 1000, // 12 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false
  }
};

// Performance monitoring
class QueryPerformanceMonitor {
  constructor() {
    this.queryTimes = new Map();
    this.slowQueryThreshold = 1000; // 1 second
  }
  
  startQuery(queryKey) {
    const key = JSON.stringify(queryKey);
    this.queryTimes.set(key, Date.now());
  }
  
  endQuery(queryKey, status) {
    const key = JSON.stringify(queryKey);
    const startTime = this.queryTimes.get(key);
    
    if (startTime) {
      const duration = Date.now() - startTime;
      this.queryTimes.delete(key);
      
      if (enableQueryLogging) {
        const emoji = status === 'success' ? '✅' : '❌';
        console.log(`${emoji} [Query] ${key} - ${duration}ms`);
      }
      
      if (duration > this.slowQueryThreshold && isDevelopment) {
        console.warn(`⚠️ Slow query detected: ${key} took ${duration}ms`);
      }
    }
  }
  
  getStats() {
    return {
      activeQueries: this.queryTimes.size,
      slowQueryThreshold: this.slowQueryThreshold
    };
  }
}

const performanceMonitor = new QueryPerformanceMonitor();

// Create optimized query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default configuration
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status && error.response.status >= 400 && error.response.status < 500) {
          return false;
        }
        
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * 2 ** attemptIndex, 4000);
      },
      
      // Network mode
      networkMode: 'offlineFirst', // Use cache first, then network
      
      // Structural sharing for performance
      structuralSharing: true,
      
      // Garbage collection
      gcTime: 30 * 60 * 1000, // 30 minutes default
      
      // Development-only logging
      ...(isDevelopment && {
        onSuccess: (data) => {
          if (enableQueryLogging) {
            console.log('✅ [Query Success]', { 
              dataSize: JSON.stringify(data).length,
              timestamp: new Date().toISOString()
            });
          }
        },
        onError: (error) => {
          console.error('❌ [Query Error]', error);
        }
      })
    },
    
    mutations: {
      // Retry configuration for mutations
      retry: 1,
      retryDelay: 1000,
      
      // Network mode
      networkMode: 'online', // Mutations require network
      
      // Global error handler
      onError: (error) => {
        // Don't show toast for validation errors (handled by components)
        if (error?.response?.data?.error?.code === 'VALIDATION_ERROR') {
          return;
        }
        
        // Show user-friendly error message
        const message = error?.response?.data?.error?.message || 'Operation failed';
        toast.error(message);
        
        if (isDevelopment) {
          console.error('❌ [Mutation Error]', error);
        }
      }
    }
  }
});

// ✅ FIX: Global query client event listeners - Remove incorrect subscribe usage
if (isDevelopment && enableQueryLogging) {
  // Use the correct event listener approach
  const originalQuery = queryClient.fetchQuery;
  const originalMutate = queryClient.executeMutation;
  
  // Wrap fetchQuery to monitor performance
  queryClient.fetchQuery = function(...args) {
    const queryKey = args[0]?.queryKey || args[0];
    performanceMonitor.startQuery(queryKey);
    
    return originalQuery.apply(this, args).then(
      (result) => {
        performanceMonitor.endQuery(queryKey, 'success');
        return result;
      },
      (error) => {
        performanceMonitor.endQuery(queryKey, 'error');
        throw error;
      }
    );
  };
}

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all queries matching a pattern
  invalidatePattern: (pattern) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.includes(pattern);
      }
    });
  },
  
  // Clear all cache
  clearAllCache: () => {
    queryClient.clear();
    toast.success('Cache cleared');
  },
  
  // Get cache statistics
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      freshQueries: queries.filter(q => !q.isStale()).length,
      errorQueries: queries.filter(q => q.state.error).length
    };
    
    if (isDevelopment) {
      console.table(stats);
    }
    
    return stats;
  },
  
  // Prefetch common queries
  prefetchCommonQueries: async () => {
    try {
      // Prefetch categories (rarely change)
      await queryClient.prefetchQuery({
        queryKey: ['categories'],
        queryFn: () => import('../utils/api').then(m => m.categoryAPI.getAll()),
        ...queryConfigs.categories
      });
    } catch (error) {
      console.warn('Failed to prefetch common queries:', error);
    }
  },
  
  // Monitor performance
  getPerformanceStats: () => performanceMonitor.getStats()
};

// Auto garbage collection
if (!isDevelopment) {
  // In production, be more aggressive with garbage collection
  setInterval(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    // Remove very old queries
    queries.forEach(query => {
      const lastUpdated = query.state.dataUpdatedAt;
      const now = Date.now();
      const age = now - lastUpdated;
      
      // Remove queries older than 2 hours that aren't being observed
      if (age > 2 * 60 * 60 * 1000 && query.getObserversCount() === 0) {
        queryClient.removeQueries(query.queryKey);
      }
    });
  }, 30 * 60 * 1000); // Every 30 minutes
}

// Export for development tools
if (isDevelopment) {
  window.queryClient = queryClient;
  window.cacheUtils = cacheUtils;
  window.queryConfigs = queryConfigs;
}

export default queryClient;