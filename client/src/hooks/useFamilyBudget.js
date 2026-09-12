/**
 * useFamilyBudget — the household's manual picture, and the six ways to change it.
 *
 * The server answers every mutation with the WHOLE recomputed overview, so this
 * hook writes that straight into the cache. No optimistic guessing of the
 * totals: the one number this screen exists for ("what's left to live on") is
 * always the server's arithmetic, and two people typing on two devices converge
 * on the same answer after each save rather than drifting apart.
 *
 * There is no polling. Unlike the grocery list, this is a sit-down-together
 * planning screen used a few times a month, and a refetch on focus covers the
 * "she added something on her phone" case without a timer.
 */

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../api';
import { useTranslation } from '../stores';
import { useToast } from './useToast';
import { useAuthUser } from '../stores/authStore';
import { apiResultError } from '../api/errors';

export const FAMILY_QUERY_KEY = ['family', 'overview'];
export const familyOverviewQueryKey = (userId) => [...FAMILY_QUERY_KEY, userId];
const WRITE_OPTIONS = { scope: { id: 'family-writes' }, retry: false };

export function useFamilyBudget({ enabled = true } = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation('family');
  const user = useAuthUser();
  const queryKey = useMemo(() => familyOverviewQueryKey(user?.id), [user?.id]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await api.family.getOverview();
      if (!result.success) throw apiResultError(result, 'family_overview');
      return result.data;
    },
    enabled: enabled && !!user?.id,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const reportError = useCallback((result) => {
    const code = result?.error?.code;
    toast.error(t(`errors.${code}`, { fallback: t('errors.generic') }));
  }, [t, toast]);

  /**
   * Every mutation shares this: run it, and on success replace the cached
   * overview with the payload the server just recomputed.
   */
  const runMutation = useCallback(async (fn, successKey) => {
    await queryClient.cancelQueries({ queryKey });
    const result = await fn();
    if (!result.success) {
      reportError(result);
      return result;
    }
    const { item, balance, ...overview } = result.data || {};
    // Ignore any older focus refresh that completed while this save was running.
    await queryClient.cancelQueries({ queryKey });
    if (overview?.summary) queryClient.setQueryData(queryKey, overview);
    if (successKey) toast.success(t(successKey));
    return result;
  }, [queryClient, queryKey, reportError, t, toast]);

  const addItem = useMutation({
    ...WRITE_OPTIONS,
    mutationFn: (payload) => runMutation(() => api.family.addItem(payload), 'toast.added'),
  });
  const updateItem = useMutation({
    ...WRITE_OPTIONS,
    mutationFn: ({ id, ...payload }) => runMutation(() => api.family.updateItem(id, payload), 'toast.saved'),
  });
  const deleteItem = useMutation({
    ...WRITE_OPTIONS,
    mutationFn: (id) => runMutation(() => api.family.deleteItem(id), 'toast.deleted'),
  });
  const addBalance = useMutation({
    ...WRITE_OPTIONS,
    mutationFn: (payload) => runMutation(() => api.family.addBalance(payload), 'toast.added'),
  });
  const updateBalance = useMutation({
    ...WRITE_OPTIONS,
    mutationFn: ({ id, ...payload }) => runMutation(() => api.family.updateBalance(id, payload), 'toast.saved'),
  });
  const deleteBalance = useMutation({
    ...WRITE_OPTIONS,
    mutationFn: (id) => runMutation(() => api.family.deleteBalance(id), 'toast.deleted'),
  });

  const data = query.data;

  // A 403 means this account is not in the household. It is not an error state
  // to retry — the page should simply say so.
  const forbidden = query.error?.status === 403 || query.error?.code === 'FAMILY_FORBIDDEN';

  return useMemo(() => ({
    members: data?.members || [],
    items: data?.items || [],
    balances: data?.balances || [],
    summary: data?.summary || null,

    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError && !forbidden,
    forbidden,
    refetch: query.refetch,

    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    addBalance: addBalance.mutateAsync,
    updateBalance: updateBalance.mutateAsync,
    deleteBalance: deleteBalance.mutateAsync,

    isSaving: addItem.isPending || updateItem.isPending || deleteItem.isPending
      || addBalance.isPending || updateBalance.isPending || deleteBalance.isPending,
  }), [
    data, forbidden, query.isLoading, query.isFetching, query.isError, query.refetch,
    addItem.mutateAsync, addItem.isPending,
    updateItem.mutateAsync, updateItem.isPending,
    deleteItem.mutateAsync, deleteItem.isPending,
    addBalance.mutateAsync, addBalance.isPending,
    updateBalance.mutateAsync, updateBalance.isPending,
    deleteBalance.mutateAsync, deleteBalance.isPending,
  ]);
}

export default useFamilyBudget;
