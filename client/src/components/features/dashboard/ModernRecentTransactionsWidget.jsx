/**
 * ModernRecentTransactionsWidget — recent transactions list for dashboard.
 * Shows the last N transactions with category icon, description, date, amount.
 * CRASH FIX: processedTransactions always returns {recent, total} object.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { ArrowRight, Plus, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, useCurrency } from '../../../stores';
import { useTransactions } from '../../../hooks/useTransactions';
import { cn } from '../../../utils/helpers';
import { institutionLabel, institutionIcon, bankBrand } from '../bankSync/bankSyncMeta';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatRelativeDate = (dateStr, t) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return t('common.date.today', 'Today');
  if (diffDays === 1) return t('common.date.yesterday', 'Yesterday');
  if (diffDays < 7) return t('common.date.daysAgo', { count: diffDays, fallback: `${diffDays}d ago` });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// ─── Transaction row ─────────────────────────────────────────────────────────
// Same visual language as ModernTransactionCard on the transactions page:
// brand-gradient source icon, green income / red expense amounts, translated
// institution names — one entity, one look.

const TxRow = ({ transaction, formatCurrency, t, lang }) => {
  const isIncome = transaction.type === 'income';
  const isBankSynced = Boolean(transaction.bank_source);
  const amount = parseFloat(transaction.amount) || 0;
  const dateStr = transaction.transaction_datetime || transaction.created_at || transaction.date;
  const Icon = institutionIcon(transaction.bank_source);
  const sourceLabel = isBankSynced
    ? institutionLabel(transaction.bank_source, lang)
    : t('manualEntry', { fallback: 'Manual entry' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
        isBankSynced
          ? `bg-gradient-to-br ${bankBrand(transaction.bank_source).gradient} text-white`
          : 'bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400'
      )}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {transaction.description || (isIncome ? 'Income' : 'Expense')}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          <span className="me-1">{sourceLabel} · </span>
          {formatRelativeDate(dateStr, t)}
        </p>
      </div>

      <span className={cn(
        'text-sm font-bold flex-shrink-0 tabular-nums',
        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
      )}>
        {isIncome ? '+' : '−'}{formatCurrency(Math.abs(amount))}
      </span>
    </motion.div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const ModernRecentTransactionsWidget = ({
  onViewAll,
  maxItems = 5,
  // PERF: when the parent (dashboard) already has recent transactions in its
  // own data, pass them in here. This eliminates a redundant API call:
  // the /transactions/dashboard endpoint already returns recent_transactions
  // server-side, so spawning a second /transactions GET was pure waste.
  preloadedTransactions = null,
  preloadedLoading = false,
}) => {
  const { t, currentLanguage } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();

  // Only fire our own fetch when the parent didn't preload anything.
  const shouldFetch = !preloadedTransactions;

  // PERF: pull just enough to render maxItems, not 50.
  const ownQuery = useTransactions({
    pageSize: Math.max(maxItems + 4, 12),
    enableAI: false,
    context: 'dashboard',
    autoRefresh: true,
    // useTransactions itself ignores extra opts; we still want it disabled.
    enabled: shouldFetch,
  });

  const allTransactions = preloadedTransactions ?? ownQuery.transactions;
  const loading = preloadedTransactions ? preloadedLoading : ownQuery.loading;
  const refetch = ownQuery.refetch;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (preloadedTransactions) {
        // Preloaded data comes from the dashboard query — refetching our own
        // (disabled) query would fetch data nothing displays. Ask the
        // dashboard to refresh instead (useDashboard listens for this).
        window.dispatchEvent(new CustomEvent('dashboard-refresh-requested'));
        await new Promise((r) => setTimeout(r, 1200));
      } else {
        await refetch?.();
      }
    } finally {
      setRefreshing(false);
    }
  }, [refetch, preloadedTransactions]);

  // ✅ CRASH FIX: always return { recent, total } — never bare array
  const processedTransactions = useMemo(() => {
    if (!allTransactions || !Array.isArray(allTransactions)) {
      return { recent: [], total: 0 };
    }
    const now = new Date();
    const filtered = allTransactions
      .filter(tx => {
        const d = new Date(tx.transaction_datetime || tx.created_at || tx.date);
        return !isNaN(d) && d <= now && !tx.is_template;
      })
      .sort((a, b) => {
        const da = new Date(a.transaction_datetime || a.created_at || a.date);
        const db = new Date(b.transaction_datetime || b.created_at || b.date);
        return db - da;
      });
    return { recent: filtered.slice(0, maxItems), total: filtered.length };
  }, [allTransactions, maxItems]);

  const { recent, total } = processedTransactions;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('recentTransactions.title')}
          </h3>
          {total > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('recentTransactions.showingCount', { count: recent.length, total })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          </button>
          {total > 0 && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 transition-colors"
            >
              {t('recentTransactions.viewAll')}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {loading && recent.length === 0 ? (
          /* Skeleton */
          <div className="py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700 rounded mb-1.5" />
                  <div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          /* Empty state */
          <div className="py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-2">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('recentTransactions.noTransactions')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('recentTransactions.getStarted')}
            </p>
          </div>
        ) : (
          /* Transaction list */
          <AnimatePresence initial={false}>
            {recent.map(tx => (
              <TxRow key={tx.id} transaction={tx} formatCurrency={formatCurrency} t={t} lang={currentLanguage} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer — view all link (only when there are more) */}
      {total > maxItems && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onViewAll}
            className="w-full text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 transition-colors flex items-center justify-center gap-1"
          >
            {t('recentTransactions.seeMore')} ({total - maxItems} more)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ModernRecentTransactionsWidget;
