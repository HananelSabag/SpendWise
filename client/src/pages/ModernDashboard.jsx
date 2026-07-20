/**
 * ModernDashboard — one responsive financial home, stating one truth: the balance you have
 * and the salary-to-salary cycle you are living in. Deeper history uses the same cycle model
 * on /insights and the yearly review.
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

import { useTranslation, useAuth, useCurrency, useNotifications } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useCurrentCycle } from '../hooks/useCycles';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { PageSkeleton } from '../components/ui';

import BrandMark from '../components/common/BrandMark';
import ModernBalancePanel from '../components/features/dashboard/ModernBalancePanel';
import FinancialCycleCard from '../components/features/dashboard/FinancialCycleCard';
import ModernRecentTransactionsWidget from '../components/features/dashboard/ModernRecentTransactionsWidget';
import GreetingHeader from '../components/features/dashboard/GreetingHeader';
import DashboardError from '../components/features/dashboard/DashboardError';
import { usePullToRefresh } from '../components/features/dashboard/usePullToRefresh';

const useGreeting = (user, t) =>
  useMemo(() => {
    const hour = new Date().getHours();
    const name =
      user?.firstName || user?.first_name || user?.name || user?.username ||
      user?.email?.split('@')[0] || '';
    const key = hour < 12
      ? 'welcome.goodMorning'
      : hour < 17
        ? 'welcome.goodAfternoon'
        : hour < 21
          ? 'welcome.goodEvening'
          : 'welcome.general';
    const text = t(key) || 'Hello';
    return text.includes('{{name}}')
      ? text.replace('{{name}}', name)
      : `${text}${name ? `, ${name}` : ''}`;
  }, [user, t]);

export default function ModernDashboard() {
  const { t, currentLanguage } = useTranslation('dashboard');
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentCycle = useCurrentCycle();

  const {
    data: dashboardData,
    isLoading,
    isError,
    isRefetching,
    refresh: refreshDashboard,
  } = useDashboard();

  const greeting = useGreeting(user, t);
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

        {/* Not sticky: the greeting is the least important thing here, and pinning it ate the
            top of the mobile viewport before the balance — the first thing you actually want. */}
        <header className="rounded-none px-4 py-3 lg:mx-auto lg:max-w-7xl lg:px-8 lg:pt-6">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" className="lg:hidden" />
            <div className="min-w-0 flex-1">
              {/* No manual refresh control: the data auto-refreshes (query hooks) and mobile has
                  pull-to-refresh. A row of refresh buttons was just noise. */}
              <GreetingHeader
                greeting={greeting}
                user={user}
                navigate={navigate}
                compact={isMobile}
                t={t}
                language={currentLanguage}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-4 px-4 py-4 lg:space-y-6 lg:px-8 lg:py-6">
          <ModernBalancePanel />

          {/* The salary-to-salary cycle is the only headline here. The removed calendar-month
              card contradicted it by counting financing as income, so every current money
              surface now reads from the same cycle engine. */}
          <FinancialCycleCard
            cycle={currentCycle.cycle}
            isLoading={currentCycle.isLoading}
            salaryTracking={currentCycle.salaryTracking}
            totalOutstanding={currentCycle.totalOutstanding}
            needsSalaryLink={currentCycle.needsSalaryLink}
            formatCurrency={formatCurrency}
            t={t}
            language={currentLanguage}
            onOpenCycle={(tab) => navigate(tab ? `/financial-cycle?tab=${tab}` : '/financial-cycle')}
            onOpenPrevious={() => navigate('/financial-cycle?cycle=previous')}
            onLinkSalary={() => navigate('/financial-cycle')}
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
