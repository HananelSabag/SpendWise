// src/context/TransactionContext.jsx
// Simplified version using React Query hooks
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Make sure this is imported
import axios from 'axios'; // Add axios import
import api, { transactionAPI } from '../utils/api'; // Make sure API utilities are imported
import { useAuth } from './AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { 
  useCreateTransaction, 
  useUpdateTransaction, 
  useDeleteTransaction,
  useRecurringTransactions,
  useTemplates 
} from '../hooks/useApi';
import { numbers } from '../utils/helpers';

const TransactionContext = createContext(null);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
};

/**
 * Transaction Provider - Now powered by React Query!
 * Much simpler and more efficient than the old version
 */
export const TransactionProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const providerId = useRef(`tx-provider-${Math.random().toString(36).substr(2, 9)}`).current;
  
  useEffect(() => {
    // ✅ לוג רק במקרים מיוחדים
    const debugMode = localStorage.getItem('debug_transactions') === 'true';
    const isFirstProvider = !window._primaryTransactionProvider;
    
    if (user?.email && isFirstProvider) {
      // לוג רק אם זה ה-provider הראשון
      console.log(`💰 [TRANSACTION-PROVIDER] [${providerId}] Ready - User: ${user.email}`);
      window._primaryTransactionProvider = providerId;
    } else if (debugMode && user?.email) {
      // לוג נוסף רק אם debug מפורש
      console.log(`💰 [TRANSACTION-PROVIDER] [${providerId}] Secondary provider for: ${user.email}`);
    }
    
    return () => {
      if (window._primaryTransactionProvider === providerId) {
        window._primaryTransactionProvider = null;
      }
    };
  }, [providerId, user?.email]);
  
  // ✅ רק recurring & templates - ללא לוגים
  const recurringQuery = useRecurringTransactions();
  const templatesQuery = useTemplates();
  
  // Mutations
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  
  // Loading states - רק recurring & templates
  const loading = recurringQuery.isLoading;
  const loadingStates = {
    recurring: recurringQuery.isLoading,
    templates: templatesQuery.isLoading,
    create: createMutation.isLoading,
    update: updateMutation.isLoading,
    delete: deleteMutation.isLoading
  };
  
  // Error handling - רק recurring error
  const error = recurringQuery.error;
  
  // Transaction operations (simplified)
  const createTransaction = async (type, data) => {
    if (!user) return null;
    return createMutation.mutateAsync({ type, data });
  };
  
  const updateTransaction = async (type, id, data, updateFuture = false) => {
    if (!user) return null;
    return updateMutation.mutateAsync({ type, id, data: { ...data, updateFuture } });
  };
  
  const deleteTransaction = async (type, id, deleteFuture = false) => {
    if (!user) return false;
    return deleteMutation.mutateAsync({ type, id, deleteFuture });
  };
  
  // Quick add transaction
  const quickAddTransaction = async (type, amount, description = 'Quick transaction', categoryId = null) => {
    try {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      const payload = {
        amount,
        description,
        date: formattedDate,
        category_id: categoryId || 8,
        notes: ''
      };
      
      const response = await api.post(`/transactions/${type}`, payload);
      
      // Trigger refresh - ללא לוגים מיותרים
      window.dispatchEvent(new CustomEvent('dashboard-refresh-requested'));
      window.dispatchEvent(new CustomEvent('transaction-added'));
      
      return response.data;
    } catch (error) {
      console.error(`❌ [QUICK-ADD] Failed:`, error);
      throw error;
    }
  };
  
  // Refresh data - רק recurring & templates
  const refreshData = () => {
    recurringQuery.refetch();
    templatesQuery.refetch();
  };
  
  // Calculate the daily impact of all recurring transactions
  const recurringDailyImpact = React.useMemo(() => {
    const rawRecurring = recurringQuery.data?.data;
    const recurring = Array.isArray(rawRecurring) ? rawRecurring : [];

    return recurring.reduce((acc, item) => {
      const dailyAmount =
        item.daily_amount ||
        (item.interval_type === 'monthly'
          ? item.amount / 30
          : item.interval_type === 'weekly'
          ? item.amount / 7
          : item.amount);

      if (item.type === 'income') {
        acc.income += dailyAmount;
      } else {
        acc.expense += dailyAmount;
      }
      acc.total = acc.income - acc.expense;
      return acc;
    }, { total: 0, income: 0, expense: 0 });
  }, [recurringQuery.data]);
  
  const value = {
    // Data - רק recurring & templates
    recurringTransactions: recurringQuery.data || [],
    templates: templatesQuery.data || [],
    recurringDailyImpact,
    
    // UI States
    loading,
    loadingState: loadingStates,
    error,
    
    // Operations
    createTransaction,
    updateTransaction,
    deleteTransaction,
    quickAddTransaction,
    
    // Data fetching
    refreshData,
    forceRefresh: refreshData,
    
    // Additional methods for backward compatibility
    getRecurringTransactions: () => recurringQuery.refetch(),
    clearErrors: () => {}
  };
  
  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;