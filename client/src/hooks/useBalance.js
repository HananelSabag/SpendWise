/**
 * 💰 BALANCE HOOK - DEDICATED BALANCE PANEL DATA MANAGEMENT
 * Simple hook that connects to the dedicated balance endpoint
 * Features: Real-time updates, Auto-refresh on transaction changes, Optimized caching
 * @version 1.0.0 - CLEAN & ALIGNED
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import { useNotifications } from '../stores';
import { useBalanceContext } from '../contexts/BalanceContext';

/**
 * 💰 Balance Hook - Get balance data for all periods
 * @param {Object} options - Hook options
 * @returns {Object} Balance data and methods
 */
export const useBalance = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    onError = null
  } = options;

  // State management
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Notifications for errors
  const { addNotification } = useNotifications();

  // Balance context for global refresh management
  const { registerRefresh } = useBalanceContext();

  // Refs for cleanup
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  /**
   * Fetch balance data from server
   */
  const fetchBalance = useCallback(async (showLoading = true) => {
    if (!mountedRef.current) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      console.log('📊 useBalance: Fetching balance data...');
      const response = await api.transactions.getBalanceData();

      if (!mountedRef.current) return;

      if (response.success) {
        setData(response.data.data);
        setLastFetch(new Date());
        console.log('✅ useBalance: Balance data updated:', response.data.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch balance data');
      }
    } catch (err) {
      if (!mountedRef.current) return;

      console.error('❌ useBalance: Failed to fetch balance data:', err);
      setError(err);

      // Show user notification
      if (onError) {
        onError(err);
      } else {
        addNotification({
          type: 'error',
          title: 'Balance Update Failed',
          message: 'Failed to update balance data. Please try again.',
          duration: 5000
        });
      }
    } finally {
      if (mountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [onError, addNotification]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchBalance(true);
  }, [fetchBalance]);

  /**
   * Silent refresh (for auto-updates)
   */
  const silentRefresh = useCallback(() => {
    fetchBalance(false);
  }, [fetchBalance]);

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    fetchBalance(true);

    return () => {
      mountedRef.current = false;
    };
  }, [fetchBalance]);

  // Register with balance context for global refresh
  useEffect(() => {
    const refreshFunctions = {
      normal: refresh,
      silent: silentRefresh
    };
    
    const unregister = registerRefresh(refreshFunctions);
    
    return unregister;
  }, [registerRefresh, refresh, silentRefresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        silentRefresh();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, silentRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Get balance for specific period
   */
  const getBalance = useCallback((period) => {
    if (!data?.balance) return null;
    return data.balance[period] || null;
  }, [data]);

  /**
   * Get metadata
   */
  const getMetadata = useCallback(() => {
    return data?.metadata || null;
  }, [data]);

  return {
    // Data
    data: data?.balance || null,
    metadata: data?.metadata || null,
    
    // State
    loading,
    error,
    lastFetch,
    
    // Methods
    refresh,
    silentRefresh,
    getBalance,
    getMetadata,
    
    // Helper getters
    daily: data?.balance?.daily || null,
    weekly: data?.balance?.weekly || null,
    monthly: data?.balance?.monthly || null,
    yearly: data?.balance?.yearly || null,
    
    // Status
    isLoading: loading,
    isError: !!error,
    isEmpty: !data?.balance,
    isReady: !loading && !error && !!data?.balance
  };
};

export default useBalance;