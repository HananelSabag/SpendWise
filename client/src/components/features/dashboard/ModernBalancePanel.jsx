/**
 * ModernBalancePanel — balance overview with period tabs.
 * Shows net balance (large), income, expenses, and spend ratio bar.
 */

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUp, ArrowDown, Building2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation, useCurrency } from '../../../stores';
import { useBalance } from '../../../hooks';
import { cn } from '../../../utils/helpers';
import apiClient from '../../../api/client';

// ── Bank account balance strip ────────────────────────────────────────────────
// Shows REAL bank balance (from bank_accounts table, populated by bank-scraper).
// This is fundamentally different from the SpendWise net balance above:
//   SpendWise net  = SUM(income) - SUM(expenses) for a period  → budget tracking
//   Bank balance   = actual money in the account right now      → bank reality
const BankBalanceStrip = ({ formatCurrency }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['bankSyncStats'],
    queryFn: () => apiClient.get('/bank-sync/stats').then(r => r.data.sources || []),
    staleTime: 5 * 60_000,
    retry: false,
  });

  // Flatten accounts that have a REAL balance from the bank (null = bank doesn't expose it)
  const accounts = (data || []).flatMap(src =>
    (src.accounts || [])
      .filter(a => a.balance !== null && a.balance !== undefined)
      .map(a => ({ ...a, source: src.source }))
  );

  // Show sources even if no balance data, to indicate sync is active
  const hasSynced = (data || []).length > 0;
  if (isLoading || !hasSynced) return null;

  // If no accounts have balance (e.g. Yahav doesn't expose it), show a minimal indicator
  if (accounts.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 px-4 py-2.5 flex items-center gap-2">
        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          בנק מסונכרן · יתרת חשבון לא זמינה דרך הספרייה
        </span>
      </div>
    );
  }

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  const sourceLabel = { yahav: 'יהב', isracard: 'ישראכרט', max: 'מקס', discount: 'דיסקונט' };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            יתרת חשבון בנק בפועל
          </span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          ≠ יתרת SpendWise
        </span>
      </div>

      {/* Per-account rows */}
      <div className="space-y-1.5">
        {accounts.map((a, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium flex-shrink-0">
                {sourceLabel[a.source] || a.source}
              </span>
              {a.account_number && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                  {a.account_number}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white flex-shrink-0">
              {formatCurrency(Number(a.balance || 0))}
            </span>
          </div>
        ))}
      </div>

      {/* Total if multiple accounts */}
      {accounts.length > 1 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">סה"כ</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(totalBalance)}</span>
        </div>
      )}

      <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500 text-center">
        מסונכרן מ-bank-scraper · מתעדכן 3× ביום
      </p>
    </div>
  );
};

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

// ── Animated number (count-up on value change) ────────────────────────────────
const AnimatedNumber = ({ value, format }) => {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf  = useRef(null);

  useEffect(() => {
    if (prev.current === value) return;
    const start     = prev.current;
    const end       = value;
    const duration  = 400;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = Math.min((now - startTime) / duration, 1);
      const eased   = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
      setDisplay(start + (end - start) * eased);
      if (elapsed < 1) raf.current = requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span>{format(display)}</span>;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonBox = ({ className }) => (
  <div className={cn('animate-pulse bg-white/20 rounded-xl', className)} />
);

// ── Main ──────────────────────────────────────────────────────────────────────
const ModernBalancePanel = ({ className = '' }) => {
  const { t }              = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { data, loading, error } = useBalance({ autoRefresh: true });

  const [period, setPeriod] = useState('daily');

  const periodData  = data?.[period] || { income: 0, expenses: 0, total: 0 };
  const income      = periodData.income   || 0;
  const expenses    = Math.abs(periodData.expenses || 0);
  const net         = periodData.total ?? (income - expenses);
  const isPositive  = net >= 0;

  // Expense ratio — how much of income was spent (clamped 0–100)
  const spendRatio  = income > 0 ? Math.min((expenses / income) * 100, 100) : 0;
  const ratioLabel  = income > 0 ? `${Math.round(spendRatio)}%` : '—';

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5">
          <SkeletonBox className="h-3 w-28 mb-3" />
          <SkeletonBox className="h-10 w-44 mb-2" />
          <SkeletonBox className="h-2 w-full mb-5 rounded-full" />
          <div className="flex gap-1">
            {PERIODS.map(p => <SkeletonBox key={p} className="flex-1 h-8" />)}
          </div>
        </div>
        <div className="grid grid-cols-2 bg-white dark:bg-gray-800">
          <div className="p-4"><SkeletonBox className="!bg-gray-100 dark:!bg-gray-700 h-14 w-full" /></div>
          <div className="p-4"><SkeletonBox className="!bg-gray-100 dark:!bg-gray-700 h-14 w-full" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl overflow-hidden shadow-lg', className)}>

      {/* ── Gradient header ──────────────────────────────────────── */}
      <div className={cn(
        'p-5 text-white transition-all duration-500',
        isPositive
          ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
          : 'bg-gradient-to-br from-rose-600 to-red-700'
      )}>

        {/* Title row */}
        <div className="flex items-center gap-2 opacity-80 mb-3">
          <Wallet className="w-4 h-4" />
          <span className="text-sm font-medium">{t('balance.title')}</span>
        </div>

        {/* Net amount + trend */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${period}-${net}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-3xl sm:text-4xl font-bold tracking-tight"
              >
                {error && !data ? '—' : (
                  <AnimatedNumber value={Math.abs(net)} format={v => formatCurrency(v)} />
                )}
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-1 mt-1 opacity-80">
              {isPositive
                ? <ArrowUp   className="w-3.5 h-3.5" />
                : <ArrowDown className="w-3.5 h-3.5" />}
              <span className="text-xs font-medium">
                {t(isPositive ? 'stats.positive' : 'stats.negative')}
              </span>
            </div>
          </div>

          {/* Spend ratio badge */}
          {income > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold">{ratioLabel}</p>
              <p className="text-xs opacity-70">{t('balance.spent', 'spent')}</p>
            </div>
          )}
        </div>

        {/* Spend ratio bar */}
        {income > 0 && (
          <div className="mb-4">
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  spendRatio >= 90 ? 'bg-red-300' :
                  spendRatio >= 70 ? 'bg-amber-300' :
                  'bg-emerald-300'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${spendRatio}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Period tabs */}
        <div className="flex gap-1 bg-white/10 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer',
                period === p
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              {t(`periods.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Income / Expenses breakdown ───────────────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">

        {/* Income */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('balance.income')}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            <AnimatedNumber value={income} format={v => formatCurrency(v)} />
          </p>
          {/* Income bar (always full) */}
          <div className="h-1 w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
        </div>

        {/* Expenses */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('balance.expenses')}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            <AnimatedNumber value={expenses} format={v => formatCurrency(v)} />
          </p>
          {/* Expenses bar (proportional to income) */}
          <div className="h-1 w-full bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${spendRatio}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* ── Real bank account balance (from bank-scraper) ─────────── */}
      {/* Only renders if the scraper has run at least once. Shows the ACTUAL
          bank balance — NOT a calculated sum. Clearly separated from above. */}
      <BankBalanceStrip formatCurrency={formatCurrency} />
    </div>
  );
};

export default ModernBalancePanel;
