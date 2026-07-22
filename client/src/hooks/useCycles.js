/**
 * useCycles / useCurrentCycle — the salary-anchored financial cycle.
 *
 * This is the view the user actually feels: one window from salary to salary, reported as
 * three lines that never contradict each other (FINANCIAL_CYCLE_SPEC.md §3c):
 *   operatingNet — income vs spending, how you really live
 *   financing    — borrowed money that arrived; you owe it back
 *   bankMovement — operatingNet + financing, always equal to the real account delta
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import cyclesApi from '../api/cycles';
import { useAuthUser, useIsAuthenticated } from '../stores/authStore';
import { useTranslation } from '../stores';
import { useToast } from './useToast';
import { queryConfigs } from '../config/queryClient';

const EMPTY = {
  status: 'loading',
  cycles: [],
  loans: [],
  totalOutstanding: 0,
  recurring: [],
  recurringGroups: [],
  salaryTracking: null,
  salaryChange: null,
  signatures: [],
  settings: { engineMode: 'automatic', manualAnchorDay: null, useEstimates: true },
  fundingForecast: { streams: [], expectedTotal: 0, start: null, end: null },
};

export function useCycles() {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation('dashboard');
  const notifyFailure = () => toast.error(t('cycle.updateFailed', { fallback: 'Could not save your change — please try again' }));

  const query = useQuery({
    queryKey: ['cycles', user?.id, 'list', 5],
    queryFn: () => cyclesApi.list({ years: 2 }),
    enabled: Boolean(isAuthenticated && user?.id),
    ...queryConfigs.dashboard,
    // Keep recent cycle history warm between screens; mutations and bank syncs invalidate it.
    // The short stale window also covers changes that arrive while the app is closed.
    staleTime: 60_000,
    refetchOnMount: true,
  });

  const transactionClassificationMutation = useMutation({
    mutationFn: ({ transactionId, ...payload }) => cyclesApi.classifyTransaction(
      transactionId,
      payload,
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
      ]);
    },
    onError: notifyFailure,
  });

  const resetClassificationMutation = useMutation({
    mutationFn: ({ transactionId }) => cyclesApi.resetTransactionClassification(transactionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
      ]);
    },
    onError: notifyFailure,
  });

  const settingsMutation = useMutation({
    mutationFn: (settings) => cyclesApi.updateSettings(settings),
    onMutate: async (patch) => {
      const queryKey = ['cycles', user?.id];
      await queryClient.cancelQueries({ queryKey });
      const snapshots = queryClient.getQueriesData({ queryKey });
      queryClient.setQueriesData({ queryKey }, (cached) => {
        if (!cached?.data) return cached;
        return {
          ...cached,
          data: {
            ...cached.data,
            settings: { ...(cached.data.settings || EMPTY.settings), ...patch },
          },
        };
      });
      return { snapshots };
    },
    onSuccess: (result) => {
      const saved = result?.data;
      if (!saved) return;
      queryClient.setQueriesData({ queryKey: ['cycles', user?.id] }, (cached) => (
        cached?.data
          ? { ...cached, data: { ...cached.data, settings: saved } }
          : cached
      ));
    },
    onError: (_error, _variables, context) => {
      (context?.snapshots || []).forEach(([key, value]) => queryClient.setQueryData(key, value));
      notifyFailure();
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
      ]);
    },
  });

  const recurringMutation = useMutation({
    mutationFn: ({ groupId, ...patch }) => cyclesApi.updateRecurringGroup(groupId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] }),
    onError: notifyFailure,
  });

  const cardSettingsMutation = useMutation({
    mutationFn: ({ source, accountNumber, ...patch }) => cyclesApi.updateCardSettings(source, accountNumber, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] }),
    onError: notifyFailure,
  });

  const data = query.data?.data || EMPTY;

  return useMemo(() => ({
    ...data,
    /** The running cycle, or the most recent closed one when nothing is running. */
    current: data.cycles?.find((c) => c.window.running) || data.cycles?.[data.cycles.length - 1] || null,
    /**
     * Without a linked salary there is no anchor, so there is no cycle to show — the UI must
     * ask the user to link their salary rather than invent a window.
     */
    needsSalaryLink: data.status === 'salary_not_linked' || data.status === 'salary_never_seen',
    needsCycleAnchor: data.status === 'cycle_anchor_not_found',
    hasNoBankData: data.status === 'no_bank_data',
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    classifyTransaction: transactionClassificationMutation.mutate,
    resetTransactionClassification: resetClassificationMutation.mutate,
    isUpdatingDecision: transactionClassificationMutation.isPending || resetClassificationMutation.isPending,
    // Follow whichever mutation is actually in flight. mutation.variables is retained after a
    // mutation settles, so a plain `a || b` would report the last classify's row during a reset.
    updatingTransactionId: (transactionClassificationMutation.isPending
      ? transactionClassificationMutation.variables?.transactionId
      : resetClassificationMutation.isPending
        ? resetClassificationMutation.variables?.transactionId
        : null) || null,
    updateCycleSettings: settingsMutation.mutate,
    isUpdatingSettings: settingsMutation.isPending,
    updateRecurringGroup: recurringMutation.mutate,
    isUpdatingRecurring: recurringMutation.isPending,
    updateCardSettings: cardSettingsMutation.mutate,
    isUpdatingCard: cardSettingsMutation.isPending,
  }), [data, query.isLoading, query.isError, query.error, query.refetch,
    transactionClassificationMutation.mutate, transactionClassificationMutation.isPending,
    transactionClassificationMutation.variables?.transactionId,
    resetClassificationMutation.mutate, resetClassificationMutation.isPending,
    resetClassificationMutation.variables?.transactionId,
    settingsMutation.mutate, settingsMutation.isPending,
    recurringMutation.mutate, recurringMutation.isPending,
    cardSettingsMutation.mutate, cardSettingsMutation.isPending]);
}

export function useCurrentCycle() {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();

  const query = useQuery({
    queryKey: ['cycles', user?.id, 'current', 5],
    queryFn: () => cyclesApi.current(),
    enabled: Boolean(isAuthenticated && user?.id),
    ...queryConfigs.dashboard,
    staleTime: 30_000,
    refetchOnMount: true,
  });

  const data = query.data?.data || {};

  return {
    status: data.status,
    cycle: data.cycle || null,
    salaryTracking: data.salaryTracking || null,
    fundingForecast: data.fundingForecast || { streams: [], expectedTotal: 0, start: null, end: null },
    settings: data.settings || { engineMode: 'automatic', manualAnchorDay: null, useEstimates: true },
    totalOutstanding: data.totalOutstanding || 0,
    needsSalaryLink: data.status === 'salary_not_linked' || data.status === 'salary_never_seen',
    needsCycleAnchor: data.status === 'cycle_anchor_not_found',
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useCycleYears() {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  const query = useQuery({
    queryKey: ['cycles', user?.id, 'years'],
    queryFn: () => cyclesApi.years(),
    enabled: Boolean(isAuthenticated && user?.id),
    staleTime: 10 * 60_000,
  });
  return {
    years: query.data?.data?.years || [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useYearlyReview(year) {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  const query = useQuery({
    queryKey: ['cycles', user?.id, 'yearly', Number(year)],
    queryFn: () => cyclesApi.yearly(year),
    enabled: Boolean(isAuthenticated && user?.id && Number.isInteger(Number(year))),
    staleTime: 5 * 60_000,
  });
  return {
    review: query.data?.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export default useCycles;
