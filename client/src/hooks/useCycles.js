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
import { queryConfigs } from '../config/queryClient';

const EMPTY = {
  status: 'loading',
  cycles: [],
  loans: [],
  totalOutstanding: 0,
  recurring: [],
  salaryTracking: null,
  salaryChange: null,
  signatures: [],
};

export function useCycles() {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cycles', user?.id, 'list', 2],
    queryFn: () => cyclesApi.list({ years: 2 }),
    enabled: Boolean(isAuthenticated && user?.id),
    ...queryConfigs.dashboard,
    // Keep recent cycle history warm between screens; mutations and bank syncs invalidate it.
    // The short stale window also covers changes that arrive while the app is closed.
    staleTime: 60_000,
    refetchOnMount: true,
  });

  const classificationMutation = useMutation({
    mutationFn: ({ transactionId, class: klass, reason }) =>
      cyclesApi.classifyCredit(transactionId, { class: klass, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] }),
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
    hasNoBankData: data.status === 'no_bank_data',
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    classifyCredit: classificationMutation.mutate,
    isClassifying: classificationMutation.isPending,
    classifyingTransactionId: classificationMutation.variables?.transactionId || null,
  }), [data, query.isLoading, query.isError, query.error, query.refetch,
    classificationMutation.mutate, classificationMutation.isPending,
    classificationMutation.variables?.transactionId]);
}

export function useCurrentCycle() {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();

  const query = useQuery({
    queryKey: ['cycles', user?.id, 'current'],
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
    totalOutstanding: data.totalOutstanding || 0,
    needsSalaryLink: data.status === 'salary_not_linked' || data.status === 'salary_never_seen',
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
