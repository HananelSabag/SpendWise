/**
 * ModernRecentTransactionsWidget — the last few transactions, rendered with the SAME row as the
 * transactions page (ModernTransactionCard). A transaction looks and behaves identically wherever
 * it appears: tap a row to open its full detail sheet; bank rows stay read-only (delete only),
 * manual rows keep edit / duplicate / delete — exactly like the page, just the most recent N.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useTranslation, useCurrency } from '../../../stores';
import { useTransactions } from '../../../hooks/useTransactions';
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import ModernTransactionCard from '../transactions/ModernTransactionCard';
import TransactionDetailSheet from '../transactions/TransactionDetailSheet';
import EditTransactionModal from '../transactions/modals/EditTransactionModal';
import DeleteTransaction from '../transactions/DeleteTransaction';

const ModernRecentTransactionsWidget = ({
  onViewAll,
  maxItems = 5,
  // PERF: the dashboard query already returns recent transactions server-side, so pass them in
  // here rather than firing a second /transactions GET.
  preloadedTransactions = null,
  preloadedLoading = false,
}) => {
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { deleteTransaction } = useTransactionActions();

  // Only fetch our own when the parent didn't preload anything.
  const shouldFetch = !preloadedTransactions;
  const ownQuery = useTransactions({
    pageSize: Math.max(maxItems + 4, 12),
    enableAI: false,
    context: 'dashboard',
    autoRefresh: true,
    enabled: shouldFetch,
  });

  const allTransactions = preloadedTransactions ?? ownQuery.transactions;
  const loading = preloadedTransactions ? preloadedLoading : ownQuery.loading;

  const [detailTransaction, setDetailTransaction] = useState(null);
  const [editTransaction, setEditTransaction] = useState(null);
  const [editMode, setEditMode] = useState('edit');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // These rows come from the dashboard payload, not this widget's own fetch, so after any
  // mutation ask the dashboard query to refresh (useDashboard listens for this event).
  const refreshDashboard = useCallback(() => {
    window.dispatchEvent(new CustomEvent('dashboard-refresh-requested'));
  }, []);

  const onOpenDetail = useCallback((tx) => setDetailTransaction(tx), []);
  const onEdit = useCallback((tx, mode = 'edit') => { setEditTransaction(tx); setEditMode(mode); }, []);
  const onDuplicate = useCallback((tx) => { setEditTransaction(tx); setEditMode('duplicate'); }, []);
  const onDelete = useCallback((tx) => setDeleteTarget(tx), []);
  const handleDeleteSuccess = useCallback(async (id, options) => {
    try {
      await deleteTransaction(id, options);
      refreshDashboard();
    } catch (_) { /* the mutation shows its own error toast */ }
  }, [deleteTransaction, refreshDashboard]);

  const { recent, total } = useMemo(() => {
    if (!allTransactions || !Array.isArray(allTransactions)) return { recent: [], total: 0 };
    const now = new Date();
    const filtered = allTransactions
      .filter((tx) => {
        const d = new Date(tx.financial_period_date || tx.transaction_datetime || tx.created_at || tx.date);
        return !isNaN(d) && d <= now && !tx.is_template;
      })
      .sort((a, b) => {
        const da = new Date(a.financial_period_date || a.transaction_datetime || a.created_at || a.date);
        const db = new Date(b.financial_period_date || b.transaction_datetime || b.created_at || b.date);
        return db - da;
      });
    return { recent: filtered.slice(0, maxItems), total: filtered.length };
  }, [allTransactions, maxItems]);

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
        {total > 0 && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 transition-colors"
          >
            {t('recentTransactions.viewAll')}
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {loading && recent.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700/60 px-3 py-2.5 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700 rounded mb-1.5" />
                  <div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
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
          <div className="space-y-2">
            {recent.map((tx) => (
              <ModernTransactionCard
                key={tx.id}
                transaction={tx}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer — view all (only when there is more than we show) */}
      {total > maxItems && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onViewAll}
            className="w-full text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 transition-colors flex items-center justify-center gap-1"
          >
            {t('recentTransactions.seeMore')}
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      )}

      {/* Full detail + edit/delete — the exact components the transactions page uses, so a row
          behaves the same here as there. */}
      <TransactionDetailSheet
        transaction={detailTransaction}
        isOpen={!!detailTransaction}
        onClose={() => setDetailTransaction(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
      />
      <EditTransactionModal
        isOpen={!!editTransaction}
        onClose={() => setEditTransaction(null)}
        onSuccess={refreshDashboard}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        transaction={editTransaction}
        mode={editMode}
      />
      {deleteTarget && (
        <DeleteTransaction
          isOpen={!!deleteTarget}
          transaction={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default ModernRecentTransactionsWidget;
