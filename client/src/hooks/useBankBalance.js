/**
 * useBankBalance — current bank balance, shared by the dashboard hero and the cycle page.
 *
 * Wraps the operational /bank-sync/stats query used by Bank Sync, Transactions, and the
 * dashboard (one user-scoped cache/network call), then reduces it through computeBankBalance.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';
import { useAuthUser } from '../stores/authStore';
import { computeBankBalance } from '../utils/bankBalance';

export function useBankBalance() {
  const user = useAuthUser();

  const query = useQuery({
    queryKey: ['bankSyncStats', user?.id],
    queryFn: () => apiClient.get('/bank-sync/stats').then((r) => r.data.sources || []),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const computed = useMemo(() => computeBankBalance(query.data), [query.data]);

  return {
    ...computed,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export default useBankBalance;
