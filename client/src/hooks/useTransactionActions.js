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
import { useBalanceRefresh } from '../contexts/BalanceContext';

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
  const { refreshAll } = useBalanceRefresh();
  
  // ✅ SIMPLIFIED: Use the optimized useTransactions hook
  const {
    createTransaction: baseCreateTransaction,
    updateTransaction: baseUpdateTransaction,
    deleteTransaction: baseDeleteTransaction,
    isCreating,
    isUpdating,
    isDeleting,
    refetch: refetchTransactions
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
    
    // ✅ FIXED: Invalidate infinite queries properly + balance/dashboard keys
    const invalidatePromises = queriesToInvalidate.map((queryKey) => {
      return queryClient.invalidateQueries({
        queryKey: [queryKey],
        exact: false
      });
    });
    // Also ensure balance and dashboard are included for UI sync
    invalidatePromises.push(
      queryClient.invalidateQueries({ queryKey: ['balance'], exact: false }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false })
    );
    await Promise.allSettled(invalidatePromises);
    
    // ✅ NEW: For high priority operations, force immediate refresh
    if (priority === 'critical' || priority === 'high') {
      // Refetch active transaction queries
      await queryClient.refetchQueries({ 
        queryKey: ['transactions'], 
        type: 'active',
        exact: false
      });
      
      // Always refetch dashboard and balance when visible
      await queryClient.refetchQueries({ 
        queryKey: ['dashboard'], 
        type: 'active',
        exact: false
      });
      await queryClient.refetchQueries({ 
        queryKey: ['balance'], 
        type: 'active',
        exact: false
      });
    }
  }, [queryClient, context]);

  /**
   * Create Transaction - Fixed parameter handling for forms
   * 
   * @param {object} data - Transaction data (includes type field)
   * @returns {Promise} - Transaction creation result
   */
  const createTransaction = useCallback(async (data) => {
    try {
      // Extract type from data if not provided as separate parameter
      const transactionType = data.type || 'expense';
      logAction(`Creating ${transactionType} transaction`, { amount: data.amount });
      
      // ✅ FIX: baseCreateTransaction expects only the data object, not type and data
      const result = await baseCreateTransaction(data);
      
      // ✅ ENHANCED: Context-aware invalidation
      await invalidateRelevantQueries(contextConfig.invalidationPriority);
      
      // ✅ NEW: Auto-refresh for high-priority contexts
      if (contextConfig.autoRefresh && (context === 'quickActions' || context === 'dashboard')) {
        setTimeout(() => {
          refetchTransactions();
        }, 500);
      }
      
      // ✅ REFRESH ALL: Trigger balance panel and transaction list refresh
      refreshAll();
      
      logAction(`${transactionType} transaction created successfully`);
      return result;
    } catch (error) {
      logAction(`Failed to create transaction`, { error: error.message });
      throw error;
    }
      }, [baseCreateTransaction, invalidateRelevantQueries, contextConfig, context, refreshAll, refetchTransactions, logAction]);

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
          refetchTransactions();
        }, 300);
      }
      
      logAction(`Transaction ${id} updated successfully`);
      
      // ✅ REFRESH ALL: Trigger balance panel and transaction list refresh
      refreshAll();
      
      return result;
    } catch (error) {
      logAction(`Failed to update transaction ${id}`, { error: error.message });
      throw error;
    }
  }, [baseUpdateTransaction, invalidateRelevantQueries, contextConfig, refreshAll, refetchTransactions, logAction]);

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
        refetchTransactions();
      }, 200);
      
      // ✅ REFRESH ALL: Trigger balance panel and transaction list refresh
      refreshAll();
      
      logAction(`Transaction ${id} deleted successfully`);
      return result;
    } catch (error) {
      logAction(`Failed to delete transaction ${id}`, { error: error.message });
      throw error;
    }
  }, [baseDeleteTransaction, invalidateRelevantQueries, queryClient, refreshAll, refetchTransactions, logAction]);

  /**
   * ✅ BULK DELETE: Use server bulk delete endpoint for better performance
   */
  const bulkDelete = useCallback(async (transactionIds, options = {}) => {
    try {
      logAction(`Bulk deleting ${transactionIds.length} transactions`);
      
      const result = await transactionAPI.bulkDelete(transactionIds);
      
      if (result.success) {
        await invalidateRelevantQueries('critical');
        setTimeout(() => {
          refetchTransactions();
        }, 200);
        refreshAll();
        
        const { successful, failed } = result.data.data.summary;
        
        if (successful > 0) {
          toastService.success('toast.success.bulkDeleteSuccess', { 
            params: { count: successful } 
          });
        }
        
        if (failed > 0) {
          toastService.error('toast.error.bulkDeletePartialFail', { 
            params: { failed } 
          });
        }
        
        logAction(`Bulk delete completed: ${successful} successful, ${failed} failed`);
        return result.data.data;
      } else {
        throw new Error(result.error?.message || 'Bulk delete failed');
      }
    } catch (error) {
      logAction(`Bulk delete failed`, { error: error.message });
      toastService.error('toast.error.bulkDeleteFailed');
      throw error;
    }
  }, [transactionAPI, invalidateRelevantQueries, refetchTransactions, refreshAll, logAction]);

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

  // ✅ NEW: Recurring template operations
  const createRecurringTemplate = useCallback(async (data) => {
    try {
      logAction('Creating recurring template', { amount: data.amount });
      
      // Use the createTransaction method with _isRecurring flag
      const recurringData = {
        ...data,
        _isRecurring: true
      };
      
      const result = await baseCreateTransaction(recurringData);
      
      // Enhanced invalidation for recurring templates
      await invalidateRelevantQueries('high');
      queryClient.invalidateQueries(['recurringTransactions']);
      queryClient.invalidateQueries(['upcomingTransactions']);
      
      refreshAll();
      
      logAction('Recurring template created successfully');
      return result;
    } catch (error) {
      logAction('Failed to create recurring template', { error: error.message });
      throw error;
    }
  }, [baseCreateTransaction, invalidateRelevantQueries, refreshAll, logAction, queryClient]);

  const updateRecurringTemplate = useCallback(async (id, data) => {
    try {
      logAction('Updating recurring template', { id, amount: data.amount });
      
      // For now, use the regular update transaction - this might need server-side improvement
      const result = await baseUpdateTransaction('expense', id, data);
      
      // Enhanced invalidation for recurring templates
      await invalidateRelevantQueries('high');
      queryClient.invalidateQueries(['recurringTransactions']);
      queryClient.invalidateQueries(['upcomingTransactions']);
      
      refreshAll();
      
      logAction('Recurring template updated successfully');
      return result;
    } catch (error) {
      logAction('Failed to update recurring template', { error: error.message });
      throw error;
    }
  }, [baseUpdateTransaction, invalidateRelevantQueries, refreshAll, logAction, queryClient]);

  return {
    // ✅ PRESERVED: CRUD Operations (enhanced with infinite loading support)
    createTransaction,
    updateTransaction, 
    deleteTransaction,
    deleteTemplate: baseDeleteTemplate, // ✅ FIX: Add deleteTemplate
    
    // ✅ NEW: Recurring template operations
    createRecurringTemplate,
    updateRecurringTemplate,
    
    // ✅ PRESERVED: Loading States
    isCreating,
    isUpdating,
    isDeleting,
    
    // ✅ ENHANCED: Operations with infinite loading support
    bulkOperations,
    bulkDelete,
    forceRefreshAll,
    
    // ✅ PRESERVED: State Helper
    isOperating: isCreating || isUpdating || isDeleting || isDeletingTemplate,
    
    // ✅ NEW: Context information for debugging
    context,
    contextConfig: process.env.NODE_ENV === 'development' ? contextConfig : undefined
  };
};

export default useTransactionActions;