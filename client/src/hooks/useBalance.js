/**
 * 💰 BALANCE HOOK - DEDICATED BALANCE PANEL DATA MANAGEMENT
 * Uses React Query for proper caching — no more refetch on every mount.
 * @version 2.0.0 - React Query migration
 */

import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useBalanceContext } from '../contexts/BalanceContext';

const BALANCE_QUERY_KEY = ['balance'];

/**
 * 💰 Balance Hook - Get balance data for all periods
 * @param {Object} options
 * @returns {Object} Balance data and methods
 */
export const useBalance = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000 // 5 minutes (was 30 seconds — way too aggressive)
  } = options;

  const queryClient = useQueryClient();
  const { registerRefresh } = useBalanceContext();

  const balanceQuery = useQuery({
    queryKey: BALANCE_QUERY_KEY,
    queryFn: async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      if (!token) return null;

      const response = await api.transactions.getBalanceData();
      if (response.success) {
        return response.data?.data ?? response.data ?? null;
      }
      throw new Error(response.error?.message || 'Failed to fetch balance data');
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes — don't refetch if data is fresh
    gcTime: 30 * 60 * 1000,     // 30 minutes in memory
    refetchOnMount: false,       // Use cache if available
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: false,
    enabled: !!(localStorage.getItem('accessToken') || localStorage.getItem('authToken'))
  });

  // Destructure refetch so useCallback depends on the stable function reference
  // (React Query guarantees refetch stability), not the whole query object which
  // is a new reference on every render.
  const { refetch: queryRefetch } = balanceQuery;

  /** Manual refresh — invalidates and refetches */
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BALANCE_QUERY_KEY });
    queryRefetch();
  }, [queryClient, queryRefetch]);

  /** Silent refresh — invalidates without showing loading state */
  const silentRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BALANCE_QUERY_KEY });
  }, [queryClient]);

  // Register with BalanceContext so transaction mutations can trigger a refresh
  useEffect(() => {
    const unregister = registerRefresh({ normal: refresh, silent: silentRefresh });
    return unregister;
  }, [registerRefresh, refresh, silentRefresh]);

  const balanceData = balanceQuery.data?.balance ?? balanceQuery.data ?? null;
  const metadata = balanceQuery.data?.metadata ?? null;

  return {
    // Data
    data: balanceData,
    metadata,

    // State
    loading: balanceQuery.isLoading,
    error: balanceQuery.error,
    lastFetch: balanceQuery.dataUpdatedAt ? new Date(balanceQuery.dataUpdatedAt) : null,

    // Methods
    refresh,
    silentRefresh,
    getBalance: (period) => balanceData?.[period] ?? null,
    getMetadata: () => metadata,

    // Period shortcuts
    daily: balanceData?.daily ?? null,
    weekly: balanceData?.weekly ?? null,
    monthly: balanceData?.monthly ?? null,
    yearly: balanceData?.yearly ?? null,

    // Status
    isLoading: balanceQuery.isLoading,
    isError: balanceQuery.isError,
    isEmpty: !balanceData,
    isReady: !balanceQuery.isLoading && !balanceQuery.isError && !!balanceData
  };
};

export default useBalance;
