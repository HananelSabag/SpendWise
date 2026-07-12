import { useCallback, useMemo } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import transactionAPI from '../api/transactions';
import { getAccessToken } from '../auth/tokenStorage';
import { queryConfigs } from '../config/queryClient';
import { useAuthStore } from '../stores/authStore';

export function useFinancialCycle() {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['financial-cycle', user?.id], [user?.id]);
  const query = useQuery({
    queryKey,
    enabled: isAuthenticated && !!getAccessToken(),
    queryFn: async () => {
      const result = await transactionAPI.getCycleRunway();
      if (!result.success) throw new Error(result.error?.message || 'Failed to load financial cycle');
      return result.data;
    },
    placeholderData: keepPreviousData,
    ...queryConfigs.dashboard,
  });
  const { refetch } = query;
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
    return refetch({ cancelRefetch: false });
  }, [queryClient, queryKey, refetch]);
  return { ...query, refresh };
}

export default useFinancialCycle;
