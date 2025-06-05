// src/config/queryClient.js
import { QueryClient } from '@tanstack/react-query';

// ✅ FIX: Create base configuration first to avoid circular reference
const baseQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes default
  gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
  refetchOnWindowFocus: false,
  refetchOnMount: false, // ✅ CRITICAL: Prevent unnecessary refetches on navigation
  refetchOnReconnect: true,
  retry: (failureCount, error) => {
    // Don't retry on authentication errors
    if (error?.response?.status && [401, 403, 404].includes(error.response.status)) {
      return false;
    }
    return failureCount < 2;
  },
};

// ✅ ADD: Development-only handlers
const developmentHandlers = process.env.NODE_ENV === 'development' ? {
  onError: (error) => {
    console.error('🔥 [QUERY-ERROR]', error);
  },
  onSuccess: (data, query) => {
    if (localStorage.getItem('debug_queries') === 'true') {
      console.log('✅ [QUERY-SUCCESS]', query.queryKey, 'Data length:', 
        Array.isArray(data) ? data.length : typeof data === 'object' ? Object.keys(data).length : 'scalar'
      );
    }
  }
} : {};

// ✅ OPTIMIZED: Query client configuration for better navigation performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...baseQueryConfig,
      ...developmentHandlers
    },
    mutations: {
      retry: 1,
    },
  },
});

// ✅ ENHANCED: Much longer cache times for better hit rates
export const queryConfigs = {
  dashboard: {
    staleTime: 30 * 60 * 1000, // 30 minutes instead of 20
    gcTime: 60 * 60 * 1000, // 1 hour instead of 45 minutes
  },
  categories: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours instead of 12
    gcTime: 48 * 60 * 60 * 1000, // 48 hours instead of 24
  },
  profile: {
    staleTime: 12 * 60 * 60 * 1000, // 12 hours instead of 6
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  recurring: {
    staleTime: 60 * 60 * 1000, // 1 hour instead of 45 minutes
    gcTime: 4 * 60 * 60 * 1000, // 4 hours instead of 3
  },
  periodTransactions: {
    staleTime: 30 * 60 * 1000, // 30 minutes instead of 15
    gcTime: 60 * 60 * 1000, // 1 hour instead of 30 minutes
  },
  transactions: {
    staleTime: 20 * 60 * 1000, // 20 minutes instead of 10
    gcTime: 40 * 60 * 1000, // 40 minutes instead of 20
  },
  // ✅ ADD: New configurations for better caching
  templates: {
    staleTime: 2 * 60 * 60 * 1000, // 2 hours
    gcTime: 8 * 60 * 60 * 1000, // 8 hours
  },
  exchangeRates: {
    staleTime: 4 * 60 * 60 * 1000, // 4 hours - currency rates change infrequently
    gcTime: 12 * 60 * 60 * 1000, // 12 hours
  }
};

// ✅ FIX: Export queryClient as both named and default
export default queryClient;