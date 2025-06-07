// components/features/transactions/TransactionCard.jsx
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Edit2,
  Trash2,
  Calendar,
  Clock,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Info,
  Tag,
  Repeat,
  Calendar as CalendarIcon,
  Pause,
  Play,
  Settings,
  AlertTriangle
} from 'lucide-react';

import { useTransactions, useTransactionTemplates } from '../../../hooks/useTransactions';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { dateHelpers, cn } from '../../../utils/helpers';
import { Badge, Button, Modal } from '../../ui';
import EditTransactionPanel from './EditTransactionPanel';
import DeleteTransaction from './DeleteTransaction';
import toast from 'react-hot-toast';

/**
 * TransactionCard Component - Handles both regular and recurring transactions
 * Provides appropriate actions based on transaction type
 */
const TransactionCard = ({
  transaction,
  onEditCallback,
  onDeleteCallback,
  onEditSingle,
  onOpenRecurringManager,
  onOpenSkipDates,
  showActions = true,
  variant = 'default',
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  
  // Hook operations
  const {
    updateTransaction,
    deleteTransaction,
    isUpdating,
    isDeleting,
    refresh
  } = useTransactions();

  const {
    updateTemplate,
    skipDates,
    isSkipping
  } = useTransactionTemplates();

  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSingle, setEditingSingle] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isRTL = language === 'he';
  
  // ✅ FIX: Properly identify recurring transactions
  const isRecurring = Boolean(transaction.template_id || transaction.is_recurring);
  const isTemplate = Boolean(transaction.id && !transaction.template_id && transaction.interval_type);
  const isExpense = transaction.transaction_type === 'expense' || transaction.type === 'expense';

  // ✅ FIX: Enhanced edit handlers - different for regular vs recurring
  const handleEditClick = useCallback(() => {
    if (isTemplate) {
      // This is a template, edit the template
      onEditCallback?.(transaction);
    } else if (isRecurring) {
      // This is a recurring transaction instance, offer both options
      setEditingSingle(false);
      setShowEditModal(true);
    } else {
      // Regular transaction
      setEditingSingle(false);
      setShowEditModal(true);
    }
  }, [transaction, isTemplate, isRecurring, onEditCallback]);

  const handleEditSingleOccurrence = useCallback(() => {
    if (!isRecurring) return;
    
    setEditingSingle(true);
    setShowEditModal(true);
    onEditSingle?.(transaction);
  }, [transaction, isRecurring, onEditSingle]);

  // ✅ FIX: Proper edit success handling
  const handleEditSuccess = useCallback(async (updatedData) => {
    try {
      if (isTemplate) {
        // Update template
        await updateTemplate(transaction.id, updatedData);
      } else {
        // Update transaction (single or future)
        await updateTransaction(
          transaction.transaction_type || transaction.type,
          transaction.id,
          updatedData,
          !editingSingle && isRecurring // updateFuture only for recurring template updates
        );
      }
      
      setShowEditModal(false);
      setEditingSingle(false);
      await refresh();
      onEditCallback?.(transaction);
    } catch (error) {
      console.error('Edit failed:', error);
    }
  }, [transaction, editingSingle, isTemplate, isRecurring, updateTransaction, updateTemplate, refresh, onEditCallback]);

  // ✅ FIX: Enhanced delete handling
  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
    onDeleteCallback?.(transaction);
  }, [transaction, onDeleteCallback]);

  const handleDeleteConfirm = useCallback(async (transactionToDelete, deleteFuture = false, deleteAll = false) => {
    try {
      if (isTemplate) {
        // Delete template (uses deleteTemplate from templates hook)
        // This is handled in the DeleteTransaction modal
      } else {
        // Delete transaction
        await deleteTransaction(
          transactionToDelete.transaction_type || transactionToDelete.type,
          transactionToDelete.id,
          deleteFuture
        );
      }
      
      setShowDeleteModal(false);
      await refresh();
      onDeleteCallback?.(transactionToDelete);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [isTemplate, deleteTransaction, refresh, onDeleteCallback]);

  // ✅ FIX: Skip functionality - only for recurring transactions with template_id
  const handleQuickSkip = useCallback(async () => {
    if (!transaction.template_id && !isTemplate) {
      toast.error(t('transactions.cannotSkipNonRecurring'));
      return;
    }
    
    try {
      const templateId = transaction.template_id || transaction.id;
      const nextDate = getNextOccurrenceDate(transaction);
      
      if (!nextDate) {
        toast.error(t('transactions.noNextOccurrence'));
        return;
      }
      
      await skipDates(templateId, [nextDate]);
      toast.success(t('transactions.nextOccurrenceSkipped'));
      refresh();
    } catch (error) {
      toast.error(t('common.error'));
    }
  }, [transaction, isTemplate, skipDates, refresh, t]);

  // ✅ FIX: Toggle active - only for templates
  const handleToggleActive = useCallback(async () => {
    const templateId = transaction.template_id || (isTemplate ? transaction.id : null);
    
    if (!templateId) {
      toast.error(t('transactions.cannotToggleNonTemplate'));
      return;
    }
    
    try {
      await updateTemplate(templateId, {
        is_active: !transaction.is_active
      });
      
      toast.success(transaction.is_active ? t('transactions.paused') : t('transactions.resumed'));
      refresh();
    } catch (error) {
      toast.error(t('common.error'));
    }
  }, [transaction, isTemplate, updateTemplate, refresh, t]);

  // Helper to get next occurrence date
  const getNextOccurrenceDate = (transaction) => {
    if (transaction.next_recurrence_date || transaction.next_occurrence) {
      return transaction.next_recurrence_date || transaction.next_occurrence;
    }
    
    // Calculate next date based on interval
    const today = new Date();
    const nextDate = new Date(today);
    
    switch (transaction.interval_type || transaction.recurring_interval) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return null;
    }
    
    return nextDate.toISOString().split('T')[0];
  };

  const formatFrequency = useCallback((interval) => {
    if (!interval) return t('actions.frequencies.oneTime') || 'One-time';
    return t(`actions.frequencies.${interval}`) || interval;
  }, [t]);

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    hover: {
      scale: 1.01,
      y: -2,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }
  };

  // ✅ FIX: Add tooltip component for better UX
  const Tooltip = ({ children, content, position = "top" }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    return (
      <div 
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        {isVisible && (
          <div className={cn(
            "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap",
            position === "top" && "-top-8 left-1/2 transform -translate-x-1/2",
            position === "bottom" && "top-full left-1/2 transform -translate-x-1/2 mt-1"
          )}>
            {content}
            <div className={cn(
              "absolute w-0 h-0 border-l-4 border-r-4 border-transparent",
              position === "top" && "top-full left-1/2 transform -translate-x-1/2 border-t-4 border-t-gray-900",
              position === "bottom" && "bottom-full left-1/2 transform -translate-x-1/2 border-b-4 border-b-gray-900"
            )}></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={variant === 'default' ? "hover" : undefined}
      className={cn(
        'relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300',
        'border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600',
        'backdrop-blur-sm',
        variant === 'compact' && 'p-4',
        variant === 'default' && 'p-5',
        (isRecurring || isTemplate) && 'ring-1 ring-primary-500/20 bg-gradient-to-br from-white via-primary-50/30 to-white dark:from-gray-800 dark:via-primary-900/10 dark:to-gray-800',
        className
      )}
    >
      {/* Recurring/Template Indicator */}
      {(isRecurring || isTemplate) && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-bl-lg rounded-tr-2xl">
          <div className="absolute inset-0.5 bg-white dark:bg-gray-800 rounded-bl-sm rounded-tr-lg">
            <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-500 rounded-bl-sm rounded-tr-lg"></div>
          </div>
        </div>
      )}

      {/* Status indicators */}
      {isTemplate && !transaction.is_active && (
        <div className="absolute top-2 left-2">
          <Badge variant="warning" size="small">
            <Pause className="w-3 h-3 mr-1" />
            {t('transactions.paused')}
          </Badge>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'relative p-3 rounded-2xl flex-shrink-0 shadow-sm',
          isExpense 
            ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30' 
            : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30'
        )}>
          <div className={cn(
            'absolute inset-0 rounded-2xl blur-sm opacity-20',
            isExpense ? 'bg-red-200' : 'bg-green-200'
          )}></div>
          {isExpense ? (
            <TrendingDown className="relative w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <TrendingUp className="relative w-5 h-5 text-green-600 dark:text-green-400" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg mb-2 leading-tight">
                {transaction.description}
              </h3>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Date */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {dateHelpers.format(transaction.date, 'MMM dd', language)}
                  </span>
                </div>
                
                {/* Category */}
                {transaction.category_name && (
                  <Badge variant="secondary" size="small" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 px-2.5 py-1">
                    <Tag className="w-3 h-3 mr-1.5" />
                    {transaction.category_name}
                  </Badge>
                )}
                
                {/* Recurring/Template Badge */}
                {(isRecurring || isTemplate) && (
                  <Badge variant="primary" size="small" className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 shadow-sm px-2.5 py-1">
                    <Repeat className="w-3 h-3 mr-1.5" />
                    {isTemplate ? t('transactions.template') : formatFrequency(transaction.recurring_interval || transaction.interval_type)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <div className={cn(
                'text-2xl font-bold tracking-tight mb-1',
                isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              )}>
                <span className="text-lg opacity-75">{isExpense ? '-' : '+'}</span>
                {formatAmount(transaction.amount)}
              </div>
              
              {/* Template monthly impact */}
              {isTemplate && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-md inline-block">
                  {transaction.occurrence_count || 0} {t('transactions.occurrences')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        {/* Expand Button */}
        {(isRecurring || isTemplate) && (
          <Button
            variant="ghost"
            size="small"
            onClick={() => setExpanded(!expanded)}
            className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl px-3 py-2 flex items-center gap-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm font-medium">Hide Options</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="text-sm font-medium">Show Options</span>
              </>
            )}
          </Button>
        )}
        
        {/* ✅ SIMPLE ACTIONS: Just Edit and Delete for non-expanded view */}
        {showActions && !expanded && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="small"
              onClick={handleEditClick}
              disabled={isUpdating}
              className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              <span className="font-medium">Edit</span>
            </Button>
            
            <Button
              variant="ghost"
              size="small"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="font-medium">Delete</span>
            </Button>
          </div>
        )}
      </div>

      {/* ✅ ENHANCED: Expanded Actions - Clear Cards with Explanations */}
      {expanded && showActions && (isRecurring || isTemplate) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 space-y-4"
        >
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-1">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-4 pt-3">
              What would you like to do?
            </h4>
            
            <div className="space-y-3 p-3">
              
              {/* ✅ ACTION CARD 1: Edit This Transaction */}
              {!isTemplate && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Edit Only This Transaction
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Change the amount, description, or category for this specific transaction only. Future recurring transactions will stay the same.
                      </p>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={handleEditSingleOccurrence}
                        disabled={isUpdating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Edit This One Only
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* ✅ ACTION CARD 2: Edit All Future Transactions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {isTemplate ? 'Edit Template Settings' : 'Edit All Future Transactions'}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {isTemplate 
                        ? 'Change the template settings. This will affect all future transactions created from this template.'
                        : 'Change the amount, description, or category for this and all future recurring transactions.'
                      }
                    </p>
                    <Button
                      variant="primary"
                      size="small"
                      onClick={handleEditClick}
                      disabled={isUpdating}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isTemplate ? 'Edit Template' : 'Edit All Future'}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* ✅ ACTION CARD 3: Skip Next Payment */}
              {(!isTemplate || transaction.is_active) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                      <CalendarIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Skip Next Payment
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Skip the next scheduled transaction. The one after that will still happen as normal. Good for temporary skips like vacation months.
                      </p>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={handleQuickSkip}
                        loading={isSkipping}
                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      >
                        Skip Next Payment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* ✅ ACTION CARD 4: Pause/Resume Template */}
              {isTemplate && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      transaction.is_active 
                        ? 'bg-orange-100 dark:bg-orange-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      {transaction.is_active ? (
                        <Pause className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {transaction.is_active ? 'Pause This Recurring Transaction' : 'Resume This Recurring Transaction'}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {transaction.is_active 
                          ? 'Stop creating new transactions from this template. You can resume it later. Existing transactions will not be affected.'
                          : 'Start creating new transactions from this template again. Future payments will resume according to the schedule.'
                        }
                      </p>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={handleToggleActive}
                        loading={isUpdating}
                        className={transaction.is_active 
                          ? 'border-orange-300 text-orange-700 hover:bg-orange-50' 
                          : 'border-green-300 text-green-700 hover:bg-green-50'
                        }
                      >
                        {transaction.is_active ? 'Pause Recurring' : 'Resume Recurring'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* ✅ ACTION CARD 5: Advanced Options */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Advanced Recurring Options
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Open the recurring manager to skip specific dates, view all occurrences, change frequency, or set end dates.
                    </p>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => {
                        // ✅ FIX: Close current expanded view and open recurring manager
                        setExpanded(false);
                        onOpenRecurringManager?.(transaction);
                      }}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Open Advanced Options
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* ✅ ACTION CARD 6: Delete Options */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700 p-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                      Delete This Transaction
                    </h5>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      Permanently remove this transaction. You'll be asked whether to delete just this one or all future recurring transactions.
                    </p>
                    <Button
                      variant="destructive"
                      size="small"
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Transaction
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ✅ SIMPLIFIED: Show transaction details only when expanded */}
      {expanded && (isRecurring || isTemplate) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
        >
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl p-4 space-y-4">
            
            {/* ✅ SIMPLIFIED: Just show key information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Next Payment Date */}
              {(transaction.next_recurrence_date || transaction.next_occurrence) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                      Next Payment
                    </h4>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {dateHelpers.format(transaction.next_recurrence_date || transaction.next_occurrence, 'PPP', language)}
                  </p>
                </div>
              )}
              
              {/* How Often */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 text-sm">
                    How Often
                  </h4>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatFrequency(transaction.recurring_interval || transaction.interval_type)}
                </p>
              </div>
            </div>
            
            {/* Template Status */}
            {isTemplate && (
              <div className={cn(
                "rounded-lg p-4 border",
                transaction.is_active 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                  : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700"
              )}>
                <div className="flex items-center gap-3">
                  {transaction.is_active ? (
                    <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Pause className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  )}
                  <div>
                    <h4 className={cn(
                      "font-medium",
                      transaction.is_active 
                        ? "text-green-900 dark:text-green-100"
                        : "text-orange-900 dark:text-orange-100"
                    )}>
                      {transaction.is_active 
                        ? 'Recurring is Active'
                        : 'Recurring is Paused'
                      }
                    </h4>
                    <p className={cn(
                      "text-sm",
                      transaction.is_active 
                        ? "text-green-700 dark:text-green-300"
                        : "text-orange-700 dark:text-orange-300"
                    )}>
                      {transaction.is_active 
                        ? 'New transactions are being created automatically'
                        : 'No new transactions will be created until resumed'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        size="large"
        hideHeader={true}
      >
        <EditTransactionPanel
          transaction={transaction}
          editingSingle={editingSingle}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          isUpdating={isUpdating}
        />
      </Modal>

      {/* Delete Modal */}
      <DeleteTransaction
        transaction={transaction}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        onOpenSkipDates={onOpenSkipDates}
        loading={isDeleting}
        isTemplate={isTemplate}
      />
    </motion.div>
  );
};

export default TransactionCard;