/**
 * useTransactions Hook — data fetching + mutations for transactions.
 * AI analysis classes are in services/transactionAI.js (opt-in, enableAI: false by default).
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from './useApi';
import { api } from '../api';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { createLogger } from '../utils/logger';
import {
  TransactionAIEngine,
  TransactionAnalytics,
  TransactionCacheManager,
  TransactionPerformanceMonitor,
} from '../services/transactionAI';

/**
 * 💰 Enhanced useTransactions Hook - REVOLUTIONIZED!
 */
export const useTransactions = (options = {}) => {
  const { isAuthenticated, user } = useAuth();
  const toastService = useToast();
  const queryClient = useQueryClient();
  const logger = useRef(createLogger('Transactions')).current;

  // ✅ CRITICAL FIX: Increase page size for better user experience
  const {
    pageSize = 50,
    enableAI = false, // AI analysis is opt-in — output not consumed by any component currently
    enableRealTimeAnalysis = true,
    autoRefresh = false,
    cacheStrategy = 'smart',
    activeTab = 'all' // ✅ NEW: Active tab for smart filtering
  } = options;

  // Enhanced state
  const [filters, setFilters] = useState({
    search: '',
    category: null,
    type: null,
    dateRange: null,
    amountRange: null,
    status: null
  });

  const [aiInsights, setAIInsights] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const performanceRef = useRef(TransactionPerformanceMonitor);

  // ✅ Enhanced infinite query with AI analysis - FIXED SERVER-SIDE FILTERING
  const transactionsQuery = useInfiniteQuery({
    queryKey: ['transactions', user?.id, filters, activeTab],
    enabled: !!user?.id, // Only run if user is authenticated
    queryFn: async ({ pageParam = 0 }) => {
      const start = performance.now();
      
      try {
        const cacheKey = TransactionCacheManager.generateKey('transactions', {
          ...filters,
          page: pageParam,
          userId: user?.id
        });

        // Check cache first
        let cachedData = null;
        if (cacheStrategy === 'smart') {
          cachedData = TransactionCacheManager.get(cacheKey);
          if (cachedData) {
            performanceRef.current.recordCacheHit();
            return cachedData;
          }
          performanceRef.current.recordCacheMiss();
        }

        // ✅ FIXED: Build server-side filters properly
        const apiFilters = {};
        
        // Pass type filter to server
        if (filters.type && filters.type !== 'all') {
          apiFilters.type = filters.type;
        }
        
        // Pass category filter to server
        if (filters.category && filters.category !== 'all') {
          apiFilters.category = filters.category;
        }
        
        // Pass search to server
        if (filters.search) {
          apiFilters.search = filters.search;
        }
        
        // ✅ SMART DATE FILTERING: Add date filters based on active tab
        if (activeTab === 'all') {
          // All tab: Only current month + past (no future transactions beyond current month end)
          const now = new Date();
          const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfCurrentMonth.setHours(23, 59, 59, 999);
          
          apiFilters.dateTo = endOfCurrentMonth.toISOString().split('T')[0];
          
          // If month filter is set, use it for date range
          if (filters.month && filters.month !== 'all') {
            const [year, month] = filters.month.split('-');
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0);
            apiFilters.dateFrom = startOfMonth.toISOString().split('T')[0];
            apiFilters.dateTo = endOfMonth.toISOString().split('T')[0];
          }
          
          logger.debug('📅 All tab - date filter:', { 
            dateFrom: apiFilters.dateFrom,
            dateTo: apiFilters.dateTo 
          });
          
        } else if (activeTab === 'upcoming') {
          // ✅ UPCOMING TAB: Get ALL future transactions from tomorrow onwards
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          apiFilters.dateFrom = tomorrow.toISOString().split('T')[0];
          
          logger.debug('📅 Upcoming tab - date filter:', { 
            dateFrom: apiFilters.dateFrom 
          });
        }
        
        logger.debug('API Request:', {
          filters: apiFilters,
          page: pageParam + 1,
          limit: pageSize
        });

        const response = await api.transactions.getAll({
          page: pageParam + 1, // Server expects 1-based pagination
          limit: pageSize,
          ...apiFilters
        });

        logger.debug('API Response:', {
          success: response.success,
          count: response.data?.transactions?.length,
          hasMore: response.data?.pagination?.hasMore
        });

        // Handle API response structure - unwrap nested { success, data: { success, data: { transactions } } }
        let rawData = response?.data?.data || response?.data || response;
        
        if (!rawData) {
          logger.warn('No data received from transactions API');
          return { transactions: [], hasMore: false, total: 0 };
        }
        
        let transactionsArray = [];
        let total = 0;
        let hasMore = false;
        
        if (Array.isArray(rawData)) {
          // If rawData is directly an array (fallback)
          transactionsArray = rawData;
          total = rawData.length;
        } else if (rawData.transactions && Array.isArray(rawData.transactions)) {
          // If rawData has transactions property (expected server format)
          transactionsArray = rawData.transactions;
          total = rawData.pagination?.total || rawData.summary?.total || rawData.transactions.length;
          hasMore = rawData.pagination?.hasMore || false;
        } else {
          logger.warn('Unexpected data structure from transactions API');
          transactionsArray = [];
        }

        // Transform flat category data to nested structure for all transactions
        const transformedTransactions = transactionsArray.map(transaction => ({
          ...transaction,
          // Transform flat category data to nested structure for frontend compatibility
          category: transaction.category_name ? {
            name: transaction.category_name,
            icon: transaction.category_icon,
            color: transaction.category_color
          } : transaction.category
        }));

        // Structure the data properly for infinite query
        const data = {
          transactions: transformedTransactions,
          hasMore: Boolean(hasMore),
          total: total,
          page: pageParam,
          limit: pageSize
        };

        // Add AI analysis if enabled
        if (enableAI && data.transactions) {
          performanceRef.current.recordAIAnalysis();
          
          const userContext = await getUserContext();
          const analysisPromises = data.transactions.map(transaction =>
            TransactionAIEngine.analyzeTransaction(transaction, userContext)
          );
          
          const analyses = await Promise.all(analysisPromises);
          
          data.transactions = data.transactions.map((transaction, index) => ({
            ...transaction,
            aiAnalysis: analyses[index],
            // Transform flat category data to nested structure for frontend compatibility
            category: transaction.category_name ? {
              name: transaction.category_name,
              icon: transaction.category_icon,
              color: transaction.category_color
            } : transaction.category
          }));

          // Generate batch insights
          if (enableRealTimeAnalysis) {
            const batchInsights = await TransactionAIEngine.getBatchInsights(
              data.transactions, 
              userContext
            );
            data.batchInsights = batchInsights;
          }
        }

        // Cache the result
        if (cacheStrategy === 'smart') {
          TransactionCacheManager.set(cacheKey, data);
        }

        const duration = performance.now() - start;
        performanceRef.current.recordQuery(duration);

        return data;
      } catch (error) {
        performanceRef.current.recordError();
        throw error;
      }
    },
    enabled: isAuthenticated && !!user?.id && !!localStorage.getItem('accessToken'),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    staleTime: cacheStrategy === 'aggressive' ? 10 * 60 * 1000 : 2 * 60 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false
  });

  // ✅ Transaction analytics query
  const analyticsQuery = useQuery({
    queryKey: ['transaction-analytics', user?.id, filters.dateRange],
    queryFn: async () => {
      const response = await api.analytics.getUserAnalytics({
        dateRange: filters.dateRange
      });
      return response.data;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000
  });

  // ✅ Real-time insights query
  const insightsQuery = useQuery({
    queryKey: ['transaction-insights', user?.id],
    queryFn: async () => {
      if (!enableAI) return null;
      
      // ✅ FIXED: Safe access to transactions in insights query
      const allTransactions = transactionsQuery.data?.pages?.flatMap(page => {
        return page?.transactions || [];
      }) || [];
      if (allTransactions.length === 0) return null;

      const insights = TransactionAnalytics.generateSpendingInsights(allTransactions);
      setAIInsights(insights);
      return insights;
    },
    enabled: isAuthenticated && enableAI && !!transactionsQuery.data,
    staleTime: 10 * 60 * 1000
  });

  // ✅ Enhanced transaction creation mutation - SUPPORTS RECURRING TEMPLATES
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData) => {
      performanceRef.current.recordMutation();

      // ✅ CRITICAL FIX: Route to correct API based on transaction type
      if (transactionData._isRecurring) {
        logger.debug('Creating recurring template');
        // Remove internal marker before sending to API
        const cleanData = { ...transactionData };
        delete cleanData._isRecurring;
        const response = await api.transactions.createRecurringTemplate(cleanData);
        return response.data;
      } else {
        logger.debug('Creating regular transaction');
        const response = await api.transactions.create(transactionData.type || 'expense', transactionData);
        return response.data;
      }
    },
    onSuccess: (newTransaction) => {
      // ✅ FIXED: Safety check to ensure we have valid transaction data
      if (!newTransaction) {
        logger.warn('Transaction creation succeeded but returned no data');
        toastService.error('transactions.createFailed');
        return;
      }

      logger.success('Transaction created successfully');

      // ✅ ENHANCED: Invalidate ALL relevant queries to ensure balance panel updates
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      queryClient.invalidateQueries(['dashboard']);
      
      // Force immediate refetch for dashboard and transactions
      queryClient.refetchQueries(['transactions'], { active: true });
      queryClient.refetchQueries(['dashboard'], { active: true });
      
      // Clear cache
      TransactionCacheManager.invalidatePattern('transactions');
      
      toastService.success('transactions.createSuccess');

      // Show AI insights if available (optional feature)
      if (newTransaction?.aiAnalysis?.fraudProbability > 0.5) {
        toastService.warning('transactions.securityAlert', {
          details: 'Transaction flagged for review'
        });
      }
    },
    onError: (error) => {
      performanceRef.current.recordError();
      toastService.error(error.message || 'transactions.createFailed');
    }
  });

  // ✅ Enhanced batch creation mutation
  const createBatchMutation = useMutation({
    mutationFn: async (transactionsData) => {
      performanceRef.current.recordMutation();
      
      // Process batch transactions individually for now
      const results = [];
      for (const transactionData of transactionsData) {
        const response = await api.transactions.create(transactionData.type || 'expense', transactionData);
        if (response.success) {
          results.push(response.data);
        }
      }
      return { transactions: results };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      TransactionCacheManager.clear();
      
      toastService.success('transactions.batchCreateSuccess', { 
        count: result.transactions.length 
      });

      // Show batch insights
      if (result.analytics && result.analytics.batch.highRiskTransactions > 0) {
        toastService.warning('transactions.batchSecurityAlert', {
          count: result.analytics.batch.highRiskTransactions
        });
      }
    },
    onError: (error) => {
      performanceRef.current.recordError();
      toastService.error(error.message || 'transactions.batchCreateFailed');
    }
  });

  // ✅ Enhanced update mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, updates }) => {
      performanceRef.current.recordMutation();
      
      const response = await api.transactions.update(updates.type || 'expense', transactionId, updates);
      return response.data;
    },
    onSuccess: (updatedTransaction) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      TransactionCacheManager.invalidatePattern('transactions');
      
      toastService.success('transactions.updateSuccess');
    },
    onError: (error) => {
      performanceRef.current.recordError();
      toastService.error(error.message || 'transactions.updateFailed');
    }
  });

  // ✅ Enhanced delete mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId) => {
      performanceRef.current.recordMutation();

      // Determine correct type for server route ('income' | 'expense')
      let typeForDelete = 'expense';
      try {
        const allTx = transactionsQuery.data?.pages?.flatMap(p => p?.transactions || []) || [];
        const tx = allTx.find(t => t.id === transactionId);
        if (tx?.type === 'income' || tx?.type === 'expense') {
          typeForDelete = tx.type;
        } else if (typeof tx?.amount === 'number') {
          typeForDelete = tx.amount > 0 ? 'income' : 'expense';
        }
      } catch {}

      const response = await api.transactions.delete(typeForDelete, transactionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      TransactionCacheManager.invalidatePattern('transactions');
      
      toastService.success('transactions.deleteSuccess');
    },
    onError: (error) => {
      performanceRef.current.recordError();
      toastService.error(error.message || 'transactions.deleteFailed');
    }
  });

  // ✅ Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operation, transactionIds, data = {} }) => {
      performanceRef.current.recordMutation();

      const allTx = transactionsQuery.data?.pages?.flatMap(p => p?.transactions || []) || [];

      const results = [];
      for (const id of transactionIds) {
        if (operation === 'delete') {
          let typeForDelete = 'expense';
          const tx = allTx.find(t => t.id === id);
          if (tx?.type === 'income' || tx?.type === 'expense') {
            typeForDelete = tx.type;
          } else if (typeof tx?.amount === 'number') {
            typeForDelete = tx.amount > 0 ? 'income' : 'expense';
          }
          const result = await api.transactions.delete(typeForDelete, id);
          results.push(result);
        }
      }
      return { data: results };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      TransactionCacheManager.clear();
      
      toastService.success(`transactions.bulk.${variables.operation}Success`, {
        count: variables.transactionIds.length
      });
      
      setSelectedTransactions(new Set());
    },
    onError: (error, variables) => {
      performanceRef.current.recordError();
      toastService.error(error.message || `transactions.bulk.${variables.operation}Failed`);
    }
  });

  // ✅ Enhanced helper methods
  const getUserContext = useCallback(async () => {
    try {
      const response = await api.users.getProfile();
      return response.data;
    } catch (error) {
      logger.warn('Failed to get user context');
      return {};
    }
  }, []);

  const invalidateAllTransactionData = useCallback(() => {
    const queriesToInvalidate = [
      'transactions',
      'transaction-analytics',
      'transaction-insights',
      'dashboard',
      'categories'
    ];

    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });

    TransactionCacheManager.clear();
  }, [queryClient]);

  // ✅ Enhanced operations
  const createTransaction = useCallback(async (transactionData) => {
    return createTransactionMutation.mutateAsync(transactionData);
  }, [createTransactionMutation]);

  const createBatch = useCallback(async (transactionsData) => {
    return createBatchMutation.mutateAsync(transactionsData);
  }, [createBatchMutation]);

  const updateTransaction = useCallback(async (transactionId, updates) => {
    return updateTransactionMutation.mutateAsync({ transactionId, updates });
  }, [updateTransactionMutation]);

  const deleteTransaction = useCallback(async (transactionId) => {
    return deleteTransactionMutation.mutateAsync(transactionId);
  }, [deleteTransactionMutation]);

  const bulkOperation = useCallback(async (operation, transactionIds, data = {}) => {
    return bulkOperationMutation.mutateAsync({ operation, transactionIds, data });
  }, [bulkOperationMutation]);

  // ✅ Advanced filtering
  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    TransactionCacheManager.invalidatePattern('transactions');
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: null,
      type: null,
      dateRange: null,
      amountRange: null,
      status: null
    });
  }, []);

  // ✅ Selection management
  const selectTransaction = useCallback((transactionId) => {
    setSelectedTransactions(prev => new Set([...prev, transactionId]));
  }, []);

  const deselectTransaction = useCallback((transactionId) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      newSet.delete(transactionId);
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    // ✅ FIXED: Safe access to transactions in selectAll
    const allTransactions = transactionsQuery.data?.pages?.flatMap(page => {
      return page?.transactions || [];
    }) || [];
    setSelectedTransactions(new Set(allTransactions.map(t => t.id)));
  }, [transactionsQuery.data]);

  const clearSelection = useCallback(() => {
    setSelectedTransactions(new Set());
  }, []);

  // ✅ AI-powered insights
  const getTransactionInsights = useCallback(async (transactionId) => {
    if (!enableAI) return null;

    // ✅ FIXED: Safe access to transactions in getTransactionInsights  
    const allTransactions = transactionsQuery.data?.pages?.flatMap(page => {
      return page?.transactions || [];
    }) || [];
    const transaction = allTransactions.find(t => t.id === transactionId);
    
    if (!transaction) return null;

    const userContext = await getUserContext();
    return TransactionAIEngine.analyzeTransaction(transaction, userContext);
  }, [enableAI, transactionsQuery.data, getUserContext]);

  const getSpendingPredictions = useCallback(() => {
    if (!enableAI || !insightsQuery.data) return null;
    return insightsQuery.data.predictions;
  }, [enableAI, insightsQuery.data]);

  // ✅ Performance monitoring
  const getPerformanceMetrics = useCallback(() => {
    return performanceRef.current.getMetrics();
  }, []);

  // ✅ Processed data
  const allTransactions = useMemo(() => {
    if (!transactionsQuery.data?.pages) {
      return [];
    }
    
    const flattened = transactionsQuery.data.pages.flatMap(page => {
      // ✅ FIXED: Safe access to page.transactions with fallback
      if (!page || !page.transactions || !Array.isArray(page.transactions)) {
        logger.warn('Invalid page structure in query result');
        return [];
      }
      return page.transactions;
    }) || [];
    
    logger.debug(`Loaded ${flattened.length} transactions from ${transactionsQuery.data.pages.length} pages`);
    
    return flattened;
  }, [transactionsQuery.data]);

  const batchInsights = useMemo(() => {
    // ✅ FIXED: Safe access to batchInsights
    const firstPage = transactionsQuery.data?.pages?.[0];
    return firstPage?.batchInsights || null;
  }, [transactionsQuery.data]);

  return {
    // Data
    transactions: allTransactions,
    analytics: analyticsQuery.data,
    insights: insightsQuery.data,
    aiInsights,
    batchInsights,
    
    // Pagination
    hasNextPage: transactionsQuery.hasNextPage,
    fetchNextPage: transactionsQuery.fetchNextPage,
    isFetchingNextPage: transactionsQuery.isFetchingNextPage,
    
    // Loading states
    loading: transactionsQuery.isLoading,
    analyticsLoading: analyticsQuery.isLoading,
    insightsLoading: insightsQuery.isLoading,
    
    // Mutation states
    creating: createTransactionMutation.isLoading,
    batchCreating: createBatchMutation.isLoading,
    updating: updateTransactionMutation.isLoading,
    deleting: deleteTransactionMutation.isLoading,
    bulkProcessing: bulkOperationMutation.isLoading,
    
    // Error states
    error: transactionsQuery.error,
    analyticsError: analyticsQuery.error,
    
    // Enhanced operations
    createTransaction,
    createBatch,
    updateTransaction,
    deleteTransaction,
    bulkOperation,
    
    // Filtering
    filters,
    applyFilters,
    clearFilters,
    
    // Selection
    selectedTransactions,
    selectTransaction,
    deselectTransaction,
    selectAll,
    clearSelection,
    
    // AI features
    getTransactionInsights,
    getSpendingPredictions,
    
    // Utilities
    invalidateAllTransactionData,
    getPerformanceMetrics,
    getUserContext,
    
    // Refetch functions
    refetch: transactionsQuery.refetch,
    refetchAnalytics: analyticsQuery.refetch,
    refetchInsights: insightsQuery.refetch
  };
};

/**
 * 📋 useTransactionTemplates Hook - Transaction Templates Management
 */
export const useTransactionTemplates = () => {
  const { user } = useAuth();
  
  return {
    templates: [],
    createTemplate: async (transaction) => {
      // Template creation logic
      return { success: true };
    },
    deleteTemplate: async (templateId) => {
      // Template deletion logic
      return { success: true };
    },
    applyTemplate: async (templateId, overrides = {}) => {
      // Template application logic
      return { success: true };
    }
  };
};

export default useTransactions;