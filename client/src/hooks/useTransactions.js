// client/src/hooks/useTransactions.js
/**
 * useTransactions Hook - Complete Transaction Management
 * ✅ FIXED: Proper data structure handling for recurring transactions
 * ✅ ENHANCED: Better cache invalidation for proper component refreshes
 */

import { useCallback, useMemo, useState } from 'react';
import { useApiQuery, useApiMutation, usePaginatedQuery, useInfiniteApiQuery } from './useApi';
import { transactionAPI, queryKeys, mutationKeys } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useDate } from '../context/DateContext';
import toast from 'react-hot-toast';

/**
 * ✅ ENHANCED: Global cache invalidation function for all transaction-related queries
 */
const invalidateAllTransactionData = (queryClient) => {
  const queriesToInvalidate = [
    'transactions',           // TransactionList component
    'dashboard',             // BalancePanel + RecentTransactions 
    'transactionsSummary',   // Balance calculations
    'templates',             // Recurring transaction templates
    'transactionsRecurring', // Recurring transactions
    'transactionsSearch',    // Search results
    'categories'             // Categories (in case transaction affects category stats)
  ];

  // Invalidate each query type
  queriesToInvalidate.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  });

  // Force refetch for currently active queries to ensure immediate refresh
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
 * Main transactions hook with comprehensive functionality
 */
export const useTransactions = (options = {}) => {
  const { isAuthenticated } = useAuth();
  const { selectedDate, getDateForServer } = useDate();
  const queryClient = useQueryClient();
  
  // Filter state
  const [filters, setFilters] = useState({
    type: options.type || null,
    categoryId: options.categoryId || null,
    startDate: options.startDate || null,
    endDate: options.endDate || null,
    searchTerm: options.searchTerm || '',
    sortBy: options.sortBy || 'date',
    sortOrder: options.sortOrder || 'DESC',
    page: 1,
    limit: options.limit || 50
  });
  
  // Main transactions query
  const transactionsQuery = usePaginatedQuery(
    ['transactions'], 
    (params) => transactionAPI.getAll(params),
    {
      ...filters,
      config: 'dynamic',
      enabled: isAuthenticated,
      keepPreviousData: true
    }
  );
  
  // Process transactions data
  const transactionsData = useMemo(() => {
    if (!transactionsQuery.data?.data) return null;
    
    const data = transactionsQuery.data.data;
    
    return {
      transactions: data.transactions || [],
      pagination: data.pagination || {
        total: 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: 0
      },
      summary: data.summary || {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0
      }
    };
  }, [transactionsQuery.data, filters]);
  
  // ✅ ENHANCED: Create transaction mutation with comprehensive cache invalidation
  const createTransactionMutation = useApiMutation(
    ({ type, data }) => transactionAPI.create(type, data),
    {
      mutationKey: mutationKeys.createTransaction,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Transaction created successfully');
      },
      optimisticUpdate: {
        queryKey: queryKeys.transactions(filters),
        updater: (old, variables) => {
          if (!old?.data) return old;
          
          const newTransaction = {
            id: Date.now(),
            type: variables.type,
            ...variables.data,
            created_at: new Date().toISOString()
          };
          
          return {
            ...old,
            data: {
              ...old.data,
              transactions: [newTransaction, ...(old.data.transactions || [])],
              pagination: {
                ...old.data.pagination,
                total: (old.data.pagination?.total || 0) + 1
              }
            }
          };
        }
      }
    }
  );
  
  // ✅ ENHANCED: Update transaction mutation
  const updateTransactionMutation = useApiMutation(
    ({ type, id, data }) => transactionAPI.update(type, id, data),
    {
      mutationKey: mutationKeys.updateTransaction,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Transaction updated successfully');
      },
      optimisticUpdate: {
        queryKey: queryKeys.transactions(filters),
        updater: (old, variables) => {
          if (!old?.data?.transactions) return old;
          
          return {
            ...old,
            data: {
              ...old.data,
              transactions: old.data.transactions.map(t => 
                t.id === variables.id 
                  ? { ...t, ...variables.data, updated_at: new Date().toISOString() }
                  : t
              )
            }
          };
        }
      }
    }
  );
  
  // ✅ ENHANCED: Delete transaction mutation
  const deleteTransactionMutation = useApiMutation(
    ({ id, deleteAll }) => transactionAPI.delete(id, deleteAll),
    {
      mutationKey: mutationKeys.deleteTransaction,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Transaction deleted successfully');
      },
      optimisticUpdate: {
        queryKey: queryKeys.transactions(filters),
        updater: (old, variables) => {
          if (!old?.data?.transactions) return old;
          
          return {
            ...old,
            data: {
              ...old.data,
              transactions: old.data.transactions.filter(t => t.id !== variables.id),
              pagination: {
                ...old.data.pagination,
                total: Math.max(0, (old.data.pagination?.total || 0) - 1)
              }
            }
          };
        }
      }
    }
  );
  
  // ✅ ENHANCED: Manual refresh function
  const refreshAllTransactionData = useCallback(() => {
    invalidateAllTransactionData(queryClient);
    return transactionsQuery.refetch();
  }, [queryClient, transactionsQuery]);

  // CRUD operation wrappers
  const createTransaction = useCallback(async (type, data) => {
    return createTransactionMutation.mutateAsync({ type, data });
  }, [createTransactionMutation]);

  const updateTransaction = useCallback(async (type, id, data) => {
    return updateTransactionMutation.mutateAsync({ type, id, data });
  }, [updateTransactionMutation]);

  const deleteTransaction = useCallback(async (id, deleteAll = false) => {
    return deleteTransactionMutation.mutateAsync({ id, deleteAll });
  }, [deleteTransactionMutation]);

  // Filter management functions
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const setPage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const setSearchTerm = useCallback((searchTerm) => {
    setFilters(prev => ({ ...prev, searchTerm, page: 1 }));
  }, []);

  const setSortBy = useCallback((sortBy, sortOrder = 'DESC') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: null,
      categoryId: null,
      startDate: null,
      endDate: null,
      searchTerm: '',
      sortBy: 'date',
      sortOrder: 'DESC',
      page: 1,
      limit: filters.limit
    });
  }, [filters.limit]);
  
  return {
    // Data
    transactions: transactionsData?.transactions || [],
    pagination: transactionsData?.pagination || {},
    summary: transactionsData?.summary || {},
    
    // Loading states
    isLoading: transactionsQuery.isLoading,
    isRefetching: transactionsQuery.isRefetching,
    isCreating: createTransactionMutation.isLoading,
    isUpdating: updateTransactionMutation.isLoading,
    isDeleting: deleteTransactionMutation.isLoading,
    
    // Error states
    error: transactionsQuery.error,
    
    // CRUD operations
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Filter management
    filters,
    updateFilters,
    setPage,
    setSearchTerm,
    setSortBy,
    clearFilters,
    
    // Refresh
    refresh: transactionsQuery.refetch,
    refreshAll: refreshAllTransactionData
  };
};

/**
 * ✅ ENHANCED: Dashboard hook with better cache invalidation
 */
export const useDashboard = () => {
  const { isAuthenticated } = useAuth();
  const { selectedDate, getDateForServer } = useDate();
  const queryClient = useQueryClient();
  
  const dashboardQuery = useApiQuery(
    queryKeys.dashboard(getDateForServer(selectedDate)),
    () => transactionAPI.getDashboard(getDateForServer(selectedDate)),
    {
      config: 'dynamic',
      enabled: isAuthenticated,
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  );
  
  const refreshDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactionsSummary'] });
    
    queryClient.refetchQueries({ 
      queryKey: ['dashboard'], 
      type: 'active' 
    });
    
    return dashboardQuery.refetch();
  }, [queryClient, dashboardQuery]);

  return {
    data: dashboardQuery.data?.data,
    isLoading: dashboardQuery.isLoading,
    isFetching: dashboardQuery.isFetching,
    error: dashboardQuery.error,
    refresh: refreshDashboard
  };
};

/**
 * Hook for transaction search
 */
export const useTransactionSearch = (searchTerm, options = {}) => {
  const { isAuthenticated } = useAuth();
  const { limit = 50 } = options;
  
  const searchQuery = useApiQuery(
    queryKeys.transactionsSearch(searchTerm),
    () => transactionAPI.search(searchTerm, limit),
    {
      config: 'dynamic',
      enabled: Boolean(isAuthenticated && searchTerm && searchTerm.length >= 2),
      staleTime: 5 * 60 * 1000
    }
  );
  
  return {
    results: searchQuery.data?.data || [],
    isSearching: searchQuery.isLoading,
    error: searchQuery.error
  };
};

/**
 * ✅ FIXED: Hook for recurring transactions with proper data structure handling
 */
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

  // Calculate monthly impact helper
  const calculateMonthlyImpact = (template) => {
    if (!template || !template.amount || !template.interval_type) return 0;
    
    const amount = parseFloat(template.amount);
    const multiplier = template.transaction_type === 'expense' ? -1 : 1;
    
    switch (template.interval_type) {
      case 'daily': return amount * 30 * multiplier;
      case 'weekly': return amount * 4.33 * multiplier;
      case 'monthly': return amount * multiplier;
      case 'quarterly': return (amount / 3) * multiplier;
      case 'yearly': return (amount / 12) * multiplier;
      default: return 0;
    }
  };

  // ✅ FIXED: Proper data structure handling for recurring transactions
  const processedData = useMemo(() => {
    if (!recurringQuery.data) return [];
    
    let recurringData = null;
    
    // ✅ Handle different API response structures
    if (recurringQuery.data) {
      // Handle Axios response object first
      let rawData = recurringQuery.data;
      
      // If it's an Axios response object, extract the data property
      if (rawData.data && rawData.status && rawData.headers) {
        rawData = rawData.data;
      }
      
      // Now try different possible data structures from API
      if (Array.isArray(rawData)) {
        recurringData = rawData;
      } else if (rawData.data && Array.isArray(rawData.data)) {
        recurringData = rawData.data;
      } else if (rawData.templates && Array.isArray(rawData.templates)) {
        recurringData = rawData.templates;
      } else if (rawData.recurring && Array.isArray(rawData.recurring)) {
        recurringData = rawData.recurring;
      } else {
        console.warn('[RECURRING] Unexpected data structure:', rawData);
        recurringData = [];
      }
    }
    
    // ✅ Ensure we have an array before mapping
    if (!Array.isArray(recurringData)) {
      console.warn('[RECURRING] Data is not an array:', typeof recurringData, recurringData);
      return [];
    }
    
    return recurringData.map(template => {
      if (!template || typeof template !== 'object') {
        console.warn('[RECURRING] Invalid template:', template);
        return null;
      }
      
      return {
        ...template,
        monthlyImpact: calculateMonthlyImpact(template),
        isActive: template.is_active && (!template.end_date || new Date(template.end_date) > new Date())
      };
    }).filter(Boolean); // Remove null entries
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

/**
 * Hook for transaction templates
 */
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
  
  const deleteTemplateMutation = useApiMutation(
    ({ id, deleteFuture }) => transactionAPI.deleteTemplate(id, deleteFuture),
    {
      mutationKey: mutationKeys.deleteTemplate,
      onSuccess: () => {
        invalidateAllTransactionData(queryClient);
        toast.success('Template deleted successfully');
      }
    }
  );
  
  const skipDatesMutation = useApiMutation(
    ({ templateId, dates }) => transactionAPI.skipDates(templateId, dates),
    {
      mutationKey: mutationKeys.skipTemplateDates,
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
    updateTemplate: (id, data) => updateTemplateMutation.mutateAsync({ id, data }),
    deleteTemplate: (id, deleteFuture) => deleteTemplateMutation.mutateAsync({ id, deleteFuture }),
    skipDates: (templateId, dates) => skipDatesMutation.mutateAsync({ templateId, dates }),
    isUpdating: updateTemplateMutation.isLoading,
    isDeleting: deleteTemplateMutation.isLoading,
    isSkipping: skipDatesMutation.isLoading,
    refresh: templatesQuery.refetch
  };
};