/**
 * Base useApi Hook - Smart Query Management
 * Foundation for all data fetching with caching and optimization
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { queryKeys, mutationKeys } from '../utils/api';

// Query configurations for different data types
const queryConfigs = {
  // Static data - long cache
  static: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 48 * 60 * 60 * 1000, // 48 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // User data - medium cache
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // Dynamic data - short cache
  dynamic: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  },
  
  // Real-time data - no cache
  realtime: {
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  }
};

/**
 * Base hook for API queries with smart caching
 */
export const useApiQuery = (key, queryFn, options = {}) => {
  const {
    config = 'user',
    enabled = true,
    onSuccess,
    onError,
    ...queryOptions
  } = options;
  
  const configOptions = queryConfigs[config] || queryConfigs.user;
  
  return useQuery({
    queryKey: key,
    queryFn,
    enabled,
    ...configOptions,
    ...queryOptions,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('[API Query Error]', error);
      onError?.(error);
    }
  });
};

/**
 * Base hook for API mutations with optimistic updates
 */
export const useApiMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    invalidateKeys = [],
    optimisticUpdate,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage,
    ...mutationOptions
  } = options;
  
  return useMutation({
    mutationFn,
    ...mutationOptions,
    onMutate: async (variables) => {
      if (optimisticUpdate) {
        // Cancel outgoing refetches
        const keysToCancel = Array.isArray(optimisticUpdate.queryKey) 
          ? [optimisticUpdate.queryKey] 
          : optimisticUpdate.queryKey;
          
        await queryClient.cancelQueries(keysToCancel);
        
        // Snapshot previous value
        const previousData = queryClient.getQueryData(optimisticUpdate.queryKey);
        
        // Optimistically update
        queryClient.setQueryData(optimisticUpdate.queryKey, (old) => 
          optimisticUpdate.updater(old, variables)
        );
        
        // Return context with snapshot
        return { previousData, queryKey: optimisticUpdate.queryKey };
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate specified queries
      if (invalidateKeys.length > 0) {
        invalidateKeys.forEach(key => {
          queryClient.invalidateQueries(key);
        });
      }
      
      // Show success toast
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      
      // Call custom success handler
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      
      // Show error toast
      if (showErrorToast) {
        const message = error.response?.data?.error?.message || error.message || 'Operation failed';
        toast.error(message);
      }
      
      // Call custom error handler
      onError?.(error, variables, context);
    },
    onSettled: () => {
      // Always refetch after mutation settles
      if (invalidateKeys.length > 0) {
        queryClient.invalidateQueries(invalidateKeys[0]);
      }
    }
  });
};

/**
 * Hook for paginated queries
 */
export const usePaginatedQuery = (baseKey, queryFn, options = {}) => {
  const {
    page = 1,
    limit = 50,
    filters = {},
    config = 'dynamic',
    ...queryOptions
  } = options;
  
  // ✅ FIX: Ensure baseKey is always an array
  const normalizedBaseKey = Array.isArray(baseKey) ? baseKey : [baseKey];
  const queryKey = [...normalizedBaseKey, { page, limit, ...filters }];
  
  return useApiQuery(queryKey, () => queryFn({ page, limit, ...filters }), {
    config,
    keepPreviousData: true,
    ...queryOptions
  });
};

/**
 * Hook for infinite queries
 */
export const useInfiniteApiQuery = (key, queryFn, options = {}) => {
  const {
    config = 'dynamic',
    limit = 50,
    ...queryOptions
  } = options;
  
  const configOptions = queryConfigs[config] || queryConfigs.dynamic;
  
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam = 1 }) => queryFn({ page: pageParam, limit }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.hasMore) {
        return pages.length + 1;
      }
      return undefined;
    },
    ...configOptions,
    ...queryOptions
  });
};

/**
 * Hook for real-time subscriptions (polling)
 */
export const useRealtimeQuery = (key, queryFn, options = {}) => {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    ...queryOptions
  } = options;
  
  return useApiQuery(key, queryFn, {
    config: 'realtime',
    enabled,
    refetchInterval: enabled ? interval : false,
    ...queryOptions
  });
};

/**
 * Hook for dependent queries
 */
export const useDependentQuery = (key, queryFn, dependencies = {}, options = {}) => {
  const {
    config = 'user',
    ...queryOptions
  } = options;
  
  // Check if all dependencies are satisfied
  const enabled = Object.values(dependencies).every(dep => dep !== null && dep !== undefined);
  
  return useApiQuery(key, () => queryFn(dependencies), {
    config,
    enabled,
    ...queryOptions
  });
};

/**
 * Hook for prefetching data
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient();
  
  const prefetchQuery = useCallback(async (key, queryFn, config = 'user') => {
    const configOptions = queryConfigs[config] || queryConfigs.user;
    
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn,
      ...configOptions
    });
  }, [queryClient]);
  
  return { prefetchQuery };
};

/**
 * Hook for manual cache management
 */
export const useCacheManager = () => {
  const queryClient = useQueryClient();
  
  const updateCache = useCallback((key, updater) => {
    queryClient.setQueryData(key, updater);
  }, [queryClient]);
  
  const invalidateCache = useCallback((key) => {
    queryClient.invalidateQueries(key);
  }, [queryClient]);
  
  const removeCache = useCallback((key) => {
    queryClient.removeQueries(key);
  }, [queryClient]);
  
  const getCacheData = useCallback((key) => {
    return queryClient.getQueryData(key);
  }, [queryClient]);
  
  return {
    updateCache,
    invalidateCache,
    removeCache,
    getCacheData
  };
};

/**
 * Hook for monitoring query performance
 */
export const useQueryPerformance = (queryKey) => {
  const startTimeRef = useRef(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'observerAdded' && 
          JSON.stringify(event.query.queryKey) === JSON.stringify(queryKey)) {
        startTimeRef.current = Date.now();
      }
      
      if (event.type === 'observerResultsUpdated' && 
          JSON.stringify(event.query.queryKey) === JSON.stringify(queryKey)) {
        if (startTimeRef.current) {
          const duration = Date.now() - startTimeRef.current;
          console.log(`[Query Performance] ${JSON.stringify(queryKey)}: ${duration}ms`);
          startTimeRef.current = null;
        }
      }
    });
    
    return unsubscribe;
  }, [queryClient, queryKey]);
};

// Export query and mutation keys for consistency
export { queryKeys, mutationKeys };

// Export query configs for external use
export { queryConfigs };