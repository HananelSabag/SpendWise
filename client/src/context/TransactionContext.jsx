// src/context/TransactionContext.jsx
// Simplified version using React Query hooks
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const token = localStorage.getItem('accessToken');
  const { user } = useAuth();
  
  // Main dashboard data - replaces 3 separate calls
  const dashboardQuery = useDashboard();
  
  // Recurring transactions
  const recurringQuery = useRecurringTransactions();
  
  // Templates
  const templatesQuery = useTemplates();
  
  // Mutations
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  
  // Extract data from queries
  const {
    recentTransactions = [],
    balances = {
      daily: { income: 0, expenses: 0, balance: 0 },
      weekly: { income: 0, expenses: 0, balance: 0 },
      monthly: { income: 0, expenses: 0, balance: 0 },
      yearly: { income: 0, expenses: 0, balance: 0 }
    },
    recurringInfo = {},
    metadata = {}
  } = dashboardQuery.data || {};
  
  // Loading states
  const loading = dashboardQuery.isLoading || recurringQuery.isLoading;
  const loadingStates = {
    dashboard: dashboardQuery.isLoading,
    recurring: recurringQuery.isLoading,
    templates: templatesQuery.isLoading,
    create: createMutation.isLoading,
    update: updateMutation.isLoading,
    delete: deleteMutation.isLoading
  };
  
  // Error handling
  const error = dashboardQuery.error || recurringQuery.error;
  
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
  const quickAddTransaction = async (type, amount, description = 'Quick transaction') => {
    try {
      // Create a date at noon to avoid timezone edge cases
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      // Get timezone offset in minutes and convert to hours
      const tzOffset = today.getTimezoneOffset();
      
      // Get the date in local timezone
      const localDate = new Date(today.getTime() - (tzOffset * 60000));
      
      // Format as YYYY-MM-DD ensuring we use local date
      const formattedDate = localDate.toISOString().substring(0, 10);
      
      console.log(`[DEBUG] Adding quick ${type} with date: ${formattedDate} (local time)`);
      console.log(`[DEBUG] Current timezone offset: ${tzOffset} minutes`);
      
      const payload = {
        amount,
        description,
        date: formattedDate,
        category_id: null,
        notes: ''
      };
      
      // Use the API utility instead of direct axios
      const endpoint = `/transactions/${type}`;
      const response = await api.post(endpoint, payload);
      
      // Trigger dashboard refresh event
      window.dispatchEvent(new CustomEvent('dashboard-refresh-requested', { 
        detail: { queryKey: 'dashboard' }
      }));
      
      // Also trigger the existing event
      window.dispatchEvent(new CustomEvent('transaction-added'));
      
      return response.data;
    } catch (error) {
      console.error('Error adding quick transaction:', error);
      throw error;
    }
  };
  
  // Refresh data
  const refreshData = () => {
    dashboardQuery.refetch();
    recurringQuery.refetch();
    templatesQuery.refetch();
  };
  
  const processBalanceData = (data) => {
    if (!data) return { income: 0, expenses: 0, total: 0 };
    
    return {
      income: numbers.parseAmount(data.income),
      expenses: numbers.parseAmount(data.expenses),
      total: numbers.parseAmount(data.income - data.expenses)
    };
  };

  // Calculate the daily impact of all recurring transactions.
  // Always ensure `recurring` is an array.
  const recurringDailyImpact = React.useMemo(() => {
    // Use Array.isArray to guarantee recurring is always an array.
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
    // Data
    recentTransactions,
    periodTransactions: recentTransactions, // For backward compatibility
    recurringTransactions: recurringQuery.data || [],
    templates: templatesQuery.data || [],
    balances,
    metadata,
    recurringInfo,
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
    forceRefresh: refreshData, // Alias for backward compatibility
    
    // Additional methods for backward compatibility
    getRecurringTransactions: () => recurringQuery.refetch(),
    getByPeriod: (period) => dashboardQuery.refetch(),
    fetchRecentTransactions: () => dashboardQuery.refetch(),
    getBalanceDetails: () => dashboardQuery.refetch(),
    clearErrors: () => {} // No longer needed with React Query
  };
  
  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export default TransactionContext;