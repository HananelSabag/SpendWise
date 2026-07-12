import React, { useDeferredValue, useState, useTransition } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useCurrency, useTranslation } from '../stores';
import { useFinancialCycle } from '../hooks/useFinancialCycle';
import BrandMark from '../components/common/BrandMark';
import FinancialCycleSummary from '../components/features/insights/FinancialCycleSummary';
import CardBillingCycles from '../components/features/insights/CardBillingCycles';
import DailyFlowHistory from '../components/features/insights/DailyFlowHistory';
import RunwayProjectionPlanner from '../components/features/insights/RunwayProjectionPlanner';

export default function InsightsPage() {
  const navigate = useNavigate();
  const { currentLanguage, t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { data: runway, isLoading, isFetching, refresh } = useFinancialCycle();
  const [selected, setSelected] = useState('current');
  const [isSwitching, startTransition] = useTransition();
  const deferredSelected = useDeferredValue(selected);
  const cycle = runway?.[deferredSelected];

  if (isLoading && !runway) return <div className="min-h-screen animate-pulse bg-gray-50 dark:bg-gray-950" />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-gray-950 lg:pb-10">
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 lg:px-8">
          <button type="button" onClick={() => navigate('/')} className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('insightsPage.back')}><ArrowLeft className="h-5 w-5 rtl:rotate-180" /></button>
          <BrandMark size="sm" />
          <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-black text-gray-950 dark:text-white">{t('cycleDashboard.title')}</h1><p className="truncate text-xs text-gray-500">{t('cycleDashboard.subtitle')}</p></div>
          <button type="button" onClick={refresh} disabled={isFetching} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800" aria-label={t('refresh')}><RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /></button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-5 lg:px-8">
        <div className="inline-flex rounded-2xl bg-gray-200/70 p-1 dark:bg-gray-800">
          {['current', 'previous'].map((key) => (
            <button key={key} type="button" onClick={() => startTransition(() => setSelected(key))} aria-pressed={selected === key} className={`rounded-xl px-4 py-2 text-xs font-bold transition ${selected === key ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-300' : 'text-gray-500'}`}>{t(key === 'current' ? 'cycleDashboard.current' : 'cycleDashboard.previous')}</button>
          ))}
        </div>

        <div className="contents" aria-busy={isSwitching}>
        <FinancialCycleSummary cycle={cycle} formatCurrency={formatCurrency} />
        <div className="grid gap-4 lg:grid-cols-2">
          <CardBillingCycles cycles={cycle?.cardBillingCycles || []} formatCurrency={formatCurrency} />
          {deferredSelected === 'current' ? <RunwayProjectionPlanner runway={runway} formatCurrency={formatCurrency} onSaved={refresh} /> : (
            <section className="rounded-3xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900">{t('cycleDashboard.closedCycle')}</section>
          )}
        </div>
        <DailyFlowHistory runway={runway} selectedCycle={deferredSelected} formatCurrency={formatCurrency} language={currentLanguage} />
        </div>
      </main>
    </div>
  );
}
