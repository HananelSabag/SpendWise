// TransactionContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useRefresh } from './RefreshContext';
import api from '../utils/api';

const TransactionContext = createContext();

// API Constants
const FETCH_COOLDOWN = 2000;  // 2 seconds between identical requests
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout
const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;

export const TransactionProvider = ({ children }) => {
  // Core hooks
  const { user } = useAuth();
  const { triggerRefresh } = useRefresh();

  // Global state
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [periodTransactions, setPeriodTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState({
    calculatedAt: null,
    nextReset: null,
    timePeriods: {}
  });
  const [balances, setBalances] = useState({
    daily: { income: 0, expenses: 0, balance: 0 },
    weekly: { income: 0, expenses: 0, balance: 0 },
    monthly: { income: 0, expenses: 0, balance: 0 },
    yearly: { income: 0, expenses: 0, balance: 0 }
  });

  // Request tracking refs
  const retryCountRef = useRef({});
  const pendingRequestsRef = useRef({});

  // ==================== Request Management ====================
  const makeRequest = useCallback(async (key, apiCall, retryCount = 0) => {
    try {
      // Handle concurrent requests
      if (pendingRequestsRef.current[key]) {
        return pendingRequestsRef.current[key];
      }

      // Create request promise
      pendingRequestsRef.current[key] = apiCall();
      const result = await Promise.race([
        pendingRequestsRef.current[key],
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT))
      ]);

      return result;
    } catch (error) {
      // Handle rate limiting
      if (error?.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '1', 10);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return makeRequest(key, apiCall, retryCount);
      }

      // Handle retries for other errors
      if (retryCount < RETRY_COUNT) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return makeRequest(key, apiCall, retryCount + 1);
      }

      throw error;
    } finally {
      delete pendingRequestsRef.current[key];
    }
  }, []);

  // ==================== Data Fetching ====================

  // Recent transactions for home page
  const fetchRecentTransactions = useCallback(async (limit = 5, date = new Date()) => {
    if (!user) return;

    try {
      console.log('TransactionContext fetching for date:', date);

      // Check if the date is today (default)
      const today = new Date();
      const isDefaultDate = date.toDateString() === today.toDateString();

      if (isDefaultDate) {
        // For default date (today) - get latest transactions regardless of date
        const response = await api.get('/transactions/recent', {
          params: { limit }
        });

        if (response?.data) {
          setRecentTransactions(response.data);
        }
      } else {
        // For selected date - get transactions for that specific date
        const normalizedDate = new Date(date);
        normalizedDate.setHours(12, 0, 0, 0);
        const dateKey = normalizedDate.toISOString().split('T')[0];

        const response = await api.get('/transactions/period/day', {
          params: { date: dateKey }
        });

        if (response?.data) {
          // Take only up to 5 transactions from the selected date
          setRecentTransactions(response.data.slice(0, limit));
        }
      }
    } catch (err) {
      console.error('Error fetching recent transactions:', err);
      setError('Failed to fetch recent transactions');
      setRecentTransactions([]);
    }
  }, [user]);

  // Period transactions for management page
  const fetchPeriodTransactions = useCallback(async (period, date) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Normalize date
      const formattedDate = new Date(date);
      formattedDate.setHours(12, 0, 0, 0);
      const dateKey = formattedDate.toISOString().split('T')[0];

      console.log('Context Request:', {
        period,
        dateKey,
        url: `/transactions/period/${period}`
      });

      const response = await api.get(`/transactions/period/${period}`, {
        params: { date: dateKey }
      });

      console.log('Context Response:', {
        status: response.status,
        dataLength: response.data?.length
      });

      if (response?.data) {
        setPeriodTransactions(response.data);
      } else {
        setPeriodTransactions([]);
      }
    } catch (err) {
      console.error('Context Error:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to fetch transactions');
      setPeriodTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);
  // Balance details
  const refreshBalances = useCallback(async (targetDate = new Date()) => {
    if (!user) return;

    try {
      const normalizedDate = new Date(targetDate);
      normalizedDate.setHours(12, 0, 0, 0);

      const response = await makeRequest(
        'refreshBalances',
        () => api.get('/transactions/balance/details', {
          params: {
            date: normalizedDate.toISOString().split('T')[0]
          }
        })
      );

      if (response?.data) {
        setBalances({
          daily: response.data.daily || { income: 0, expenses: 0, balance: 0 },
          weekly: response.data.weekly || { income: 0, expenses: 0, balance: 0 },
          monthly: response.data.monthly || { income: 0, expenses: 0, balance: 0 },
          yearly: response.data.yearly || { income: 0, expenses: 0, balance: 0 }
        });

        if (response.data.metadata) {
          setMetadata(response.data.metadata);
        }
      }
    } catch (err) {
      console.error('Error refreshing balances:', err);
      setError('Failed to refresh balances');
    }
  }, [user, makeRequest]);


  // ==================== Transaction Mutations ====================

  // Helper for refreshing data after changes
  const refreshData = useCallback(async (date) => {
    await Promise.all([
      refreshBalances(date),
      fetchRecentTransactions(5, date),
      date ? fetchPeriodTransactions('day', date) : null
    ].filter(Boolean));
  
    triggerRefresh('all', date); // Pass the date here
  }, [refreshBalances, fetchRecentTransactions, fetchPeriodTransactions, triggerRefresh]);
  // Add transaction
  const addTransaction = useCallback(async (data) => {
    if (!user) return;

    try {
      const endpoint = `/transactions/${data.type}`;
      const dataToSend = {
        ...data,
        user_id: user.id,
        amount: parseFloat(data.amount),
        date: data.date || new Date().toISOString().split('T')[0],
        is_recurring: Boolean(data.isRecurring),
        recurring_interval: data.isRecurring ? data.frequency : null,
        recurring_amount: data.isRecurring ? parseFloat(data.amount) : null,
        category_id: data.category_id ? parseInt(data.category_id) : null
      };

      const response = await makeRequest(
        'addTransaction',
        () => api.post(endpoint, dataToSend)
      );

      await refreshData(new Date(dataToSend.date));
      return response?.data;
    } catch (err) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  }, [user, makeRequest, refreshData]);

  // Update transaction
  const updateTransaction = useCallback(async (id, type, data) => {
    if (!user) return;

    try {
      const dataToSend = {
        ...data,
        amount: parseFloat(data.amount),
        is_recurring: Boolean(data.is_recurring),
        recurring_amount: data.recurring_amount ? parseFloat(data.recurring_amount) : null,
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : undefined
      };

      await makeRequest(
        `updateTransaction_${id}`,
        () => api.put(`/transactions/${type}/${id}`, dataToSend)
      );

      await refreshData(data.date ? new Date(data.date) : null);
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw err;
    }
  }, [user, makeRequest, refreshData]);

  // Delete transaction
  const deleteTransaction = useCallback(async (id, type) => {
    if (!user) return;

    try {
      await makeRequest(
        `deleteTransaction_${id}`,
        () => api.delete(`/transactions/${type}/${id}`)
      );

      await refreshData();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  }, [user, makeRequest, refreshData]);

  // Quick expense
  const addQuickExpense = useCallback(async (amount, description = 'Quick Expense', date = new Date()) => {
    if (!user) return;
  
    try {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(12, 0, 0, 0);
      const dateKey = normalizedDate.toISOString().split('T')[0];
  
      await makeRequest(
        'addQuickExpense',
        () => api.post('/transactions/expense', {
          amount: parseFloat(amount),
          description,
          date: dateKey,
          is_recurring: false
        })
      );
  
      await refreshData(normalizedDate);
      return true;
    } catch (err) {
      console.error('Error adding quick expense:', err);
      throw err;
    }
  }, [user, makeRequest, refreshData]);

  // ==================== Initial Load ====================
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        await Promise.all([
          refreshBalances(),
          fetchRecentTransactions(5)
        ]);
      } catch (err) {
        console.error('Error in initial data load:', err);
        if (mounted) {
          setError('Failed to load initial data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();
    return () => { mounted = false; };
  }, [user, refreshBalances, fetchRecentTransactions]);

  return (
    <TransactionContext.Provider
      value={{
        // State
        balances,
        metadata,
        recentTransactions,
        periodTransactions,
        loading,
        error,
        // Data fetching
        refreshBalances,
        fetchRecentTransactions,
        fetchPeriodTransactions,
        // Transaction mutations
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addQuickExpense,
        // Data refresh
        refreshData
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export default TransactionContext;