/** Paginated reads. Writes and cache invalidation live in useTransactionActions. */

import { useMemo } from 'react';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthUser, useIsAuthenticated } from '../stores/authStore';
import { apiResultError } from '../api/errors';
import { buildTransactionFilters } from '../utils/transactionFilters';

const DEFAULT_PAGE_SIZE = 50;


export const useTransactions = (options = {}) => {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();

  const {
    pageSize = DEFAULT_PAGE_SIZE,
    filters = {},
    search = '',
    activeTab = 'all',
    autoRefresh = false,
    enabled = true,
  } = options;

  const apiFilters = useMemo(
    () => buildTransactionFilters({ filters, search, activeTab }),
    // Stringify: callers pass fresh object literals every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters), search, activeTab],
  );

  // ── Data ──────────────────────────────────────────────────────────────────
  const transactionsQuery = useInfiniteQuery({
    queryKey: ['transactions', user?.id, apiFilters, pageSize],
    enabled: enabled && isAuthenticated && !!user?.id,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await api.transactions.getAll({
        page: pageParam + 1, // server is 1-based
        limit: pageSize,
        ...apiFilters,
      }, { signal });
      if (!response?.success) throw apiResultError(response);

      const raw = response?.data?.data || response?.data || response || {};
      const list = Array.isArray(raw) ? raw : (raw.transactions || []);
      const hasMore = Array.isArray(raw)
        ? false
        : Boolean(raw.pagination?.hasMore);
      const total = Array.isArray(raw)
        ? raw.length
        : (raw.pagination?.total ?? list.length);

      return {
        transactions: list,
        hasMore,
        total,
        page: pageParam,
        // Whole-filtered-set totals computed server-side (same on every page).
        summary: Array.isArray(raw) ? null : (raw.summary || null),
      };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false,
    // Keep showing the previous list while a filter change fetches — a chip
    // tap must not blank the page into a skeleton.
    placeholderData: keepPreviousData,
  });

  const allTransactions = useMemo(
    () => transactionsQuery.data?.pages?.flatMap((p) => p?.transactions || []) || [],
    [transactionsQuery.data],
  );

  return {
    // Data
    transactions: allTransactions,
    // Server-computed totals for the WHOLE filtered set (null until loaded)
    summary: transactionsQuery.data?.pages?.[0]?.summary || null,

    // Pagination
    hasNextPage: transactionsQuery.hasNextPage,
    fetchNextPage: transactionsQuery.fetchNextPage,
    isFetchingNextPage: transactionsQuery.isFetchingNextPage,

    // States
    loading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    isFetching: transactionsQuery.isFetching,

    // Refetch
    refetch: transactionsQuery.refetch,
  };
};

export default useTransactions;
