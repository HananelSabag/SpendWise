import React, { lazy, Suspense } from 'react';
import { ArrowLeft, Landmark, RefreshCw, Repeat2, Settings2, Wallet } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrency, useTranslation } from '../stores';
import { useCurrentCycleWorkspace } from '../hooks/useCycles';
import { useBankBalance } from '../hooks/useBankBalance';
import CycleSummary from '../components/features/financialCycleV2/CycleSummary';
import CycleCardsPanelV2 from '../components/features/financialCycleV2/CycleCardsPanelV2';
import CycleKnownExpensesPanelV2 from '../components/features/financialCycleV2/CycleKnownExpensesPanelV2';
import CycleActivityPanel from '../components/features/financialCycleV2/CycleActivityPanel';
import { CycleEmpty, cycleButton } from '../components/features/financialCycleV2/CyclePrimitives';
import { cn } from '../utils/helpers';

const CycleRecurringPanelV2 = lazy(
  () => import('../components/features/financialCycleV2/CycleRecurringPanelV2'),
);
const CycleLoansPanelV2 = lazy(
  () => import('../components/features/financialCycleV2/CycleLoansPanelV2'),
);
const CycleManagePanelV2 = lazy(
  () => import('../components/features/financialCycleV2/CycleManagePanelV2'),
);
const TABS = [
  { id: 'overview', icon: Wallet },
  { id: 'recurring', icon: Repeat2 },
  { id: 'loans', icon: Landmark },
  { id: 'settings', icon: Settings2 },
];

export function resolveCycleTab(requested) {
  if (['control', 'manage', 'recurring'].includes(requested)) return 'recurring';
  if (requested === 'debts') return 'loans';
  return TABS.some(({ id }) => id === requested) ? requested : 'overview';
}

function PanelLoading({ t }) {
  return (
    <div
      role="status"
      className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
    >
      {t('cycleV2.loadingCycle')}
    </div>
  );
}

/** Pure page shell is also mounted by the synthetic, dev-only visual harness. */
export function FinancialCycleWorkspaceView({
  workspace,
  tab,
  onTabChange,
  onBack,
  onConnect,
  formatCurrency,
  language,
  t,
}) {
  const { cycle } = workspace;
  const useEstimates = workspace.settings?.useEstimates !== false;
  const updating =
    workspace.isFetching ||
    workspace.isUpdatingSettings ||
    workspace.isUpdatingCard ||
    workspace.isUpdatingRecurring;
  const moveTab = (event, index) => {
    const forward = language === 'he' ? 'ArrowLeft' : 'ArrowRight';
    const backward = language === 'he' ? 'ArrowRight' : 'ArrowLeft';
    let target;
    if (event.key === forward) target = (index + 1) % TABS.length;
    if (event.key === backward) target = (index + TABS.length - 1) % TABS.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = TABS.length - 1;
    if (target === undefined) return;
    event.preventDefault();
    event.currentTarget.parentElement.children[target]?.focus();
    onTabChange(TABS[target].id);
  };
  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:pb-10">
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
        <h1 className="sr-only">{t('cycleV2.pageTitle')}</h1>
        <header className="mb-2">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className={cn(
                cycleButton,
                '-ms-3 flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300',
              )}
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t('cycleV2.backDashboard')}
            </button>
            <button
              type="button"
              onClick={workspace.refetch}
              disabled={updating}
              aria-label={t('cycleV2.refresh')}
              className={cn(
                cycleButton,
                'flex items-center gap-2 text-slate-500 dark:text-slate-400',
              )}
            >
              <RefreshCw className={cn('h-4 w-4', updating && 'animate-spin')} />
              <span className="text-xs">{t(updating ? 'cycleV2.syncing' : 'cycleV2.refresh')}</span>
            </button>
          </div>
        </header>
        <div
          role="tablist"
          aria-label={t('cycleV2.pageTabs')}
          className="mb-5 grid grid-cols-4 gap-1 rounded-2xl bg-slate-200/60 p-1 dark:bg-slate-900"
        >
          {TABS.map(({ id, icon: Icon }, index) => (
            <button
              key={id}
              id={`cycle-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`cycle-panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onKeyDown={(event) => moveTab(event, index)}
              onClick={() => onTabChange(id)}
              className={cn(
                cycleButton,
                'flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-xs sm:flex-row sm:gap-2 sm:px-3 sm:text-sm',
                tab === id
                  ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(`cycleV2.tab_${id}`)}</span>
            </button>
          ))}
        </div>
        {workspace.isError && cycle && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
          >
            {t('cycleV2.staleData')}
          </p>
        )}
        <div
          id={`cycle-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`cycle-tab-${tab}`}
          tabIndex={0}
        >
          <Suspense fallback={<PanelLoading t={t} />}>
            {workspace.isLoading && !cycle ? (
              <PanelLoading t={t} />
            ) : workspace.isError && !cycle ? (
              <CycleEmpty title={t('cycleV2.loadError')}>
                <button
                  type="button"
                  onClick={workspace.refetch}
                  className={`${cycleButton} bg-indigo-600 text-white`}
                >
                  {t('cycleV2.tryAgain')}
                </button>
              </CycleEmpty>
            ) : workspace.hasNoBankData ? (
              <CycleEmpty title={t('cycleV2.noBankTitle')} hint={t('cycleV2.noBankHint')}>
                <button
                  type="button"
                  onClick={onConnect}
                  className={`${cycleButton} bg-indigo-600 text-white`}
                >
                  {t('cycleV2.connectBank')}
                </button>
              </CycleEmpty>
            ) : (workspace.needsCycleAnchor || !cycle) && tab === 'overview' ? (
              <CycleEmpty title={t('cycleV2.anchorTitle')} hint={t('cycleV2.anchorHint')}>
                <button
                  type="button"
                  onClick={() => onTabChange('settings')}
                  className={`${cycleButton} bg-indigo-600 text-white`}
                >
                  {t('cycleV2.chooseCycleDay')}
                </button>
              </CycleEmpty>
            ) : (
              <>
                {tab === 'overview' && cycle && (
                  <div className="space-y-6">
                    <CycleSummary
                      cycle={cycle}
                      settings={workspace.settings}
                      formatCurrency={formatCurrency}
                      language={language}
                      t={t}
                      onEstimateChange={(useEstimates) =>
                        workspace.updateCycleSettings({ useEstimates })
                      }
                      isSaving={workspace.isUpdatingSettings}
                    />
                    <div className="grid items-start gap-4 lg:grid-cols-[1.2fr_1fr]">
                      <CycleKnownExpensesPanelV2
                        cycle={cycle}
                        useEstimates={useEstimates}
                        formatCurrency={formatCurrency}
                        language={language}
                        t={t}
                      />
                      <CycleActivityPanel
                        cycle={cycle}
                        formatCurrency={formatCurrency}
                        language={language}
                        t={t}
                      />
                    </div>
                    <CycleCardsPanelV2
                      cycle={cycle}
                      useEstimates={useEstimates}
                      formatCurrency={formatCurrency}
                      language={language}
                      t={t}
                      onChange={workspace.updateCardSettings}
                      isSaving={workspace.isUpdatingCard}
                    />
                  </div>
                )}
                {tab === 'recurring' && (
                  <CycleRecurringPanelV2
                    recurringGroups={workspace.recurringGroups}
                    onRecurringChange={workspace.updateRecurringGroup}
                    isSavingRecurring={workspace.isUpdatingRecurring}
                    formatCurrency={formatCurrency}
                    language={language}
                    t={t}
                  />
                )}
                {tab === 'loans' && (
                  <CycleLoansPanelV2
                    formatCurrency={formatCurrency}
                    language={language}
                    t={t}
                    onManageRecurring={() => onTabChange('recurring')}
                  />
                )}
                {tab === 'settings' && (
                  <CycleManagePanelV2
                    settings={workspace.settings}
                    cycle={cycle}
                    onSettingsChange={workspace.updateCycleSettings}
                    onSaveLimit={(overdraftLimit) =>
                      workspace.updateCycleSettingsAsync({ overdraftLimit })
                    }
                    isSavingSettings={workspace.isUpdatingSettings}
                    formatCurrency={formatCurrency}
                    language={language}
                    t={t}
                  />
                )}
              </>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default function FinancialCyclePageV2() {
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const { t, currentLanguage } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const workspace = useCurrentCycleWorkspace();
  const bankBalance = useBankBalance();
  return (
    <FinancialCycleWorkspaceView
      workspace={{
        ...workspace,
        refetch: () => Promise.all([workspace.refetch(), bankBalance.refetch()]),
      }}
      tab={resolveCycleTab(search.get('tab'))}
      onTabChange={(tab) =>
        setSearch((current) => {
          const next = new URLSearchParams(current);
          next.set('tab', tab);
          return next;
        })
      }
      onBack={() => navigate('/')}
      onConnect={() => navigate('/bank-sync')}
      formatCurrency={formatCurrency}
      language={currentLanguage}
      t={t}
    />
  );
}
