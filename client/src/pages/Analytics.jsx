/**
 * Analytics Page — rebuilt from scratch
 * Translation fix: useTranslation() with NO module + full 'module.key' keys
 * + { fallback: '...' } object format to avoid the tSync string-spread bug.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Wallet, Target, PieChart as PieIcon,
  Activity, RefreshCw, AlertCircle, BarChart3, DollarSign,
} from 'lucide-react';

import { useTranslation, useCurrency } from '../stores';
import { analyticsAPI } from '../api/analytics';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { getIconComponent } from '../config/categoryIcons';
import { LoadingSpinner } from '../components/ui';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton';
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';

// ─── Palette ──────────────────────────────────────────────────────────────────

const COLOR = {
  income:   '#10b981',
  expenses: '#ef4444',
  cats: ['#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'],
};

const PERIODS = [
  { label: '7D',  days: 7,   months: 1  },
  { label: '1M',  days: 30,  months: 1  },
  { label: '3M',  days: 90,  months: 3  },
  { label: '1Y',  days: 365, months: 12 },
];

// ─── Data hook ────────────────────────────────────────────────────────────────

function useAnalyticsData(period) {
  const summary = useQuery({
    queryKey: ['analytics-summary', period.days],
    queryFn: async () => {
      const r = await analyticsAPI.getDashboardSummary({ period: period.days });
      if (!r.success) throw new Error(r.error?.message || 'Failed');
      return r.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const trends = useQuery({
    queryKey: ['analytics-user', period.months],
    queryFn: async () => {
      const r = await analyticsAPI.getUserAnalytics({ months: period.months });
      if (!r.success) throw new Error(r.error?.message || 'Failed');
      return r.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    summary:   summary.data,
    trends:    trends.data,
    isLoading: summary.isLoading || trends.isLoading,
    isError:   summary.isError   || trends.isError,
    error:     summary.error     || trends.error,
    refetch:   () => { summary.refetch(); trends.refetch(); },
  };
}

// ─── Period tabs ──────────────────────────────────────────────────────────────

function PeriodTabs({ period, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {PERIODS.map(p => (
        <button
          key={p.label}
          onClick={() => onChange(p)}
          className={cn(
            'flex-1 py-1.5 px-3 text-sm font-semibold rounded-lg transition-all',
            period.label === p.label
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ summary, formatCurrency, t }) {
  const income      = summary?.monthlyStats?.income   || 0;
  const expenses    = summary?.monthlyStats?.expenses || 0;
  const net         = summary?.monthlyStats?.net      ?? (income - Math.abs(expenses));
  const savingsRate = summary?.summary?.savingsRate   || 0;

  const cards = [
    {
      label: t('stats.income',      { fallback: 'Income' }),
      value: formatCurrency(income),
      icon:  ArrowUpRight,
      color: 'green',
    },
    {
      label: t('stats.expenses',    { fallback: 'Expenses' }),
      value: formatCurrency(Math.abs(expenses)),
      icon:  ArrowDownRight,
      color: 'red',
    },
    {
      label: t('stats.net',         { fallback: 'Net Balance' }),
      value: formatCurrency(Math.abs(net)),
      icon:  Wallet,
      color: net >= 0 ? 'green' : 'red',
    },
    {
      label: t('stats.savingsRate', { fallback: 'Savings Rate' }),
      value: `${Math.round(savingsRate)}%`,
      icon:  Target,
      color: savingsRate >= 20 ? 'green' : savingsRate >= 10 ? 'yellow' : 'red',
    },
  ];

  const palette = {
    green:  'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400',
    red:    'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', palette[color])}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, formatCurrency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl p-3 text-sm min-w-[140px]">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-gray-500 dark:text-gray-400 capitalize flex-1">{entry.name}</span>
          <span className="font-bold text-gray-900 dark:text-white tabular-nums">
            {formatCurrency(Math.abs(entry.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Trends chart ─────────────────────────────────────────────────────────────

function TrendsChart({ trends, formatCurrency, t }) {
  const data = useMemo(() => {
    const raw = trends?.trends
      || trends?.rawAnalytics?.spending_patterns?.monthly_trends
      || [];
    return raw.slice(-12).map(d => ({
      month:    new Date(d.month + '-01').toLocaleDateString(undefined, { month: 'short' }),
      income:   Math.abs(Number(d.income)   || 0),
      expenses: Math.abs(Number(d.expenses) || 0),
    }));
  }, [trends]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-44 text-gray-400 dark:text-gray-500 text-sm">
        {t('analytics.noTrendsData', { fallback: 'No trend data for this period' })}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={COLOR.income}   stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLOR.income}   stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={COLOR.expenses} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLOR.expenses} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-gray-100 dark:text-gray-800"
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-400 dark:text-gray-500"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'currentColor' }}
          className="text-gray-400 dark:text-gray-500"
          tickLine={false}
          axisLine={false}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          width={36}
        />
        <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} />} />
        <Area
          type="monotone"
          dataKey="income"
          name={t('stats.income', { fallback: 'Income' })}
          stroke={COLOR.income}
          fill="url(#gInc)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          name={t('stats.expenses', { fallback: 'Expenses' })}
          stroke={COLOR.expenses}
          fill="url(#gExp)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Chart legend ─────────────────────────────────────────────────────────────

function ChartLegend({ t }) {
  return (
    <div className="flex items-center gap-5 pt-2">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: COLOR.income }} />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t('stats.income', { fallback: 'Income' })}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: COLOR.expenses }} />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t('stats.expenses', { fallback: 'Expenses' })}
        </span>
      </div>
    </div>
  );
}

// ─── Category breakdown ───────────────────────────────────────────────────────

function CategoryChart({ trends, formatCurrency, t }) {
  const data = useMemo(() => {
    const cats = trends?.categories
      || trends?.rawAnalytics?.spending_patterns?.top_expense_categories
      || [];
    return cats.slice(0, 7).map((c, i) => ({
      name:   c.category || c.name || 'Other',
      amount: Math.abs(Number(c.amount) || 0),
      color:  COLOR.cats[i % COLOR.cats.length],
    }));
  }, [trends]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-36 text-gray-400 dark:text-gray-500 text-sm">
        {t('analytics.noCategoryData', { fallback: 'No category data' })}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={data.length * 34 + 20}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="currentColor"
          className="text-gray-100 dark:text-gray-800"
        />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: 'currentColor' }}
          className="text-gray-400 dark:text-gray-500"
          tickLine={false}
          axisLine={false}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fill: 'currentColor' }}
          className="text-gray-400 dark:text-gray-500"
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} />} />
        <Bar
          dataKey="amount"
          name={t('stats.amount', { fallback: 'Amount' })}
          radius={[0, 6, 6, 0]}
        >
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Health score ring ────────────────────────────────────────────────────────

function HealthRing({ score }) {
  const stroke = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  const circ   = 2 * Math.PI * 30;
  const dash   = (score / 100) * circ;

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r="30" fill="none" stroke="currentColor"
          className="text-gray-100 dark:text-gray-700" strokeWidth="5" />
        <circle cx="34" cy="34" r="30" fill="none" stroke={stroke}
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900 dark:text-white">{score}</span>
      </div>
    </div>
  );
}

function HealthScore({ summary, t }) {
  const rate  = summary?.summary?.savingsRate || 0;
  const score = Math.min(100, Math.max(0, Math.round(rate * 1.2)));

  const { levelKey, color } = score >= 80
    ? { levelKey: 'health.excellent', color: 'text-emerald-600 dark:text-emerald-400' }
    : score >= 60
    ? { levelKey: 'health.good',      color: 'text-blue-600 dark:text-blue-400' }
    : score >= 40
    ? { levelKey: 'health.fair',      color: 'text-amber-600 dark:text-amber-400' }
    : { levelKey: 'health.poor',      color: 'text-red-600 dark:text-red-400' };

  const levelFallbacks = {
    'health.excellent': 'Excellent',
    'health.good':      'Good',
    'health.fair':      'Fair',
    'health.poor':      'Needs Work',
  };

  return (
    <div className="flex items-center gap-5">
      <HealthRing score={score} />
      <div>
        <p className={cn('text-xl font-bold', color)}>
          {t(levelKey, { fallback: levelFallbacks[levelKey] })}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t('health.financialHealth', { fallback: 'Financial Health' })}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {t('health.savingsRate', { fallback: 'Savings Rate' })}: {Math.round(rate)}%
        </p>
      </div>
    </div>
  );
}

// ─── Recent transactions ──────────────────────────────────────────────────────

function RecentList({ summary, formatCurrency, t }) {
  const txns = summary?.recentTransactions?.slice(0, 5) || [];
  if (!txns.length) return null;

  return (
    <div className="space-y-2">
      {txns.map((tx, i) => {
        const isIncome = tx.type === 'income' || Number(tx.amount) > 0;
        let Icon = DollarSign;
        try { Icon = getIconComponent(tx.category_icon || 'Receipt') || DollarSign; } catch {}
        return (
          <div
            key={tx.id || i}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
          >
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
              isIncome
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-100    dark:bg-red-900/40    text-red-700    dark:text-red-400',
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {tx.description || t('transactions.noDescription', { fallback: 'No description' })}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {tx.category_name || t('categories.uncategorized', { fallback: 'Uncategorized' })}
              </p>
            </div>
            <span className={cn(
              'text-sm font-bold tabular-nums whitespace-nowrap',
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
            )}>
              {isIncome ? '+' : '-'}{formatCurrency(Math.abs(Number(tx.amount)))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({ icon: Icon, iconBg, title, subtitle, action, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700/60 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm', iconBg)}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileAnalytics({ period, setPeriod, summary, trends, formatCurrency, t, navigate, refetch, refreshing, setRefreshing }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">
                {t('analytics.title', { fallback: 'Analytics' })}
              </h1>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {t('analytics.subtitle', { fallback: 'Financial insights & trends' })}
              </p>
            </div>
          </div>
          <button
            onClick={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4 text-gray-500', refreshing && 'animate-spin')} />
          </button>
        </div>
        <PeriodTabs period={period} onChange={setPeriod} />
      </div>

      <div className="px-4 py-4 space-y-4">
        <SummaryCards summary={summary} formatCurrency={formatCurrency} t={t} />

        <SectionCard
          icon={Target}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          title={t('health.financialHealth', { fallback: 'Financial Health' })}
          subtitle={t('health.yourScore', { fallback: 'Your Score' })}
        >
          <HealthScore summary={summary} t={t} />
        </SectionCard>

        <SectionCard
          icon={TrendingUp}
          iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
          title={t('analytics.monthlyTrends', { fallback: 'Monthly Trends' })}
          subtitle={t('analytics.incomeVsExpenses', { fallback: 'Income vs Expenses' })}
        >
          <TrendsChart trends={trends} formatCurrency={formatCurrency} t={t} />
          <ChartLegend t={t} />
        </SectionCard>

        <SectionCard
          icon={PieIcon}
          iconBg="bg-gradient-to-br from-purple-500 to-violet-600"
          title={t('analytics.topCategories', { fallback: 'Top Categories' })}
          subtitle={t('analytics.topCategoriesDesc', { fallback: 'Where your money goes' })}
        >
          <CategoryChart trends={trends} formatCurrency={formatCurrency} t={t} />
        </SectionCard>

        {summary?.recentTransactions?.length > 0 && (
          <SectionCard
            icon={Activity}
            iconBg="bg-gradient-to-br from-emerald-500 to-green-600"
            title={t('analytics.recentTransactions', { fallback: 'Recent Transactions' })}
            subtitle={t('analytics.lastActivity', { fallback: 'Latest activity' })}
            action={
              <button
                onClick={() => navigate('/transactions')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('actions.viewAll', { fallback: 'View all' })}
              </button>
            }
          >
            <RecentList summary={summary} formatCurrency={formatCurrency} t={t} />
          </SectionCard>
        )}
      </div>
    </div>
  );
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopAnalytics({ period, setPeriod, summary, trends, formatCurrency, t, navigate, refetch, refreshing, setRefreshing }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('analytics.title', { fallback: 'Analytics' })}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('analytics.subtitle', { fallback: 'Financial insights & trends' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PeriodTabs period={period} onChange={setPeriod} />
              <button
                onClick={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                {t('analytics.refresh', { fallback: 'Refresh' })}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        <SummaryCards summary={summary} formatCurrency={formatCurrency} t={t} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('analytics.monthlyTrends', { fallback: 'Monthly Trends' })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('analytics.trendsSubtitle', { fallback: 'Track your financial flow over time' })}
                  </p>
                </div>
              </div>
              <TrendsChart trends={trends} formatCurrency={formatCurrency} t={t} />
              <ChartLegend t={t} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {t('analytics.recentTransactions', { fallback: 'Recent Transactions' })}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('analytics.lastActivity', { fallback: 'Latest activity' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('actions.viewAll', { fallback: 'View all' })} →
                </button>
              </div>
              <RecentList summary={summary} formatCurrency={formatCurrency} t={t} />
            </div>
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('health.financialHealth', { fallback: 'Financial Health' })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('health.yourScore', { fallback: 'Your Score' })}
                  </p>
                </div>
              </div>
              <HealthScore summary={summary} t={t} />
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary?.summary?.totalTransactions || 0}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {t('stats.transactions', { fallback: 'Transactions' })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary?.summary?.categoriesUsed || 0}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {t('stats.categories', { fallback: 'Categories' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                  <PieIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('analytics.topCategories', { fallback: 'Top Categories' })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('analytics.topCategoriesDesc', { fallback: 'Where your money goes' })}
                  </p>
                </div>
              </div>
              <CategoryChart trends={trends} formatCurrency={formatCurrency} t={t} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Analytics() {
  // useTranslation() with NO module — keys use full 'module.key' with { fallback }
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [period,     setPeriod]     = useState(PERIODS[1]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

  const { summary, trends, isLoading, isError, error, refetch } = useAnalyticsData(period);

  const shared = { period, setPeriod, summary, trends, formatCurrency, t, navigate, refetch, refreshing, setRefreshing };

  if (isLoading && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {t('analytics.loading', { fallback: 'Loading analytics...' })}
          </p>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('analytics.errorTitle', { fallback: 'Failed to load analytics' })}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error?.message}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {t('common.retry', { fallback: 'Retry' })}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMobile
        ? <MobileAnalytics {...shared} />
        : <DesktopAnalytics {...shared} />
      }
      <AddTransactionModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => { setShowAdd(false); refetch(); }}
      />
      <FloatingAddTransactionButton onClick={() => setShowAdd(true)} />
    </>
  );
}
