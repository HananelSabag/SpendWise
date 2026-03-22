/**
 * ModernDashboard — main dashboard page.
 * Uses useIsMobile() to render separate mobile and desktop layouts.
 * All data hooks are shared; only layout differs.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RefreshCw, TrendingUp, Activity, Target, Crown,
  Plus, ArrowUpRight, ArrowDownRight, BarChart3,
} from 'lucide-react';

import { useTranslation, useAuth, useCurrency, useNotifications } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { Card, Button } from '../components/ui';

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
        Add Expense
      </button>
      <button
        onClick={() => handleAdd('income')}
        className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 font-semibold text-sm active:scale-95 transition-transform"
      >
        <ArrowUpRight className="w-4 h-4" />
        Add Income
      </button>
    </div>
  );
};

// ─── Auto-retry error state ───────────────────────────────────────────────────

const DashboardError = ({ onRetry, t }) => {
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (countdown <= 0) { onRetry(); return; }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, onRetry]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center p-8 max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-7 h-7 text-red-500 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t('dashboardError')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('dashboardErrorMessage')}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Retrying in {countdown}s…
        </p>
        <Button onClick={onRetry} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
          {t('reloadPage')}
        </Button>
      </div>
    </div>
  );
};

// ─── Mobile layout ────────────────────────────────────────────────────────────

const MobileDashboard = ({ greeting, dashboardData, handleRefresh, isRefreshing, t, navigate }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
    {/* Greeting bar */}
    <div className="bg-white dark:bg-gray-900 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            {greeting}
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4 text-gray-500', isRefreshing && 'animate-spin')} />
        </button>
      </div>
    </div>

    <div className="px-4 py-4 space-y-4">
      {/* Balance */}
      <ModernBalancePanel />

      {/* Quick add */}
      <MobileQuickAdd />

      {/* Recent transactions */}
      <ModernRecentTransactionsWidget
        onViewAll={() => navigate('/transactions')}
        maxItems={6}
      />
    </div>
  </div>
);

// ─── Desktop layout ───────────────────────────────────────────────────────────

const DesktopDashboard = ({
  greeting, dashboardData, handleRefresh, isRefreshing,
  formatCurrency, t, navigate,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
    {/* Page header */}
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{greeting}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
      {/* Balance panel */}
      <ModernBalancePanel />

      {/* Stats row */}
      {dashboardData && (
        <StatsRow dashboardData={dashboardData} formatCurrency={formatCurrency} t={t} />
      )}

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent transactions — takes 2/3 */}
        <div className="xl:col-span-2">
          <ModernRecentTransactionsWidget
            onViewAll={() => navigate('/transactions')}
            maxItems={8}
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

  // Listen for add transaction event (from bottom nav FAB)
  useEffect(() => {
    const onAdd = () => setShowAddTransaction(true);
    window.addEventListener('transaction:add', onAdd);
    return () => window.removeEventListener('transaction:add', onAdd);
  }, []);

  // ── Loading ──
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 mx-auto mb-4"
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
          </motion.div>
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
    dashboardData,
    handleRefresh,
    isRefreshing,
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
