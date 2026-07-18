import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '../api';
import { useAuthStore } from '../stores/authStore';
import { getAccessToken } from '../auth/tokenStorage';
import { queryConfigs } from '../config/queryClient';

const EMPTY_DASHBOARD = { recentTransactions: [], isEmpty: true };

export const useDashboard = () => {
  const { isAuthenticated, user } = useAuthStore();
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
  const refetchDashboard = query.refetch;

  const refresh = useCallback(async () => {
    try {
      const result = await refetchDashboard();
      if (result.isError) throw result.error;
      window.dispatchEvent(new CustomEvent('dashboard-refreshed'));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [refetchDashboard]);

  return {
    // Preserve a real error state for ModernDashboard. Returning the empty fallback on
    // failure made the dashboard silently look like an account with no transactions and
    // made DashboardError unreachable.
    data: query.data || (query.isLoading || query.isError ? null : EMPTY_DASHBOARD),
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
