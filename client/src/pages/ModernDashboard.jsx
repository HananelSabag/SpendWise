/**
 * ModernDashboard — main dashboard page.
 *
 * Aggressively pruned: greeting, balance, quick add, recent transactions.
 * The old half-empty stat cards (avg '—', top category '—', duplicate
 * income/expense counters) are gone — the balance panel already tells
 * that story with real data.
 *
 * Mobile-first: pull-to-refresh, liquid-glass surfaces, thumb-sized
 * add-income/add-expense actions.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { useTranslation, useAuth, useCurrency, useNotifications } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { Button, Avatar, PageSkeleton } from '../components/ui';

import ModernBalancePanel from '../components/features/dashboard/ModernBalancePanel';
import ModernQuickActionsBar from '../components/features/dashboard/ModernQuickActionsBar';
import ModernRecentTransactionsWidget from '../components/features/dashboard/ModernRecentTransactionsWidget';
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton.jsx';

// ─── Greeting ────────────────────────────────────────────────────────────────

const useGreeting = (user, t) => useMemo(() => {
  const hour = new Date().getHours();
  const name =
    user?.firstName || user?.first_name ||
    user?.name || user?.username ||
    user?.email?.split('@')[0] || '';

  const key =
    hour < 12 ? 'welcome.goodMorning' :
    hour < 17 ? 'welcome.goodAfternoon' :
    hour < 21 ? 'welcome.goodEvening' : 'welcome.general';

  const text = t(key) || 'Hello';
  return text.includes('{{name}}') ? text.replace('{{name}}', name) : `${text}${name ? `, ${name}` : ''}`;
}, [user, t]);

// ─── Pull-to-refresh (mobile) ─────────────────────────────────────────────────
// Native-feeling: drag down from the top of the page → spinner → refresh.
// Threshold 70px, resistance 0.5 so the pull feels weighted.

const usePullToRefresh = (onRefresh, enabled) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e) => {
      if (!pulling.current || refreshing) return;
      const delta = (e.touches[0].clientY - startY.current) * 0.5;
      if (delta > 0 && window.scrollY === 0) {
        setPull(Math.min(delta, 110));
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pull >= 70 && !refreshing) {
        setRefreshing(true);
        setPull(54);
        try { await onRefresh(); } catch (_) {}
        setRefreshing(false);
      }
      setPull(0);
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, pull, refreshing, onRefresh]);

  return { pull, refreshing };
};

// ─── Quick add (income / expense) ─────────────────────────────────────────────

const QuickAdd = ({ t }) => {
  const handleAdd = useCallback((type) => {
    try { window.dispatchEvent(new CustomEvent('transaction:add', { detail: { type } })); } catch (_) {}
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => handleAdd('expense')}
        className="glass-card flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm text-red-600 dark:text-red-400 active:scale-95 transition-transform"
      >
        <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
          <ArrowDownRight className="w-4 h-4 text-white" />
        </span>
        {t('addExpense', 'Add Expense')}
      </button>
      <button
        onClick={() => handleAdd('income')}
        className="glass-card flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-sm text-emerald-600 dark:text-emerald-400 active:scale-95 transition-transform"
      >
        <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <ArrowUpRight className="w-4 h-4 text-white" />
        </span>
        {t('addIncome', 'Add Income')}
      </button>
    </div>
  );
};

// ─── Auto-retry error state ───────────────────────────────────────────────────

const MAX_AUTO_RETRIES = 3;

const DashboardError = ({ onRetry, t }) => {
  const [countdown, setCountdown] = useState(8);
  const [attempt, setAttempt] = useState(0);
  const exhausted = attempt >= MAX_AUTO_RETRIES;

  useEffect(() => {
    if (exhausted) return;
    if (countdown <= 0) {
      setAttempt(a => a + 1);
      setCountdown(8);
      onRetry();
      return;
    }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, onRetry, exhausted]);

  const handleManualRetry = () => {
    setAttempt(0);
    setCountdown(8);
    onRetry();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-card rounded-2xl text-center p-8 max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <RefreshCw className={cn('w-7 h-7 text-red-500', !exhausted && 'animate-spin')} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t('dashboardError')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('dashboardErrorMessage')}
        </p>
        {!exhausted ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {t('retryingIn', { countdown }) || `Retrying in ${countdown}s…`}
            {attempt > 0 && ` (attempt ${attempt + 1} / ${MAX_AUTO_RETRIES})`}
          </p>
        ) : (
          <p className="text-xs text-red-500 dark:text-red-400 mb-4">
            {t('autoRetriesExhausted', 'Auto-retries exhausted — try again manually.')}
          </p>
        )}
        <Button onClick={handleManualRetry} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
          {t('reloadPage')}
        </Button>
      </div>
    </div>
  );
};

// ─── Greeting header (shared) ─────────────────────────────────────────────────

const GreetingHeader = ({ greeting, user, navigate, compact = false }) => (
  <div className={cn('flex items-center justify-between', !compact && 'mb-1')}>
    <div className="min-w-0">
      <h1 className={cn(
        'font-bold text-gray-900 dark:text-white leading-tight truncate',
        compact ? 'text-lg' : 'text-2xl',
      )}>
        {greeting}
      </h1>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
    <button
      onClick={() => navigate('/profile')}
      className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <Avatar
        src={user?.avatar || user?.profile_picture_url || user?.picture}
        fallback={user?.firstName?.charAt(0) || user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
        className={cn(
          'rounded-full ring-2 ring-white/60 dark:ring-gray-700 shadow-sm hover:opacity-80 transition-opacity',
          compact ? 'w-9 h-9' : 'w-11 h-11',
        )}
      />
    </button>
  </div>
);

// ─── Mobile layout ────────────────────────────────────────────────────────────

const MobileDashboard = ({ greeting, user, dashboardData, t, navigate, onRefresh }) => {
  const { pull, refreshing } = usePullToRefresh(onRefresh, true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-gray-50 to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: `${pull}px` }}
      >
        <RefreshCw className={cn(
          'w-5 h-5 text-indigo-500 transition-transform',
          refreshing && 'animate-spin',
          !refreshing && pull >= 70 && 'rotate-180',
        )} />
      </div>

      {/* Glass greeting header */}
      <div className="glass-card sticky top-0 z-20 px-4 py-3 border-x-0 border-t-0 rounded-none">
        <GreetingHeader greeting={greeting} user={user} navigate={navigate} compact />
      </div>

      <div className="px-4 py-4 space-y-4 pb-28">
        <ModernBalancePanel />
        <QuickAdd t={t} />
        <ModernRecentTransactionsWidget
          onViewAll={() => navigate('/transactions')}
          maxItems={6}
          preloadedTransactions={dashboardData?.recentTransactions}
          preloadedLoading={!dashboardData}
        />
      </div>
    </div>
  );
};

// ─── Desktop layout ───────────────────────────────────────────────────────────

const DesktopDashboard = ({ greeting, user, dashboardData, t, navigate }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6">
      <GreetingHeader greeting={greeting} user={user} navigate={navigate} />
    </div>

    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6">
      <ModernBalancePanel />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ModernRecentTransactionsWidget
            onViewAll={() => navigate('/transactions')}
            maxItems={8}
            preloadedTransactions={dashboardData?.recentTransactions}
            preloadedLoading={!dashboardData}
          />
        </div>

        <div className="xl:col-span-1">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100/60 dark:border-gray-700/60">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('quickActions.title')}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t('quickActions.subtitle')}
              </p>
            </div>
            <div className="p-4">
              <ModernQuickActionsBar />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ModernDashboard = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const {
    data: dashboardData,
    isLoading,
    isError,
    refresh: refreshDashboard,
  } = useDashboard();

  const greeting = useGreeting(user, t);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshDashboard();
    } catch (_) {
      addNotification({ type: 'error', message: t('refreshError'), duration: 4000 });
    }
  }, [refreshDashboard, addNotification, t]);

  if (isLoading && !dashboardData) {
    return <PageSkeleton page="dashboard" />;
  }

  if (isError && !dashboardData) {
    return <DashboardError onRetry={handleRefresh} t={t} />;
  }

  const sharedProps = { greeting, user, dashboardData, formatCurrency, t, navigate };

  return (
    <>
      {isMobile
        ? <MobileDashboard {...sharedProps} onRefresh={handleRefresh} />
        : <DesktopDashboard {...sharedProps} />
      }

      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSuccess={() => {
          setShowAddTransaction(false);
          try { window.dispatchEvent(new CustomEvent('dashboard-refresh-requested')); } catch (_) {}
        }}
      />

      <FloatingAddTransactionButton onClick={() => setShowAddTransaction(true)} />
    </>
  );
};

export default ModernDashboard;
