/**
 * Analytics Page — v4 (rebuilt for real bank data)
 *
 * The account behind this app now runs mostly on bank-synced transactions:
 * checking-account cash-flow EVENTS (a "Visa Leumi" line is a whole month's
 * card bill settling, not one purchase), almost never user-categorized.
 * Previous versions treated this like manually-entered, fully-categorized
 * data and it showed accordingly: a fake "Health Score" ring with no real
 * basis, and a category chart that was 100% "General" — worthless.
 *
 * Server now classifies uncategorized bank rows by real Israeli banking
 * description patterns (card settlement / loan / cash withdrawal / fees /
 * transfer) instead of dumping them in one bucket, and every entry is
 * tagged 'category' (user-set, exact) or 'auto' (inferred) so the UI can
 * be honest about which numbers are real vs guessed. A new "Bank costs"
 * card surfaces fees/interest/loan payments — real money leaving the
 * account that a manual-entry app would never think to show.
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
  Wallet, Target, PieChart as PieIcon, Landmark, Banknote, Percent,
  Activity, RefreshCw, AlertCircle, BarChart3, DollarSign,
  Minus, Info,
} from 'lucide-react';

import { useTranslation, useCurrency } from '../stores';
import { analyticsAPI } from '../api/analytics';
import { useIsMobile } from '../hooks/useIsMobile';
import { cn } from '../utils/helpers';
import { getIconComponent } from '../config/categoryIcons';
import { LoadingSpinner, PageSkeleton } from '../components/ui';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton';
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR = {
  income:   '#10b981',
  expenses: '#ef4444',
  // Muted, low-saturation ramp — the loud rainbow palette was the thing
  // that "screamed" in dark mode. One consistent family, varied by shade.
  cats: ['#6366f1', '#0ea5e9', '#14b8a6', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'],
};

const PERIODS = [
  { key: '1M', label: '1M', full: 'Month',    days: 31,  months: 1  },
  { key: '3M', label: '3M', full: 'Quarter',  days: 90,  months: 3  },
  { key: '6M', label: '6M', full: '6 Months', days: 180, months: 6  },
  { key: '1Y', label: '1Y', full: 'Year',     days: 365, months: 12 },
];

// ─── Data hook ────────────────────────────────────────────────────────────────

function useAnalyticsData(period) {
  const summary = useQuery({
    queryKey: ['analytics-summary', period.days],
    queryFn: async () => {
      const r = await analyticsAPI.getDashboardSummary({ period: period.days });
      if (!r.success) throw new Error(r.error?.message || 'Failed');
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

    const trendArr = trends?.trends || [];
    const cur  = trendArr[trendArr.length - 1];
    const prev = trendArr[trendArr.length - 2];

    const pctChange = (a, b) => (!b ? null : Math.round(((a - b) / Math.abs(b)) * 100));
    const incomeChange  = cur && prev ? pctChange(cur.income,   prev.income)   : null;
    const expenseChange = cur && prev ? pctChange(cur.expenses, prev.expenses) : null;

    return { income, expenses, net, savingsRate, incomeChange, expenseChange };
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
    { label: t('stats.income',      { fallback: 'Income' }),   value: formatCurrency(income),
      icon: ArrowUpRight,  tint: 'text-emerald-500 dark:text-emerald-400', badge: <ChangeBadge pct={incomeChange} /> },
    { label: t('stats.expenses',    { fallback: 'Expenses' }), value: formatCurrency(Math.abs(expenses)),
      icon: ArrowDownRight, tint: 'text-red-500 dark:text-red-400', badge: <ChangeBadge pct={expenseChange} invert /> },
    { label: t('stats.net',         { fallback: 'Net Balance' }), value: formatCurrency(Math.abs(net)),
      icon: Wallet, tint: net >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400', badge: null },
    { label: t('stats.savingsRate', { fallback: 'Savings Rate' }), value: `${Math.round(savingsRate)}%`,
      icon: Target, tint: savingsRate >= 20 ? 'text-emerald-500 dark:text-emerald-400' : savingsRate >= 10 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400', badge: null },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ label, value, icon: Icon, tint, badge }) => (
        <div key={label} className="glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700/60">
              <Icon className={cn('w-4 h-4', tint)} />
            </div>
            {badge}
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight tabular-nums">{value}</p>
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
    <div className="glass-menu rounded-xl p-3 text-sm min-w-[150px]">
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

// ─── Spending breakdown — real categories + auto-detected bank patterns ───────

function SpendingBreakdown({ trends, formatCurrency, t }) {
  const data = useMemo(() => {
    const cats = trends?.categories || [];
    const total = cats.reduce((s, c) => s + Math.abs(Number(c.amount) || 0), 0);
    return cats.slice(0, 8).map((c, i) => ({
      name:   c.name || 'Other',
      source: c.source || 'auto',
      amount: Math.abs(Number(c.amount) || 0),
      count:  c.count || 0,
      pct:    total > 0 ? Math.round((Math.abs(Number(c.amount) || 0) / total) * 100) : 0,
      color:  COLOR.cats[i % COLOR.cats.length],
    }));
  }, [trends]);

  const hasAuto = data.some(d => d.source === 'auto');

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
        {t('analytics.noCategoryData', { fallback: 'No spending data yet' })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map(({ name, source, amount, count, pct, color }) => (
        <div key={name}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{name}</span>
              {source === 'auto' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 shrink-0">
                  {t('analytics.autoDetected', { fallback: 'auto' })}
                </span>
              )}
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
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
          </div>
        </div>
      ))}
      {hasAuto && (
        <div className="flex items-start gap-1.5 pt-1 text-[11px] text-gray-400 dark:text-gray-500">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{t('analytics.autoDetectedHint', {
            fallback: '"auto" groups are guessed from your bank transaction descriptions, not categories you set',
          })}</span>
        </div>
      )}
    </div>
  );
}

// ─── Bank costs — fees, interest, loans, cash (real bank-specific insight) ────

function BankCosts({ trends, formatCurrency, t }) {
  const costs = trends?.bankCosts;
  const hasAny = costs && (costs.feesInterest > 0 || costs.loanPayments > 0 || costs.cashWithdrawn > 0);
  if (!hasAny) return null;

  const items = [
    { label: t('analytics.feesInterest', { fallback: 'Fees & Interest' }), value: costs.feesInterest, icon: Percent, tint: 'text-amber-500 dark:text-amber-400' },
    { label: t('analytics.loanPayments', { fallback: 'Loan Payments' }),   value: costs.loanPayments, icon: Landmark, tint: 'text-indigo-500 dark:text-indigo-400' },
    { label: t('analytics.cashWithdrawn', { fallback: 'Cash Withdrawn' }), value: costs.cashWithdrawn, icon: Banknote, tint: 'text-teal-500 dark:text-teal-400',
      sub: costs.cashWithdrawalCount ? `${costs.cashWithdrawalCount}x` : null },
  ].filter(i => i.value > 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map(({ label, value, icon: Icon, tint, sub }) => (
        <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 shrink-0">
            <Icon className={cn('w-4 h-4', tint)} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
              {formatCurrency(value)} {sub && <span className="text-xs font-normal text-gray-400">· {sub}</span>}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        </div>
      ))}
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
          <div key={tx.id || i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white dark:bg-gray-800',
              isIncome ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center gap-1">
                {tx.bank_source && <Landmark className="w-3 h-3 text-gray-400 shrink-0" />}
                <span className="truncate">{tx.description || t('transactions.noDescription', { fallback: 'No description' })}</span>
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

function Card({ icon: Icon, iconTint, title, subtitle, action, children, className }) {
  return (
    <div className={cn('glass-card rounded-2xl p-5', className)}>
      {(Icon || title) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 dark:bg-gray-700/60">
                <Icon className={cn('w-4 h-4', iconTint)} />
              </div>
            )}
            <div>
              {title    && <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>}
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

// ─── Mobile layout ─────────────────────────────────────────────────────────────

function MobileAnalytics({ period, setPeriod, summary, trends, metrics, formatCurrency, t, navigate, refetch, refreshing, setRefreshing }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <div className="glass-card sticky top-0 z-20 rounded-none border-x-0 border-t-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
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
        <SummaryCards metrics={metrics} formatCurrency={formatCurrency} t={t} />

        <Card
          icon={TrendingUp} iconTint="text-indigo-500 dark:text-indigo-400"
          title={t('analytics.monthlyTrends', { fallback: 'Monthly Trends' })}
          subtitle={t('analytics.incomeVsExpenses', { fallback: 'Income vs Expenses' })}
        >
          <TrendsChart trends={trends} formatCurrency={formatCurrency} t={t} />
        </Card>

        <Card
          icon={PieIcon} iconTint="text-violet-500 dark:text-violet-400"
          title={t('analytics.whereMoneyWent', { fallback: 'Where your money went' })}
          subtitle={t('analytics.topCategoriesDesc', { fallback: 'Spending breakdown' })}
        >
          <SpendingBreakdown trends={trends} formatCurrency={formatCurrency} t={t} />
        </Card>

        <Card
          icon={Landmark} iconTint="text-amber-500 dark:text-amber-400"
          title={t('analytics.bankCosts', { fallback: 'Bank Costs' })}
          subtitle={t('analytics.bankCostsDesc', { fallback: 'Fees, interest & loans this period' })}
        >
          <BankCosts trends={trends} formatCurrency={formatCurrency} t={t} />
        </Card>

        {summary?.recentTransactions?.length > 0 && (
          <Card
            icon={Activity} iconTint="text-emerald-500 dark:text-emerald-400"
            title={t('analytics.recentTransactions', { fallback: 'Recent Transactions' })}
            subtitle={t('analytics.lastActivity', { fallback: 'Latest activity' })}
            action={
              <button onClick={() => navigate('/transactions')}
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
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

// ─── Desktop layout ────────────────────────────────────────────────────────────

function DesktopAnalytics({ period, setPeriod, summary, trends, metrics, formatCurrency, t, navigate, refetch, refreshing, setRefreshing }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6 pb-10 space-y-6">

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

        <SummaryCards metrics={metrics} formatCurrency={formatCurrency} t={t} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700/60">
                  <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
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

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700/60">
                  <Landmark className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('analytics.bankCosts', { fallback: 'Bank Costs' })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('analytics.bankCostsDesc', { fallback: 'Fees, interest & loans this period' })}
                  </p>
                </div>
              </div>
              <BankCosts trends={trends} formatCurrency={formatCurrency} t={t} />
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700/60">
                    <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
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
                  className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  {t('actions.viewAll', { fallback: 'View all' })} →
                </button>
              </div>
              <RecentList summary={summary} formatCurrency={formatCurrency} t={t} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700/60">
                  <PieIcon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {t('analytics.whereMoneyWent', { fallback: 'Where your money went' })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('analytics.topCategoriesDesc', { fallback: 'Spending breakdown' })}
                  </p>
                </div>
              </div>
              <SpendingBreakdown trends={trends} formatCurrency={formatCurrency} t={t} />

              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60">
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
                    {t('stats.categories', { fallback: 'Categorized' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root component ────────────────────────────────────────────────────────────

export default function Analytics() {
  const { t }              = useTranslation();
  const { formatCurrency } = useCurrency();
  const navigate           = useNavigate();
  const isMobile           = useIsMobile();

  const [period,     setPeriod]     = useState(PERIODS[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

  const { summary, trends, isLoading, isError, error, refetch } = useAnalyticsData(period);
  const metrics = useDerivedMetrics(summary, trends);

  const shared = { period, setPeriod, summary, trends, metrics, formatCurrency, t, navigate, refetch, refreshing, setRefreshing };

  if (isLoading && !summary) {
    return <PageSkeleton page="analytics" />;
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
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors">
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
