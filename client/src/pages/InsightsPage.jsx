/**
 * The financial cycle: one salary to the next.
 *
 * Three tabs rather than one long scroll — there are too many numbers, cards and accounts here
 * for a single column to stay readable. The page states figures and short labels only; every
 * explanation hides behind an InfoHint until it is asked for.
 *
 * Runs on services/cycleEngine (FINANCIAL_CYCLE_SPEC.md), whose totals reconcile to the real
 * bank movement — replacing the older billing-anchored view, which put the salary outside its
 * own window and reported ₪18 of income.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, BarChart3, CalendarRange, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useCurrency, useTranslation } from '../stores';
import { useCycles } from '../hooks/useCycles';
import { formatCycleWindow } from '../utils/cycleFormat';
import BrandMark from '../components/common/BrandMark';
import { LiquidTabs, PageSkeleton } from '../components/ui';
import CycleOverviewTab from '../components/features/insights/CycleOverviewTab';
import CycleCardsTab from '../components/features/insights/CycleCardsTab';
import CycleDebtsTab from '../components/features/insights/CycleDebtsTab';
import CycleControlTab from '../components/features/insights/CycleControlTab';
import CycleBalanceStrip from '../components/features/insights/CycleBalanceStrip';
import SalaryCandidatePrompt from '../components/features/dashboard/SalaryCandidatePrompt';

const TABS = ['overview', 'cards', 'control'];
const CARD_ESTIMATE_KEY = 'spendwise-use-card-estimate';

function initialCycleTab() {
  try {
    const requested = new URLSearchParams(window.location.search).get('tab');
    return TABS.includes(requested) ? requested : 'overview';
  } catch (_) {
    return 'overview';
  }
}

function savedCardEstimatePreference() {
  try {
    return localStorage.getItem(CARD_ESTIMATE_KEY) !== 'false';
  } catch (_) {
    return true;
  }
}

function initiallyShowPreviousCycle() {
  try { return new URLSearchParams(window.location.search).get('cycle') === 'previous'; } catch (_) { return false; }
}

export default function InsightsPage() {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const [tab, setTab] = useState(initialCycleTab);
  // Selection is keyed by the cycle's own start date, not a positional index: a background refetch
  // can reorder or shrink the cycles array, and an index would then point at a different cycle.
  const [selectedCycleStart, setSelectedCycleStart] = useState(null);
  const [showPreviousInitially] = useState(initiallyShowPreviousCycle);
  const [useCardEstimate, setUseCardEstimate] = useState(savedCardEstimatePreference);
  const { cycles, signatures, loans, totalOutstanding, recurring, salaryTracking, salaryChange,
    needsSalaryLink, hasNoBankData, isLoading, isError, refetch, classifyTransaction,
    resetTransactionClassification, isUpdatingDecision, updatingTransactionId,
    settings, fundingForecast, updateCycleSettings, isUpdatingSettings } = useCycles();

  const cycle = useMemo(() => {
    if (!cycles?.length) return null;
    if (selectedCycleStart) {
      return cycles.find((c) => c.window.start === selectedCycleStart) || null;
    }
    if (showPreviousInitially) return [...cycles].reverse().find((item) => !item.window.running) || cycles[cycles.length - 1];
    return cycles.find((c) => c.window.running) || cycles[cycles.length - 1];
  }, [cycles, selectedCycleStart, showPreviousInitially]);

  const changeDecision = useCallback((item, classification) => {
    classifyTransaction({
      transactionId: item.transactionId,
      classification,
      reason: `control_override:${item.reason}`,
    });
  }, [classifyTransaction]);

  const resetDecision = useCallback((item) => {
    resetTransactionClassification({ transactionId: item.transactionId });
  }, [resetTransactionClassification]);

  const changeCardEstimate = useCallback((enabled) => {
    setUseCardEstimate(enabled);
    try { localStorage.setItem(CARD_ESTIMATE_KEY, String(enabled)); } catch (_) { /* optional preference */ }
  }, []);

  if (isLoading && !cycles?.length) {
    return <PageSkeleton page="financial-cycle" />;
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
            <button
              type="button"
              onClick={() => navigate(`/financial-cycle/yearly/${cycle?.window?.start?.slice(0, 4) || new Date().getFullYear()}`)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-2.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300"
              aria-label={t('cycle.yearlyTitle', { fallback: 'Yearly review' })}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('cycle.yearlyShort', { fallback: 'Year' })}</span>
            </button>
            <button type="button" onClick={refetch} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('refresh', { fallback: 'Refresh' })}>
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* The window replaces a subtitle: it is the one fact the whole page depends on. */}
          {cycle && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <CalendarRange className="h-3 w-3" />
                {formatCycleWindow(cycle.window, currentLanguage)}
              </span>
              {cycle.window.running && (
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {t('cycle.soFar', { fallback: 'so far' })}
                </span>
              )}
              {cycle.partials?.length > 0 && (
                <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  {t('cycle.partialBadge', { fallback: 'Partial' })}
                </span>
              )}
              {cycles.length > 1 && (
                <select
                  value={cycle.window.start}
                  onChange={(e) => setSelectedCycleStart(e.target.value)}
                  className="ms-auto max-w-[52%] shrink-0 truncate rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  aria-label={t('cycle.pickCycle', { fallback: 'Choose cycle' })}
                >
                  {cycles.map((c) => (
                    <option key={c.window.start} value={c.window.start}>{formatCycleWindow(c.window, currentLanguage)}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4 lg:px-8">
        {/* The level the user navigates by — always in view, above the flow. */}
        <CycleBalanceStrip
          cycle={cycle}
          formatCurrency={formatCurrency}
          t={t}
          language={currentLanguage}
          useCardEstimate={useCardEstimate}
          onCardEstimateChange={changeCardEstimate}
          className="mb-4"
        />

        {isError && !cycle ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-3 text-sm font-bold text-red-700 dark:text-red-300">
              {t('cycle.loadError', { fallback: 'We could not load your financial cycle' })}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-red-600/80 dark:text-red-300/70">
              {t('cycle.loadErrorHint', { fallback: 'This is usually temporary. Check your connection and try again.' })}
            </p>
            <button type="button" onClick={refetch} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">
              <RefreshCw className="h-4 w-4" />{t('reloadPage', { fallback: 'Try again' })}
            </button>
          </div>
        ) : empty ? (
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
                <button
                  type="button"
                  disabled={isUpdatingSettings}
                  onClick={() => updateCycleSettings({ engineMode: 'manual', manualAnchorDay: 10 })}
                  className="mt-3 w-full rounded-xl border border-indigo-200 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/20"
                >
                  {t('cycle.control.startManual', { fallback: 'Use a manual monthly reset instead' })}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Three tabs by purpose: what the cycle did (overview), where money goes and what
                you owe (cards + loans), and the one place for decisions (control). */}
            <LiquidTabs
              className="sticky top-2 z-20 mb-4 shadow-sm backdrop-blur sm:static sm:shadow-none"
              fill
              size="sm"
              mobileCompact
              tabs={TABS.map((id) => ({ id, label: t(`cycle.tab.${id}`, { fallback: id }) }))}
              active={tab}
              onChange={setTab}
            />

            {tab === 'overview' && (
              <CycleOverviewTab cycle={cycle} salaryTracking={salaryTracking} formatCurrency={formatCurrency} t={t} language={currentLanguage} useCardEstimate={useCardEstimate} />
            )}
            {/* Cards and loans together: both answer "where does my money go and what do I owe". */}
            {tab === 'cards' && (
              <div className="space-y-4">
                <CycleCardsTab
                  cycle={cycle}
                  formatCurrency={formatCurrency}
                  t={t}
                  language={currentLanguage}
                  useCardEstimate={useCardEstimate}
                />
                <CycleDebtsTab loans={loans} totalOutstanding={totalOutstanding} recurring={recurring} formatCurrency={formatCurrency} t={t} language={currentLanguage} />
              </div>
            )}
            {/* Control — the only tab that asks something of you: salary, job change, the credit
                questions, and merchant watch, each its own clear section. */}
            {tab === 'control' && (
              <CycleControlTab
                cycle={cycle}
                salaryTracking={salaryTracking}
                salaryChange={salaryChange}
                needsReview={cycle.needsReview}
                formatCurrency={formatCurrency}
                t={t}
                onDecisionChange={changeDecision}
                onDecisionReset={resetDecision}
                isUpdatingDecision={isUpdatingDecision}
                updatingTransactionId={updatingTransactionId}
                signatures={signatures}
                onSalarySelected={refetch}
                settings={settings}
                fundingForecast={fundingForecast}
                onSettingsChange={updateCycleSettings}
                isUpdatingSettings={isUpdatingSettings}
                language={currentLanguage}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
