import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../../api';
import { useTranslation } from '../../../stores';
import { useAuthUser } from '../../../stores/authStore';

export default function SalaryCandidatePrompt({
  formatCurrency,
  hasSalaryIdentity = false,
  salaryIdentityCount = 0,
  onSelected,
}) {
  const { t } = useTranslation('dashboard');
  const user = useAuthUser();
  const queryClient = useQueryClient();
  // Keep the onboarding session available after the first choice so a joint
  // account can select a second salary before leaving the page.
  const [startedWithoutIdentity] = useState(() => !hasSalaryIdentity);
  const shouldOfferSelection = startedWithoutIdentity || salaryIdentityCount < 2;
  const candidates = useQuery({
    queryKey: ['salaryCandidates', user?.id],
    enabled: shouldOfferSelection && Boolean(user?.id),
    queryFn: async () => {
      const result = await api.transactions.getSalaryCandidates();
      if (!result.success) throw new Error(result.error?.message || 'Failed to load salary candidates');
      return result.data;
    },
    staleTime: 5 * 60_000,
  });
  const selectSalary = useMutation({
    mutationFn: async (transactionId) => {
      const result = await api.transactions.createSalarySignature(transactionId, {
        cycleAnchor: !hasSalaryIdentity,
      });
      if (!result.success) throw new Error(result.error?.message || 'Failed to save salary');
      return result.data;
    },
    onSuccess: async () => {
      // The dashboard's current-cycle query may be inactive while onboarding lives on the
      // full cycle page. Drop that cached pre-link response so returning home cannot briefly
      // repeat the "link your salary" prompt after the salary was already saved.
      queryClient.removeQueries({ queryKey: ['cycles', user?.id] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['salaryCandidates', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['cycles', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] }),
      ]);
      await onSelected?.();
    },
  });

  if (!shouldOfferSelection || candidates.isLoading || !candidates.data?.length) return null;

  return (
    <details className="group mt-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/20" open={!hasSalaryIdentity}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
        {t(hasSalaryIdentity ? 'monthlyAccounting.addSalary' : 'monthlyAccounting.chooseSalary')}
        <span aria-hidden="true" className="text-base transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">{t('monthlyAccounting.chooseSalaryHint')}</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {candidates.data.slice(0, 6).map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            disabled={selectSalary.isPending}
            onClick={() => selectSalary.mutate(candidate.id)}
            className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-start text-xs transition hover:border-amber-400 disabled:opacity-50 dark:border-amber-900 dark:bg-gray-900"
          >
            <span className="min-w-0 truncate font-medium text-gray-800 dark:text-gray-100">{candidate.description}</span>
            <span className="shrink-0 text-end">
              <span className="block font-bold text-emerald-600">{formatCurrency(Number(candidate.amount))}</span>
              <span className="block text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                {t(hasSalaryIdentity ? 'monthlyAccounting.additionalSalary' : 'monthlyAccounting.mainSalary')}
              </span>
            </span>
          </button>
        ))}
      </div>
      {selectSalary.isError && <p className="mt-2 text-[11px] text-red-600">{t('monthlyAccounting.salarySaveFailed')}</p>}
    </details>
  );
}
