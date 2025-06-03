// components/features/transactions/TransactionCard.jsx
import React, { useState } from 'react';
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
  Repeat
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { dateHelpers, cn } from '../../../utils/helpers';
import { Badge, Button } from '../../ui';

/**
 * TransactionCard Component
 * Modern card design for displaying transaction details
 * Supports both regular and recurring transactions with expandable details
 */
const TransactionCard = ({
  transaction,
  onEdit,
  onDelete,
  onEditSingle,
  showActions = true,
  variant = 'default',
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const isRTL = language === 'he';
  
  const isRecurring = transaction.is_recurring || transaction.template_id;
  const isExpense = transaction.transaction_type === 'expense';

  // Handle single occurrence editing
  const handleEditSingleOccurrence = (transaction) => {
    if (onEditSingle) {
      onEditSingle(transaction);
    }
  };

  // Format frequency
  const formatFrequency = (interval) => {
    if (!interval || interval === null || interval === undefined) {
      return t('actions.frequencies.oneTime') || 'One-time';
    }
    return t(`actions.frequencies.${interval}`) || interval;
  };

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    hover: {
      scale: 1.01,
      y: -2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const expandVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      transition: {
        opacity: { duration: 0.2 },
        height: { duration: 0.3, ease: "easeInOut" }
      }
    },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: {
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    }
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
        isRecurring && 'ring-1 ring-primary-500/20 bg-gradient-to-br from-white via-primary-50/30 to-white dark:from-gray-800 dark:via-primary-900/10 dark:to-gray-800',
        className
      )}
    >
      {/* Recurring Indicator */}
      {isRecurring && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-bl-lg rounded-tr-2xl">
          <div className="absolute inset-0.5 bg-white dark:bg-gray-800 rounded-bl-sm rounded-tr-lg">
            <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-500 rounded-bl-sm rounded-tr-lg"></div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-start gap-4">
        {/* Enhanced Icon with gradient background */}
        <div className={cn(
          'relative p-3 rounded-2xl flex-shrink-0 shadow-sm',
          isExpense 
            ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30' 
            : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30'
        )}>
          {/* Subtle glow effect */}
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

        {/* Details Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title with better typography */}
              <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg mb-2 leading-tight">
                {transaction.description}
              </h3>
              
              {/* Enhanced metadata with better spacing */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Date with improved styling */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {dateHelpers.format(transaction.date, 'MMM dd', language)}
                  </span>
                </div>
                
                {/* Category with enhanced design */}
                {transaction.category_name && (
                  <Badge 
                    variant="secondary" 
                    size="small"
                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 px-2.5 py-1"
                  >
                    <Tag className="w-3 h-3 mr-1.5" />
                    {transaction.category_name}
                  </Badge>
                )}
                
                {/* Enhanced Recurring Badge */}
                {isRecurring && (
                  <Badge 
                    variant="primary" 
                    size="small"
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 shadow-sm px-2.5 py-1"
                  >
                    <Repeat className="w-3 h-3 mr-1.5" />
                    {formatFrequency(transaction.recurring_interval)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Enhanced Amount Display */}
            <div className="text-right">
              <div className={cn(
                'text-2xl font-bold tracking-tight mb-1',
                isExpense 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              )}>
                <span className="text-lg opacity-75">{isExpense ? '-' : '+'}</span>
                {formatAmount(transaction.amount)}
              </div>
              
              {/* Daily amount with improved styling */}
              {isRecurring && transaction.daily_amount && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-md inline-block">
                  {formatAmount(transaction.daily_amount)}/day
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Actions Bar */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        {/* Expand Button for Recurring with better design */}
        {isRecurring && (
          <Button
            variant="ghost"
            size="small"
            onClick={() => setExpanded(!expanded)}
            className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl px-3 py-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                {t('transactionCard.hideDetails')}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                {t('transactionCard.showDetails')}
              </>
            )}
          </Button>
        )}
        
        {/* Enhanced Action Buttons */}
        {showActions && (
          <div className={cn(
            'flex items-center gap-1',
            !isRecurring && 'ml-auto'
          )}>
            {/* Single Occurrence Edit Button for recurring transactions */}
            {transaction.template_id && (
              <Button
                variant="ghost"
                size="small"
                onClick={() => handleEditSingleOccurrence(transaction)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl p-2.5"
                title={t('transactions.editThisOnly')}
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden sm:inline ml-1 text-xs">{t('transactions.editSingle')}</span>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="small"
              onClick={() => onEdit?.(transaction)}
              className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl p-2.5"
              title={t('common.edit')}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="small"
              onClick={() => onDelete?.(transaction)}
              className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl p-2.5"
              title={t('common.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Expanded Details */}
      <motion.div
        variants={expandVariants}
        initial="hidden"
        animate={expanded ? "visible" : "hidden"}
        className="overflow-hidden"
      >
        <div className="pt-4 space-y-4">
          {/* Enhanced Details Panel */}
          <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
            
            {/* Next Occurrence with improved layout */}
            {transaction.next_recurrence_date && (
              <div className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-medium">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  {t('transactionCard.nextOccurrence')}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dateHelpers.format(transaction.next_recurrence_date, 'PPP', language)}
                </span>
              </div>
            )}
            
            {/* Frequency Info */}
            <div className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-medium">
                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                {t('transactionCard.frequency')}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatFrequency(transaction.recurring_interval)}
              </span>
            </div>
            
            {/* End Date */}
            {transaction.recurring_end_date && (
              <div className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  {t('transactions.endsOn')}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {dateHelpers.format(transaction.recurring_end_date, 'PPP', language)}
                </span>
              </div>
            )}
            
            {/* Daily Amount */}
            {transaction.daily_amount && (
              <div className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-medium">
                  <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <DollarSign className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  {t('transactionCard.dailyEquivalent')}
                </span>
                <span className={cn(
                  'font-semibold',
                  isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                )}>
                  {formatAmount(transaction.daily_amount)}
                </span>
              </div>
            )}
          </div>
          
          {/* Enhanced Info Note */}
          <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 dark:from-blue-900/20 dark:via-blue-900/10 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  {t('transactionCard.recurringInfo')}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  {t('transactions.recurringNote', { 
                    type: t(`transactions.${transaction.transaction_type}`)
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TransactionCard;