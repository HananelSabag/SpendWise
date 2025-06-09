// client/src/hooks/useTransactionActions.js
/**
 * useTransactionActions Hook - Optimized Component Refresh System
 * 
 * PERFORMANCE IMPROVEMENTS:
 * ✅ Removed setTimeout delays - immediate cache invalidation  
 * ✅ Efficient cache management - invalidate only necessary queries
 * ✅ Cross-component synchronization - QuickActions updates BalancePanel + RecentTransactions instantly
 * ✅ Clean architecture - relies purely on React Query cache invalidation
 * 
 * USAGE:
 * - QuickActionsBar: Creates transactions and updates dashboard immediately
 * - AddTransactions: Full transaction creation with instant refresh
 * - EditTransaction: Updates existing transactions with real-time sync
 * - DeleteTransaction: Removes transactions with immediate UI updates
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTransactions } from './useTransactions';
import toast from 'react-hot-toast';

export const useTransactionActions = () => {
  const queryClient = useQueryClient();
  
  // Base transaction operations from useTransactions hook
  // Use consistent limit to match TransactionList default configuration
  const {
    createTransaction: baseCreateTransaction,
    updateTransaction: baseUpdateTransaction,
    deleteTransaction: baseDeleteTransaction,
    isCreating,
    isUpdating,
    isDeleting
  } = useTransactions({ limit: 50 });

  /**
   * Create Transaction - Optimized for immediate component updates
   * 
   * BEFORE: setTimeout(100ms) → delayed refresh → QuickActions didn't update other components
   * AFTER: Immediate invalidation → instant refresh → all components sync immediately
   * 
   * @param {string} type - 'income' or 'expense'
   * @param {object} data - Transaction data (amount, description, category_id, date, etc.)
   * @returns {Promise} - Transaction creation result
   */
  const createTransaction = useCallback(async (type, data) => {
    try {
      // Create the transaction first
      const result = await baseCreateTransaction(type, data);
      
      // PERFORMANCE FIX: Immediate cache invalidation without setTimeout
      // This ensures QuickActionsBar updates BalancePanel + RecentTransactions instantly
      await queryClient.invalidateQueries({ 
        queryKey: ['dashboard']
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['transactions'] 
      });
      
      // Optional: Invalidate related queries that might be affected
      await queryClient.invalidateQueries({ 
        queryKey: ['transactionsSummary'] 
      });
      
      return result;
    } catch (error) {
      // Let the base mutation handle error toasts and logging
      throw error;
    }
  }, [baseCreateTransaction, queryClient]);

  /**
   * Update Transaction - Immediate refresh for edit operations
   * 
   * Ensures edit operations from TransactionList or EditModal 
   * immediately update dashboard components
   * 
   * @param {string} type - Transaction type
   * @param {number} id - Transaction ID
   * @param {object} data - Updated transaction data
   * @returns {Promise} - Update result
   */
  const updateTransaction = useCallback(async (type, id, data) => {
    try {
      const result = await baseUpdateTransaction(type, id, data);
      
      // Immediate refresh - same pattern as create
      await queryClient.invalidateQueries({ 
        queryKey: ['dashboard']
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['transactions'] 
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['transactionsSummary'] 
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [baseUpdateTransaction, queryClient]);

  /**
   * Delete Transaction - Clean removal with immediate UI updates
   * 
   * Handles both single transaction deletion and bulk recurring deletion
   * Updates all dashboard components immediately
   * 
   * @param {number} id - Transaction ID to delete
   * @param {boolean} deleteAll - Whether to delete all recurring instances
   * @returns {Promise} - Deletion result
   */
  const deleteTransaction = useCallback(async (id, deleteAll = false) => {
    try {
      const result = await baseDeleteTransaction(id, deleteAll);
      
      // Immediate refresh for deletion
      await queryClient.invalidateQueries({ 
        queryKey: ['dashboard']
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['transactions'] 
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['transactionsSummary'] 
      });
      
      // For recurring deletions, also refresh recurring templates
      if (deleteAll) {
        await queryClient.invalidateQueries({ 
          queryKey: ['templates'] 
        });
        
        await queryClient.invalidateQueries({ 
          queryKey: ['transactionsRecurring'] 
        });
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }, [baseDeleteTransaction, queryClient]);

  /**
   * Bulk Operations - For future expansion
   * 
   * Placeholder for bulk transaction operations
   * with optimized cache invalidation
   */
  const bulkOperations = useCallback(async (operation, transactionIds) => {
    try {
      // Future implementation for bulk create/update/delete
      // Will follow the same immediate invalidation pattern
      
      throw new Error('Bulk operations not yet implemented');
    } catch (error) {
      throw error;
    }
  }, [queryClient]);

  /**
   * Force Refresh All - Manual refresh trigger
   * 
   * Utility function to manually refresh all transaction-related data
   * Useful for debugging or manual sync operations
   */
  const forceRefreshAll = useCallback(async () => {
    try {
      // Clear and refetch all transaction-related queries
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
      
      // Force immediate refetch of active queries
      await queryClient.refetchQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0];
          return ['dashboard', 'transactions'].includes(queryKey) && 
                 query.getObserversCount() > 0;
        },
        type: 'active'
      });
      
      toast.success('All transaction data refreshed');
    } catch (error) {
      toast.error('Failed to refresh transaction data');
      console.error('Force refresh error:', error);
    }
  }, [queryClient]);

  // Return all transaction operations with loading states
  return {
    // CRUD Operations - optimized for immediate component updates
    createTransaction,
    updateTransaction, 
    deleteTransaction,
    
    // Loading States - directly from base mutations
    isCreating,
    isUpdating,
    isDeleting,
    
    // Utility Operations
    bulkOperations,
    forceRefreshAll,
    
    // State Helper - check if any transaction operation is in progress
    isOperating: isCreating || isUpdating || isDeleting
  };
};

export default useTransactionActions;