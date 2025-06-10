/**
 * useTransactions Hook - OPTIMIZED INFINITE LOADING VERSION
 * 
 * ✅ FIXED: True progressive loading with useInfiniteQuery
 * ✅ FIXED: No more limit-changing refetch hell
 * ✅ FIXED: Stable state management without loops
 * ✅ FIXED: Proper page-based pagination that appends data
 * ✅ PRESERVED: All existing functionality and CRUD operations
 * 
 * ARCHITECTURE:
 * - Uses useInfiniteQuery for true infinite scrolling
 * - Page-based pagination (page 1, 2, 3...) instead of limit changes
 * - Stable filter state without synchronization loops
 * - Flattened transaction array for easy consumption
 * - Perfect cache invalidation for CRUD operations
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from './useApi';
import { transactionAPI, queryKeys, mutationKeys } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

/**
 * ✅ ENHANCED: Smart cache invalidation for all transaction-related data
 */
const invalidateAllTransactionData = (queryClient) => {
  const queriesToInvalidate = [
    'transactions',
    'dashboard', 
    'transactionsSummary',
    'templates',
    'transactionsRecurring',
    'categories'
  ];

  queriesToInvalidate.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  });

  // Force immediate refetch for critical active queries
  queryClient.refetchQueries({ 
    queryKey: ['transactions'], 
    type: 'active' 
  });
  queryClient.refetchQueries({ 
    queryKey: ['dashboard'], 
    type: 'active' 
  });
};

/**
 * ✅ OPTIMIZED: Loading strategies for different contexts
 */
const LOADING_STRATEGIES = {
  progressive: { pageSize: 15, maxAutoLoad: 100 },
  dashboard: { pageSize: 8, maxAutoLoad: 24 },
  search: { pageSize: 20, maxAutoLoad: 60 },
  mobile: { pageSize: 10, maxAutoLoad: 50 }
};

/**
 * Main transactions hook with TRUE infinite loading
 */
export const useTransactions = (options = {}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  // ✅ STABLE: Detect mobile for strategy selection
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }, []);
  
  const strategy = options.strategy || (isMobile ? 'mobile' : 'progressive');
  const config = LOADING_STRATEGIES[strategy] || LOADING_STRATEGIES.progressive;
  
  // ✅ FIXED: Single stable filter state - NO LOOPS
  const [filters, setFilters] = useState(() => ({
    type: options.type || null,
    categoryId: options.categoryId || null,
    startDate: options.startDate || null,
    endDate: options.endDate || null,
    searchTerm: options.searchTerm || '',
    sortBy: options.sortBy || 'date',
    sortOrder: options.sortOrder || 'DESC',
    // Advanced filters
    categories: options.categories || [],
    minAmount: options.minAmount || null,
    maxAmount: options.maxAmount || null,
    recurring: options.recurring || 'all'
  }));

  // ✅ CRITICAL FIX: Update filters when options change
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      type: options.type || null,
      categoryId: options.categoryId || null,
      startDate: options.startDate || null,
      endDate: options.endDate || null,
      searchTerm: options.searchTerm || '',
      categories: options.categories || [],
      minAmount: options.minAmount || null,
      maxAmount: options.maxAmount || null,
      recurring: options.recurring || 'all'
    }));
  }, [options.type, options.startDate, options.endDate, options.searchTerm, 
      options.categories, options.minAmount, options.maxAmount, options.recurring]);

  // ✅ OPTIMIZED: Build query key for cache management
  const queryKey = useMemo(() => {
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== null && value !== '' && (Array.isArray(value) ? value.length > 0 : true)) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    return ['transactions', 'infinite', cleanFilters];
  }, [filters]);

  // ✅ CORE FIX: Use useInfiniteQuery for TRUE progressive loading
  const transactionsQuery = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: config.pageSize,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };
      
      // Add non-empty filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== 'sortBy' && key !== 'sortOrder' && value && 
            (Array.isArray(value) ? value.length > 0 : true)) {
          params[key] = value;
        }
      });
      
      console.log(`📡 [TRANSACTIONS] Fetching page ${pageParam} with params:`, params);
      return transactionAPI.getAll(params);
    },
    enabled: isAuthenticated,
    getNextPageParam: (lastPage, allPages) => {
      const data = lastPage?.data;
      
      if (!data?.pagination) {
        console.log('❌ [TRANSACTIONS] No pagination data found');
        return undefined;
      }
      
      // ✅ FIX: Use your server's actual field names
      const { page, pages, total } = data.pagination;  // pages = totalPages in your API
      const currentPage = page || allPages.length;
      const totalPages = pages;  // Your server uses 'pages' not 'totalPages'
      const hasMore = currentPage < totalPages;  // Calculate hasMore
      
      console.log('🔍 [TRANSACTIONS] Fixed pagination check:', {
        currentPage,
        totalPages,
        hasMore,
        total,
        allPagesLength: allPages.length,
        shouldContinue: hasMore
      });
      
      if (hasMore) {
        const nextPage = currentPage + 1;
        console.log('✅ [TRANSACTIONS] Next page available:', nextPage);
        return nextPage;
      }
      
      console.log('🔚 [TRANSACTIONS] All pages loaded');
      return undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    keepPreviousData: true
  });

  // ✅ OPTIMIZED: Flatten infinite data into consumable format
  const processedData = useMemo(() => {
    if (!transactionsQuery.data?.pages) {
      return {
        transactions: [],
        pagination: { total: 0, hasMore: false, totalPages: 0 },
        summary: { totalIncome: 0, totalExpenses: 0, balance: 0 }
      };
    }

    // Flatten all pages into single transaction array
    const allTransactions = [];
    let latestPagination = { total: 0, hasMore: false, totalPages: 0 };
    let latestSummary = { totalIncome: 0, totalExpenses: 0, balance: 0 };

    transactionsQuery.data.pages.forEach(page => {
      const pageData = page?.data;
      if (pageData?.transactions) {
        allTransactions.push(...pageData.transactions);
      }
      if (pageData?.pagination) {
        // ✅ FIX: Map your server's pagination format to expected format
        latestPagination = {
          ...pageData.pagination,
          totalPages: pageData.pagination.pages,  // Map 'pages' to 'totalPages'
          hasMore: pageData.pagination.page < pageData.pagination.pages  // Calculate hasMore
        };
      }
      if (pageData?.summary) {
        latestSummary = pageData.summary;
      }
    });

    console.log('📊 [TRANSACTIONS] Processed', allTransactions.length, 'total transactions from', transactionsQuery.data.pages.length, 'pages');
    console.log('📊 [TRANSACTIONS] Latest pagination:', latestPagination);
    console.log('📊 [TRANSACTIONS] Has next page:', !!transactionsQuery.hasNextPage);

    return {
      transactions: allTransactions,
      pagination: {
        ...latestPagination,
        hasMore: !!transactionsQuery.hasNextPage,
        isLoading: transactionsQuery.isFetchingNextPage
      },
      summary: latestSummary
    };
  }, [transactionsQuery.data, transactionsQuery.hasNextPage, transactionsQuery.isFetchingNextPage]);

  // ✅ PRESERVED: All CRUD mutations with enhanced cache management
  const createTransactionMutation = useApiMutation(
    ({ type, data }) => transactionAPI.create(type, data),
    {
      mutationKey: mutationKeys.createTransaction,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Transaction created successfully');
      }
    }
  );

  const updateTransactionMutation = useApiMutation(
    ({ type, id, data }) => transactionAPI.update(type, id, data),
    {
      mutationKey: mutationKeys.updateTransaction,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Transaction updated successfully');
      }
    }
  );

  const deleteTransactionMutation = useApiMutation(
    ({ id, deleteAll }) => transactionAPI.delete('expense', id, deleteAll), // Default to expense, server handles it
    {
      mutationKey: mutationKeys.deleteTransaction,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Transaction deleted successfully');
      }
    }
  );

  // ✅ ENHANCED: Filter management without state loops
  const updateFilters = useCallback((newFilters) => {
    console.log('🔄 [TRANSACTIONS] Updating filters:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    console.log('🗑️ [TRANSACTIONS] Clearing all filters');
    setFilters({
      type: null,
      categoryId: null,
      startDate: null,
      endDate: null,
      searchTerm: '',
      sortBy: 'date',
      sortOrder: 'DESC',
      categories: [],
      minAmount: null,
      maxAmount: null,
      recurring: 'all'
    });
  }, []);

  const setSearchTerm = useCallback((searchTerm) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const setSortBy = useCallback((sortBy, sortOrder = 'DESC') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  // ✅ NEW: Progressive loading helpers for infinite scroll
  const loadMore = useCallback(() => {
    if (transactionsQuery.hasNextPage && !transactionsQuery.isFetchingNextPage) {
      console.log('📈 [TRANSACTIONS] Loading next page...');
      return transactionsQuery.fetchNextPage();
    }
  }, [transactionsQuery.hasNextPage, transactionsQuery.isFetchingNextPage, transactionsQuery.fetchNextPage]);

  const progressiveStatus = useMemo(() => {
    const totalItems = processedData.pagination.total || 0;
    const loadedItems = processedData.transactions.length;
    const hasMore = !!transactionsQuery.hasNextPage;
    const canAutoLoad = loadedItems < config.maxAutoLoad;

    // Only log when there are actual changes to avoid spam
    if (loadedItems > 0) {
      console.log('📊 [TRANSACTIONS] Progressive status:', {
        totalItems,
        loadedItems,
        hasNextPage: transactionsQuery.hasNextPage,
        hasMore,
        canAutoLoad
      });
    }

    return {
      hasMore,
      canAutoLoad: hasMore && canAutoLoad,
      shouldShowManualLoad: hasMore && !canAutoLoad,
      loadedCount: loadedItems,
      totalCount: totalItems,
      remainingCount: Math.max(0, totalItems - loadedItems),
      loadedPercentage: totalItems > 0 ? Math.round((loadedItems / totalItems) * 100) : 0,
      isLoading: transactionsQuery.isFetchingNextPage
    };
  }, [processedData, transactionsQuery.hasNextPage, transactionsQuery.isFetchingNextPage, config.maxAutoLoad]);

  // ✅ PRESERVED: CRUD operation wrappers
  const createTransaction = useCallback(async (type, data) => {
    return createTransactionMutation.mutateAsync({ type, data });
  }, [createTransactionMutation]);

  const updateTransaction = useCallback(async (type, id, data) => {
    return updateTransactionMutation.mutateAsync({ type, id, data });
  }, [updateTransactionMutation]);

  const deleteTransaction = useCallback(async (id, deleteAll = false) => {
    return deleteTransactionMutation.mutateAsync({ id, deleteAll });
  }, [deleteTransactionMutation]);

  const refresh = useCallback(() => {
    return transactionsQuery.refetch();
  }, [transactionsQuery]);

  const refreshAll = useCallback(() => {
    invalidateAllTransactionData(queryClient);
    return transactionsQuery.refetch();
  }, [queryClient, transactionsQuery]);

  return {
    // ✅ CORE DATA: Flattened and ready to use
    transactions: processedData.transactions,
    pagination: processedData.pagination,
    summary: processedData.summary,
    
    // ✅ LOADING STATES
    isLoading: transactionsQuery.isLoading,
    isRefetching: transactionsQuery.isRefetching,
    isLoadingMore: transactionsQuery.isFetchingNextPage,
    isCreating: createTransactionMutation.isLoading,
    isUpdating: updateTransactionMutation.isLoading,
    isDeleting: deleteTransactionMutation.isLoading,
    
    // ✅ ERROR HANDLING
    error: transactionsQuery.error,
    
    // ✅ CRUD OPERATIONS
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // ✅ FILTER MANAGEMENT
    filters,
    updateFilters,
    clearFilters,
    setSearchTerm,
    setSortBy,
    
    // ✅ INFINITE LOADING
    loadMore,
    hasMoreToLoad: !!transactionsQuery.hasNextPage,
    progressiveStatus,
    
    // ✅ REFRESH OPERATIONS
    refresh,
    refreshAll
  };
};

// ✅ PRESERVED: All other hooks remain the same but updated for consistency

export const useTransactionSearch = (searchTerm, options = {}) => {
  const { isAuthenticated } = useAuth();
  const { limit = 50 } = options;
  
  return useApiQuery(
    queryKeys.transactionsSearch(searchTerm),
    () => transactionAPI.search(searchTerm, limit),
    {
      config: 'dynamic',
      enabled: Boolean(isAuthenticated && searchTerm && searchTerm.length >= 2),
      staleTime: 5 * 60 * 1000
    }
  );
};

export const useRecurringTransactions = (type = null) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const recurringQuery = useApiQuery(
    queryKeys.transactionsRecurring(type),
    () => transactionAPI.getRecurring(type),
    {
      config: 'user',
      enabled: Boolean(isAuthenticated),
      staleTime: 10 * 60 * 1000,
      cacheTime: 30 * 60 * 1000
    }
  );
  
  const generateRecurringMutation = useApiMutation(
    () => transactionAPI.generateRecurring(),
    {
      mutationKey: mutationKeys.generateRecurring,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Recurring transactions generated successfully');
      }
    }
  );

  const processedData = useMemo(() => {
    if (!recurringQuery.data) return [];
    
    let recurringData = recurringQuery.data;
    
    // Handle different API response structures
    if (recurringData.data && recurringData.status) {
      recurringData = recurringData.data;
    }
    
    if (Array.isArray(recurringData)) {
      return recurringData;
    } else if (recurringData.data && Array.isArray(recurringData.data)) {
      return recurringData.data;
    } else if (recurringData.templates && Array.isArray(recurringData.templates)) {
      return recurringData.templates;
    }
    
    return [];
  }, [recurringQuery.data]);
  
  return {
    recurringTransactions: processedData,
    isLoading: recurringQuery.isLoading,
    error: recurringQuery.error,
    generateRecurring: generateRecurringMutation.mutateAsync,
    isGenerating: generateRecurringMutation.isLoading,
    refresh: recurringQuery.refetch
  };
};

export const useTransactionTemplates = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const templatesQuery = useApiQuery(
    queryKeys.templates,
    () => transactionAPI.getTemplates(),
    {
      config: 'user',
      enabled: isAuthenticated,
      staleTime: 30 * 60 * 1000
    }
  );
  
  const updateTemplateMutation = useApiMutation(
    ({ id, data }) => transactionAPI.updateTemplate(id, data),
    {
      mutationKey: mutationKeys.updateTemplate,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Template updated successfully');
      }
    }
  );

  const skipDatesMutation = useApiMutation(
    ({ templateId, dates }) => transactionAPI.skipDates(templateId, dates),
    {
      mutationKey: mutationKeys.skipDates,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Dates skipped successfully');
      }
    }
  );
  
  return {
    templates: templatesQuery.data?.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    updateTemplate: updateTemplateMutation.mutateAsync,
    skipDates: skipDatesMutation.mutateAsync,
    isUpdating: updateTemplateMutation.isLoading,
    isSkipping: skipDatesMutation.isLoading,
    refresh: templatesQuery.refetch
  };
};

export default useTransactions;