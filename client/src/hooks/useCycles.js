import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import cyclesApi from '../api/cycles';
import { useAuthUser, useIsAuthenticated } from '../stores/authStore';
import { useTranslation } from '../stores';
import { useToast } from './useToast';
import { queryConfigs } from '../config/queryClient';

const CYCLE_QUERY_VERSION = 7;
const DEFAULT_SETTINGS = { engineMode: 'automatic', manualAnchorDay: null, useEstimates: true };
const EMPTY = {
  status: 'loading', cycles: [], loans: [], totalOutstanding: 0, recurring: [],
  recurringGroups: [], salaryTracking: null, salaryChange: null, signatures: [],
  settings: DEFAULT_SETTINGS,
  fundingForecast: { streams: [], expectedTotal: 0, start: null, end: null },
};

function patchEnvelope(cached, update) {
  if (!cached?.data) return cached;
  return { ...cached, data: update(cached.data) };
}

function patchCardInCycle(cycle, source, accountNumber, patch) {
  if (!cycle) return cycle;
  return {
    ...cycle,
    cards: (cycle.cards || []).map((card) => {
      if (card.source !== source || String(card.accountNumber) !== String(accountNumber)) return card;
      return {
        ...card,
        included: patch.included ?? card.included,
        statementDay: patch.statementDay == null
          ? card.statementDay
          : { ...(card.statementDay || {}), day: patch.statementDay, certain: true, source: 'user' },
        setting: { ...(card.setting || {}), ...patch },
      };
    }),
  };
}

export function applyCycleSettingsPatch(data, patch) {
  return { ...data, settings: { ...(data.settings || DEFAULT_SETTINGS), ...patch } };
}

export function applyCardSettingsPatch(data, { source, accountNumber, ...patch }) {
  return {
    ...data,
    cycle: patchCardInCycle(data.cycle, source, accountNumber, patch),
    cycles: (data.cycles || []).map((cycle) => patchCardInCycle(cycle, source, accountNumber, patch)),
  };
}

export function applyRecurringGroupPatch(data, { groupId, ...patch }) {
  return {
    ...data,
    recurringGroups: (data.recurringGroups || []).map((group) => group.id === groupId
      ? {
          ...group,
          label: patch.label ?? group.label,
          includeInEstimate: patch.includeInEstimate ?? group.includeInEstimate,
          active: patch.active ?? group.active,
        }
      : group),
  };
}

/** Shared optimistic controls for both the dashboard hot query and the full cycle query. */
export function useCycleControls() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation('dashboard');
  const prefix = ['cycles', user?.id];

  const notifyFailure = () => toast.error(t('cycle.updateFailed', {
    fallback: 'Could not save your change — please try again',
  }));

  const snapshotAndPatch = async (update) => {
    await queryClient.cancelQueries({ queryKey: prefix });
    const snapshots = queryClient.getQueriesData({ queryKey: prefix });
    queryClient.setQueriesData({ queryKey: prefix }, (cached) => patchEnvelope(cached, update));
    return { snapshots };
  };

  const restore = (context) => {
    (context?.snapshots || []).forEach(([key, value]) => queryClient.setQueryData(key, value));
    notifyFailure();
  };

  const refreshActive = async () => {
    await queryClient.refetchQueries({ queryKey: prefix, type: 'active' });
  };

  const settings = useMutation({
    mutationFn: (patch) => cyclesApi.updateSettings(patch),
    onMutate: (patch) => snapshotAndPatch((data) => applyCycleSettingsPatch(data, patch)),
    onSuccess: (result) => {
      if (!result?.data) return;
      queryClient.setQueriesData({ queryKey: prefix }, (cached) => patchEnvelope(cached, (data) => ({
        ...data,
        settings: { ...(data.settings || DEFAULT_SETTINGS), ...result.data },
      })));
    },
    onError: (_error, _variables, context) => restore(context),
    onSettled: refreshActive,
  });

  const cards = useMutation({
    mutationFn: ({ source, accountNumber, ...patch }) => cyclesApi.updateCardSettings(source, accountNumber, patch),
    onMutate: (patch) => snapshotAndPatch((data) => applyCardSettingsPatch(data, patch)),
    onError: (_error, _variables, context) => restore(context),
    onSettled: refreshActive,
  });

  const recurring = useMutation({
    mutationFn: ({ groupId, ...patch }) => cyclesApi.updateRecurringGroup(groupId, patch),
    onMutate: (patch) => snapshotAndPatch((data) => applyRecurringGroupPatch(data, patch)),
    onSuccess: (result, variables) => {
      if (!result?.data) return;
      queryClient.setQueriesData({ queryKey: prefix }, (cached) => patchEnvelope(cached, (data) => ({
        ...data,
        recurringGroups: (data.recurringGroups || []).map((group) => (
          group.id === variables.groupId ? { ...group, ...result.data } : group
        )),
      })));
    },
    onError: (_error, _variables, context) => restore(context),
    onSettled: refreshActive,
  });

  return {
    updateCycleSettings: settings.mutate,
    updateCycleSettingsAsync: settings.mutateAsync,
    isUpdatingSettings: settings.isPending,
    updateCardSettings: cards.mutate,
    isUpdatingCard: cards.isPending,
    updateRecurringGroup: recurring.mutate,
    isUpdatingRecurring: recurring.isPending,
  };
}

export function useCycles() {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation('dashboard');
  const controls = useCycleControls();
  const notifyFailure = () => toast.error(t('cycle.updateFailed', {
    fallback: 'Could not save your change — please try again',
  }));

  const query = useQuery({
    queryKey: ['cycles', user?.id, 'list', CYCLE_QUERY_VERSION],
    queryFn: () => cyclesApi.list({ years: 2 }),
    enabled: Boolean(isAuthenticated && user?.id),
    ...queryConfigs.dashboard,
    staleTime: 60_000,
    refetchOnMount: true,
  });

  const classification = useMutation({
    mutationFn: ({ transactionId, ...payload }) => cyclesApi.classifyTransaction(transactionId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['cycles', user?.id], type: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
      ]);
    },
    onError: notifyFailure,
  });

  const resetClassification = useMutation({
    mutationFn: ({ transactionId }) => cyclesApi.resetTransactionClassification(transactionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['cycles', user?.id], type: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
      ]);
    },
    onError: notifyFailure,
  });

  const data = query.data?.data || EMPTY;
  const current = data.cycles?.find((cycle) => cycle.window.running)
    || data.cycles?.[data.cycles.length - 1]
    || null;

  return {
    ...data,
    current,
    needsSalaryLink: data.status === 'salary_not_linked' || data.status === 'salary_never_seen',
    needsCycleAnchor: data.status === 'cycle_anchor_not_found',
    hasNoBankData: data.status === 'no_bank_data',
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    classifyTransaction: classification.mutate,
    resetTransactionClassification: resetClassification.mutate,
    isUpdatingDecision: classification.isPending || resetClassification.isPending,
    updatingTransactionId: (classification.isPending
      ? classification.variables?.transactionId
      : resetClassification.isPending
        ? resetClassification.variables?.transactionId
        : null) || null,
    ...controls,
  };
}

export function useCurrentCycle() {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  const query = useQuery({
    queryKey: ['cycles', user?.id, 'current', CYCLE_QUERY_VERSION],
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
    settings: data.settings || DEFAULT_SETTINGS,
    recurringGroups: data.recurringGroups || [],
    totalOutstanding: data.totalOutstanding || 0,
    needsSalaryLink: data.status === 'salary_not_linked' || data.status === 'salary_never_seen',
    needsCycleAnchor: data.status === 'cycle_anchor_not_found',
    hasNoBankData: data.status === 'no_bank_data',
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useCurrentCycleWorkspace() {
  const current = useCurrentCycle();
  const controls = useCycleControls();
  return { ...current, ...controls };
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
  return { years: query.data?.data?.years || [], isLoading: query.isLoading, isError: query.isError };
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
