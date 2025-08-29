/**
 * 🗑️ DELETE TRANSACTION COMPONENT - MOBILE-FIRST
 * Enhanced deletion modal with recurring transaction handling
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, AlertTriangle, Calendar, Clock, Target,
  X, CheckCircle, AlertCircle, Repeat, Zap
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import { useTranslation, useTheme, useNotifications, useCurrency } from '../../../stores';

import { Button, Modal, Badge } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

const DeleteTransaction = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
  isDeleting = false
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('transactions');
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();

  const [deleteMode, setDeleteMode] = useState('single'); // single, future, all
  const [confirmationText, setConfirmationText] = useState('');

  // Enhanced transaction data
  const transactionData = useMemo(() => {
    if (!transaction) return null;

    const isRecurring = Boolean(transaction.template_id || transaction.is_recurring);
    const isExpense = transaction.type === 'expense' || transaction.amount < 0;
    
    return {
      isRecurring,
      isExpense,
      formattedAmount: Math.abs(transaction.amount).toFixed(2),
      displayDate: dateHelpers.format(transaction.date, 'MMM dd, yyyy'),
      description: transaction.description || t('transactions.noDescription', 'No description'),
      category: transaction.category?.name || t('categories.uncategorized', 'Uncategorized')
    };
  }, [transaction, t]);

  // Delete mode options for recurring transactions
  const deleteModeOptions = useMemo(() => {
    if (!transactionData?.isRecurring) return [];

    return [
      {
        value: 'single',
        title: t('delete.recurring.single'),
        description: t('delete.recurring.singleDescription'),
        icon: Calendar,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20'
      },
      {
        value: 'future',
        title: t('delete.recurring.future'),
        description: t('delete.recurring.futureDescription'),
        icon: Clock,
        color: 'text-orange-600',
        bg: 'bg-orange-50 dark:bg-orange-900/20'
      },
      {
        value: 'all',
        title: t('delete.recurring.all'),
        description: t('delete.recurring.allDescription'),
        icon: Repeat,
        color: 'text-red-600',
        bg: 'bg-red-50 dark:bg-red-900/20'
      }
    ];
  }, [transactionData?.isRecurring, t]);

  // Handle delete confirmation
  const handleDelete = useCallback(async () => {
    if (!transaction) return;

    try {
      await onSuccess(transaction.id, {
        mode: transactionData?.isRecurring ? deleteMode : 'single',
        transaction
      });

      addNotification({
        type: 'success',
        message: t('toast.transactions.deleteSuccess', 'Transaction deleted successfully'),
        duration: 3000
      });

      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      
      addNotification({
        type: 'error',
        message: error.message || t('toast.transactions.transactionDeleteFailed', 'Failed to delete transaction. Please try again.'),
        duration: 5000
      });
    }
  }, [transaction, deleteMode, transactionData?.isRecurring, onSuccess, addNotification, t, onClose]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setDeleteMode('single');
    setConfirmationText('');
    onClose();
  }, [onClose]);

  if (!transaction || !transactionData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={transactionData.isRecurring ? t('delete.recurring.title') : t('delete.title')}
      size="lg"
      className="backdrop-blur-sm"
      mobileFullScreen={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Warning header */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl"
        >
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mr-3" />
          <div className="text-center">
            <p className="font-semibold text-red-900 dark:text-red-100">
              {t('delete.description')}
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {t('delete.warning')}
            </p>
          </div>
        </motion.div>

        {/* Transaction details */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {transactionData.description}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {transactionData.category} • {transactionData.displayDate}
              </p>
              {transactionData.isRecurring && (
                <Badge variant="secondary" className="mt-2">
                  <Repeat className="w-3 h-3 mr-1" />
                  {t('labels.recurring')}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <Badge 
                variant={transactionData.isExpense ? "destructive" : "success"}
                className="text-lg font-bold"
              >
                {transactionData.isExpense ? '-' : '+'}{formatCurrency(transactionData.formattedAmount)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Delete mode selection for recurring transactions */}
        {transactionData.isRecurring && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {t('delete.recurring.options')}
            </h4>
            
            <div className="space-y-3">
              {deleteModeOptions.map((option) => (
                <motion.div
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteMode(option.value)}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all",
                    deleteMode === option.value
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                    "bg-white dark:bg-gray-800"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      option.bg
                    )}>
                      <option.icon className={cn("w-5 h-5", option.color)} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {option.title}
                        </h5>
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 transition-all",
                          deleteMode === option.value
                            ? "border-red-500 bg-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        )}>
                          {deleteMode === option.value && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Action buttons - Better Touch Targets */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 py-3 text-base font-medium"
          >
            {t('actions.cancel')}
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            loading={isDeleting}
            className="flex-1 py-3 text-base font-medium bg-red-600 hover:bg-red-700 border-red-600 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? t('loading.deleting') : t('delete.confirm')}
          </Button>
        </div>

        {/* Additional warning for bulk deletes */}
        {transactionData.isRecurring && deleteMode !== 'single' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700"
          >
            <div className="flex items-center text-orange-800 dark:text-orange-200">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <p className="text-sm">
                {deleteMode === 'all' 
                  ? t('delete.recurring.allWarning')
                  : t('delete.recurring.futureWarning')
                }
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Modal>
  );
};

export default DeleteTransaction;