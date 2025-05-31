// src/config/queryClient.js
import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Create query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Retry failed requests once
      retry: 1,
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Global error handler
      onError: (error) => {
        const message = error.response?.data?.error?.message || 'An error occurred';
        console.error('Query error:', error);
        // Don't show toast for 401 errors (handled by interceptor)
        if (error.response?.status !== 401) {
          toast.error(message);
        }
      }
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Global error handler
      onError: (error) => {
        const message = error.response?.data?.error?.message || 'Operation failed';
        console.error('Mutation error:', error);
        toast.error(message);
      },
      // Global success handler
      onSuccess: () => {
        // Can be overridden per mutation
      }
    }
  }
});

// Invalidation helpers
export const invalidateQueries = {
  // Invalidate all transaction related queries
  transactions: () => {
    queryClient.invalidateQueries(['transactions']);
    queryClient.invalidateQueries(['dashboard']);
    queryClient.invalidateQueries(['recurring']);
    queryClient.invalidateQueries(['templates']);
  },
  
  // Invalidate dashboard data
  dashboard: (date) => {
    if (date) {
      queryClient.invalidateQueries(['dashboard', date]);
    } else {
      queryClient.invalidateQueries(['dashboard']);
    }
  },
  
  // Invalidate user data
  profile: () => {
    queryClient.invalidateQueries(['profile']);
  },
  
  // Invalidate all data
  all: () => {
    queryClient.invalidateQueries();
  }
};

export default queryClient;