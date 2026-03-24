/**
 * Analytics Page — v3 (full rebuild)
 *
 * Fixes:
 *  1. Data was 0 — double-wrapped API response (r.data?.data)
 *  2. Desktop layout follows ModernDashboard: no extra header block,
 *     global <Header> from App already handles desktop nav.
 *  3. Translations use useTranslation() (no module) + { fallback } objects.
 *  4. Month-over-month change badges on summary cards.
 *  5. Better period labels + richer category chart.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Wallet, Target, PieChart as PieIcon,
  Activity, RefreshCw, AlertCircle, BarChart3, DollarSign,
  Minus,
} from 'lucide-react';

import { useTranslation, useCurrency } from '../stores';
import { analyticsAPI } from '../api/analytics';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { getIconComponent } from '../config/categoryIcons';
import { LoadingSpinner } from '../components/ui';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton';
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR = {
  income:   '#10b981',
  expenses: '#ef4444',
  cats: ['#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'],
};

// Period has a short label (for tabs) and a full label (for display)
const PERIODS = [
  { key: '1M',  label: '1M',  full: 'Month',    days: 31,  months: 1  },
  { key: '3M',  label: '3M',  full: 'Quarter',  days: 90,  months: 3  },
  { key: '6M',  label: '6M',  full: '6 Months', days: 180, months: 6  },
  { key: '1Y',  label: '1Y',  full: 'Year',     days: 365, months: 12 },
];

// ─── Data hook ────────────────────────────────────────────────────────────────

function useAnalyticsData(period) {
  const summary = useQuery({
    queryKey: ['analytics-summary', period.days],
    queryFn: async () => {
      const r = await analyticsAPI.getDashboardSummary({ period: period.days });
      if (!r.success) throw new Error(r.error?.message || 'Failed');
      // Unwrap double-wrapped response: r.data = server JSON = { success, data: {...} }
      return r.data?.data ?? r.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const trends = useQuery({
    queryKey: ['analytics-user', period.months],
    queryFn: async () => {
      const r = await analyticsAPI.getUserAnalytics({ months: period.months });
      if (!r.success) throw new Error(r.error?.message || 'Failed');
      return r.data?.data ?? r.data;
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

// ─── Derived metrics ──────────────────────────────────────────────────────────

function useDerivedMetrics(summary, trends) {
  return useMemo(() => {
    const income      = summary?.monthlyStats?.income   || 0;
    const expenses    = summary?.monthlyStats?.expenses || 0;
    const net         = summary?.monthlyStats?.net      ?? (income - Math.abs(expenses));
    const savingsRate = summary?.summary?.savingsRate   || 0;

    // Month-over-month from trends array
    const trendArr = trends?.trends || [];
    const cur  = trendArr[trendArr.length - 1];
    const prev = trendArr[trendArr.length - 2];

    const pctChange = (a, b) => {
      if (!b || b === 0) return null;
      return Math.round(((a - b) / Math.abs(b)) * 100);
    };

    const incomeChange   = cur && prev ? pctChange(cur.income,   prev.income)   : null;
    const expenseChange  = cur && prev ? pctChange(cur.expenses, prev.expenses) : null;

    // Average daily spending
    const totalDays = (trends?.period || '').replace(' months', '') * 30 || 30;
    const dailyAvg  = expenses > 0 ? Math.abs(expenses) / totalDays : 0;

    return { income, expenses, net, savingsRate, incomeChange, expenseChange, dailyAvg };
  }, [summary, trends]);
}

// ─── Period tabs ──────────────────────────────────────────────────────────────

function PeriodTabs({ period, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {PERIODS.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p)}
          className={cn(
            'flex-1 py-1.5 px-3 text-sm font-semibold rounded-lg transition-all',
            period.key === p.key
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

// ─── Change badge ─────────────────────────────────────────────────────────────

function ChangeBadge({ pct, invert = false }) {
  if (pct === null || pct === undefined) return null;
  // invert=true: for expenses, a decrease is good (green)
  const isGood = invert ? pct <= 0 : pct >= 0;
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
      isGood
        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
        : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    )}>
      <Icon className="w-2.5 h-2.5" />
      {Math.abs(pct)}%
    </span>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ metrics, formatCurrency, t }) {
  const { income, expenses, net, savingsRate, incomeChange, expenseChange } = metrics;

  const cards = [
    {
      label:  t('stats.income',      { fallback: 'Income' }),
      value:  formatCurrency(income),
      icon:   ArrowUpRight,
      color:  'green',
      badge:  <ChangeBadge pct={incomeChange} />,
    },
    {
      label:  t('stats.expenses',    { fallback: 'Expenses' }),
      value:  formatCurrency(Math.abs(expenses)),
      icon:   ArrowDownRight,
      color:  'red',
      badge:  <ChangeBadge pct={expenseChange} invert />,
    },
    {
      label:  t('stats.net',         { fallback: 'Net Balance' }),
      value:  formatCurrency(Math.abs(net)),
      icon:   Wallet,
      color:  net >= 0 ? 'green' : 'red',
      badge:  null,
    },
    {
      label:  t('stats.savingsRate', { fallback: 'Savings Rate' }),
      value:  `${Math.round(savingsRate)}%`,
      icon:   Target,
      color:  savingsRate >= 20 ? 'green' : savingsRate >= 10 ? 'yellow' : 'red',
      badge:  null,
    },
  ];

  const palette = {
    green:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    red:    'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400',
    yellow: 'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400',
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ label, value, icon: Icon, color, badge }) => (
        <div
          key={label}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/60 shadow-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', palette[color])}>
              <Icon className="w-4 h-4" />
            </div>
            {badge}
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight tabular-nums">
            {value}
          </p>
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl p-3 text-sm min-w-[150px]">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-gray-500 dark:text-gray-400 flex-1">{entry.name}</span>
          <span className="font-bold text-gray-900 dark:text-white tabular-nums">
            {formatCurrency(Math.abs(entry.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Trends area chart ────────────────────────────────────────────────────────

function TrendsChart({ trends, formatCurrency, t }) {
  const data = useMemo(() => {
    const raw = trends?.trends || [];
    return raw.slice(-12).map(d => ({
      month:    d.month,
      income:   Math.abs(Number(d.income)   || 0),
      expenses: Math.abs(Number(d.expenses) || 0),
      savings:  Math.max(0, Number(d.savings) || 0),
    }));
  }, [trends]);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-44 gap-2 text-gray-400 dark:text-gray-500">
        <BarChart3 className="w-8 h-8 opacity-40" />
        <span className="text-sm">{t('analytics.noTrendsData', { fallback: 'No trend data for this period' })}</span>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLOR.income}   stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLOR.income}   stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLOR.expenses} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLOR.expenses} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-gray-400 dark:text-gray-500"
            tickLine={false} axisLine={false}
            tickFormatter={v => {
              const [, m] = v.split('-');
              return new Date(2000, parseInt(m) - 1).toLocaleString(undefined, { month: 'short' });
            }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'currentColor' }}
            className="text-gray-400 dark:text-gray-500"
            tickLine={false} axisLine={false}
            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            width={34}
          />
          <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} />} />
          <Area type="monotone" dataKey="income"
            name={t('stats.income', { fallback: 'Income' })}
            stroke={COLOR.income} fill="url(#gInc)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="expenses"
            name={t('stats.expenses', { fallback: 'Expenses' })}
            stroke={COLOR.expenses} fill="url(#gExp)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-5 pt-2">
        {[
          { color: COLOR.income,   key: 'stats.income',   fb: 'Income' },
          { color: COLOR.expenses, key: 'stats.expenses', fb: 'Expenses' },
        ].map(({ color, key, fb }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t(key, { fallback: fb })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category breakdown (list + mini bars) ────────────────────────────────────

function CategoryBreakdown({ trends, formatCurrency, t }) {
  const data = useMemo(() => {
    const cats = trends?.categories || [];
    const total = cats.reduce((s, c) => s + Math.abs(Number(c.amount) || 0), 0);
    return cats.slice(0, 7).map((c, i) => ({
      name:    c.name || 'Other',
      amount:  Math.abs(Number(c.amount) || 0),
      count:   c.count || 0,
      pct:     total > 0 ? Math.round((Math.abs(Number(c.amount) || 0) / total) * 100) : 0,
      color:   COLOR.cats[i % COLOR.cats.length],
    }));
  }, [trends]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
        {t('analytics.noCategoryData', { fallback: 'No category data' })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map(({ name, amount, count, pct, color }) => (
        <div key={name}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{count}x</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{pct}%</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Health score ─────────────────────────────────────────────────────────────

function HealthRing({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  const circ  = 2 * Math.PI * 28;
  const dash  = (score / 100) * circ;
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor"
          className="text-gray-100 dark:text-gray-700" strokeWidth="5" />
        <circle cx="32" cy="32" r="28" fill="none" stroke={color}
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold text-gray-900 dark:text-white">{score}</span>
      </div>
    </div>
  );
}

function HealthScore({ metrics, t }) {
  const { savingsRate } = metrics;
  const score = Math.min(100, Math.max(0, Math.round(savingsRate * 1.2)));

  const { levelKey, color } = score >= 80
    ? { levelKey: 'health.excellent', color: 'text-emerald-600 dark:text-emerald-400' }
    : score >= 60
    ? { levelKey: 'health.good',      color: 'text-blue-600 dark:text-blue-400' }
    : score >= 40
    ? { levelKey: 'health.fair',      color: 'text-amber-600 dark:text-amber-400' }
    : { levelKey: 'health.poor',      color: 'text-red-600 dark:text-red-400' };

  const fallbacks = { 'health.excellent': 'Excellent', 'health.good': 'Good', 'health.fair': 'Fair', 'health.poor': 'Needs Work' };

  return (
    <div className="flex items-center gap-4">
      <HealthRing score={score} />
      <div>
        <p className={cn('text-xl font-bold', color)}>
          {t(levelKey, { fallback: fallbacks[levelKey] })}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t('health.financialHealth', { fallback: 'Financial Health' })}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {t('health.savingsRate', { fallback: 'Savings Rate' })}: {Math.round(savingsRate)}%
        </p>
      </div>
    </div>
  );
}

// ─── Recent transactions ──────────────────────────────────────────────────────

function RecentList({ summary, formatCurrency, t }) {
  const txns = summary?.recentTransactions?.slice(0, 5) || [];
  if (!txns.length) return (
    <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
      {t('analytics.noTrendsData', { fallback: 'No recent transactions' })}
    </p>
  );

  return (
    <div className="space-y-2">
      {txns.map((tx, i) => {
        const isIncome = tx.type === 'income' || Number(tx.amount) > 0;
        let Icon = DollarSign;
        try { Icon = getIconComponent(tx.category_icon || 'Receipt') || DollarSign; } catch {}
        return (
          <div key={tx.id || i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
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

// ─── Section card ─────────────────────────────────────────────────────────────

function Card({ icon: Icon, iconBg, title, subtitle, action, children, className }) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/60 shadow-sm', className)}>
      {(Icon || title) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm', iconBg)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              {title   && <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>}
              {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Mobile layout — has its own title/period sticky bar ──────────────────────

function MobileAnalytics({ period, setPeriod, summary, trends, metrics, formatCurrency, t, navigate, refetch, refreshing, setRefreshing }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">

      {/* Sticky mobile title bar (no global nav on mobile, only bottom nav) */}
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

        {/* Summary cards */}
        <SummaryCards metrics={metrics} formatCurrency={formatCurrency} t={t} />

        {/* Financial Health */}
        <Card
          icon={Target}
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          title={t('health.financialHealth', { fallback: 'Financial Health' })}
          subtitle={t('health.yourScore', { fallback: 'Your Score' })}
        >
          <HealthScore metrics={metrics} t={t} />
        </Card>

        {/* Monthly Trends */}
        <Card
          icon={TrendingUp}
          iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
          title={t('analytics.monthlyTrends', { fallback: 'Monthly Trends' })}
          subtitle={t('analytics.incomeVsExpenses', { fallback: 'Income vs Expenses' })}
        >
          <TrendsChart trends={trends} formatCurrency={formatCurrency} t={t} />
        </Card>

        {/* Top Categories */}
        <Card
          icon={PieIcon}
          iconBg="bg-gradient-to-br from-purple-500 to-violet-600"
          title={t('analytics.topCategories', { fallback: 'Top Categories' })}
          subtitle={t('analytics.topCategoriesDesc', { fallback: 'Where your money goes' })}
        >
          <CategoryBreakdown trends={trends} formatCurrency={formatCurrency} t={t} />
        </Card>

        {/* Recent Transactions */}
        {summary?.recentTransactions?.length > 0 && (
          <Card
            icon={Activity}
            iconBg="bg-gradient-to-br from-emerald-500 to-green-600"
            title={t('analytics.recentTransactions', { fallback: 'Recent Transactions' })}
            subtitle={t('analytics.lastActivity', { fallback: 'Latest activity' })}
            action={
              <button onClick={() => navigate('/transactions')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                {t('actions.viewAll', { fallback: 'View all' })}
              </button>
            }
          >
            <RecentList summary={summary} formatCurrency={formatCurrency} t={t} />
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Desktop layout — no extra header (global Header already shown by App) ────

function DesktopAnalytics({ period, setPeriod, summary, trends, metrics, formatCurrency, t, navigate, refetch, refreshing, setRefreshing }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6 pb-10 space-y-6">

        {/* Page title row — inline, NOT a sticky card (global Header handles nav) */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('analytics.title', { fallback: 'Analytics' })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('analytics.subtitle', { fallback: 'Financial insights & trends' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PeriodTabs period={period} onChange={setPeriod} />
            <button
              onClick={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors shadow-sm"
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              {t('analytics.refresh', { fallback: 'Refresh' })}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <SummaryCards metrics={metrics} formatCurrency={formatCurrency} t={t} />

        {/* Main 2-col grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left 2/3 */}
          <div className="xl:col-span-2 space-y-6">

            {/* Trends chart */}
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
            </div>

            {/* Recent transactions */}
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
                <button onClick={() => navigate('/transactions')}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  {t('actions.viewAll', { fallback: 'View all' })} →
                </button>
              </div>
              <RecentList summary={summary} formatCurrency={formatCurrency} t={t} />
            </div>
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">

            {/* Health score */}
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
              <HealthScore metrics={metrics} t={t} />
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

            {/* Category breakdown */}
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
              <CategoryBreakdown trends={trends} formatCurrency={formatCurrency} t={t} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root component ────────────────────────────────────────────────────────────

export default function Analytics() {
  // No module arg — full 'module.key' keys with { fallback } objects
  const { t }              = useTranslation();
  const { formatCurrency } = useCurrency();
  const navigate           = useNavigate();
  const isMobile           = useIsMobile();

  const [period,     setPeriod]     = useState(PERIODS[0]); // 1M default
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

  const { summary, trends, isLoading, isError, error, refetch } = useAnalyticsData(period);
  const metrics = useDerivedMetrics(summary, trends);

  const shared = { period, setPeriod, summary, trends, metrics, formatCurrency, t, navigate, refetch, refreshing, setRefreshing };

  if (isLoading && !summary) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
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
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('analytics.errorTitle', { fallback: 'Failed to load analytics' })}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error?.message}</p>
          <button onClick={refetch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
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
