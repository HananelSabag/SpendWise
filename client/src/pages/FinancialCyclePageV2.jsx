import React, { useState } from 'react';
import { ArrowLeft, Calculator, Landmark, RefreshCw, Repeat2, Settings2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BrandMark from '../components/common/BrandMark';
import { PageSkeleton } from '../components/ui';
import { useCurrency, useTranslation } from '../stores';
import { useCurrentCycleWorkspace } from '../hooks/useCycles';
import { formatCycleWindow, signedCurrency } from '../utils/cycleFormat';
import CyclePositionPanelV2 from '../components/features/financialCycleV2/CyclePositionPanelV2';
import CycleCardsPanelV2 from '../components/features/financialCycleV2/CycleCardsPanelV2';
import CycleManagePanelV2 from '../components/features/financialCycleV2/CycleManagePanelV2';
import CycleKnownExpensesPanelV2 from '../components/features/financialCycleV2/CycleKnownExpensesPanelV2';
import CycleRecurringPanelV2 from '../components/features/financialCycleV2/CycleRecurringPanelV2';
import CycleLoansPanelV2 from '../components/features/financialCycleV2/CycleLoansPanelV2';
import { getCycleProjection } from '../utils/cycleProjection';

const TABS = [
  { id: 'overview', icon: TrendingUp },
  { id: 'recurring', icon: Repeat2 },
  { id: 'loans', icon: Landmark },
  { id: 'settings', icon: Settings2 },
];

function initialTab() {
  try {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested === 'control' || requested === 'manage' || requested === 'recurring') return 'recurring';
    if (requested === 'loans' || requested === 'debts') return 'loans';
    if (requested === 'settings') return 'settings';
    return 'overview';
  } catch (_) {
    return 'overview';
  }
}

function Breakdown({ cycle, useEstimates, formatCurrency, t }) {
  const reset = cycle?.forwardReset || {};
  const projection = getCycleProjection(reset);
  const rows = [
    { label: t('cycleV2.startBalance'), value: null, meta: t('cycleV2.startBalanceHint') },
    { label: t('cycleV2.cardsKnown'), value: -projection.knownCardOut, meta: t('cycleV2.cardsKnownHint') },
    { label: t('cycleV2.fixedOut'), value: -projection.knownFixedOut, meta: t('cycleV2.fixedOutHint') },
    ...(useEstimates && projection.expectedIncome > 0 ? [{ label: t('cycleV2.expectedIncome'), value: projection.expectedIncome, estimate: true, positive: true, meta: t('cycleV2.expectedIncomeHint') }] : []),
    ...(useEstimates && projection.forecastExtraOut > 0 ? [{ label: t('cycleV2.estimateExtra'), value: -projection.forecastExtraOut, estimate: true, meta: t('cycleV2.growthHint') }] : []),
  ];
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-indigo-500" /><h2 className="text-base font-black text-slate-950 dark:text-white">{t('cycleV2.calculationTitle')}</h2></div>
      <p className="mt-1 text-xs text-slate-500">{t('cycleV2.calculationHint')}</p>
      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-800 dark:text-slate-100">{row.label}{row.estimate && <span className="ms-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{t('cycleV2.estimate')}</span>}</p><p className="mt-0.5 text-[10px] text-slate-400">{row.meta}</p></div>
            {row.value === null ? <span className="text-xs font-bold text-slate-400">{t('cycleV2.live')}</span> : <strong className={`shrink-0 whitespace-nowrap text-sm tabular-nums ${row.positive ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>{signedCurrency(row.value, formatCurrency, { signPositive: true })}</strong>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FinancialCyclePageV2() {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const [tab, setTab] = useState(initialTab);
  const workspace = useCurrentCycleWorkspace();
  const cycle = workspace.cycle;

  if (workspace.isLoading && !cycle) return <PageSkeleton page="financial-cycle" />;

  const empty = workspace.hasNoBankData || workspace.needsSalaryLink || workspace.needsCycleAnchor || !cycle;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950 lg:pb-10">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/')} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('insightsPage.back')}><ArrowLeft className="h-5 w-5 rtl:rotate-180" /></button>
            <BrandMark size="sm" />
            <div className="min-w-0 flex-1"><h1 className="truncate text-base font-black text-slate-950 dark:text-white">{t('cycleV2.pageTitle')}</h1>{cycle && <p className="truncate text-[11px] font-semibold text-slate-400">{formatCycleWindow(cycle.window, currentLanguage)}</p>}</div>
            {(workspace.isFetching || workspace.isUpdatingSettings || workspace.isUpdatingCard || workspace.isUpdatingRecurring) && <span className="hidden text-[10px] font-bold text-indigo-500 sm:inline">{t('cycleV2.syncing')}</span>}
            <button type="button" onClick={() => workspace.refetch()} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('cycleV2.refresh')}><RefreshCw className={`h-4 w-4 ${workspace.isFetching ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 lg:px-8 lg:py-6">
        {workspace.isError && !cycle ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/20"><p className="font-black text-rose-700 dark:text-rose-300">{t('cycleV2.loadError')}</p><button type="button" onClick={() => workspace.refetch()} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white">{t('cycleV2.tryAgain')}</button></div>
        ) : empty ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"><h2 className="text-lg font-black text-slate-900 dark:text-white">{workspace.hasNoBankData ? t('cycleV2.noBankTitle') : workspace.needsCycleAnchor ? t('cycleV2.anchorTitle') : t('cycleV2.incomeTitle')}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{workspace.hasNoBankData ? t('cycleV2.noBankHint') : workspace.needsCycleAnchor ? t('cycleV2.anchorHint') : t('cycleV2.incomeHint')}</p>{workspace.needsCycleAnchor && <button type="button" onClick={() => workspace.updateCycleSettings({ engineMode: 'manual', manualAnchorDay: 10 })} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">{t('cycleV2.useDayTen')}</button>}</div>
        ) : (
          <>
            <nav className="mb-5 grid grid-cols-4 gap-1 rounded-2xl bg-slate-200/70 p-1.5 dark:bg-slate-900" aria-label={t('cycleV2.pageTabs')}>
              {TABS.map(({ id, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-black transition ${tab === id ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300' : 'text-slate-500'}`}><Icon className="h-4 w-4" />{t(`cycleV2.tab_${id}`)}</button>)}
            </nav>

            {tab === 'overview' && (
              <div className="space-y-4">
                <CyclePositionPanelV2 cycle={cycle} settings={workspace.settings} formatCurrency={formatCurrency} t={t} onEstimateChange={(enabled) => workspace.updateCycleSettings({ useEstimates: enabled })} isSaving={workspace.isUpdatingSettings} />
                <div className="grid gap-4 lg:grid-cols-2"><CycleKnownExpensesPanelV2 cycle={cycle} useEstimates={workspace.settings?.useEstimates !== false} formatCurrency={formatCurrency} language={currentLanguage} t={t} /><Breakdown cycle={cycle} useEstimates={workspace.settings?.useEstimates !== false} formatCurrency={formatCurrency} t={t} /></div>
                <CycleCardsPanelV2 cycle={cycle} useEstimates={workspace.settings?.useEstimates !== false} formatCurrency={formatCurrency} language={currentLanguage} t={t} onChange={workspace.updateCardSettings} isSaving={workspace.isUpdatingCard} />
              </div>
            )}
            {tab === 'recurring' && <CycleRecurringPanelV2 recurringGroups={workspace.recurringGroups} onRecurringChange={workspace.updateRecurringGroup} isSavingRecurring={workspace.isUpdatingRecurring} formatCurrency={formatCurrency} language={currentLanguage} t={t} />}
            {tab === 'loans' && <CycleLoansPanelV2 formatCurrency={formatCurrency} language={currentLanguage} t={t} />}
            {tab === 'settings' && <CycleManagePanelV2 settings={workspace.settings} cycle={cycle} onSettingsChange={workspace.updateCycleSettings} isSavingSettings={workspace.isUpdatingSettings} t={t} />}
          </>
        )}
      </main>
    </div>
  );
}
