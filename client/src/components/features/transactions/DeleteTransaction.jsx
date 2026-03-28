/**
 * 🗑️ DELETE TRANSACTION — Confirmation dialog (centered modal, intentional)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Trash2, AlertTriangle, Calendar, Clock, Repeat, AlertCircle } from 'lucide-react';

import { useTranslation, useNotifications, useCurrency } from '../../../stores';
import { Button, Modal, Badge } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

const DeleteTransaction = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
  isDeleting = false,
}) => {
  const { t, isRTL }        = useTranslation('transactions');
  const { addNotification }  = useNotifications();
  const { formatCurrency }   = useCurrency();

  const [deleteMode, setDeleteMode] = useState('single');

  const transactionData = useMemo(() => {
    if (!transaction) return null;
    return {
      isRecurring: Boolean(transaction.template_id || transaction.is_recurring),
      isExpense:   transaction.type === 'expense' || transaction.amount < 0,
      formattedAmount: Math.abs(transaction.amount).toFixed(2),
      displayDate: dateHelpers.format(transaction.date, 'MMM dd, yyyy'),
      description: transaction.description || t('noDescription', 'No description'),
      category:    transaction.category?.name || t('categories.uncategorized', 'Uncategorized'),
    };
  }, [transaction, t]);

  const deleteModeOptions = useMemo(() => {
    if (!transactionData?.isRecurring) return [];
    return [
      { value: 'single', icon: Calendar, title: t('delete.recurring.single'),  description: t('delete.recurring.singleDescription'),  color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20'   },
      { value: 'future', icon: Clock,    title: t('delete.recurring.future'),  description: t('delete.recurring.futureDescription'),  color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
      { value: 'all',    icon: Repeat,   title: t('delete.recurring.all'),     description: t('delete.recurring.allDescription'),     color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20'     },
    ];
  }, [transactionData?.isRecurring, t]);

  const handleDelete = useCallback(async () => {
    if (!transaction) return;
    try {
      await onSuccess(transaction.id, {
        mode: transactionData?.isRecurring ? deleteMode : 'single',
        transaction,
      });
      addNotification({ type: 'success', message: t('toast.transactions.deleteSuccess', 'Transaction deleted'), duration: 3000 });
      onClose();
    } catch (error) {
      addNotification({ type: 'error', message: error.message || t('toast.transactions.transactionDeleteFailed', 'Failed to delete'), duration: 5000 });
    }
  }, [transaction, deleteMode, transactionData?.isRecurring, onSuccess, addNotification, t, onClose]);

  const handleClose = useCallback(() => {
    setDeleteMode('single');
    onClose();
  }, [onClose]);

  if (!transaction || !transactionData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={transactionData.isRecurring ? t('delete.recurring.title', 'Delete Recurring') : t('delete.title', 'Delete Transaction')}
      size="md"
    >
      <div className="p-5 space-y-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

        {/* Warning banner */}
        <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">{t('delete.description', 'This action cannot be undone')}</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{t('delete.warning', 'The transaction will be permanently removed')}</p>
          </div>
        </div>

        {/* Transaction details */}
        <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{transactionData.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{transactionData.category} · {transactionData.displayDate}</p>
            {transactionData.isRecurring && (
              <Badge variant="secondary" className="mt-1.5 text-xs">
                <Repeat className="w-3 h-3 mr-1" />{t('labels.recurring', 'Recurring')}
              </Badge>
            )}
          </div>
          <Badge
            variant={transactionData.isExpense ? 'destructive' : 'success'}
            className="text-sm font-bold shrink-0 ml-3"
          >
            {transactionData.isExpense ? '-' : '+'}{formatCurrency(transactionData.formattedAmount)}
          </Badge>
        </div>

        {/* Recurring delete mode options */}
        {transactionData.isRecurring && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('delete.recurring.options', 'Delete scope')}
            </p>
            {deleteModeOptions.map(opt => {
              const Icon = opt.icon;
              const active = deleteMode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDeleteMode(opt.value)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all',
                    active
                      ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', opt.bg)}>
                    <Icon className={cn('w-4 h-4', opt.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.description}</p>
                  </div>
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 transition-colors',
                    active ? 'border-red-500 bg-red-500' : 'border-gray-300 dark:border-gray-600'
                  )} />
                </button>
              );
            })}
          </div>
        )}

        {/* Bulk delete warning */}
        {transactionData.isRecurring && deleteMode !== 'single' && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800 dark:text-orange-200">
              {deleteMode === 'all' ? t('delete.recurring.allWarning') : t('delete.recurring.futureWarning')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting} className="flex-1 h-10 text-sm">
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            loading={isDeleting}
            className="flex-1 h-10 text-sm bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            {isDeleting ? t('loading.deleting', 'Deleting...') : t('delete.confirm', 'Delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteTransaction;
