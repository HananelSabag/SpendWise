import React from 'react';
import { ArrowLeft, CalendarDays, Landmark, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { useCurrency, useTranslation } from '../stores';
import { useCycleYears, useYearlyReview } from '../hooks/useCycles';
import { PageSkeleton } from '../components/ui';
import { cn } from '../utils/helpers';
import { signedCurrency } from '../utils/cycleFormat';

function monthLabel(iso, language) {
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function TotalCard({ icon: Icon, label, value, formatCurrency, tone = 'neutral', suffix }) {
  const tones = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    negative: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-gray-950 dark:text-white',
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <Icon className="h-4 w-4" />{label}
      </div>
      <p className={cn('mt-2 text-xl font-black tabular-nums', tones[tone])}>
        {suffix ? `${value}${suffix}` : signedCurrency(value, formatCurrency)}
      </p>
    </div>
  );
}

export default function YearlyReviewPage() {
  const navigate = useNavigate();
  const { year: yearParam } = useParams();
  const { t, currentLanguage } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const currentYear = new Date().getFullYear();
  const year = Number(yearParam) || currentYear;
  const { years } = useCycleYears();
  const { review, isLoading, isError, refetch } = useYearlyReview(year);
  const availableYears = [...new Set([year, ...(years.length ? years : [currentYear])])]
    .sort((a, b) => b - a);

  if (isLoading && !review) return <PageSkeleton page="financial-cycle" />;
  const totals = review?.totals || {};
  const months = review?.months || [];
  const maxExpense = Math.max(1, ...months.map((month) => month.expenses));
  const maxCategory = Math.max(1, ...(review?.categories || []).map((item) => item.amount));

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-gray-950 lg:pb-10">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 lg:px-8">
          <button type="button" onClick={() => navigate('/financial-cycle')} className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('insightsPage.back', { fallback: 'Back' })}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-black text-gray-950 dark:text-white">{t('cycle.yearlyTitle', { fallback: 'Yearly review' })}</h1>
            <p className="text-xs text-gray-500">{t('cycle.yearlyHint', { fallback: 'Salary-cycle results, month by month' })}</p>
          </div>
          <select
            value={year}
            onChange={(event) => navigate(`/financial-cycle/yearly/${event.target.value}`)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold dark:border-gray-700 dark:bg-gray-800"
            aria-label={t('cycle.pickYear', { fallback: 'Choose year' })}
          >
            {availableYears.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
          </select>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 lg:px-8">
        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-900 dark:bg-red-950/20">
            <p className="text-sm font-bold text-red-700 dark:text-red-300">{t('cycle.yearlyError', { fallback: 'Could not load this year' })}</p>
            <button type="button" onClick={refetch} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white">{t('reloadPage', { fallback: 'Try again' })}</button>
          </div>
        ) : months.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <CalendarDays className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white">{t('cycle.noYearData', { fallback: 'No complete cycles for this year' })}</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <TotalCard icon={TrendingUp} label={t('cycle.income', { fallback: 'Income' })} value={totals.income} formatCurrency={formatCurrency} tone="positive" />
              <TotalCard icon={TrendingDown} label={t('cycle.expenses', { fallback: 'Expenses' })} value={totals.expenses} formatCurrency={formatCurrency} tone="negative" />
              <TotalCard icon={PiggyBank} label={t('cycle.yearlySavings', { fallback: 'Savings' })} value={totals.operatingNet} formatCurrency={formatCurrency} tone={totals.operatingNet < 0 ? 'negative' : 'positive'} />
              <TotalCard icon={Landmark} label={t('cycle.bankMovement', { fallback: 'Bank movement' })} value={totals.bankMovement} formatCurrency={formatCurrency} tone={totals.bankMovement < 0 ? 'negative' : 'positive'} />
              <TotalCard icon={PiggyBank} label={t('cycle.savingsRate', { fallback: 'Savings rate' })} value={totals.savingsRate} suffix="%" formatCurrency={formatCurrency} tone={totals.savingsRate < 0 ? 'negative' : 'positive'} />
            </section>

            <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-black text-gray-950 dark:text-white">{t('cycle.monthByMonth', { fallback: 'Month by month' })}</h2>
              <div className="mt-4 space-y-3">
                {months.map((month) => (
                  <div key={month.cycleStart} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500">{monthLabel(month.cycleStart, currentLanguage)}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(2, (month.expenses / maxExpense) * 100)}%` }} />
                    </div>
                    <div className="text-end">
                      <p className="text-xs font-bold tabular-nums text-gray-800 dark:text-gray-200">{formatCurrency(month.expenses)}</p>
                      <p className={cn('text-[10px] font-semibold tabular-nums', month.operatingNet < 0 ? 'text-rose-500' : 'text-emerald-500')}>{signedCurrency(month.operatingNet, formatCurrency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-black text-gray-950 dark:text-white">{t('cycle.categoryTrends', { fallback: 'Top spending categories' })}</h2>
              <div className="mt-4 space-y-3">
                {(review.categories || []).slice(0, 8).map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-semibold text-gray-600 dark:text-gray-300">{item.category}</span>
                      <span className="shrink-0 font-bold tabular-nums text-gray-900 dark:text-white">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${(item.amount / maxCategory) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
