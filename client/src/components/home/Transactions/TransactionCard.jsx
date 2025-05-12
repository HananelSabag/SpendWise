// components/home/Transactions/TransactionCard.jsx
// Transaction card component with full translation support
// Displays individual transaction details with edit/delete actions
import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Clock,
  CalendarIcon,
  Calendar,
  RefreshCw,
  DollarSign,
  Info,
  RepeatIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { formatDate } from '../../../utils/helpers';
import DeleteTransaction from './DeleteTransaction';

/**
 * TransactionCard Component
 * Displays a transaction card with full translation support
 * Shows transaction details and provides edit/delete actions
 * Supports both one-time and recurring transactions
 * 
 * @param {Object} transaction - Transaction object
 * @param {Function} onEdit - Edit handler function
 * @param {Function} onDelete - Delete handler function
 * @param {boolean} showActions - Whether to show edit/delete buttons
 * @param {string} className - Additional CSS classes
 */
const TransactionCard = ({
  transaction,
  onEdit,
  onDelete,
  showActions = true,
  className = ''
}) => {
  // Hooks for language (text and direction) and currency formatting
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isHebrew = language === 'he';
  
  // State for expanded details (for recurring transactions)
  const [expanded, setExpanded] = useState(false);
  // State for delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  /**
   * getTransactionStyle()
   * Determines container class, icon, and text color based on transaction type.
   */
  const getTransactionStyle = () => ({
    containerClass:
      transaction.transaction_type === 'expense'
        ? 'bg-error-light'
        : 'bg-success-light',
    Icon:
      transaction.transaction_type === 'expense'
        ? ArrowDownRight
        : ArrowUpRight,
    textColor:
      transaction.transaction_type === 'expense'
        ? 'text-error'
        : 'text-success'
  });

  /**
   * handleDeleteConfirm(transaction, deleteFuture)
   * Handles transaction deletion after confirmation from the dialog
   */
  const handleDeleteConfirm = (transaction, deleteFuture) => {
    onDelete({ 
      ...transaction,
      deleteFuture
    });
    setShowDeleteDialog(false);
  };

  /**
   * formatFrequency(interval)
   * Converts recurring interval to human-readable text
   */
  const formatFrequency = (interval) => {
    switch (interval) {
      case 'daily': return t('actions.frequencies.daily');
      case 'weekly': return t('actions.frequencies.weekly');
      case 'monthly': return t('actions.frequencies.monthly');
      default: return interval;
    }
  };

  const { containerClass, Icon, textColor } = getTransactionStyle();
  const isRecurring = transaction.is_recurring;

  return (
    <div
      className={`bg-white hover:bg-gray-50 transition-all rounded-xl shadow-sm 
                 ${className} ${expanded ? 'ring-2 ring-primary-100' : ''}`}
    >
      {/* Main transaction details */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          {/* Icon showing transaction type (income or expense) */}
          <div className={`p-2 rounded-xl ${containerClass} flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${textColor}`} />
          </div>

          {/* Transaction info (description, date, category) */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {transaction.description}
              </h3>
              
              {/* Recurring badge */}
              {isRecurring && (
                <div className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full flex items-center">
                  <RepeatIcon className="w-3 h-3 mr-0.5" />
                  <span>{formatFrequency(transaction.recurring_interval)}</span>
                </div>
              )}
            </div>
            
            {/* Transaction metadata */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center">
                <CalendarIcon className="w-3 h-3 mr-0.5" />
                {formatDate(transaction.date, language)}
              </span>
              
              {transaction.category_name && (
                <>
                  <span className="hidden xs:inline">•</span>
                  <span className="text-primary-500">
                    {t(`categories.${transaction.category_name}`)}
                  </span>
                </>
              )}
              
              {/* Toggle details button for recurring transactions */}
              {isRecurring && (
                <button 
                  className="ml-auto text-primary-500 flex items-center" 
                  onClick={() => setExpanded(!expanded)}
                  aria-label={expanded ? t('transactionCard.hideDetails') : t('transactionCard.showDetails')}
                >
                  <span className="mr-0.5">
                    {expanded ? t('transactionCard.hideDetails') : t('transactionCard.showDetails')}
                  </span>
                  {expanded ? 
                    <ChevronUp className="w-3 h-3" /> : 
                    <ChevronDown className="w-3 h-3" />
                  }
                </button>
              )}
            </div>
          </div>

          {/* Amount and optional action buttons */}
          <div className="flex flex-col items-end gap-2">
            <span className={`font-medium whitespace-nowrap ${textColor}`}>
              {formatAmount(transaction.amount)}
            </span>
            
            {showActions && (
              <div className="flex gap-1">
                {/* Edit button */}
                <button
                  onClick={() => onEdit(transaction)}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label={t('transactionCard.editButton')}
                  title={t('transactionCard.editButton')}
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Delete button */}
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="p-1.5 rounded-lg bg-error-light hover:bg-error/10 transition-colors"
                  aria-label={t('transactionCard.deleteButton')}
                  title={t('transactionCard.deleteButton')}
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details for recurring transactions */}
      {isRecurring && expanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {/* Next occurrence date */}
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-700">{t('transactionCard.nextOccurrence')}</div>
                  <div className="text-gray-600">
                    {transaction.next_recurrence_date ? 
                      formatDate(transaction.next_recurrence_date, language) : 
                      t('transactionCard.noScheduled')}
                  </div>
                </div>
              </div>
              
              {/* Recurring pattern */}
              <div className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-700">{t('transactionCard.frequency')}</div>
                  <div className="text-gray-600">
                    {formatFrequency(transaction.recurring_interval)}
                    {transaction.recurring_end_date && (
                      <span> {t('transactions.endsOn')} {formatDate(transaction.recurring_end_date, language)}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Daily amount - if available */}
              {transaction.daily_amount && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-700">{t('transactionCard.dailyEquivalent')}</div>
                    <div className="text-gray-600">
                      {formatAmount(transaction.daily_amount)}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Start date - if available */}
              {transaction.recurring_start_date && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-700">{t('transactionCard.startDate')}</div>
                    <div className="text-gray-600">
                      {formatDate(transaction.recurring_start_date, language)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Information note about recurring transactions */}
            <div className="mt-3 bg-blue-50 p-2 rounded-lg text-xs text-blue-700 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>
                  {t('transactions.recurringNote', { 
                    type: t(`transactions.${transaction.transaction_type}`)
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Transaction Dialog */}
      {showDeleteDialog && (
        <DeleteTransaction
          open={showDeleteDialog}
          transaction={transaction}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default React.memo(TransactionCard);