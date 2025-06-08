/**
 * TransactionCard Component - Redesigned for Clarity & Simplicity
 * 
 * NEW UX APPROACH:
 * - Clear distinction between single vs template actions
 * - Simplified action set (Edit This | Edit All | Quick Actions)
 * - Integrated with centralized icon system
 * - Responsive and touch-friendly
 * - Production-ready with proper error handling
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2, Trash2, Calendar, Clock, Pause, Play, Settings,
  ChevronDown, ChevronUp, MoreHorizontal, Zap, CalendarX
} from 'lucide-react';

// ✅ NEW: Use centralized icon system
import { getIconComponent, getColorForCategory, getGradientForCategory } from '../../../config/categoryIcons';
import { useTransactions, useTransactionTemplates } from '../../../hooks/useTransactions';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { dateHelpers, cn } from '../../../utils/helpers';
import { Badge, Button } from '../../ui';
import DeleteTransaction from './DeleteTransaction';
import toast from 'react-hot-toast';

/**
 * TransactionCard - Production-Ready Recurring Transaction Interface
 * Handles both regular and recurring transactions with clear UX patterns
 */
const TransactionCard = ({
  transaction,
  onEdit,
  onEditSingle,
  onEditTemplate,
  onDelete,
  onOpenRecurringManager,
  showActions = true,
  variant = 'default',
  className = '',
  isHighlighted = false
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  
  // Hooks for transaction operations
  const { updateTransaction, deleteTransaction, isUpdating, isDeleting, refresh } = useTransactions();
  const { updateTemplate, skipDates, isSkipping } = useTransactionTemplates();

  // Local state
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isRTL = language === 'he';
  
  // ✅ IMPROVED: Clear transaction type detection
  const isRecurring = Boolean(transaction.template_id || transaction.is_recurring);
  const isTemplate = Boolean(transaction.id && !transaction.template_id && transaction.interval_type);
  const isExpense = transaction.transaction_type === 'expense' || transaction.type === 'expense';
  const isActive = transaction.is_active !== false; // Default to true if not specified

  // ✅ NEW: Get category icon using centralized system
  const categoryIcon = transaction.category_icon || 'tag';
  const CategoryIcon = getIconComponent(categoryIcon);

  // ✅ SIMPLIFIED: Primary action handlers
  const handleEditSingle = useCallback(() => {
    if (onEditSingle) {
      // Use dedicated single edit handler
      onEditSingle(transaction);
    } else if (onEdit) {
      // Fallback to generic handler with single flag
      onEdit(transaction, true);
    }
  }, [transaction, onEditSingle, onEdit]);

  const handleEditTemplate = useCallback(() => {
    if (!isRecurring && !isTemplate) {
      toast.error(t('transactions.notRecurring'));
      return;
    }
    
    if (onEditTemplate) {
      // Use dedicated template edit handler
      onEditTemplate(transaction);
    } else if (onEdit) {
      // Fallback to generic handler with template flag
      onEdit(transaction, false);
    }
  }, [transaction, isRecurring, isTemplate, onEditTemplate, onEdit, t]);

  const handleQuickSkip = useCallback(async () => {
    const templateId = transaction.template_id || (isTemplate ? transaction.id : null);
    
    if (!templateId) {
      toast.error(t('transactions.cannotSkipNonRecurring'));
      return;
    }
    
    try {
      // Calculate next occurrence date
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
          toast.error(t('transactions.unknownInterval'));
          return;
      }
      
      await skipDates(templateId, [nextDate.toISOString().split('T')[0]]);
      toast.success(t('transactions.nextPaymentSkipped'));
      await refresh();
    } catch (error) {
      console.error('Skip failed:', error);
      toast.error(t('common.error'));
    }
  }, [transaction, isTemplate, skipDates, refresh, t]);

  const handleToggleActive = useCallback(async () => {
    const templateId = transaction.template_id || (isTemplate ? transaction.id : null);
    
    if (!templateId) {
      toast.error(t('transactions.cannotToggleNonTemplate'));
      return;
    }
    
    try {
      await updateTemplate(templateId, {
        is_active: !isActive
      });
      
      toast.success(isActive ? t('transactions.paused') : t('transactions.resumed'));
      await refresh();
    } catch (error) {
      console.error('Toggle failed:', error);
      toast.error(t('common.error'));
    }
  }, [transaction, isTemplate, isActive, updateTemplate, refresh, t]);

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
    onDelete?.(transaction);
  }, [transaction, onDelete]);

  const handleDeleteConfirm = useCallback(async (transactionToDelete, deleteFuture = false) => {
    try {
      await deleteTransaction(
        transactionToDelete.transaction_type || transactionToDelete.type,
        transactionToDelete.id,
        deleteFuture
      );
      
      setShowDeleteModal(false);
      await refresh();
      onDelete?.(transactionToDelete);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [deleteTransaction, refresh, onDelete]);

  // ✅ NEW: Format frequency for display
  const formatFrequency = useCallback((interval) => {
    if (!interval) return null;
    const key = `actions.frequencies.${interval}`;
    return t(key);
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

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={variant === 'default' ? "hover" : undefined}
      className={cn(
        'relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300',
        'border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600',
        (isRecurring || isTemplate) && 'ring-1 ring-primary-500/20 bg-gradient-to-br from-white via-primary-50/30 to-white dark:from-gray-800 dark:via-primary-900/10 dark:to-gray-800',
        isHighlighted && 'ring-2 ring-primary-400 shadow-lg',
        className
      )}
    >
      {/* ✅ NEW: Status Indicators */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {(isRecurring || isTemplate) && (
          <div className="w-2 h-2 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full animate-pulse" />
        )}
        {isTemplate && !isActive && (
          <Badge variant="warning" size="small">
            <Pause className="w-3 h-3 mr-1" />
            {t('transactions.paused')}
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* ✅ UPDATED: Category Icon using centralized system */}
          <div className={cn(
            'relative p-3 rounded-xl flex-shrink-0 shadow-sm',
            getColorForCategory(transaction.transaction_type || transaction.type)
          )}>
            <CategoryIcon className="w-5 h-5" />
          </div>

          {/* Transaction Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg mb-2">
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
                    <Badge variant="secondary" size="small" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                      <CategoryIcon className="w-3 h-3 mr-1.5" />
                      {transaction.category_name}
                    </Badge>
                  )}
                  
                  {/* ✅ IMPROVED: Recurring Badge */}
                  {(isRecurring || isTemplate) && (
                    <Badge variant="primary" size="small" className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 shadow-sm">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {isTemplate ? t('transactions.template') : formatFrequency(transaction.recurring_interval || transaction.interval_type)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <div className={cn(
                  'text-2xl font-bold tracking-tight',
                  isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                )}>
                  <span className="text-lg opacity-75">{isExpense ? '-' : '+'}</span>
                  {formatAmount(transaction.amount)}
                </div>
                
                {/* Template info */}
                {isTemplate && transaction.occurrence_count && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-md inline-block mt-1">
                    {transaction.occurrence_count} {t('transactions.occurrences')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NEW: Simplified Action Bar */}
        {showActions && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            
            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              {/* Edit This */}
              <Button
                variant="outline"
                size="small"
                onClick={handleEditSingle}
                disabled={isUpdating}
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {isRecurring ? t('transactions.editThis') : t('common.edit')}
              </Button>
              
              {/* Edit All (only for recurring) */}
              {(isRecurring || isTemplate) && (
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleEditTemplate}
                  disabled={isUpdating}
                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {t('transactions.editAll')}
                </Button>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Actions for Recurring */}
              {(isRecurring || isTemplate) && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <MoreHorizontal className="w-4 h-4 mr-1" />
                  {t('transactions.quickActions')}
                  {showQuickActions ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </Button>
              )}
              
              {/* Delete */}
              <Button
                variant="ghost"
                size="small"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ✅ NEW: Quick Actions Panel (Collapsible) */}
        <AnimatePresence>
          {showQuickActions && (isRecurring || isTemplate) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                
                {/* Skip Next Payment */}
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleQuickSkip}
                  loading={isSkipping}
                  disabled={isSkipping || !isActive}
                  className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700 justify-start"
                >
                  <CalendarX className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{t('transactions.skipNext')}</div>
                    <div className="text-xs opacity-75">{t('transactions.skipNextDesc')}</div>
                  </div>
                </Button>

                {/* Pause/Resume (Templates only) */}
                {isTemplate && (
                  <Button
                    variant="outline"
                    size="small"
                    onClick={handleToggleActive}
                    loading={isUpdating}
                    disabled={isUpdating}
                    className={cn(
                      "justify-start",
                      isActive 
                        ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700"
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                    )}
                  >
                    {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    <div className="text-left">
                      <div className="font-medium">
                        {isActive ? t('transactions.pauseRecurring') : t('transactions.resumeRecurring')}
                      </div>
                      <div className="text-xs opacity-75">
                        {isActive ? t('transactions.pauseDesc') : t('transactions.resumeDesc')}
                      </div>
                    </div>
                  </Button>
                )}

                {/* Advanced Management */}
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => {
                    setShowQuickActions(false);
                    onOpenRecurringManager?.(transaction);
                  }}
                  className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{t('transactions.advancedOptions')}</div>
                    <div className="text-xs opacity-75">{t('transactions.advancedDesc')}</div>
                  </div>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Modal */}
      <DeleteTransaction
        transaction={transaction}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        isTemplate={isTemplate}
      />
    </motion.div>
  );
};

export default TransactionCard;