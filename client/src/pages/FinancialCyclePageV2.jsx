import React, { useState } from 'react';
import { ArrowLeft, Calculator, CreditCard, RefreshCw, Settings2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BrandMark from '../components/common/BrandMark';
import { PageSkeleton } from '../components/ui';
import { useCurrency, useTranslation } from '../stores';
import { useCurrentCycleWorkspace } from '../hooks/useCycles';
import { formatCycleDay } from '../utils/cycleDate';
import { formatCycleWindow, signedCurrency } from '../utils/cycleFormat';
import CyclePositionPanelV2 from '../components/features/financialCycleV2/CyclePositionPanelV2';
import CycleCardsPanelV2 from '../components/features/financialCycleV2/CycleCardsPanelV2';
import CycleManagePanelV2 from '../components/features/financialCycleV2/CycleManagePanelV2';

const TABS = [
  { id: 'overview', icon: TrendingUp },
  { id: 'cards', icon: CreditCard },
  { id: 'manage', icon: Settings2 },
];

function initialTab() {
  try {
    const requested = new URLSearchParams(window.location.search).get('tab');
    return requested === 'control' || requested === 'manage' ? 'manage' : requested === 'cards' ? 'cards' : 'overview';
  } catch (_) {
    return 'overview';
  }
}

function Breakdown({ cycle, formatCurrency, t }) {
  const reset = cycle?.forwardReset || {};
  const knownCards = Number(reset.knownCardOut) || 0;
  const estimatedCards = Number(reset.estimatedCardOut) || knownCards;
  const rows = [
    { label: t('cycleV2.startBalance'), value: null, meta: t('cycleV2.startBalanceHint') },
    { label: t('cycleV2.incoming'), value: Number(reset.expectedIncoming) || 0, positive: true, meta: t('cycleV2.incomingHint') },
    { label: t('cycleV2.cardsKnown'), value: -knownCards, meta: t('cycleV2.cardsKnownHint') },
    { label: t('cycleV2.fixedOut'), value: -(Number(reset.fixedOut ?? reset.estimatedFixedOut) || 0), meta: t('cycleV2.fixedOutHint') },
    { label: t('cycleV2.possibleGrowth'), value: -Math.max(0, estimatedCards - knownCards), estimate: true, meta: t('cycleV2.growthHint') },
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

function Upcoming({ cycle, formatCurrency, language, t }) {
  const stages = cycle?.projection?.stages || [];
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <h2 className="text-base font-black text-slate-950 dark:text-white">{t('cycleV2.upcomingTitle')}</h2>
      <p className="mt-1 text-xs text-slate-500">{t('cycleV2.upcomingHint')}</p>
      <div className="mt-4 space-y-2">
        {stages.slice(0, 7).map((stage) => (
          <div key={`${stage.date}-${stage.kind}-${stage.label || ''}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/65">
            <div className="w-12 shrink-0 text-center"><p className="text-[10px] font-black text-indigo-600 dark:text-indigo-300">{formatCycleDay(stage.date, language)}</p></div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-800 dark:text-slate-100">{stage.label || stage.kind}</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">{stage.certainty === 'known' ? t('cycleV2.known') : t('cycleV2.estimate')}</p></div>
            <p className={`shrink-0 whitespace-nowrap text-sm font-black tabular-nums ${Number(stage.amount) > 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>{signedCurrency(Number(stage.amount), formatCurrency, { signPositive: true })}</p>
          </div>
        ))}
        {!stages.length && <p className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500 dark:bg-slate-800/65">{t('cycleV2.noUpcoming')}</p>}
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
            <nav className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1.5 dark:bg-slate-900" aria-label={t('cycleV2.pageTabs')}>
              {TABS.map(({ id, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-black transition ${tab === id ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300' : 'text-slate-500'}`}><Icon className="h-4 w-4" />{t(`cycleV2.tab_${id}`)}</button>)}
            </nav>

            {tab === 'overview' && (
              <div className="space-y-4">
                <CyclePositionPanelV2 cycle={cycle} settings={workspace.settings} formatCurrency={formatCurrency} t={t} onEstimateChange={(enabled) => workspace.updateCycleSettings({ useEstimates: enabled })} isSaving={workspace.isUpdatingSettings} />
                <div className="grid gap-4 lg:grid-cols-2"><Breakdown cycle={cycle} formatCurrency={formatCurrency} t={t} /><Upcoming cycle={cycle} formatCurrency={formatCurrency} language={currentLanguage} t={t} /></div>
              </div>
            )}
            {tab === 'cards' && <CycleCardsPanelV2 cycle={cycle} formatCurrency={formatCurrency} language={currentLanguage} t={t} onChange={workspace.updateCardSettings} isSaving={workspace.isUpdatingCard} />}
            {tab === 'manage' && <CycleManagePanelV2 settings={workspace.settings} cycle={cycle} recurringGroups={workspace.recurringGroups} onSettingsChange={workspace.updateCycleSettings} onRecurringChange={workspace.updateRecurringGroup} isSavingSettings={workspace.isUpdatingSettings} isSavingRecurring={workspace.isUpdatingRecurring} formatCurrency={formatCurrency} language={currentLanguage} t={t} />}
          </>
        )}
      </main>
    </div>
  );
}
