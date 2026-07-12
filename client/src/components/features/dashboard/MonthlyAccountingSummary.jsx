import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { api } from '../../../api';
import { useTranslation } from '../../../stores';
import SalaryReviewPrompt from './SalaryReviewPrompt';

const STATUS = {
  open: ['open', Clock3, 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'],
  closed: ['closed', CheckCircle2, 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'],
  awaiting_salary: ['awaitingSalary', Clock3, 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'],
  awaiting_settlement: ['awaitingSettlement', Clock3, 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'],
  needs_review: ['needsReview', AlertTriangle, 'text-red-600 bg-red-50 dark:bg-red-950/30'],
};

function SalaryCandidatePrompt({ formatCurrency, t }) {
  const queryClient = useQueryClient();
  const candidates = useQuery({
    queryKey: ['salaryCandidates'],
    queryFn: async () => {
      const result = await api.transactions.getSalaryCandidates();
      if (!result.success) throw new Error(result.error?.message || 'Failed to load salary candidates');
      return result.data;
    },
    staleTime: 5 * 60_000,
  });
  const selectSalary = useMutation({
    mutationFn: async (transactionId) => {
      const result = await api.transactions.createSalarySignature(transactionId);
      if (!result.success) throw new Error(result.error?.message || 'Failed to save salary');
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  });

  if (candidates.isLoading) {
    return <div className="mt-3 flex items-center gap-2 text-xs text-gray-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />{t('monthlyAccounting.salarySearch')}</div>;
  }
  if (!candidates.data?.length) {
    return <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/25 dark:text-amber-300">{t('monthlyAccounting.noSalaryCandidate')}</p>;
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/70 p-3 dark:border-amber-900 dark:bg-amber-950/20">
      <p className="text-xs font-bold text-amber-900 dark:text-amber-200">{t('monthlyAccounting.chooseSalary')}</p>
      <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">{t('monthlyAccounting.chooseSalaryHint')}</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {candidates.data.slice(0, 4).map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            disabled={selectSalary.isPending}
            onClick={() => selectSalary.mutate(candidate.id)}
            className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-start text-xs transition hover:border-amber-400 disabled:opacity-50 dark:border-amber-900 dark:bg-gray-900"
          >
            <span className="min-w-0 truncate font-medium text-gray-800 dark:text-gray-100">{candidate.description}</span>
            <span className="shrink-0 font-bold text-emerald-600">{formatCurrency(Number(candidate.amount))}</span>
          </button>
        ))}
      </div>
      {selectSalary.isError && <p className="mt-2 text-[11px] text-red-600">{t('monthlyAccounting.salarySaveFailed')}</p>}
    </div>
  );
}

function MonthCard({ data, formatCurrency, t, language }) {
  if (!data) return null;
  const [statusKey, StatusIcon, statusClass] = STATUS[data.status] || STATUS.open;
  const monthLabel = new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', { month: 'long', year: 'numeric' })
    .format(new Date(`${data.month}-15T12:00:00`));
  const income = data.income.actual;
  const net = data.net.actual;

  return (
    <article className="rounded-2xl border border-gray-200/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/70">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {t('monthlyAccounting.previousMonth')}
          </p>
          <h3 className="mt-0.5 text-base font-bold text-gray-900 dark:text-white">{monthLabel}</h3>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${statusClass}`}>
          <StatusIcon className="h-3 w-3" />{t(`monthlyAccounting.status.${statusKey}`)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div><p className="text-[11px] text-gray-400">{t('monthlyAccounting.actualIncome')}</p><p className="font-bold text-emerald-600">{formatCurrency(income)}</p></div>
        <div><p className="text-[11px] text-gray-400">{t('monthlyAccounting.spending')}</p><p className="font-bold text-red-500">{formatCurrency(data.spending.committed)}</p></div>
        <div><p className="text-[11px] text-gray-400">{t('monthlyAccounting.actualNet')}</p><p className={`font-bold ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(net)}</p></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-[11px] text-gray-500 dark:border-gray-800">
        <span>
          {t(data.spending.cardDataMode === 'settlement_fallback' ? 'monthlyAccounting.bankCardCharge' : 'monthlyAccounting.itemizedCard')}: {formatCurrency(data.spending.cardPosted)}
        </span>
        <span>{t('monthlyAccounting.bankDirect')}: {formatCurrency(data.spending.bankDirect)}</span>
        {data.spending.cardPending > 0 && <span>{t('monthlyAccounting.pending')}: {formatCurrency(data.spending.cardPending)}</span>}
        <span>{t('monthlyAccounting.avgDailySpend')}: {formatCurrency(data.dailyAverage.spending)}</span>
        <span>{t('monthlyAccounting.avgDailyIncome')}: {formatCurrency(data.dailyAverage.income)}</span>
      </div>
      {data.reconciliation.status !== 'unavailable' && (
        <p className={`mt-2 text-[11px] ${data.reconciliation.status === 'matched' ? 'text-emerald-600' : 'text-amber-600'}`}>
          {t('monthlyAccounting.cardVerification')}: {data.reconciliation.status === 'matched' ? t('monthlyAccounting.matched') : t('monthlyAccounting.difference', { amount: formatCurrency(Math.abs(data.reconciliation.difference)) })}
        </p>
      )}
      {data.status === 'awaiting_salary' && <SalaryCandidatePrompt formatCurrency={formatCurrency} t={t} />}
    </article>
  );
}

export default function MonthlyAccountingSummary({ data, formatCurrency }) {
  const { t, currentLanguage } = useTranslation('dashboard');
  if (!data) return null;
  return (
    // Only the previous month here — the current summary is the salary-anchored
    // RunwayCard above, so a second "current" card would just duplicate it.
    <section className="grid grid-cols-1 gap-4">
      <SalaryReviewPrompt formatCurrency={formatCurrency} />
      <MonthCard data={data.previous} formatCurrency={formatCurrency} t={t} language={currentLanguage} />
    </section>
  );
}
