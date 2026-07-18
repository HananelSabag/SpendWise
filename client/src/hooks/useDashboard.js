import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../api';
import { useAuthStore } from '../stores/authStore';
import { getAccessToken } from '../auth/tokenStorage';
import { queryConfigs } from '../config/queryClient';

const EMPTY_DASHBOARD = { recentTransactions: [], isEmpty: true };

export const useDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['dashboard', user?.id], [user?.id]);
  const query = useQuery({
    queryKey,
    enabled: isAuthenticated && !!user?.id && !!getAccessToken(),
    queryFn: async () => {
      const result = await api.transactions.getDashboardData();
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch dashboard data');
      return result.data?.data ?? result.data;
    },
    ...queryConfigs.dashboard,
    retry: (failureCount, error) => error?.response?.status !== 401
      && !(error?.response?.status >= 500 && failureCount >= 2),
    select: useCallback((raw) => {
      const recentTransactions = raw?.recent_transactions || [];
      return { recentTransactions, isEmpty: recentTransactions.length === 0 };
    }, []),
  });

  const refresh = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey });
      await query.refetch();
      window.dispatchEvent(new CustomEvent('dashboard-refreshed'));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [queryClient, queryKey, query]);

  return {
    data: query.data || (query.isLoading ? null : EMPTY_DASHBOARD),
    error: query.error,
    isLoading: query.isLoading,
    isError: query.isError,
    isEmpty: query.data?.isEmpty || false,
    isRefetching: query.isFetching && !query.isLoading,
    refresh,
    refetch: query.refetch,
    lastFetched: query.dataUpdatedAt,
    isStale: query.isStale,
    query,
  };
};

export default useDashboard;
