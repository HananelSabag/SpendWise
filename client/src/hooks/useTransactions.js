/**
 * useTransactions — transactions data + mutations.
 *
 * Rebuilt lean. The previous 681-line version carried an entire dead "AI
 * analysis" layer (opt-in, never consumed), a second cache on top of React
 * Query, selection state nobody read, analytics queries that never ran —
 * and it IGNORED the filters/search options callers passed in, so pages
 * silently fell back to client-side filtering.
 *
 * Now: options are honored (server-side filtering), React Query is the only
 * cache, and the public surface is exactly what the app consumes.
 */

import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../stores';
import { useToast } from './useToast';

const DEFAULT_PAGE_SIZE = 50;

// Build the server-side filter object from options + active tab.
function buildApiFilters({ filters = {}, search = '', activeTab = 'all' }) {
  const apiFilters = {};

  if (filters.type && filters.type !== 'all') apiFilters.type = filters.type;
  if (search || filters.search) apiFilters.search = search || filters.search;

  // Source filter — 'manual' or an institution id, optionally one account.
  // Server-side so results (and the stats tiles) cover the whole filtered
  // set, not just whichever pages happen to be loaded.
  if (filters.source && filters.source !== 'all') {
    apiFilters.source = filters.source;
    if (filters.account) apiFilters.account = filters.account;
  }
  const amountMin = parseFloat(filters.amountMin);
  const amountMax = parseFloat(filters.amountMax);
  if (!Number.isNaN(amountMin)) apiFilters.amountMin = amountMin;
  if (!Number.isNaN(amountMax)) apiFilters.amountMax = amountMax;

  if (activeTab === 'upcoming') {
    // Future transactions only, from tomorrow onward.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    apiFilters.dateFrom = tomorrow.toISOString().split('T')[0];
    return apiFilters;
  }

  // 'all' tab: cap at end of the current month (future months live in
  // the upcoming view), unless a specific month was picked.
  if (filters.month && filters.month !== 'all') {
    const [year, month] = filters.month.split('-');
    apiFilters.dateFrom = new Date(+year, +month - 1, 1).toISOString().split('T')[0];
    apiFilters.dateTo   = new Date(+year, +month, 0).toISOString().split('T')[0];
  } else {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    apiFilters.dateTo = endOfMonth.toISOString().split('T')[0];
  }
  return apiFilters;
}

export const useTransactions = (options = {}) => {
  const { isAuthenticated, user } = useAuth();
  const toastService = useToast();
  const queryClient = useQueryClient();

  const {
    pageSize = DEFAULT_PAGE_SIZE,
    filters = {},
    search = '',
    activeTab = 'all',
    autoRefresh = false,
    enabled = true,
  } = options;

  const apiFilters = useMemo(
    () => buildApiFilters({ filters, search, activeTab }),
    // Stringify: callers pass fresh object literals every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters), search, activeTab],
  );

  // ── Data ──────────────────────────────────────────────────────────────────
  const transactionsQuery = useInfiniteQuery({
    queryKey: ['transactions', user?.id, apiFilters, pageSize],
    enabled: enabled && isAuthenticated && !!user?.id,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.transactions.getAll({
        page: pageParam + 1, // server is 1-based
        limit: pageSize,
        ...apiFilters,
      });

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
    refetchInterval: autoRefresh ? 30 * 1000 : false,
    // Keep showing the previous list while a filter change fetches — a chip
    // tap must not blank the page into a skeleton.
    placeholderData: keepPreviousData,
  });

  const allTransactions = useMemo(
    () => transactionsQuery.data?.pages?.flatMap((p) => p?.transactions || []) || [],
    [transactionsQuery.data],
  );

  // ── Shared invalidation after any mutation ────────────────────────────────
  const invalidateAfterMutation = useCallback(() => {
    ['transactions', 'dashboard', 'balance'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    );
  }, [queryClient]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData) => {
      const response = await api.transactions.create(transactionData.type || 'expense', transactionData);
      return response.data;
    },
    onSuccess: (created) => {
      if (!created) {
        toastService.error('transactions.createFailed');
        return;
      }
      invalidateAfterMutation();
      toastService.success('transactions.createSuccess');
    },
    onError: (error) => toastService.error(error.message || 'transactions.createFailed'),
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, updates }) => {
      const response = await api.transactions.update(updates.type || 'expense', transactionId, updates);
      return response.data;
    },
    onSuccess: () => {
      invalidateAfterMutation();
      toastService.success('transactions.updateSuccess');
    },
    onError: (error) => toastService.error(error.message || 'transactions.updateFailed'),
  });

  // The server routes deletes by type; resolve it from the loaded rows.
  const resolveTypeForDelete = useCallback((transactionId) => {
    const tx = allTransactions.find((t) => t.id === transactionId);
    if (tx?.type === 'income' || tx?.type === 'expense') return tx.type;
    if (typeof tx?.amount === 'number') return tx.amount > 0 ? 'income' : 'expense';
    return 'expense';
  }, [allTransactions]);

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId) => {
      const response = await api.transactions.delete(resolveTypeForDelete(transactionId), transactionId);
      return response.data;
    },
    onSuccess: () => {
      invalidateAfterMutation();
      toastService.success('transactions.deleteSuccess');
    },
    onError: (error) => toastService.error(error.message || 'transactions.deleteFailed'),
  });

  // ── Stable async wrappers ─────────────────────────────────────────────────
  const createTransaction = useCallback(
    (data) => createTransactionMutation.mutateAsync(data),
    [createTransactionMutation],
  );
  const updateTransaction = useCallback(
    (transactionId, updates) => updateTransactionMutation.mutateAsync({ transactionId, updates }),
    [updateTransactionMutation],
  );
  const deleteTransaction = useCallback(
    (transactionId) => deleteTransactionMutation.mutateAsync(transactionId),
    [deleteTransactionMutation],
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
    creating: createTransactionMutation.isPending,
    updating: updateTransactionMutation.isPending,
    deleting: deleteTransactionMutation.isPending,

    // Operations
    createTransaction,
    updateTransaction,
    deleteTransaction,

    // Refetch
    refetch: transactionsQuery.refetch,
  };
};

export default useTransactions;
