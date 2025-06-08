/**
 * useTransactions Hook - Complete Transaction Management
 * Handles all transaction operations with optimistic updates and caching
 */

import { useCallback, useMemo, useState } from 'react';
import { useApiQuery, useApiMutation, usePaginatedQuery, useInfiniteApiQuery } from './useApi';
import { transactionAPI, queryKeys, mutationKeys } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useDate } from '../context/DateContext';
import toast from 'react-hot-toast';

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
  
  // ✅ FIX: Main transactions query - fixed baseKey parameter
  const transactionsQuery = usePaginatedQuery(
    ['transactions'], // ✅ FIX: Pass array as baseKey, not function call
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
  
  // Create transaction mutation
  const createTransactionMutation = useApiMutation(
    ({ type, data }) => transactionAPI.create(type, data),
    {
      mutationKey: mutationKeys.createTransaction,
      invalidateKeys: [
        queryKeys.transactions(filters),
        queryKeys.dashboard(getDateForServer(selectedDate)),
        queryKeys.transactionsSummary
      ],
      successMessage: 'Transaction created successfully',
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
  
  // Update transaction mutation
  const updateTransactionMutation = useApiMutation(
    ({ type, id, data }) => transactionAPI.update(type, id, data),
    {
      mutationKey: mutationKeys.updateTransaction,
      invalidateKeys: [
        queryKeys.transactions(filters),
        queryKeys.dashboard(getDateForServer(selectedDate))
      ],
      successMessage: 'Transaction updated successfully',
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
                  ? { ...t, ...variables.data }
                  : t
              )
            }
          };
        }
      }
    }
  );
  
  // Delete transaction mutation
  const deleteTransactionMutation = useApiMutation(
    ({ type, id, deleteFuture }) => transactionAPI.delete(type, id, deleteFuture),
    {
      mutationKey: mutationKeys.deleteTransaction,
      invalidateKeys: [
        queryKeys.transactions(filters),
        queryKeys.dashboard(getDateForServer(selectedDate)),
        queryKeys.transactionsSummary
      ],
      successMessage: 'Transaction deleted successfully',
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
  
  // Helper functions
  const createTransaction = useCallback(async (type, data) => {
    return createTransactionMutation.mutateAsync({ type, data });
  }, [createTransactionMutation]);
  
  const updateTransaction = useCallback(async (type, id, data, updateFuture = false) => {
    return updateTransactionMutation.mutateAsync({ 
      type, 
      id, 
      data: { ...data, updateFuture } 
    });
  }, [updateTransactionMutation]);
  
  const deleteTransaction = useCallback(async (type, id, deleteFuture = false) => {
    return deleteTransactionMutation.mutateAsync({ type, id, deleteFuture });
  }, [deleteTransactionMutation]);
  
  // Filter update functions
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
    refresh: transactionsQuery.refetch
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
 * Hook for recurring transactions
 */
export const useRecurringTransactions = (type = null) => {
  const { isAuthenticated } = useAuth();
  
  const recurringQuery = useApiQuery(
    queryKeys.transactionsRecurring(type),
    () => transactionAPI.getRecurring(type),
    {
      config: 'user',
      enabled: Boolean(isAuthenticated),
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000 // 30 minutes
    }
  );
  
  const generateRecurringMutation = useApiMutation(
    () => transactionAPI.generateRecurring(),
    {
      mutationKey: mutationKeys.generateRecurring,
      invalidateKeys: [
        queryKeys.transactionsRecurring(type),
        ['transactions'],
        ['dashboard']
      ],
      successMessage: 'Recurring transactions generated successfully'
    }
  );
  
  const calculateMonthlyImpact = (template) => {
    // Enhanced validation for template data
    if (!template || typeof template.amount === 'undefined') {
      return 0;
    }
    
    const amount = parseFloat(template.amount) || 0;
    
    switch (template.interval_type) {
      case 'daily':
        return amount * 30.44; // Average days per month
      case 'weekly':
        return amount * 4.35; // Average weeks per month
      case 'monthly':
        return amount;
      case 'yearly':
        return amount / 12;
      default:
        return amount;
    }
  };
  
  const processedData = useMemo(() => {
    // ✅ FIX: Handle Axios response object structure
    let recurringData = null;
    
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
        console.warn('[RECURRING] Unexpected data structure after Axios handling:', rawData);
        recurringData = [];
      }
    }
    
    if (!Array.isArray(recurringData)) {
      console.warn('[RECURRING] Recurring data is not an array:', typeof recurringData, recurringData);
      return [];
    }
    
    return recurringData.map(template => {
      // Validate template structure
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
      staleTime: 30 * 60 * 1000 // 30 minutes
    }
  );
  
  const updateTemplateMutation = useApiMutation(
    ({ id, data }) => transactionAPI.updateTemplate(id, data),
    {
      mutationKey: mutationKeys.updateTemplate,
      invalidateKeys: [queryKeys.templates, queryKeys.transactionsRecurring()],
      successMessage: 'Template updated successfully'
    }
  );
  
  const deleteTemplateMutation = useApiMutation(
    ({ id, deleteFuture }) => transactionAPI.deleteTemplate(id, deleteFuture),
    {
      mutationKey: mutationKeys.deleteTemplate,
      invalidateKeys: [queryKeys.templates, queryKeys.transactionsRecurring()],
      successMessage: 'Template deleted successfully'
    }
  );
  
  const skipDatesMutation = useApiMutation(
    ({ templateId, dates }) => transactionAPI.skipDates(templateId, dates),
    {
      mutationKey: mutationKeys.skipTemplateDates,
      invalidateKeys: [queryKeys.templates, queryKeys.transactionsRecurring()],
      successMessage: 'Dates skipped successfully'
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

/**
 * Hook for transaction statistics by period
 */
export const useTransactionsByPeriod = (period, date) => {
  const { isAuthenticated } = useAuth();
  
  const periodQuery = useApiQuery(
    queryKeys.transactionsPeriod(period, date),
    () => transactionAPI.getByPeriod(period, date),
    {
      config: 'dynamic',
      enabled: isAuthenticated && period && date,
      staleTime: 10 * 60 * 1000
    }
  );
  
  return {
    data: periodQuery.data?.data || null,
    transactions: periodQuery.data?.data?.transactions || [],
    isLoading: periodQuery.isLoading,
    error: periodQuery.error,
    refresh: periodQuery.refetch
  };
};

/**
 * Hook for category breakdown
 */
export const useCategoryBreakdown = (startDate, endDate) => {
  const { isAuthenticated } = useAuth();
  
  const breakdownQuery = useApiQuery(
    queryKeys.categoryBreakdown(startDate, endDate),
    () => transactionAPI.getCategoryBreakdown(startDate, endDate),
    {
      config: 'user',
      enabled: isAuthenticated && startDate && endDate,
      staleTime: 30 * 60 * 1000
    }
  );
  
  const processedData = useMemo(() => {
    if (!breakdownQuery.data?.data) return null;
    
    const data = breakdownQuery.data.data;
    
    // Process for charts
    const chartData = Object.entries(data).map(([category, amounts]) => ({
      category,
      income: parseFloat(amounts.income) || 0,
      expenses: parseFloat(amounts.expenses) || 0,
      total: (parseFloat(amounts.income) || 0) - (parseFloat(amounts.expenses) || 0)
    }));
    
    return {
      raw: data,
      chartData,
      topExpenseCategories: chartData
        .filter(c => c.expenses > 0)
        .sort((a, b) => b.expenses - a.expenses)
        .slice(0, 5),
      topIncomeCategories: chartData
        .filter(c => c.income > 0)
        .sort((a, b) => b.income - a.income)
        .slice(0, 5)
    };
  }, [breakdownQuery.data]);
  
  return {
    breakdown: processedData,
    isLoading: breakdownQuery.isLoading,
    error: breakdownQuery.error,
    refresh: breakdownQuery.refetch
  };
};

// Export for components
export default useTransactions;