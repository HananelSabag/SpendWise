/**
 * useTransactionActions Hook - OPTIMIZED FOR INFINITE LOADING
 * 
 * ✅ FIXED: Clean integration with infinite loading architecture
 * ✅ FIXED: Proper cache invalidation for infinite queries
 * ✅ FIXED: Simplified context-aware operations
 * ✅ PRESERVED: All existing functionality and CRUD operations
 * 
 * ARCHITECTURE:
 * - Works with useInfiniteQuery data structure
 * - Proper cache invalidation for infinite queries
 * - Context-aware performance optimization
 * - All original functionality preserved
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTransactions, useTransactionTemplates } from './useTransactions';
import { useToast } from './useToast';

/**
 * ✅ ENHANCED: Context strategies optimized for infinite loading
 */
const CONTEXT_STRATEGIES = {
  dashboard: {
    strategy: 'dashboard',
    invalidationPriority: 'high',
    autoRefresh: true
  },
  
  transactions: {
    strategy: 'progressive', 
    invalidationPriority: 'high',
    autoRefresh: true
  },
  
  quickActions: {
    strategy: 'dashboard',
    invalidationPriority: 'critical',
    autoRefresh: true
  },
  
  search: {
    strategy: 'search',
    invalidationPriority: 'medium',
    autoRefresh: false
  },
  
  analytics: {
    strategy: 'analytics',
    invalidationPriority: 'low',
    autoRefresh: false
  },

  mobile: {
    strategy: 'mobile',
    invalidationPriority: 'high',
    autoRefresh: true
  }
};

export const useTransactionActions = (context = 'transactions') => {
  const queryClient = useQueryClient();
  const contextConfig = CONTEXT_STRATEGIES[context] || CONTEXT_STRATEGIES.transactions;
  const toastService = useToast();
  
  // ✅ SIMPLIFIED: Use the optimized useTransactions hook
  const {
    createTransaction: baseCreateTransaction,
    updateTransaction: baseUpdateTransaction,
    deleteTransaction: baseDeleteTransaction,
    isCreating,
    isUpdating,
    isDeleting,
    refreshAll
  } = useTransactions({ strategy: contextConfig.strategy });

  // ✅ FIX: Import deleteTemplate from useTransactionTemplates properly
  const { deleteTemplate: baseDeleteTemplate, isDeleting: isDeletingTemplate } = useTransactionTemplates();

  // ✅ FIXED: Add proper logging utility
  const logAction = useCallback((message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [TRANSACTION_ACTIONS] ${message}`, data ? { context, ...data } : { context });
    }
  }, [context]);

  /**
   * ✅ ENHANCED: Smart cache invalidation for infinite queries
   */
  const invalidateRelevantQueries = useCallback(async (priority = 'high') => {
    const priorityMap = {
      critical: ['transactions', 'dashboard'],
      high: ['transactions', 'dashboard', 'transactionsSummary'],
      medium: ['transactions', 'dashboard', 'transactionsSummary', 'categories'],
      low: ['transactions', 'dashboard', 'transactionsSummary', 'categories', 'templates', 'transactionsRecurring']
    };
    
    const queriesToInvalidate = priorityMap[priority] || priorityMap.high;
    
    // ✅ FIXED: Invalidate infinite queries properly
    for (const queryKey of queriesToInvalidate) {
      await queryClient.invalidateQueries({ 
        queryKey: [queryKey],
        exact: false // This ensures infinite queries are also invalidated
      });
    }
    
    // ✅ NEW: For high priority operations, force immediate refresh
    if (priority === 'critical' || priority === 'high') {
      // Refetch infinite transaction queries
      await queryClient.refetchQueries({ 
        queryKey: ['transactions', 'infinite'], 
        type: 'active',
        exact: false
      });
      
      if (context === 'quickActions' || context === 'dashboard') {
        await queryClient.refetchQueries({ 
          queryKey: ['dashboard'], 
          type: 'active',
          exact: false
        });
      }
    }
  }, [queryClient, context]);

  /**
   * Create Transaction - Optimized for infinite loading
   * 
   * @param {string} type - 'income' or 'expense'
   * @param {object} data - Transaction data
   * @returns {Promise} - Transaction creation result
   */
  const createTransaction = useCallback(async (type, data) => {
    try {
      logAction(`Creating ${type} transaction`, { amount: data.amount });
      const result = await baseCreateTransaction(type, data);
      
      // ✅ ENHANCED: Context-aware invalidation
      await invalidateRelevantQueries(contextConfig.invalidationPriority);
      
      // ✅ NEW: Auto-refresh for high-priority contexts
      if (contextConfig.autoRefresh && (context === 'quickActions' || context === 'dashboard')) {
        setTimeout(() => {
          refreshAll();
        }, 500);
      }
      
      logAction(`${type} transaction created successfully`);
      return result;
    } catch (error) {
      logAction(`Failed to create ${type} transaction`, { error: error.message });
      throw error;
    }
  }, [baseCreateTransaction, invalidateRelevantQueries, contextConfig, context, refreshAll, logAction]);

  /**
   * Update Transaction - Context-aware immediate refresh
   * 
   * @param {string} type - Transaction type
   * @param {number} id - Transaction ID
   * @param {object} data - Updated transaction data
   * @returns {Promise} - Update result
   */
  const updateTransaction = useCallback(async (type, id, data) => {
    try {
      logAction(`Updating transaction ${id}`, { type });
      const result = await baseUpdateTransaction(type, id, data);
      
      await invalidateRelevantQueries('high');
      
      if (contextConfig.autoRefresh) {
        setTimeout(() => {
          refreshAll();
        }, 300);
      }
      
      logAction(`Transaction ${id} updated successfully`);
      return result;
    } catch (error) {
      logAction(`Failed to update transaction ${id}`, { error: error.message });
      throw error;
    }
  }, [baseUpdateTransaction, invalidateRelevantQueries, contextConfig, refreshAll, logAction]);

  /**
   * Delete Transaction - Fixed parameter handling
   * 
   * @param {number} id - Transaction ID to delete
   * @param {object} options - Delete options
   * @returns {Promise} - Deletion result
   */
  const deleteTransaction = useCallback(async (id, options = {}) => {
    const { deleteAll = false, deleteFuture = false, deleteSingle = false } = options;
    
    try {
      logAction(`Deleting transaction ${id}`, { deleteAll, deleteFuture, deleteSingle });
      
      // ✅ FIX: Determine the correct delete strategy
      let result;
      if (deleteAll) {
        // Delete entire recurring series or template
        result = await baseDeleteTransaction(id, { deleteAll: true });
      } else if (deleteFuture) {
        // Stop future occurrences  
        result = await baseDeleteTransaction(id, { deleteFuture: true });
      } else {
        // Delete single occurrence (default)
        result = await baseDeleteTransaction(id, { deleteSingle: true });
      }
      
      await invalidateRelevantQueries('critical');
      
      if (deleteAll) {
        await queryClient.invalidateQueries({ queryKey: ['templates'] });
        await queryClient.invalidateQueries({ queryKey: ['transactionsRecurring'] });
      }
      
      setTimeout(() => {
        refreshAll();
      }, 200);
      
      logAction(`Transaction ${id} deleted successfully`);
      return result;
    } catch (error) {
      logAction(`Failed to delete transaction ${id}`, { error: error.message });
      throw error;
    }
  }, [baseDeleteTransaction, invalidateRelevantQueries, queryClient, refreshAll, logAction]);

  /**
   * ✅ SIMPLIFIED: Bulk Operations optimized for infinite loading
   */
  const bulkOperations = useCallback(async (operation, transactionIds, options = {}) => {
    try {
      const { batchSize = 10, onProgress } = options;
      const results = [];
      
      // Process in batches
      for (let i = 0; i < transactionIds.length; i += batchSize) {
        const batch = transactionIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(id => {
          switch (operation) {
            case 'delete':
              return baseDeleteTransaction(id);
            case 'update':
              return baseUpdateTransaction(options.type, id, options.data);
            default:
              throw new Error(`Unsupported bulk operation: ${operation}`);
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Report progress
        if (onProgress) {
          onProgress({
            completed: i + batch.length,
            total: transactionIds.length,
            percentage: Math.round(((i + batch.length) / transactionIds.length) * 100)
          });
        }
        
        // Small delay between batches
        if (i + batchSize < transactionIds.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Invalidate caches once after all operations
      await invalidateRelevantQueries('high');
      
      // Refresh data
      setTimeout(() => {
        refreshAll();
      }, 500);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (successful > 0) {
        toastService.success('toast.success.bulkOperationSuccess', { 
          params: { count: successful, operation } 
        });
      }
      
      if (failed > 0) {
        toastService.error('toast.error.bulkOperationPartialFail', { 
          params: { failed, operation } 
        });
      }
      
      return { successful, failed, results };
      
    } catch (error) {
              toastService.error('toast.error.bulkOperationFailed', { 
          params: { operation } 
        });
      throw error;
    }
  }, [baseDeleteTransaction, baseUpdateTransaction, invalidateRelevantQueries, refreshAll]);

  /**
   * ✅ ENHANCED: Force refresh with infinite query support
   */
  const forceRefreshAll = useCallback(async () => {
    try {
      // Clear all transaction-related queries, including infinite queries
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0];
          return [
            'dashboard',
            'transactions', 
            'transactionsSummary',
            'templates',
            'transactionsRecurring',
            'categories'
          ].includes(queryKey);
        }
      });
      
      // Force immediate refetch of infinite queries
      await queryClient.refetchQueries({ 
        queryKey: ['transactions', 'infinite'],
        type: 'active',
        exact: false
      });
      
      await queryClient.refetchQueries({ 
        queryKey: ['dashboard'],
        type: 'active',
        exact: false
      });
      
              toastService.success('toast.success.dataRefreshed');
    } catch (error) {
              toastService.error('toast.error.operationFailed');
      console.error('Force refresh error:', error);
    }
  }, [queryClient]);

  return {
    // ✅ PRESERVED: CRUD Operations (enhanced with infinite loading support)
    createTransaction,
    updateTransaction, 
    deleteTransaction,
    deleteTemplate: baseDeleteTemplate, // ✅ FIX: Add deleteTemplate
    
    // ✅ PRESERVED: Loading States
    isCreating,
    isUpdating,
    isDeleting,
    
    // ✅ ENHANCED: Operations with infinite loading support
    bulkOperations,
    forceRefreshAll,
    
    // ✅ PRESERVED: State Helper
    isOperating: isCreating || isUpdating || isDeleting || isDeletingTemplate,
    
    // ✅ NEW: Context information for debugging
    context,
    contextConfig: process.env.NODE_ENV === 'development' ? contextConfig : undefined
  };
};

export default useTransactionActions;