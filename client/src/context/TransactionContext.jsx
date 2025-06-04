// src/context/TransactionContext.jsx
// Simplified version using React Query hooks
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import api, { transactionAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useDate } from './DateContext'; // ✅ FIX: Add missing import
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
  // ✅ FIX: Remove useAuth dependency to prevent circular dependency
  // const { user } = useAuth(); // REMOVED - causing circular dependency
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectedDate } = useDate();
  
  // Generate a unique provider instance ID for debugging
  const [providerId] = useState(() => {
    const id = Math.random().toString(36).substr(2, 9);
    return `tx-provider-${id}`;
  });

  // ✅ UPDATED: Get user info directly from localStorage or token instead of useAuth
  const [userEmail, setUserEmail] = useState(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email || 'Unknown';
      } catch {
        return 'Token-Invalid';
      }
    }
    return 'Not-Authenticated';
  });

  // ✅ UPDATE: Listen for auth changes via localStorage instead of useAuth
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserEmail(payload.email || 'Unknown');
        } catch {
          setUserEmail('Token-Invalid');
        }
      } else {
        setUserEmail('Not-Authenticated');
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom auth events
    window.addEventListener('authStateChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleStorageChange);
    };
  }, []);

  // ✅ FIXED: Log only once when provider mounts
  useEffect(() => {
    console.log(`💰 [TRANSACTION-PROVIDER] [${providerId}] Ready - User: ${userEmail}`);
  }, [providerId, userEmail]);
  
  // ✅ FIX: Get authenticated status from localStorage
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));
  
  // React Query hooks
  const recurringQuery = useRecurringTransactions();
  const templatesQuery = useTemplates();
  
  // Mutations
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  
  // ✅ FIX: Calculate recurring daily impact
  const recurringDailyImpact = React.useMemo(() => {
    if (!recurringQuery.data) return { income: 0, expense: 0 };
    
    const impact = { income: 0, expense: 0 };
    
    recurringQuery.data.forEach(transaction => {
      const amount = parseFloat(transaction.amount) || 0;
      const frequency = transaction.frequency || 'monthly';
      
      // Convert to daily amount
      let dailyAmount = amount;
      switch (frequency) {
        case 'daily':
          dailyAmount = amount;
          break;
        case 'weekly':
          dailyAmount = amount / 7;
          break;
        case 'monthly':
          dailyAmount = amount / 30;
          break;
        case 'yearly':
          dailyAmount = amount / 365;
          break;
        default:
          dailyAmount = amount / 30;
      }
      
      if (transaction.type === 'income') {
        impact.income += dailyAmount;
      } else {
        impact.expense += dailyAmount;
      }
    });
    
    return impact;
  }, [recurringQuery.data]);
  
  // Loading states
  const loading = recurringQuery.isLoading;
  const loadingStates = {
    recurring: recurringQuery.isLoading,
    templates: templatesQuery.isLoading,
    create: createMutation.isLoading,
    update: updateMutation.isLoading,
    delete: deleteMutation.isLoading
  };
  
  // Error handling
  const error = recurringQuery.error;
  
  // Transaction operations (simplified)
  const createTransaction = async (type, data) => {
    if (!isAuthenticated) return null;
    return createMutation.mutateAsync({ type, data });
  };
  
  const updateTransaction = async (type, id, data, updateFuture = false) => {
    if (!isAuthenticated) return null;
    return updateMutation.mutateAsync({ type, id, data: { ...data, updateFuture } });
  };
  
  const deleteTransaction = async (type, id, deleteFuture = false) => {
    if (!isAuthenticated) return false;
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
      
      // Trigger refresh
      window.dispatchEvent(new CustomEvent('dashboard-refresh-requested'));
      window.dispatchEvent(new CustomEvent('transaction-added'));
      
      return response.data;
    } catch (error) {
      console.error(`❌ [QUICK-ADD] Failed:`, error);
      throw error;
    }
  };
  
  // Refresh data
  const refreshData = () => {
    recurringQuery.refetch();
    templatesQuery.refetch();
  };
  
  // ✅ FIX: Complete the value object
  const value = {
    // Data
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