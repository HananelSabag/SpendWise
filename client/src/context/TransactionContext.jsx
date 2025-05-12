/**
 * TransactionContext.jsx
 * Centralized transaction state management with improved error handling and refresh capability
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useRefresh } from './RefreshContext';
import { useDate } from './DateContext';
import api, { transactionAPI, forceRefresh as apiForceRefresh } from '../utils/api';
import { toast } from 'react-toastify';

/**
 * Transaction Context
 */
const TransactionContext = createContext(null);

/**
 * Transaction Status Types
 */
const TransactionStatus = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  SKIPPED: 'skipped'
};

/**
 * Request Manager for preventing duplicate API calls and tracking in-flight requests
 */
const RequestManager = {
  pending: new Map(),
  
  /**
   * Execute a function and track its promise to prevent duplicate calls
   * @param {string} key - Unique key for the request
   * @param {Function} fn - Function to execute
   * @returns {Promise} Result of the function
   */
  async execute(key, fn) {
    // If request is already in progress, return the pending promise
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Create a new promise
    const promise = fn();
    this.pending.set(key, promise);

    try {
      // Await and return the result
      return await promise;
    } finally {
      // Clean up after completion
      this.pending.delete(key);
    }
  },
  
  /**
   * Clear all pending requests
   */
  clear() {
    this.pending.clear();
  }
};

/**
 * Transaction Provider Component
 */
export const TransactionProvider = ({ children }) => {
  // Core hooks
  const { user } = useAuth();
  const { triggerRefresh } = useRefresh();
  const { selectedDate, normalizeDate } = useDate();

  // Core states for transactions
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [periodTransactions, setPeriodTransactions] = useState([]);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  
  // Balance states
  const [balances, setBalances] = useState({
    daily: { income: 0, expenses: 0, balance: 0 },
    weekly: { income: 0, expenses: 0, balance: 0 },
    monthly: { income: 0, expenses: 0, balance: 0 },
    yearly: { income: 0, expenses: 0, balance: 0 }
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    recent: false,
    period: false,
    recurring: false,
    balance: false,
    create: false,
    update: false,
    delete: false
  });
  const [error, setError] = useState(null);
  const [isSkippingTransaction, setIsSkippingTransaction] = useState(false);
  const [skipError, setSkipError] = useState(null);

  // Metadata state
  const [metadata, setMetadata] = useState({
    calculatedAt: null,
    nextReset: null,
    timePeriods: {}
  });

  // Tracking fetched data for specific dates
  const fetchedDatesRef = useRef(new Set());

  /**
   * Update loading state for a specific operation
   * @param {string} operation - Operation name
   * @param {boolean} isLoading - Loading state
   */
  const updateLoadingState = useCallback((operation, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [operation]: isLoading
    }));
    
    // Update global loading state if any operation is loading
    setLoading(prev => {
      if (isLoading) return true;
      
      // Check if any other operation is still loading
      const updatedStates = {
        ...prev,
        [operation]: isLoading
      };
      
      return Object.values(updatedStates).some(state => state);
    });
  }, []);

  /**
   * Clear errors
   */
  const clearErrors = useCallback(() => {
    setError(null);
    setSkipError(null);
  }, []);

  /**
   * Handle error with consistent formatting
   * @param {Error} error - Error object
   * @param {string} operation - Operation that failed
   * @param {string} defaultMessage - Default error message
   * @returns {Object} Formatted error object
   */
  const handleError = useCallback((error, operation, defaultMessage) => {
    console.error(`Error in ${operation}:`, error);
    
    const errorObj = {
      type: error.response?.data?.error || `${operation}_failed`,
      message: error.response?.data?.message || defaultMessage,
      originalError: error
    };
    
    return errorObj;
  }, []);

  /**
   * fetchRecentTransactions
   * Loads up to 'limit' recent transactions up to (and including) 'dateArg'.
   * Default is selectedDate if none provided.
   */
  const fetchRecentTransactions = useCallback(async (limit = 5, dateArg = selectedDate) => {
    if (!user) return [];
    
    const normalizedDate = normalizeDate(dateArg);
    const dateStr = normalizedDate.toISOString().split('T')[0];
    const requestKey = `recent_${dateStr}_${limit}`;

    try {
      updateLoadingState('recent', true);
      clearErrors();
      
      const result = await RequestManager.execute(requestKey, async () => {
        const response = await transactionAPI.getRecent(limit, normalizedDate);
        return response.data;
      });
      
      setRecentTransactions(result);
      return result;
    } catch (err) {
      const error = handleError(err, 'fetch', 'Unable to fetch recent transactions');
      setError(error);
      return [];
    } finally {
      updateLoadingState('recent', false);
    }
  }, [user, selectedDate, normalizeDate, clearErrors, handleError, updateLoadingState]);

  /**
   * Get transactions by period
   */
  const getByPeriod = useCallback(async (period, date = selectedDate) => {
    if (!user) return [];

    const normalizedDate = normalizeDate(date);
    const dateKey = normalizedDate.toISOString().split('T')[0];
    const requestKey = `period_${period}_${dateKey}`;

    try {
      updateLoadingState('period', true);
      clearErrors();
      
      const result = await RequestManager.execute(requestKey, async () => {
        const response = await transactionAPI.getByPeriod(period, normalizedDate);
        return response.data;
      });
      
      // Mark this date as fetched
      fetchedDatesRef.current.add(dateKey);
      
      setPeriodTransactions(result);
      return result;
    } catch (err) {
      const error = handleError(err, 'fetch', 'Unable to fetch period transactions');
      setError(error);
      return [];
    } finally {
      updateLoadingState('period', false);
    }
  }, [user, selectedDate, normalizeDate, clearErrors, handleError, updateLoadingState]);

  /**
   * Get recurring transactions
   */
  const getRecurringTransactions = useCallback(async (type = null) => {
    if (!user) return [];

    const requestKey = `recurring_${type || 'all'}`;

    try {
      updateLoadingState('recurring', true);
      clearErrors();
      
      const result = await RequestManager.execute(requestKey, async () => {
        const response = await transactionAPI.getRecurring(type);
        return response.data;
      });
      
      setRecurringTransactions(result);
      return result;
    } catch (err) {
      const error = handleError(err, 'fetch', 'Unable to fetch recurring transactions');
      setError(error);
      return [];
    } finally {
      updateLoadingState('recurring', false);
    }
  }, [user, clearErrors, handleError, updateLoadingState]);

  /**
   * Get balance details
   */
  const getBalanceDetails = useCallback(async (date = selectedDate) => {
    if (!user) return null;
  
    const normalizedDate = normalizeDate(date);
    const dateKey = normalizedDate.toISOString().split('T')[0];
    const requestKey = `balance_${dateKey}`;
  
    try {
      updateLoadingState('balance', true);
      clearErrors();
      
      const result = await RequestManager.execute(requestKey, async () => {
        try {
          const response = await transactionAPI.getBalanceDetails(normalizedDate);
          return response.data;
        } catch (err) {
          console.error('Balance API error:', err);
          // Return fallback data instead of throwing
          return {
            daily: { income: 0, expenses: 0, balance: 0 },
            weekly: { income: 0, expenses: 0, balance: 0 },
            monthly: { income: 0, expenses: 0, balance: 0 },
            yearly: { income: 0, expenses: 0, balance: 0 },
            metadata: {
              calculatedAt: new Date().toISOString(),
              timePeriods: {}
            }
          };
        }
      });
      
      if (result) {
        setBalances({
          daily: result.daily || { income: 0, expenses: 0, balance: 0 },
          weekly: result.weekly || { income: 0, expenses: 0, balance: 0 },
          monthly: result.monthly || { income: 0, expenses: 0, balance: 0 },
          yearly: result.yearly || { income: 0, expenses: 0, balance: 0 }
        });
        
        setMetadata(result.metadata || {
          calculatedAt: null,
          nextReset: null,
          timePeriods: {}
        });
        
        return result;
      }
      
      return null;
    } catch (err) {
      // Log but don't crash
      console.error('Error in balance calculation:', err);
      // Use default values
      setBalances({
        daily: { income: 0, expenses: 0, balance: 0 },
        weekly: { income: 0, expenses: 0, balance: 0 },
        monthly: { income: 0, expenses: 0, balance: 0 },
        yearly: { income: 0, expenses: 0, balance: 0 }
      });
      return null;
    } finally {
      updateLoadingState('balance', false);
    }
  }, [user, selectedDate, normalizeDate, clearErrors, updateLoadingState]);
  
  /**
   * Force refresh all transaction data
   * Clears request tracking and fetches fresh data
   */
  const forceRefresh = useCallback(async () => {
    setLoading(true);
    RequestManager.clear();
    
    try {
      // Use the API's force refresh first
      await apiForceRefresh();
      
      // Then refresh our context data
      const normalizedDate = normalizeDate(selectedDate);
      
      // Clear the fetched dates tracking
      fetchedDatesRef.current.clear();
      
      // Refetch all data
      await Promise.all([
        getBalanceDetails(normalizedDate),
        fetchRecentTransactions(5, normalizedDate),
        getByPeriod('day', normalizedDate)
      ]);
      
      toast.success('Data refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error in forceRefresh:', error);
      toast.error('Failed to refresh data');
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    selectedDate, 
    normalizeDate, 
    getBalanceDetails, 
    fetchRecentTransactions, 
    getByPeriod
  ]);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async (date = selectedDate) => {
    if (!user) return;

    try {
      clearErrors();
      
      // Clear pending requests to avoid conflicts
      RequestManager.clear();

      // Check if we need to fetch data for this date
      const normalizedDate = normalizeDate(date);
      const dateKey = normalizedDate.toISOString().split('T')[0];
      
      // Execute refreshes in parallel for better performance
      await Promise.all([
        getBalanceDetails(normalizedDate),
        fetchRecentTransactions(5, normalizedDate),
        getByPeriod('day', normalizedDate)
      ]);

      triggerRefresh('all', normalizedDate);
    } catch (error) {
      console.error('Error in refreshData:', error);
      setError({
        type: 'refresh_failed',
        message: 'Failed to refresh data'
      });
    }
  }, [
    user,
    selectedDate, 
    normalizeDate,
    clearErrors,
    getBalanceDetails,
    fetchRecentTransactions,
    getByPeriod,
    triggerRefresh
  ]);

  /**
   * Create new transaction
   */
  const createTransaction = useCallback(async (type, data) => {
    if (!user) return null;

    try {
      updateLoadingState('create', true);
      clearErrors();

      // Prepare data for API
      const dataToSend = {
        ...data,
        user_id: user.id,
        amount: parseFloat(data.amount),
        date: data.date || selectedDate.toISOString().split('T')[0],
        is_recurring: Boolean(data.is_recurring),
        recurring_interval: data.is_recurring ? data.recurring_interval : null,
        recurring_amount: data.is_recurring ? parseFloat(data.amount) : null,
        recurring_end_date: data.recurring_end_date || null,
        category_id: data.category_id ? parseInt(data.category_id) : null
      };

      const response = await transactionAPI.create(type, dataToSend);
      
      // Show success message
      toast.success(`${type === 'expense' ? 'Expense' : 'Income'} added successfully`);

      // Refresh data
      const dateObj = new Date(dataToSend.date);
      await refreshData(dateObj);
      
      // If it's recurring, refresh that list too
      if (data.is_recurring) {
        await getRecurringTransactions();
      }
      
      return response.data;
    } catch (err) {
      const error = handleError(err, 'creation', 'Failed to create transaction');
      setError(error);
      throw error;
    } finally {
      updateLoadingState('create', false);
    }
  }, [
    user,
    selectedDate,
    refreshData,
    getRecurringTransactions,
    clearErrors,
    handleError,
    updateLoadingState
  ]);

  /**
   * Update transaction with support for recurring options
   */
  const updateTransaction = useCallback(async (type, id, data, updateFuture = false) => {
    if (!user) return null;

    try {
      updateLoadingState('update', true);
      clearErrors();

      // Prepare data for submission
      const dataToSend = {
        ...data,
        amount: parseFloat(data.amount),
        is_recurring: Boolean(data.is_recurring),
        recurring_interval: data.is_recurring ? data.recurring_interval : null,
        recurring_amount: data.is_recurring ? parseFloat(data.amount) : null,
        recurring_end_date: data.recurring_end_date || null,
        updateFuture
      };

      const response = await transactionAPI.update(type, id, dataToSend);
      
      // Show success message
      toast.success(`${type === 'expense' ? 'Expense' : 'Income'} updated successfully`);

      // Refresh data
      const dateObj = new Date(data.date);
      await refreshData(dateObj);
      
      // If recurring or updating future occurrences, refresh recurring list
      if (updateFuture || data.is_recurring) {
        await getRecurringTransactions();
      }
      
      return response.data;
    } catch (err) {
      const error = handleError(err, 'update', 'Failed to update transaction');
      setError(error);
      throw error;
    } finally {
      updateLoadingState('update', false);
    }
  }, [
    user,
    refreshData,
    getRecurringTransactions,
    clearErrors,
    handleError,
    updateLoadingState
  ]);

  /**
   * Delete transaction with support for recurring options
   */
  const deleteTransaction = useCallback(async (type, id, deleteFuture = false) => {
    if (!user) return false;

    try {
      updateLoadingState('delete', true);
      clearErrors();

      await transactionAPI.delete(type, id, deleteFuture);
      
      // Show success message
      toast.success(`${type === 'expense' ? 'Expense' : 'Income'} deleted successfully`);

      // Refresh data
      await refreshData(selectedDate);
      
      // If it affects future occurrences, refresh recurring list
      if (deleteFuture) {
        await getRecurringTransactions();
      }
      
      return true;
    } catch (err) {
      const error = handleError(err, 'deletion', 'Failed to delete transaction');
      setError(error);
      throw error;
    } finally {
      updateLoadingState('delete', false);
    }
  }, [
    user,
    selectedDate,
    refreshData,
    getRecurringTransactions,
    clearErrors,
    handleError,
    updateLoadingState
  ]);

  /**
   * Skip specific occurrence of recurring transaction
   */
  const skipTransactionOccurrence = useCallback(async (type, id, skipDate) => {
    if (!user) return false;

    try {
      setIsSkippingTransaction(true);
      clearErrors();

      await transactionAPI.skipOccurrence(type, id, skipDate);
      
      // Refresh affected data
      await refreshData(new Date(skipDate));
      await getRecurringTransactions();
      
      return true;
    } catch (err) {
      const error = handleError(err, 'skip', 'Failed to skip transaction occurrence');
      setSkipError(error);
      return false;
    } finally {
      setIsSkippingTransaction(false);
    }
  }, [
    user,
    refreshData,
    getRecurringTransactions,
    clearErrors,
    handleError
  ]);

  /**
   * Quick add transaction (expense/income)
   * Simplified version of createTransaction for quick entries
   */
  const quickAddTransaction = useCallback(async (type, amount, description = 'Quick Transaction', date = selectedDate) => {
    if (!user) return null;

    try {
      updateLoadingState('create', true);
      clearErrors();

      const data = {
        amount: parseFloat(amount),
        description,
        date: normalizeDate(date).toISOString().split('T')[0],
        is_recurring: false,
        user_id: user.id
      };

      const response = await transactionAPI.create(type, data);
      
      // Show success notification
      toast.success(`Quick ${type} added successfully`);
      
      // Refresh data
      await refreshData(date);
      
      return response.data;
    } catch (err) {
      const error = handleError(err, 'creation', `Failed to add quick ${type}`);
      setError(error);
      throw error;
    } finally {
      updateLoadingState('create', false);
    }
  }, [
    user,
    selectedDate,
    normalizeDate,
    refreshData,
    clearErrors,
    handleError,
    updateLoadingState
  ]);

  // Get daily recurring impact on the balance
  const recurringDailyImpact = useMemo(() => {
    if (!recurringTransactions.length) return { total: 0, income: 0, expense: 0 };
    
    return recurringTransactions.reduce((acc, tx) => {
      const amount = Number(tx.daily_amount || 0);
      
      if (tx.transaction_type === 'income') {
        acc.income += amount;
      } else {
        acc.expense += amount;
      }
      
      acc.total = acc.income - acc.expense;
      return acc;
    }, { total: 0, income: 0, expense: 0 });
  }, [recurringTransactions]);

  // Initial data load
  useEffect(() => {
    if (!user) return;
    
    // Only fetch data if we haven't already fetched for this date
    const dateKey = selectedDate.toISOString().split('T')[0];
    
    if (!fetchedDatesRef.current.has(dateKey)) {
      refreshData(selectedDate);
    }
  }, [user, selectedDate, refreshData]);

  // Combine the loading states into the overall loading state
  // Allows more granular loading indicators while maintaining backwards compatibility
  const loadingState = useMemo(() => ({
    ...loadingStates,
    isLoading: loading
  }), [loading, loadingStates]);

  // Context value
  const value = {
    // Transaction data
    recentTransactions,
    periodTransactions,
    recurringTransactions,
    balances,
    metadata,
    recurringDailyImpact,

    // UI state
    loading,
    loadingState,
    error,
    isSkippingTransaction,
    skipError,

    // Transaction operations
    createTransaction,
    updateTransaction,
    deleteTransaction,
    skipTransactionOccurrence,
    quickAddTransaction,

    // Data fetching
    getRecurringTransactions,
    getByPeriod,
    refreshData,
    forceRefresh,
    getBalanceDetails,
    fetchRecentTransactions,
    clearErrors
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

/**
 * Custom hook to access transaction context
 */
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export default TransactionContext;