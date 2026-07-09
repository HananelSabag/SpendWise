/**
 * 🗑️ DELETE TRANSACTION — Confirmation dialog (centered modal, intentional)
 */

import React, { useCallback, useMemo } from 'react';
import { Trash2, AlertTriangle, Landmark } from 'lucide-react';

import { useTranslation, useCurrency } from '../../../stores';
import { Button, Modal, Badge } from '../../ui';
import { dateHelpers } from '../../../utils/helpers';
import { institutionLabel } from '../bankSync/bankSyncMeta';

const DeleteTransaction = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
  isDeleting = false,
}) => {
  const { t, isRTL, currentLanguage } = useTranslation('transactions');
  const { formatCurrency }   = useCurrency();

  const transactionData = useMemo(() => {
    if (!transaction) return null;
    return {
      isExpense:   transaction.type === 'expense' || transaction.amount < 0,
      formattedAmount: Math.abs(transaction.amount).toFixed(2),
      displayDate: dateHelpers.format(transaction.date, 'MMM dd, yyyy'),
      description: transaction.description || t('noDescription', 'No description'),
      sourceLabel: transaction.bank_source
        ? institutionLabel(transaction.bank_source, currentLanguage)
        : t('manualEntry', 'Manual entry'),
    };
  }, [transaction, t, currentLanguage]);

  const handleDelete = useCallback(async () => {
    if (!transaction) return;
    try {
      // onSuccess runs the delete mutation, which shows its own toast.
      await onSuccess(transaction.id, { transaction });
      onClose();
    } catch (error) {
      // mutation error toast is handled by the mutation itself
    }
  }, [transaction, onSuccess, onClose]);

  if (!transaction || !transactionData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('delete.title', 'Delete Transaction')}
      size="md"
    >
      <div className="p-5 space-y-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

        {/* Warning banner — bank rows are hidden (they'd re-import from the
            bank otherwise), manual rows are really deleted. Say which. */}
        <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">{t('delete.description', 'This action cannot be undone')}</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
              {transaction.bank_source
                ? t('delete.bankWarning', 'The transaction will be removed from your data and will not re-import on future syncs')
                : t('delete.warning', 'The transaction will be permanently removed')}
            </p>
          </div>
        </div>

        {/* Transaction details */}
        <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{transactionData.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
              {transaction.bank_source && <Landmark className="w-3 h-3 shrink-0" />}
              {transactionData.sourceLabel} · {transactionData.displayDate}
            </p>
          </div>
          <Badge
            variant={transactionData.isExpense ? 'destructive' : 'success'}
            className="text-sm font-bold shrink-0 ml-3"
          >
            {transactionData.isExpense ? '-' : '+'}{formatCurrency(transactionData.formattedAmount)}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="flex-1 h-10 text-sm">
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
