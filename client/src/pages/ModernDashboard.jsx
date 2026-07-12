/**
 * ModernDashboard — one responsive financial home. Every card consumes the
 * same dashboard payload and selected calendar-month window.
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

import { useTranslation, useAuth, useCurrency, useNotifications } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { formatFinancialPeriod } from '../utils/financialPeriod';
import { PageSkeleton } from '../components/ui';

import BrandMark from '../components/common/BrandMark';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton.jsx';
import ModernBalancePanel from '../components/features/dashboard/ModernBalancePanel';
import ModernRecentTransactionsWidget from '../components/features/dashboard/ModernRecentTransactionsWidget';
import MonthlyAccountingSummary from '../components/features/dashboard/MonthlyAccountingSummary';
import RunwayCard from '../components/features/dashboard/RunwayCard';
import BankCosts from '../components/features/dashboard/BankCosts';
import SpendingBreakdown from '../components/features/dashboard/SpendingBreakdown';
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

  const {
    data: dashboardData,
    isLoading,
    isError,
    isRefetching,
    refresh: refreshDashboard,
  } = useDashboard({ periodOffset: 0 });

  const greeting = useGreeting(user, t);
  const calendarPeriodLabel = useMemo(
    () => formatFinancialPeriod(dashboardData?.period, currentLanguage),
    [dashboardData?.period, currentLanguage],
  );

  const handleRefresh = useCallback(async () => {
    const result = await refreshDashboard();
    if (!result.success) {
      addNotification({ type: 'error', message: t('refreshError'), duration: 4000 });
    }
  }, [refreshDashboard, addNotification, t]);

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

        <header className="glass-card sticky top-0 z-20 rounded-none border-x-0 border-t-0 px-4 py-3 lg:static lg:mx-auto lg:max-w-7xl lg:border-0 lg:bg-transparent lg:px-8 lg:pt-6 lg:shadow-none">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" className="lg:hidden" />
            <div className="min-w-0 flex-1">
              <GreetingHeader
                greeting={greeting}
                user={user}
                navigate={navigate}
                onRefresh={isMobile ? undefined : handleRefresh}
                compact={isMobile}
                t={t}
              />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-4 px-4 py-4 lg:space-y-6 lg:px-8 lg:py-6">
          <ModernBalancePanel />

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
            <div className="space-y-4 lg:space-y-6 xl:col-span-2">
              <RunwayCard data={dashboardData.runway} formatCurrency={formatCurrency} />
              <MonthlyAccountingSummary data={dashboardData.monthlyAccounting} formatCurrency={formatCurrency} />
              <ModernRecentTransactionsWidget
                onViewAll={() => navigate('/transactions')}
                maxItems={isMobile ? 6 : 8}
                preloadedTransactions={dashboardData.recentTransactions}
                preloadedLoading={isRefetching}
              />
            </div>

            <aside className="space-y-4 lg:space-y-6 xl:col-span-1">
              <SpendingBreakdown
                categoryBreakdown={dashboardData.categoryBreakdown}
                formatCurrency={formatCurrency}
                t={t}
                periodLabel={calendarPeriodLabel}
              />
              <BankCosts bankCosts={dashboardData.bankCosts} formatCurrency={formatCurrency} t={t} periodLabel={calendarPeriodLabel} />
            </aside>
          </div>
        </main>
      </div>

      <FloatingAddTransactionButton />
    </>
  );
}
