import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const FINANCIAL_QUERY_ROOTS = [
  'dashboard',
  'cycles',
  'bankSyncStats',
  'transactions',
  'transactionMonths',
  'merchantWatches',
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

/** One app-level bridge keeps every money surface on the same cache lifecycle. */
export function useFinancialDataSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const events = [
      'financial-data-updated',
      'server-woke',
    ];
    const handleRefresh = () => { void invalidateFinancialQueries(queryClient); };
    events.forEach((event) => window.addEventListener(event, handleRefresh));
    return () => events.forEach((event) => window.removeEventListener(event, handleRefresh));
  }, [queryClient]);
}
