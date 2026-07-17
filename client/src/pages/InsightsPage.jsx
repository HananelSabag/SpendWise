/**
 * The financial cycle: one salary to the next.
 *
 * Four tabs rather than one long scroll — there are too many numbers, cards and accounts here
 * for a single column to stay readable. The page states figures and short labels only; every
 * explanation hides behind an InfoHint until it is asked for.
 *
 * Runs on services/cycleEngine (FINANCIAL_CYCLE_SPEC.md), whose totals reconcile to the real
 * bank movement — replacing the older billing-anchored view, which put the salary outside its
 * own window and reported ₪18 of income.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, CalendarRange, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useCurrency, useTranslation } from '../stores';
import { useCycles } from '../hooks/useCycles';
import BrandMark from '../components/common/BrandMark';
import { LiquidTabs } from '../components/ui';
import CycleOverviewTab from '../components/features/insights/CycleOverviewTab';
import CycleCardsTab from '../components/features/insights/CycleCardsTab';
import CycleDebtsTab from '../components/features/insights/CycleDebtsTab';
import CycleTrackingTab from '../components/features/insights/CycleTrackingTab';
import CycleBalanceStrip from '../components/features/insights/CycleBalanceStrip';
import SalaryCandidatePrompt from '../components/features/dashboard/SalaryCandidatePrompt';

const TABS = ['overview', 'cards', 'debts', 'tracking'];

/** Readable window: the end is exclusive, and a running cycle has not reached it yet. */
function formatWindow(window, language) {
  if (!window?.start || !window?.end) return '';
  const start = new Date(`${window.start}T12:00:00`);
  const end = new Date(`${window.end}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  if (!window.running) end.setDate(end.getDate() - 1);
  const fmt = new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: start.getFullYear() === end.getFullYear() ? undefined : 'numeric',
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export default function InsightsPage() {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const [tab, setTab] = useState('overview');
  const [cycleIndex, setCycleIndex] = useState(null);
  const { cycles, signatures, loans, totalOutstanding, recurring, salaryTracking, salaryChange,
    needsSalaryLink, hasNoBankData, isLoading, refetch, classifyCredit,
    isClassifying, classifyingTransactionId } = useCycles();

  const cycle = useMemo(() => {
    if (!cycles?.length) return null;
    if (cycleIndex == null) return cycles.find((c) => c.window.running) || cycles[cycles.length - 1];
    return cycles[cycleIndex] || null;
  }, [cycles, cycleIndex]);

  const classify = useCallback((item, klass) => {
    classifyCredit({
      transactionId: item.transactionId,
      class: klass,
      reason: item.reason,
    });
  }, [classifyCredit]);

  if (isLoading && !cycles?.length) {
    return <div className="min-h-screen animate-pulse bg-gray-50 dark:bg-gray-950" />;
  }

  const empty = hasNoBankData || needsSalaryLink || !cycle;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-gray-950 lg:pb-10">
      <header className="border-b border-gray-200/70 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/')} className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('insightsPage.back', { fallback: 'Back' })}>
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <BrandMark size="sm" />
            <h1 className="min-w-0 flex-1 truncate text-base font-black text-gray-950 dark:text-white">
              {t('cycle.pageTitle', { fallback: 'Financial cycle' })}
            </h1>
            <button type="button" onClick={refetch} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('refresh', { fallback: 'Refresh' })}>
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* The window replaces a subtitle: it is the one fact the whole page depends on. */}
          {cycle && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <CalendarRange className="h-3 w-3" />
                {formatWindow(cycle.window, currentLanguage)}
              </span>
              {cycle.window.running && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {t('cycle.soFar', { fallback: 'so far' })}
                </span>
              )}
              {cycle.partials?.length > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  {t('cycle.partialBadge', { fallback: 'Partial' })}
                </span>
              )}
              {cycles.length > 1 && (
                <select
                  value={cycleIndex ?? cycles.findIndex((c) => c === cycle)}
                  onChange={(e) => setCycleIndex(Number(e.target.value))}
                  className="ms-auto rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  aria-label={t('cycle.pickCycle', { fallback: 'Choose cycle' })}
                >
                  {cycles.map((c, i) => (
                    <option key={c.window.start} value={i}>{formatWindow(c.window, currentLanguage)}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4 lg:px-8">
        {/* The level the user navigates by — always in view, above the flow. */}
        <CycleBalanceStrip cycle={cycle} formatCurrency={formatCurrency} t={t} language={currentLanguage} className="mb-4" />

        {empty ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {hasNoBankData
                ? t('cycle.noBankData', { fallback: 'Connect a bank to see your cycle' })
                : t('cycle.linkSalaryTitle', { fallback: 'Link your salary to see your cycle' })}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
              {hasNoBankData
                ? t('cycle.noBankDataHint', { fallback: 'Your cycle is built from your real bank and card activity.' })
                : t('cycle.linkSalaryHint', { fallback: 'Your financial cycle runs from one salary to the next. Point us at your salary once and we take it from there.' })}
            </p>
            {hasNoBankData ? (
              <button type="button" onClick={() => navigate('/bank-sync')} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
                {t('cycle.connectBank', { fallback: 'Connect a bank' })}
              </button>
            ) : (
              <div className="mx-auto mt-4 max-w-2xl text-start">
                <SalaryCandidatePrompt formatCurrency={formatCurrency} onSelected={refetch} />
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Four tabs plus icons will not fit a 375px row without clipping the labels, and a
                half-read label is worse than no icon. The label is the information here. */}
            <LiquidTabs
              className="mb-4"
              fill
              size="sm"
              mobileCompact
              tabs={TABS.map((id) => ({ id, label: t(`cycle.tab.${id}`, { fallback: id }) }))}
              active={tab}
              onChange={setTab}
            />

            {tab === 'overview' && (
              <CycleOverviewTab cycle={cycle} salaryTracking={salaryTracking} formatCurrency={formatCurrency} t={t} language={currentLanguage} />
            )}
            {tab === 'cards' && <CycleCardsTab cycle={cycle} formatCurrency={formatCurrency} t={t} language={currentLanguage} />}
            {tab === 'debts' && (
              <CycleDebtsTab loans={loans} totalOutstanding={totalOutstanding} recurring={recurring} formatCurrency={formatCurrency} t={t} language={currentLanguage} />
            )}
            {tab === 'tracking' && (
              <CycleTrackingTab
                salaryTracking={salaryTracking}
                salaryChange={salaryChange}
                needsReview={cycle.needsReview}
                formatCurrency={formatCurrency}
                t={t}
                onClassify={classify}
                isClassifying={isClassifying}
                classifyingTransactionId={classifyingTransactionId}
                 signatures={signatures}
                 onSalarySelected={refetch}
                 language={currentLanguage}
               />
            )}
          </>
        )}
      </main>
    </div>
  );
}
