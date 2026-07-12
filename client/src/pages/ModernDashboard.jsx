/**
 * ModernDashboard — one responsive financial home. Every card consumes the
 * same dashboard payload and selected calendar-month window.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

import { useTranslation, useAuth, useCurrency, useNotifications } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useFinancialCycle } from '../hooks/useFinancialCycle';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { PageSkeleton } from '../components/ui';

import BrandMark from '../components/common/BrandMark';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton.jsx';
import ModernBalancePanel from '../components/features/dashboard/ModernBalancePanel';
import ModernRecentTransactionsWidget from '../components/features/dashboard/ModernRecentTransactionsWidget';
import CalendarActivityCard from '../components/features/dashboard/CalendarActivityCard';
import RunwaySnapshot from '../components/features/dashboard/RunwaySnapshot';
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
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [periodOffset, setPeriodOffset] = useState(0);

  const {
    data: dashboardData,
    isLoading,
    isError,
    isRefetching,
    refresh: refreshDashboard,
  } = useDashboard({ periodOffset });
  const { data: financialCycle } = useFinancialCycle();

  const greeting = useGreeting(user, t);
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] lg:gap-6">
            <CalendarActivityCard
              activity={dashboardData.calendarActivity}
              formatCurrency={formatCurrency}
              canPrevious={dashboardData.period?.availableOffsets?.includes(periodOffset - 1)}
              canNext={periodOffset < 0 && dashboardData.period?.availableOffsets?.includes(periodOffset + 1)}
              onPrevious={() => setPeriodOffset((value) => value - 1)}
              onNext={() => setPeriodOffset((value) => Math.min(0, value + 1))}
            />
            <aside>
              <RunwaySnapshot runway={financialCycle} formatCurrency={formatCurrency} onOpen={() => navigate('/financial-cycle')} />
            </aside>
            <div className="lg:col-start-1">
              <ModernRecentTransactionsWidget
                onViewAll={() => navigate('/transactions')}
                maxItems={isMobile ? 6 : 8}
                preloadedTransactions={dashboardData.recentTransactions}
                preloadedLoading={isRefetching}
              />
            </div>
          </div>
        </main>
      </div>

      <FloatingAddTransactionButton />
    </>
  );
}
