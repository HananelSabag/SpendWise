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
import { useIsAuthenticated } from '../stores/authStore';
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
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cycles', 'list'],
    queryFn: () => cyclesApi.list(),
    enabled: Boolean(isAuthenticated),
    ...queryConfigs.dashboard,
  });

  const classificationMutation = useMutation({
    mutationFn: ({ transactionId, class: klass, reason }) =>
      cyclesApi.classifyCredit(transactionId, { class: klass, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cycles'] }),
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

  const query = useQuery({
    queryKey: ['cycles', 'current'],
    queryFn: () => cyclesApi.current(),
    enabled: Boolean(isAuthenticated),
    ...queryConfigs.dashboard,
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

export default useCycles;
