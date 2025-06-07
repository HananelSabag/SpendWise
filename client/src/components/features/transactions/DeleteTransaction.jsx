// components/features/transactions/DeleteTransaction.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  AlertTriangle,
  X,
  Calendar,
  Repeat,
  DollarSign,
  Info,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useTransactions } from '../../../hooks/useTransactions';
import { dateHelpers } from '../../../utils/helpers';
import { Button, Modal, Alert, Badge } from '../../ui';

/**
 * DeleteTransaction Component
 * Enhanced confirmation dialog for transaction deletion
 * Provides different options for recurring transactions
 * Includes safety measures and clear explanations
 */
const DeleteTransaction = ({
  transaction,
  isOpen,
  onClose,
  onOpenSkipDates,
  loading = false
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const { deleteTransaction, isDeleting } = useTransactions();
  const isRTL = language === 'he';
  
  // State
  const [deleteOption, setDeleteOption] = useState('single');
  const [confirmed, setConfirmed] = useState(false);

  if (!transaction) return null;

  const isRecurring = transaction.is_recurring || transaction.template_id;
  const transactionType = transaction.transaction_type;

  // Enhanced delete options for recurring transactions
  const deleteOptions = [
    {
      id: 'single',
      title: t('transactions.delete.singleOccurrence') || 'Delete this occurrence only',
      description: (() => {
        const date = new Date(transaction.date + 'T12:00:00');
        const formattedDate = date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        return `Remove just this specific ${transactionType} on ${formattedDate}. The recurring pattern will continue for future dates.`;
      })(),
      icon: Calendar,
      color: 'blue',
      recommended: true,
      apiAction: 'single'
    },
    {
      id: 'skip',
      title: t('transactions.delete.skipDates') || 'Skip specific dates',
      description: t('transactions.delete.skipDescription') || 'Choose specific dates to skip for this recurring transaction while keeping the pattern active.',
      icon: Clock,
      color: 'purple',
      special: true,
      apiAction: 'skip'
    },
    {
      id: 'future',
      title: t('transactions.delete.stopRecurring') || 'Stop recurring from this date',
      description: (() => {
        const date = new Date(transaction.date + 'T12:00:00');
        const formattedDate = date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        return `Cancel this ${transactionType} from ${formattedDate} onwards. All future occurrences will be removed.`;
      })(),
      icon: Repeat,
      color: 'orange',
      warning: true,
      apiAction: 'future'
    },
    {
      id: 'all',
      title: t('transactions.delete.deleteAll') || 'Delete entire recurring series',
      description: t('transactions.delete.allDescription') || 'Permanently delete this recurring transaction and all its past and future occurrences.',
      icon: Trash2,
      color: 'red',
      danger: true,
      apiAction: 'all'
    }
  ];

  // Handle confirmation
  const handleConfirm = async () => {
    // ✅ FIX: Handle skip dates option immediately without confirmation step
    if (deleteOption === 'skip') {
      handleClose();
      onOpenSkipDates?.(transaction);
      return;
    }

    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    try {
      // ✅ FIX: Use hook's deleteTransaction function directly
      const transactionType = transaction.transaction_type || transaction.type;
      
      // Map delete options to API parameters
      let deleteFuture = false;
      
      switch (deleteOption) {
        case 'future':
          deleteFuture = true;
          break;
        case 'all':
          deleteFuture = true;
          break;
        default:
          deleteFuture = false;
      }

      await deleteTransaction(transactionType, transaction.id, deleteFuture);
      
      // ✅ ADD: Close modal on success
      handleClose();
      
    } catch (error) {
      console.error('Delete failed:', error);
      // Error handling is done by the hook via toast
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setDeleteOption('single');
    setConfirmed(false);
    onClose?.();
  };

  // Format frequency
  const formatFrequency = (interval) => {
    const frequencies = {
      daily: t('actions.frequencies.daily'),
      weekly: t('actions.frequencies.weekly'),
      monthly: t('actions.frequencies.monthly')
    };
    return frequencies[interval] || interval;
  };

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: isRTL ? -20 : 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      x: isRTL ? 20 : -20,
      transition: { duration: 0.2 }
    }
  };

  const optionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }),
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
      className="max-w-3xl"
      hideHeader={true}
      preventBackdropClose={isDeleting}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        className="relative"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 -m-6 mb-6 rounded-t-xl">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {confirmed ? 'Confirm Deletion' : t('transactions.deleteConfirm')}
                </h2>
                <p className="text-white/80 text-sm">
                  {confirmed 
                    ? 'This action cannot be undone'
                    : isRecurring 
                      ? 'Choose how to delete this recurring transaction'
                      : 'Are you sure you want to delete this transaction?'
                  }
                </p>
              </div>
            </div>

            {!isDeleting && (
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Transaction Preview */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {transaction.description}
                  </h3>
                  {isRecurring && (
                    <Badge variant="primary" className="text-xs">
                      <Repeat className="w-3 h-3 mr-1" />
                      {formatFrequency(transaction.recurring_interval)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {/* ✅ FIX: Use local timezone date formatting */}
                    {(() => {
                      const date = new Date(transaction.date + 'T12:00:00');
                      return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                    })()}
                  </span>
                  
                  {transaction.category_name && (
                    <span>{t(`categories.${transaction.category_name}`)}</span>
                  )}
                </div>
              </div>

              <div className={`text-right ${
                transaction.transaction_type === 'expense' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                <div className="text-xl font-bold">
                  {transaction.transaction_type === 'expense' ? '-' : '+'}
                  {formatAmount(transaction.amount)}
                </div>
                
                {isRecurring && transaction.daily_amount && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAmount(transaction.daily_amount)}/day
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Delete Options */}
          <AnimatePresence mode="wait">
            {!confirmed ? (
              <motion.div
                key="options"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                {isRecurring ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('transactions.delete.recurringInfo')}
                      </p>
                    </div>

                    {deleteOptions.map((option, index) => {
                      const IconComponent = option.icon;
                      const isSelected = deleteOption === option.id;
                      
                      return (
                        <motion.label
                          key={option.id}
                          custom={index}
                          variants={optionVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                          className={`relative block cursor-pointer`}
                        >
                          <input
                            type="radio"
                            name="deleteOption"
                            value={option.id}
                            checked={isSelected}
                            onChange={() => setDeleteOption(option.id)}
                            className="sr-only"
                          />
                          
                          <div className={`p-5 rounded-xl border-2 transition-all ${
                            isSelected
                              ? option.danger
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : option.warning
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : option.special
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                isSelected
                                  ? option.danger
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : option.warning
                                    ? 'bg-orange-100 dark:bg-orange-900/30'
                                    : option.special
                                    ? 'bg-purple-100 dark:bg-purple-900/30'
                                    : 'bg-primary-100 dark:bg-primary-900/30'
                                  : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <IconComponent className={`w-5 h-5 ${
                                  isSelected
                                    ? option.danger
                                      ? 'text-red-600 dark:text-red-400'
                                      : option.warning
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : option.special
                                      ? 'text-purple-600 dark:text-purple-400'
                                      : 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`} />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-semibold ${
                                    isSelected
                                      ? option.danger
                                        ? 'text-red-700 dark:text-red-300'
                                        : option.warning
                                        ? 'text-orange-700 dark:text-orange-300'
                                        : option.special
                                        ? 'text-purple-700 dark:text-purple-300'
                                        : 'text-primary-700 dark:text-primary-300'
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {option.title}
                                  </h4>
                                  
                                  {option.recommended && (
                                    <Badge variant="success" className="text-xs">
                                      {t('common.recommended')}
                                    </Badge>
                                  )}
                                  
                                  {option.warning && (
                                    <Badge variant="warning" className="text-xs">
                                      ⚠️ {t('transactions.delete.permanent')}
                                    </Badge>
                                  )}

                                  {option.danger && (
                                    <Badge variant="danger" className="text-xs">
                                      🚫 {t('transactions.delete.irreversible')}
                                    </Badge>
                                  )}

                                  {option.special && (
                                    <Badge variant="purple" className="text-xs">
                                      ✨ {t('transactions.delete.manageDates')}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {option.description}
                                </p>

                                {/* Special information for different options */}
                                {option.id === 'skip' && (
                                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2 font-medium">
                                      <ArrowRight className="w-4 h-4" />
                                      {t('transactions.delete.skipRedirect') || 'Opens date picker to select specific dates to skip'}
                                    </p>
                                  </div>
                                )}

                                {option.id === 'future' && transaction.next_recurrence_date && (
                                  <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {t('transactions.delete.nextOccurrence', {
                                        date: (() => {
                                          const date = new Date(transaction.next_recurrence_date + 'T12:00:00');
                                          return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          });
                                        })()
                                      })}
                                    </p>
                                  </div>
                                )}

                                {option.id === 'all' && (
                                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <p className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      {t('transactions.delete.allWarning')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.label>
                      );
                    })}
                  </div>
                ) : (
                  <Alert type="warning">
                    <AlertTriangle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{t('transactions.delete.cannotUndo')}</p>
                      <p className="text-sm mt-1">
                        {t('transactions.delete.confirmSingle', { type: transactionType })}
                      </p>
                    </div>
                  </Alert>
                )}
              </motion.div>
            ) : (
              // ✅ FIX: Remove skip option from confirmation step since it redirects immediately
              <motion.div
                key="confirmation"
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <Alert type="error">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{t('transactions.delete.finalConfirmation')}</p>
                    <p className="text-sm mt-1">
                      {deleteOption === 'all'
                        ? t('transactions.delete.confirmAll')
                        : deleteOption === 'future'
                        ? t('transactions.delete.confirmFuture', { type: transactionType })
                        : t('transactions.delete.confirmSingle', { type: transactionType })
                    }</p>
                  </div>
                </Alert>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('transactions.delete.summaryChanges')}
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      {deleteOption === 'skip' 
                        ? t('transactions.delete.summarySkip')
                        : t('transactions.delete.summaryDelete', {
                            description: transaction.description,
                            amount: formatAmount(transaction.amount)
                          })
                      }
                    </li>
                    {(deleteOption === 'future' || deleteOption === 'all') && isRecurring && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        {deleteOption === 'all' 
                          ? t('transactions.delete.summaryDeleteAll')
                          : t('transactions.delete.summaryCancelFuture')
                        }
                      </li>
                    )}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            {!confirmed ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isDeleting}
                  size="large"
                >
                  {t('common.cancel')}
                </Button>
                
                <Button
                  variant={deleteOption === 'skip' ? 'primary' : 'danger'}
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="min-w-[140px]"
                  size="large"
                >
                  {deleteOption === 'skip' ? (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      {t('transactions.delete.openSkipDates') || 'Skip Dates'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteOption === 'all' 
                        ? t('transactions.delete.deleteAll')
                        : deleteOption === 'future'
                        ? t('transactions.delete.stopRecurring')
                        : isRecurring 
                          ? t('transactions.delete.deleteOnce')
                          : t('common.delete')
                      }
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setConfirmed(false)}
                  disabled={isDeleting}
                >
                  {t('common.goBack')}
                </Button>
                
                <Button
                  variant={deleteOption === 'skip' ? 'primary' : 'danger'}
                  onClick={handleConfirm}
                  loading={isDeleting}
                  disabled={isDeleting}
                  className="min-w-[140px]"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      {deleteOption === 'skip' 
                        ? t('common.redirecting')
                        : t('common.deleting')
                      }
                    </div>
                  ) : deleteOption === 'skip' ? (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      {t('transactions.delete.openSkipModal')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      {t('transactions.delete.confirmDelete')}
                    </div>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Modal>
  );
};

export default DeleteTransaction;