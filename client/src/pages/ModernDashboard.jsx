/**
 * ModernDashboard — main dashboard page.
 * Uses useIsMobile() to render separate mobile and desktop layouts.
 * All data hooks are shared; only layout differs.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, TrendingUp, Activity, Target, Crown,
  Plus, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

import { useTranslation, useAuth, useCurrency, useNotifications } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { Card, Button, Avatar } from '../components/ui';

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

// ─── Stats row ────────────────────────────────────────────────────────────────

const StatsRow = ({ dashboardData, formatCurrency, t }) => {
  const items = useMemo(() => {
    const txCount = dashboardData?.monthlyStats?.transactionCount || 0;
    const income  = dashboardData?.monthlyStats?.income || 0;
    const expenses = dashboardData?.monthlyStats?.expenses || 0;
    const net     = dashboardData?.monthlyStats?.net || (income - Math.abs(expenses));
    const avg     = txCount > 0 ? (Math.abs(expenses) + income) / txCount : 0;
    const topCat  = dashboardData?.topCategory?.name || '—';

    return [
      { label: t('stats.totalTransactions'), value: txCount || '—', icon: Activity, color: 'blue' },
      { label: t('stats.avgTransaction'),    value: avg > 0 ? formatCurrency(avg) : '—', icon: Target,   color: 'green' },
      { label: t('stats.topCategory'),       value: topCat,                              icon: Crown,    color: 'purple' },
      {
        label: t('stats.monthlyBalance'),
        value: net !== 0 ? formatCurrency(Math.abs(net)) : '—',
        icon: TrendingUp,
        color: net >= 0 ? 'green' : 'red',
      },
    ];
  }, [dashboardData, formatCurrency, t]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
            color === 'blue'   && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            color === 'green'  && 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
            color === 'red'    && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-white truncate">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Quick add row (mobile) ───────────────────────────────────────────────────

const MobileQuickAdd = () => {
  const { t } = useTranslation('transactions');
  const handleAdd = useCallback((type) => {
    try { window.dispatchEvent(new CustomEvent('transaction:add', { detail: { type } })); } catch (_) {}
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => handleAdd('expense')}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold text-sm active:scale-95 transition-transform"
      >
        <ArrowDownRight className="w-4 h-4" />
        {t('addExpense', 'Add Expense')}
      </button>
      <button
        onClick={() => handleAdd('income')}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 font-semibold text-sm active:scale-95 transition-transform"
      >
        <ArrowUpRight className="w-4 h-4" />
        {t('addIncome', 'Add Income')}
      </button>
    </div>
  );
};

// ─── Auto-retry error state ───────────────────────────────────────────────────
// Cap auto-retries at MAX_AUTO_RETRIES. Previously this retried every 8s
// FOREVER, which on Render free-tier means hammering a sleeping/dead server
// from every open tab — and burning the user's bandwidth + battery — for as
// long as the page was open. After the cap we stop and require a manual click,
// which also stops parallel tabs from DDOSing the server.

const MAX_AUTO_RETRIES = 3;

const DashboardError = ({ onRetry, t }) => {
  const [countdown, setCountdown] = useState(8);
  const [attempt, setAttempt] = useState(0);
  const exhausted = attempt >= MAX_AUTO_RETRIES;

  useEffect(() => {
    if (exhausted) return;            // stop the timer once we've used our retries
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
      <div className="text-center p-8 max-w-sm">
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
            Auto-retries exhausted. The server isn&apos;t responding — try again manually
            or check status.
          </p>
        )}
        <Button onClick={handleManualRetry} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
          {t('reloadPage')}
        </Button>
      </div>
    </div>
  );
};

// ─── Mobile mini-stats ────────────────────────────────────────────────────────

const MobileMiniStats = ({ dashboardData, formatCurrency, t }) => {
  const txCount = dashboardData?.monthlyStats?.transactionCount || 0;
  const net     = dashboardData?.monthlyStats?.net ||
    ((dashboardData?.monthlyStats?.income || 0) - Math.abs(dashboardData?.monthlyStats?.expenses || 0));

  if (!dashboardData) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('stats.totalTransactions', 'Transactions')}</p>
        <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{txCount || '—'}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <p className="text-[11px] text-gray-400 dark:text-gray-500">{t('stats.monthlyBalance', 'Net this month')}</p>
        <p className={cn(
          'text-base font-bold tabular-nums',
          net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {net !== 0 ? `${net >= 0 ? '+' : ''}${formatCurrency(net)}` : '—'}
        </p>
      </div>
    </div>
  );
};

// ─── Mobile layout ────────────────────────────────────────────────────────────

const MobileDashboard = ({ greeting, user, dashboardData, formatCurrency, t, navigate }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
    {/* Greeting bar */}
    <div className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            {greeting}
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Avatar
          src={user?.avatar || user?.profile_picture_url || user?.picture}
          fallback={user?.firstName?.charAt(0) || user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          className="w-9 h-9 rounded-full border-2 border-gray-100 dark:border-gray-700 shrink-0"
        />
      </div>
    </div>

    <div className="px-4 py-4 space-y-4">
      {/* Balance */}
      <ModernBalancePanel />

      {/* Mini stats */}
      <MobileMiniStats dashboardData={dashboardData} formatCurrency={formatCurrency} t={t} />

      {/* Quick add */}
      <MobileQuickAdd />

      {/* Recent transactions — preload from dashboard data so we don't fire
          a second /transactions API call. The dashboard endpoint already
          returns recent_transactions server-side. */}
      <ModernRecentTransactionsWidget
        onViewAll={() => navigate('/transactions')}
        maxItems={6}
        preloadedTransactions={dashboardData?.recentTransactions}
        preloadedLoading={!dashboardData}
      />
    </div>
  </div>
);

// ─── Desktop layout ───────────────────────────────────────────────────────────

const DesktopDashboard = ({
  greeting, user, dashboardData,
  formatCurrency, t, navigate,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6 pb-0 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <button
        onClick={() => navigate('/profile')}
        title={t('goToProfile') || 'Go to profile'}
        className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Avatar
          src={user?.avatar || user?.profile_picture_url || user?.picture}
          fallback={user?.firstName?.charAt(0) || user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          className="w-11 h-11 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-md hover:opacity-80 transition-opacity"
        />
      </button>
    </div>

    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6">
      {/* Balance panel */}
      <ModernBalancePanel />

      {/* Stats row */}
      {dashboardData && (
        <StatsRow dashboardData={dashboardData} formatCurrency={formatCurrency} t={t} />
      )}

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent transactions — takes 2/3.
            Preload from dashboard data to avoid a redundant API call. */}
        <div className="xl:col-span-2">
          <ModernRecentTransactionsWidget
            onViewAll={() => navigate('/transactions')}
            maxItems={8}
            preloadedTransactions={dashboardData?.recentTransactions}
            preloadedLoading={!dashboardData}
          />
        </div>

        {/* Quick actions — takes 1/3 */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [addTransactionType, setAddTransactionType] = useState('expense');

  const {
    data: dashboardData,
    isLoading,
    isError,
    refresh: refreshDashboard,
  } = useDashboard();

  const greeting = useGreeting(user, t);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshDashboard();
    } catch (_) {
      addNotification({ type: 'error', message: t('refreshError'), duration: 4000 });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshDashboard, addNotification, t]);

  // NOTE: 'transaction:add' on mobile is handled globally by UnifiedTransactionActions.
  // Desktop FAB below uses a direct onClick so onSuccess → dashboard-refresh-requested fires.

  // ── Loading ──
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <p className="text-base font-medium text-gray-500 dark:text-gray-400">
            {t('loadingDashboard')}
          </p>
        </div>
      </div>
    );
  }

  // ── Error with auto-retry ──
  if (isError && !dashboardData) {
    return <DashboardError onRetry={handleRefresh} t={t} />;
  }

  const sharedProps = {
    greeting,
    user,
    dashboardData,
    formatCurrency,
    t,
    navigate,
  };

  return (
    <>
      {isMobile
        ? <MobileDashboard {...sharedProps} />
        : <DesktopDashboard {...sharedProps} />
      }

      <AddTransactionModal
        isOpen={showAddTransaction}
        defaultType={addTransactionType}
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
