/**
 * ModernBalancePanel — balance overview with period tabs.
 * Shows net balance (large), income, expenses, and spend ratio bar.
 */

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, useCurrency } from '../../../stores';
import { useBalance } from '../../../hooks';
import { cn } from '../../../utils/helpers';

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
    </div>
  );
};

export default ModernBalancePanel;
