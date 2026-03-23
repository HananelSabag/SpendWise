/**
 * 📊 ANALYTICS PAGE — Full rebuild
 * Real data from API, modern charts (Recharts), mobile/desktop split
 * Dark mode, period selector, no mocking
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  PieChart, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight,
  Target, Wallet, BarChart3
} from 'lucide-react';

import { useTranslation, useCurrency } from '../stores';
import { analyticsAPI } from '../api/analytics';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn, dateHelpers } from '../utils/helpers';
import { getIconComponent } from '../config/categoryIcons';
import { Button, LoadingSpinner } from '../components/ui';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton';
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: '7D',  days: 7,   months: 1  },
  { label: '1M',  days: 30,  months: 1  },
  { label: '3M',  days: 90,  months: 3  },
  { label: '1Y',  days: 365, months: 12 },
];

const C = {
  income:   '#10b981',
  expenses: '#ef4444',
  savings:  '#3b82f6',
  cats: ['#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'],
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

const useAnalyticsData = (period) => {
  const summary = useQuery({
    queryKey: ['analytics-summary', period.days],
    queryFn: async () => {
      const r = await analyticsAPI.dashboard.getSummary(period.days);
      if (!r.success) throw new Error(r.error?.message || 'Failed to load summary');
      return r.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const trends = useQuery({
    queryKey: ['analytics-user', period.months],
    queryFn: async () => {
      const r = await analyticsAPI.getUserAnalytics({ months: period.months });
      if (!r.success) throw new Error(r.error?.message || 'Failed to load trends');
      return r.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    summary:    summary.data,
    trends:     trends.data,
    isLoading:  summary.isLoading || trends.isLoading,
    isError:    summary.isError   || trends.isError,
    error:      summary.error     || trends.error,
    refetch:    () => { summary.refetch(); trends.refetch(); },
  };
};

// ── Sub-components ────────────────────────────────────────────────────────────

const PeriodTabs = ({ period, onChange }) => (
  <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
    {PERIODS.map(p => (
      <button
        key={p.label}
        onClick={() => onChange(p)}
        className={cn(
          'flex-1 py-1.5 px-3 text-sm font-medium rounded-lg transition-all',
          period.label === p.label
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        )}
      >
        {p.label}
      </button>
    ))}
  </div>
);

const SummaryCards = ({ summary, formatCurrency, t }) => {
  const income   = summary?.monthlyStats?.income   || 0;
  const expenses = summary?.monthlyStats?.expenses  || 0;
  const net      = summary?.monthlyStats?.net       ?? (income - Math.abs(expenses));
  const savingsRate = summary?.summary?.savingsRate || 0;

  const cards = [
    { label: t('stats.income',      'Income'),       value: formatCurrency(income),           icon: ArrowUpRight,   color: 'green' },
    { label: t('stats.expenses',    'Expenses'),      value: formatCurrency(Math.abs(expenses)),icon: ArrowDownRight, color: 'red'   },
    { label: t('stats.net',         'Net Balance'),   value: formatCurrency(Math.abs(net)),    icon: Wallet,         color: net >= 0 ? 'green' : 'red' },
    { label: t('stats.savingsRate', 'Savings Rate'), value: `${Math.round(savingsRate)}%`,    icon: Target,         color: savingsRate >= 20 ? 'green' : savingsRate >= 10 ? 'yellow' : 'red' },
  ];

  const colorMap = {
    green:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    red:    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', colorMap[color])}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
};

// Custom tooltip for charts
const ChartTooltip = ({ active, payload, label, formatCurrency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-600 dark:text-gray-400 capitalize">{entry.name}:</span>
          <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(Math.abs(entry.value))}</span>
        </div>
      ))}
    </div>
  );
};

const TrendsChart = ({ trends, formatCurrency, t }) => {
  const data = useMemo(() => {
    const raw = trends?.trends
      || trends?.rawAnalytics?.spending_patterns?.monthly_trends
      || [];
    return raw.slice(-12).map(d => ({
      month: new Date(d.month).toLocaleDateString(undefined, { month: 'short' }),
      income:   Math.abs(Number(d.income)   || 0),
      expenses: Math.abs(Number(d.expenses) || 0),
      savings:  Math.abs(Number(d.savings)  || 0),
    }));
  }, [trends]);

  if (!data.length) return (
    <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-sm">
      {t('analytics.noTrendsData', 'No trend data for this period')}
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gIncome"   x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.income}   stopOpacity={0.3} />
            <stop offset="95%" stopColor={C.income}   stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.expenses} stopOpacity={0.3} />
            <stop offset="95%" stopColor={C.expenses} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} t={t} />} />
        <Area type="monotone" dataKey="income"   name={t('stats.income','Income')}   stroke={C.income}   fill="url(#gIncome)"   strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="expenses" name={t('stats.expenses','Expenses')} stroke={C.expenses} fill="url(#gExpenses)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const CategoryChart = ({ trends, summary, formatCurrency, t }) => {
  const data = useMemo(() => {
    const cats = trends?.categories
      || trends?.rawAnalytics?.spending_patterns?.top_expense_categories
      || [];
    return cats.slice(0, 7).map((c, i) => ({
      name:   c.category || c.name || 'Other',
      amount: Math.abs(Number(c.amount) || 0),
      count:  c.count || 0,
      color:  C.cats[i % C.cats.length],
    }));
  }, [trends]);

  if (!data.length) return (
    <div className="flex items-center justify-center h-36 text-gray-400 dark:text-gray-500 text-sm">
      {t('analytics.noCategoryData', 'No category data')}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-gray-100 dark:text-gray-800" />
          <XAxis type="number" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" tickLine={false} axisLine={false} width={70} />
          <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} t={t} />} />
          <Bar dataKey="amount" name={t('stats.amount','Amount')} radius={[0, 6, 6, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const HealthScore = ({ summary, t }) => {
  const rate = summary?.summary?.savingsRate || 0;
  const score = Math.min(100, Math.max(0, Math.round(rate * 1.2)));
  const { level, color, bg } = score >= 80
    ? { level: t('health.excellent','Excellent'), color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500' }
    : score >= 60
    ? { level: t('health.good','Good'),           color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-500' }
    : score >= 40
    ? { level: t('health.fair','Fair'),           color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500' }
    : { level: t('health.poor','Needs Work'),     color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-500' };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${score} ${100 - score}`}
            strokeDashoffset="0"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900 dark:text-white">{score}</span>
        </div>
      </div>
      <div>
        <p className={cn('text-lg font-bold', color)}>{level}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('health.financialHealth','Financial Health Score')}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('health.savingsRate','Savings rate')}: {Math.round(rate)}%</p>
      </div>
    </div>
  );
};

const RecentList = ({ summary, formatCurrency, t }) => {
  const txns = summary?.recentTransactions?.slice(0, 5) || [];
  if (!txns.length) return null;

  return (
    <div className="space-y-2">
      {txns.map((tx, i) => {
        const isIncome = tx.type === 'income' || Number(tx.amount) > 0;
        const Icon = (() => { try { return getIconComponent(tx.category_icon || 'Receipt'); } catch { return null; } })();
        return (
          <div key={tx.id || i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm',
              isIncome ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400')}>
              {Icon ? <Icon className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.description || t('transactions.noDescription','No description')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{tx.category_name || t('categories.uncategorized','Uncategorized')}</p>
            </div>
            <span className={cn('text-sm font-bold tabular-nums whitespace-nowrap',
              isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {isIncome ? '+' : '−'}{formatCurrency(Math.abs(Number(tx.amount)))}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Layouts ───────────────────────────────────────────────────────────────────

const MobileAnalytics = ({ period, setPeriod, summary, trends, formatCurrency, t, navigate, refetch, isRefreshing, setIsRefreshing }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
    {/* Sticky header */}
    <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('analytics.title','Analytics')}</h1>
        <button onClick={async () => { setIsRefreshing(true); await refetch(); setIsRefreshing(false); }}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <RefreshCw className={cn('w-4 h-4 text-gray-500', isRefreshing && 'animate-spin')} />
        </button>
      </div>
      <PeriodTabs period={period} onChange={setPeriod} />
    </div>

    <div className="px-4 py-4 space-y-4">
      {/* Summary cards */}
      <SummaryCards summary={summary} formatCurrency={formatCurrency} t={t} />

      {/* Health score */}
      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <HealthScore summary={summary} t={t} />
        </div>
      )}

      {/* Monthly trends chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          {t('analytics.monthlyTrends','Monthly Trends')}
        </h3>
        <TrendsChart trends={trends} formatCurrency={formatCurrency} t={t} />
      </div>

      {/* Category breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-purple-500" />
          {t('analytics.topCategories','Top Spending Categories')}
        </h3>
        <CategoryChart trends={trends} summary={summary} formatCurrency={formatCurrency} t={t} />
      </div>

      {/* Recent transactions */}
      {summary?.recentTransactions?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('analytics.recentTransactions','Recent Transactions')}</h3>
            <button onClick={() => navigate('/transactions')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              {t('actions.viewAll','View all')}
            </button>
          </div>
          <RecentList summary={summary} formatCurrency={formatCurrency} t={t} />
        </div>
      )}
    </div>
  </div>
);

const DesktopAnalytics = ({ period, setPeriod, summary, trends, formatCurrency, t, navigate, refetch, isRefreshing, setIsRefreshing }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
    {/* Header */}
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('analytics.title','Analytics')}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('analytics.subtitle','Financial insights & trends')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PeriodTabs period={period} onChange={setPeriod} />
            <button onClick={async () => { setIsRefreshing(true); await refetch(); setIsRefreshing(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              {t('actions.refresh','Refresh')}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
      {/* Summary cards row */}
      <SummaryCards summary={summary} formatCurrency={formatCurrency} t={t} />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left — Trends chart (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Monthly trends */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              {t('analytics.monthlyTrends','Monthly Income vs Expenses')}
            </h3>
            <TrendsChart trends={trends} formatCurrency={formatCurrency} t={t} />
            {/* Legend */}
            <div className="flex items-center gap-6 mt-3 pl-2">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded-full" style={{ background: C.income }} /><span className="text-xs text-gray-500 dark:text-gray-400">{t('stats.income','Income')}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded-full" style={{ background: C.expenses }} /><span className="text-xs text-gray-500 dark:text-gray-400">{t('stats.expenses','Expenses')}</span></div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('analytics.recentTransactions','Recent Transactions')}</h3>
              <button onClick={() => navigate('/transactions')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                {t('actions.viewAll','View all')} →
              </button>
            </div>
            <RecentList summary={summary} formatCurrency={formatCurrency} t={t} />
          </div>
        </div>

        {/* Right — Category & Health (1/3 width) */}
        <div className="space-y-6">
          {/* Financial health */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              {t('health.financialHealth','Financial Health')}
            </h3>
            <HealthScore summary={summary} t={t} />
            {/* Extra stats */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{summary?.summary?.totalTransactions || 0}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('stats.transactions','Transactions')}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{summary?.summary?.categoriesUsed || 0}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('stats.categories','Categories')}</p>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              {t('analytics.topCategories','Top Categories')}
            </h3>
            <CategoryChart trends={trends} summary={summary} formatCurrency={formatCurrency} t={t} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const Analytics = () => {
  const { t } = useTranslation('analytics');
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [period, setPeriod]           = useState(PERIODS[1]); // 1M default
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdd, setShowAdd]         = useState(false);

  const { summary, trends, isLoading, isError, error, refetch } = useAnalyticsData(period);

  const sharedProps = { period, setPeriod, summary, trends, formatCurrency, t, navigate, refetch, isRefreshing, setIsRefreshing };

  if (isLoading && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t('analytics.loading','Loading analytics...')}</p>
        </div>
      </div>
    );
  }

  if (isError && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('analytics.errorTitle','Failed to load analytics')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error?.message}</p>
          <Button onClick={refetch} size="sm">{t('actions.retry','Retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMobile ? <MobileAnalytics {...sharedProps} /> : <DesktopAnalytics {...sharedProps} />}
      <AddTransactionModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); refetch(); }} />
      <FloatingAddTransactionButton onClick={() => setShowAdd(true)} />
    </>
  );
};

export default Analytics;
