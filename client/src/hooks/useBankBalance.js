/**
 * useBankBalance — current bank balance, shared by the dashboard hero and the cycle page.
 *
 * Wraps the same /bank-sync/stats query the hero already uses (identical queryKey, so the two
 * screens share one cache and one network call) and reduces it through computeBankBalance so
 * the "how much is in the account" number is defined exactly once (see utils/bankBalance).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';
import { useAuthUser } from '../stores/authStore';
import { computeBankBalance } from '../utils/bankBalance';

export function useBankBalance() {
  const user = useAuthUser();

  const query = useQuery({
    queryKey: ['bankBalances', user?.id],
    queryFn: () => apiClient.get('/bank-sync/stats', { params: { periodOffset: 0 } }).then((r) => r.data.sources || []),
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
