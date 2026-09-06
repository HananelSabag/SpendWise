/**
 * ModernDashboard — one responsive financial home, stating one truth: the balance you have
 * and the billing cycle you are living in. Deeper history uses the same cycle model
 * on /insights and the yearly review.
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

import { useTranslation, useCurrency, useNotifications } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useCurrentCycle, useCycleControls } from '../hooks/useCycles';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { PageSkeleton } from '../components/ui';

import ModernBalancePanel from '../components/features/dashboard/ModernBalancePanel';
import FinancialCycleSnapshotV2 from '../components/features/dashboard/FinancialCycleSnapshotV2';
import OverdraftRunwayCard from '../components/features/dashboard/OverdraftRunwayCard';
import ModernRecentTransactionsWidget from '../components/features/dashboard/ModernRecentTransactionsWidget';
import DashboardError from '../components/features/dashboard/DashboardError';
import { usePullToRefresh } from '../components/features/dashboard/usePullToRefresh';

export default function ModernDashboard() {
  const { t, currentLanguage } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentCycle = useCurrentCycle();
  const cycleControls = useCycleControls();

  const {
    data: dashboardData,
    isLoading,
    isError,
    isRefetching,
    refresh: refreshDashboard,
  } = useDashboard();

  const handleRefresh = useCallback(async () => {
    const [result] = await Promise.all([refreshDashboard(), currentCycle.refetch()]);
    if (!result.success) {
      addNotification({ type: 'error', message: t('refreshError'), duration: 4000 });
    }
  }, [refreshDashboard, currentCycle, addNotification, t]);

  const { pull, refreshing } = usePullToRefresh(handleRefresh, isMobile);

  if (isLoading && !dashboardData) return <PageSkeleton page="dashboard" />;
  if (isError && !dashboardData) return <DashboardError onRetry={handleRefresh} t={t} />;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-24 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 lg:pb-8">
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-150 lg:hidden"
          style={{ height: `${pull}px` }}
        >
          <RefreshCw
            className={cn(
              'h-5 w-5 text-indigo-500 transition-transform',
              refreshing && 'animate-spin',
              !refreshing && pull >= 70 && 'rotate-180',
            )}
          />
        </div>

        <h1 className="sr-only">{t('title')}</h1>

        <main className="mx-auto max-w-7xl space-y-4 px-4 py-4 lg:space-y-6 lg:px-8 lg:py-6">
          <ModernBalancePanel />

          {/* The current cycle and detail page share one scenario calculation and presentation. */}
          <FinancialCycleSnapshotV2
            cycle={currentCycle.cycle}
            settings={currentCycle.settings}
            isLoading={currentCycle.isLoading}
            isError={currentCycle.isError}
            hasNoBankData={currentCycle.hasNoBankData}
            needsCycleAnchor={currentCycle.needsCycleAnchor}
            formatCurrency={formatCurrency}
            t={t}
            language={currentLanguage}
            onEstimateChange={(useEstimates) => cycleControls.updateCycleSettings({ useEstimates })}
            isSaving={cycleControls.isUpdatingSettings}
            onRetry={currentCycle.refetch}
            onOpen={() => navigate('/financial-cycle')}
          />

          <OverdraftRunwayCard
            cycle={currentCycle.cycle}
            settings={currentCycle.settings}
            formatCurrency={formatCurrency}
            t={t}
            onSaveLimit={(overdraftLimit) => cycleControls.updateCycleSettingsAsync({ overdraftLimit })}
            isSaving={cycleControls.isUpdatingSettings}
          />

          <ModernRecentTransactionsWidget
            onViewAll={() => navigate('/transactions')}
            maxItems={isMobile ? 6 : 8}
            preloadedTransactions={dashboardData.recentTransactions}
            preloadedLoading={isRefetching}
          />
        </main>
      </div>
    </>
  );
}
