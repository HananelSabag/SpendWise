/**
 * ModernDashboard — one responsive financial home. Every card consumes the
 * same dashboard payload and selected billing-cycle window.
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, BarChart3, ArrowRight } from 'lucide-react';

import { useTranslation, useAuth, useCurrency, useNotifications } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { PageSkeleton } from '../components/ui';

import BrandMark from '../components/common/BrandMark';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton.jsx';
import ModernBalancePanel from '../components/features/dashboard/ModernBalancePanel';
import ModernRecentTransactionsWidget from '../components/features/dashboard/ModernRecentTransactionsWidget';
import PeriodSummary from '../components/features/dashboard/PeriodSummary';
import SourcesOverview from '../components/features/dashboard/SourcesOverview';
import BankCosts from '../components/features/dashboard/BankCosts';
import SpendingBreakdown from '../components/features/dashboard/SpendingBreakdown';
import GreetingHeader from '../components/features/dashboard/GreetingHeader';
import DashboardError from '../components/features/dashboard/DashboardError';
import ManualEntryLink from '../components/features/dashboard/ManualEntryLink';
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

          <button
            type="button"
            onClick={() => navigate('/insights')}
            className="flex w-full items-center gap-3 rounded-2xl border border-indigo-100 bg-white/80 p-3 text-start shadow-sm transition hover:border-indigo-300 dark:border-indigo-900/50 dark:bg-gray-900/80"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
              <BarChart3 className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-gray-900 dark:text-white">{currentLanguage === 'he' ? 'כל המחזורים והתובנות' : 'All cycles and insights'}</span>
              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{currentLanguage === 'he' ? 'קטגוריות, עסקאות חוזרות וניווט לתקופות קודמות' : 'Categories, recurring patterns and previous periods'}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-indigo-500 rtl:rotate-180" />
          </button>

          <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
            <div className="space-y-4 lg:space-y-6 xl:col-span-2">
              <PeriodSummary
                dashboardData={dashboardData}
                formatCurrency={formatCurrency}
                t={t}
              />
              <ModernRecentTransactionsWidget
                onViewAll={() => navigate('/transactions')}
                maxItems={isMobile ? 6 : 8}
                preloadedTransactions={dashboardData.recentTransactions}
                preloadedLoading={isRefetching}
              />
              <ManualEntryLink t={t} />
            </div>

            <aside className="space-y-4 lg:space-y-6 xl:col-span-1">
              <SourcesOverview
                sources={dashboardData.sources}
                formatCurrency={formatCurrency}
                t={t}
                lang={currentLanguage}
                navigate={navigate}
              />
              <BankCosts bankCosts={dashboardData.bankCosts} formatCurrency={formatCurrency} t={t} />
              <SpendingBreakdown
                categoryBreakdown={dashboardData.categoryBreakdown}
                formatCurrency={formatCurrency}
                t={t}
              />
            </aside>
          </div>
        </main>
      </div>

      <FloatingAddTransactionButton />
    </>
  );
}
