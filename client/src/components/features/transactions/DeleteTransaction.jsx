// components/features/transactions/DeleteTransaction.jsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trash2,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Repeat,
  StopCircle,
  CalendarX,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Pause,
  Play,
  Settings
} from 'lucide-react';

import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { dateHelpers, cn } from '../../../utils/helpers';
import { Modal, Button, Badge } from '../../ui';
import useToast from '../../../hooks/useToast';

/**
 * Enhanced DeleteTransaction Component - User-Friendly with Clear Options
 * Provides detailed explanations and visual guidance for delete actions
 */
const DeleteTransaction = ({
  transaction,
  isOpen,
  onClose,
  onConfirm,
  onOpenSkipDates,
  loading = false,
  isTemplate = false
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const { deleteTemplate } = useTransactionActions();
  const toastService = useToast();
  
  const [selectedAction, setSelectedAction] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isRTL = language === 'he';
  const isRecurring = Boolean(transaction?.template_id || transaction?.is_recurring);
  const isExpense = transaction?.transaction_type === 'expense' || transaction?.type === 'expense';

  // ✅ FIX: Add date validation helper
  const formatSafeDate = useCallback((date) => {
    if (!date) return t('common.notSet');
    
    try {
      // Check if date is valid
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided:', date);
        return t('common.invalidDate');
      }
      
      return dateHelpers.format(date, 'PPP', language);
    } catch (error) {
      console.error('Date formatting error:', error, 'Date:', date);
      return t('common.invalidDate');
    }
  }, [language, t]);

  // ✅ Enhanced Action Options with safe date formatting
  const actionOptions = [
    // Single occurrence option
    {
      id: 'single',
      title: t('transactions.delete.deleteOnce'),
      subtitle: t('transactions.deleteMessages.permanentDelete', { 
        type: isExpense ? t('transactions.expense') : t('transactions.income') 
      }),
      description: t('transactions.deleteOptions.single.description', {
        type: isExpense ? t('transactions.expense') : t('transactions.income'),
        date: formatSafeDate(transaction?.date) // ✅ FIX: Use safe date formatting
      }),
      icon: Trash2,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-700',
      bgColor: 'bg-red-50 dark:bg-red-900/10',
      recommended: true,
      permanent: true,
      available: true
    },
    
    // Skip dates option (only for recurring)
    {
      id: 'skip',
      title: t('transactions.delete.skipDates'),
      subtitle: t('transactions.delete.manageDates'),
      description: t('transactions.delete.skipDescription'),
      icon: CalendarX,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-700',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      recommended: false,
      permanent: false,
      available: isRecurring && !isTemplate,
      action: 'redirect'
    },
    
    // Stop future occurrences (only for recurring)
    {
      id: 'future',
      title: t('transactions.delete.stopRecurring'),
      subtitle: t('transactions.deleteMessages.permanentStop', { 
        type: isExpense ? t('transactions.expense') : t('transactions.income') 
      }),
      description: t('transactions.deleteOptions.future.description', {
        type: isExpense ? t('transactions.expense') : t('transactions.income'),
        date: formatSafeDate(transaction?.date) // ✅ FIX: Use safe date formatting
      }),
      icon: StopCircle,
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-700',
      bgColor: 'bg-orange-50 dark:bg-orange-900/10',
      recommended: false,
      permanent: true,
      available: isRecurring && !isTemplate,
      warning: true
    },
    
    // Delete all (template or recurring series)
    {
      id: 'all',
      title: isTemplate ? t('transactions.deleteTemplate') : t('transactions.delete.deleteAll'),
      subtitle: t('transactions.deleteMessages.permanentDelete', { 
        type: isTemplate ? t('transactions.template') : t('transactions.recurring') 
      }),
      description: t('transactions.delete.allDescription'),
      icon: AlertTriangle,
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-700',
      bgColor: 'bg-red-50 dark:bg-red-900/10',
      recommended: false,
      permanent: true,
      available: isRecurring || isTemplate,
      warning: true,
      danger: true
    }
  ];

  const availableOptions = actionOptions.filter(option => option.available);

  // ✅ Enhanced Action Handler with Clear Flow
  const handleActionSelect = useCallback((actionId) => {
    try {
      setSelectedAction(actionId);
      
      if (actionId === 'skip') {
        // Redirect to skip dates management
        if (toastService?.info) {
          toastService.info('toast.info.dataLoading');
        }
        onOpenSkipDates?.(transaction);
        onClose();
        return;
      }
      
      // For delete actions, show confirmation
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error in handleActionSelect:', error);
      if (toastService?.error) {
        toastService.error('Failed to process action. Please try again.');
      }
    }
  }, [transaction, onOpenSkipDates, onClose, toastService]);

  // ✅ Enhanced Confirmation Handler
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedAction) return;
    if (!onConfirm) {
      console.error('onConfirm is not provided');
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log('🗑️ DeleteTransaction: Starting delete with action:', selectedAction);
      
      switch (selectedAction) {
        case 'single':
          console.log('🗑️ Calling onConfirm with deleteSingle: true');
          await onConfirm(transaction, { deleteSingle: true });
          break;
          
        case 'future':
          console.log('🗑️ Calling onConfirm with deleteFuture: true');
          await onConfirm(transaction, { deleteFuture: true });
          break;
          
        case 'all':
          if (isTemplate) {
            console.log('🗑️ Calling onConfirm with deleteAll: true, deleteFuture: true (template)');
            await onConfirm(transaction, { deleteAll: true, deleteFuture: true });
          } else {
            console.log('🗑️ Calling onConfirm with deleteAll: true');
            await onConfirm(transaction, { deleteAll: true });
          }
          break;
          
        default:
          console.warn('Unknown action:', selectedAction);
          return;
      }
      
      console.log('🗑️ Delete successful');
      
      // Success feedback
      if (toastService?.success) {
        toastService.success('Transaction deleted successfully');
      }
      onClose();
      
    } catch (error) {
      console.error('🗑️ Delete failed in DeleteTransaction:', error);
      
      // Better error handling
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to delete transaction';
      
      if (toastService?.error) {
        toastService.error(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [selectedAction, transaction, onConfirm, isTemplate, onClose, toastService]);

  // ✅ Reset state when modal closes
  const handleClose = useCallback(() => {
    setSelectedAction(null);
    setShowConfirmation(false);
    setIsDeleting(false);
    onClose();
  }, [onClose]);

  // Get selected action details
  const selectedActionDetails = availableOptions.find(opt => opt.id === selectedAction);

  // ✅ Note: validation no longer needed here since parent only renders with valid transaction
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
      className="max-h-[90vh] overflow-hidden"
    >
      <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* ✅ ENHANCED: Header with Transaction Context */}
        <div className="flex items-center gap-4 mb-6 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-900/50 rounded-2xl">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('transactions.deleteConfirm')}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {transaction?.description || t('common.notSet')}
              </span>
              <Badge variant={isExpense ? "destructive" : "success"} size="small">
                {formatAmount(transaction?.amount || 0)}
              </Badge>
              {(isRecurring || isTemplate) && (
                <Badge variant="primary" size="small">
                  <Repeat className="w-3 h-3 mr-1" />
                  {isTemplate ? t('transactions.template') : t('transactions.recurring')}
                </Badge>
              )}
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* ✅ ENHANCED: Action Selection or Confirmation */}
        <div className="flex-1 overflow-y-auto px-6">
          <AnimatePresence mode="wait">
            {!showConfirmation ? (
              // Action Selection Phase
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Information Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        {isRecurring || isTemplate 
                          ? t('transactions.delete.recurringInfo')
                          : t('transactions.deleteConfirmDesc')
                        }
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {t('transactions.delete.cannotUndo')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ✅ ENHANCED: Action Options with Clear Visual Hierarchy */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('transactions.chooseDeleteOption')}
                  </h3>
                  
                  {availableOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      onClick={() => handleActionSelect(option.id)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        'hover:shadow-md hover:scale-[1.02]',
                        option.bgColor,
                        option.borderColor,
                        selectedAction === option.id && 'ring-2 ring-primary-500'
                      )}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={cn('p-3 rounded-xl', option.iconBg)}>
                          <option.icon className={cn('w-6 h-6', option.iconColor)} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {option.title}
                            </h4>
                            
                            {/* Status Badges */}
                            <div className="flex gap-2">
                              {option.recommended && (
                                <Badge variant="success" size="small">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {t('common.recommended')}
                                </Badge>
                              )}
                              
                              {option.permanent && (
                                <Badge variant="secondary" size="small">
                                  <Shield className="w-3 h-3 mr-1" />
                                  {t('common.permanent')}
                                </Badge>
                              )}
                              
                              {option.warning && (
                                <Badge variant="warning" size="small">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  {t('common.warning')}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {option.subtitle}
                          </p>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {option.description}
                          </p>
                          
                          {/* Additional Info */}
                          {option.id === 'skip' && (
                            <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/50 rounded-lg">
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                {t('transactions.delete.skipModalInfo')}
                              </p>
                            </div>
                          )}
                          
                          {option.danger && (
                            <div className="mt-3 p-3 bg-red-100 dark:bg-red-800/50 rounded-lg">
                              <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                                {t('transactions.delete.allWarning')}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Arrow */}
                        <ArrowRight className="w-5 h-5 text-gray-400 self-center" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              // Confirmation Phase
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* ✅ ENHANCED: Final Confirmation with Clear Summary */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-700">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl">
                      <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                        {t('transactions.deleteMessages.finalConfirmation')}
                      </h3>
                      
                      <p className="text-red-700 dark:text-red-300 mb-4">
                        {selectedActionDetails?.subtitle}
                      </p>
                      
                      <div className="bg-white dark:bg-red-900/30 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-red-900 dark:text-red-100">
                          {t('transactions.deleteMessages.summaryOfChanges')}
                        </h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <selectedActionDetails.icon className="w-4 h-4 text-red-600" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {t('transactions.deleteMessages.deleteItem', {
                                description: transaction?.description,
                                amount: formatAmount(transaction?.amount)
                              })}
                            </span>
                          </div>
                          
                          {selectedAction === 'future' && (
                            <div className="flex items-center gap-2 text-sm">
                              <StopCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {t('transactions.deleteMessages.cancelFutureOccurrences')}
                              </span>
                            </div>
                          )}
                          
                          {selectedAction === 'all' && (
                            <div className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {t('transactions.deleteMessages.summaryDeleteAll')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-4">
                        {t('transactions.deleteMessages.thisActionCannotBeUndone')}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Transaction Details Reminder */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {t('transactions.transactionDetails')}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t('common.description')}:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {transaction?.description || t('common.notSet')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t('common.amount')}:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatAmount(transaction?.amount || 0)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t('common.date')}:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatSafeDate(transaction?.date)} {/* ✅ FIX: Use safe date formatting */}
                      </p>
                    </div>
                    {transaction?.category_name && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('common.category')}:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{transaction.category_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ✅ ENHANCED: Action Buttons with Clear Labels */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
          {!showConfirmation ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              
              <Button
                variant="primary"
                onClick={() => selectedAction && handleActionSelect(selectedAction)}
                disabled={!selectedAction}
                className="flex-1"
              >
                {selectedAction === 'skip' 
                  ? t('transactions.delete.openSkipModal')
                  : t('common.continue')
                }
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
                disabled={isDeleting}
              >
                {t('common.back')}
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                loading={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('transactions.deleteMessages.confirmDeletion')}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DeleteTransaction;