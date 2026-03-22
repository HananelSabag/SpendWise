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

// ─── helpers ────────────────────────────────────────────────────────────────

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const CategoryBadge = ({ category, type }) => {
  const initial = (category || (type === 'income' ? 'I' : 'E')).charAt(0).toUpperCase();
  return (
    <div className={cn(
      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
      type === 'income'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    )}>
      {initial}
    </div>
  );
};

// ─── Transaction row ─────────────────────────────────────────────────────────

const TxRow = ({ transaction, formatCurrency }) => {
  const isIncome = transaction.type === 'income';
  const amount = parseFloat(transaction.amount) || 0;
  const dateStr = transaction.transaction_datetime || transaction.created_at || transaction.date;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
    >
      <CategoryBadge category={transaction.category_name} type={transaction.type} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {transaction.description || transaction.category_name || (isIncome ? 'Income' : 'Expense')}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {transaction.category_name && (
            <span className="mr-1">{transaction.category_name} · </span>
          )}
          {formatRelativeDate(dateStr)}
        </p>
      </div>

      <span className={cn(
        'text-sm font-bold flex-shrink-0',
        isIncome ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
      )}>
        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(amount))}
      </span>
    </motion.div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const ModernRecentTransactionsWidget = ({
  onViewAll,
  maxItems = 5,
}) => {
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();

  const { transactions: allTransactions, loading, refetch } = useTransactions({
    pageSize: 50,
    enableAI: false,
    context: 'dashboard',
    autoRefresh: true,
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch?.(); } finally { setRefreshing(false); }
  }, [refetch]);

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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
              <TxRow key={tx.id} transaction={tx} formatCurrency={formatCurrency} />
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
