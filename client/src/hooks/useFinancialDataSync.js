import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const FINANCIAL_QUERY_ROOTS = [
  'dashboard',
  'cycles',
  'bankSyncStats',
  'transactions',
];

export async function invalidateFinancialQueries(queryClient) {
  await Promise.all(
    FINANCIAL_QUERY_ROOTS.map((root) =>
      queryClient.invalidateQueries({ queryKey: [root] }),
    ),
  );
}

export function emitFinancialDataUpdated(detail = {}) {
  window.dispatchEvent(new CustomEvent('financial-data-updated', { detail }));
}

export function useFinancialDataRefresh() {
  const queryClient = useQueryClient();
  return useCallback(
    () => invalidateFinancialQueries(queryClient),
    [queryClient],
  );
}

/** One app-level bridge keeps every money surface on the same cache lifecycle. */
export function useFinancialDataSync() {
  const refreshFinancialData = useFinancialDataRefresh();

  useEffect(() => {
    const events = [
      'financial-data-updated',
      'transaction-added',
      'dashboard-refresh-requested',
      'server-woke',
    ];
    const handleRefresh = () => { void refreshFinancialData(); };
    events.forEach((event) => window.addEventListener(event, handleRefresh));
    return () => events.forEach((event) => window.removeEventListener(event, handleRefresh));
  }, [refreshFinancialData]);
}
