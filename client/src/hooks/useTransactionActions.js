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
import { useTransactions } from './useTransactions';
import toast from 'react-hot-toast';

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
      const result = await baseCreateTransaction(type, data);
      
      // ✅ ENHANCED: Context-aware invalidation
      await invalidateRelevantQueries(contextConfig.invalidationPriority);
      
      // ✅ NEW: Auto-refresh for high-priority contexts
      if (contextConfig.autoRefresh && (context === 'quickActions' || context === 'dashboard')) {
        setTimeout(() => {
          refreshAll();
        }, 500); // Small delay to allow server to process
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [baseCreateTransaction, invalidateRelevantQueries, contextConfig, context, refreshAll]);

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
      const result = await baseUpdateTransaction(type, id, data);
      
      // Always use high priority for updates since they're user-initiated
      await invalidateRelevantQueries('high');
      
      // Auto-refresh for immediate feedback
      if (contextConfig.autoRefresh) {
        setTimeout(() => {
          refreshAll();
        }, 300);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [baseUpdateTransaction, invalidateRelevantQueries, contextConfig, refreshAll]);

  /**
   * Delete Transaction - Clean removal with infinite query support
   * 
   * @param {number} id - Transaction ID to delete
   * @param {boolean} deleteAll - Whether to delete all recurring instances
   * @returns {Promise} - Deletion result
   */
  const deleteTransaction = useCallback(async (id, deleteAll = false) => {
    try {
      const result = await baseDeleteTransaction(id, deleteAll);
      
      // Use critical priority for deletions to ensure immediate UI updates
      await invalidateRelevantQueries('critical');
      
      // For recurring deletions, also refresh templates
      if (deleteAll) {
        await queryClient.invalidateQueries({ queryKey: ['templates'] });
        await queryClient.invalidateQueries({ queryKey: ['transactionsRecurring'] });
      }
      
      // Always refresh after deletion for immediate feedback
      setTimeout(() => {
        refreshAll();
      }, 200);
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [baseDeleteTransaction, invalidateRelevantQueries, queryClient, refreshAll]);

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
        toast.success(`${successful} transactions ${operation}d successfully`);
      }
      
      if (failed > 0) {
        toast.error(`${failed} transactions failed to ${operation}`);
      }
      
      return { successful, failed, results };
      
    } catch (error) {
      toast.error(`Bulk ${operation} failed`);
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
      
      toast.success('All transaction data refreshed');
    } catch (error) {
      toast.error('Failed to refresh transaction data');
      console.error('Force refresh error:', error);
    }
  }, [queryClient]);

  return {
    // ✅ PRESERVED: CRUD Operations (enhanced with infinite loading support)
    createTransaction,
    updateTransaction, 
    deleteTransaction,
    
    // ✅ PRESERVED: Loading States
    isCreating,
    isUpdating,
    isDeleting,
    
    // ✅ ENHANCED: Operations with infinite loading support
    bulkOperations,
    forceRefreshAll,
    
    // ✅ PRESERVED: State Helper
    isOperating: isCreating || isUpdating || isDeleting,
    
    // ✅ NEW: Context information for debugging
    context,
    contextConfig: process.env.NODE_ENV === 'development' ? contextConfig : undefined
  };
};

export default useTransactionActions;