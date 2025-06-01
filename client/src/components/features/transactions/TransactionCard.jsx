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
  showActions = true,
  variant = 'default',
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const isRTL = language === 'he';
  
  const isRecurring = transaction.is_recurring;
  const isExpense = transaction.transaction_type === 'expense';

  // Format frequency
  const formatFrequency = (interval) => {
    // ✅ Better handling of null/undefined values
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
      scale: 1.02,
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
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all',
        'border border-gray-100 dark:border-gray-700',
        variant === 'compact' && 'p-3',
        variant === 'default' && 'p-4',
        className
      )}
    >
      {/* Main Content */}
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={cn(
          'p-3 rounded-xl flex-shrink-0',
          isExpense 
            ? 'bg-red-50 dark:bg-red-900/20' 
            : 'bg-green-50 dark:bg-green-900/20'
        )}>
          {isExpense ? (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {transaction.description}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* Date */}
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {dateHelpers.format(transaction.date, 'PP', language)}
                </span>
                
                {/* Category */}
                {transaction.category_name && (
                  <Badge variant="default" size="small">
                    <Tag className="w-3 h-3 mr-1" />
                    {t(`categories.${transaction.category_name}`)}
                  </Badge>
                )}
                
                {/* Recurring Badge */}
                {isRecurring && (
                  <Badge variant="primary" size="small">
                    <Repeat className="w-3 h-3 mr-1" />
                    {formatFrequency(transaction.recurring_interval)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <div className={cn(
                'text-lg font-bold',
                isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              )}>
                {isExpense ? '-' : '+'}{formatAmount(transaction.amount)}
              </div>
              
              {isRecurring && transaction.daily_amount && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatAmount(transaction.daily_amount)}/day
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        {/* Expand Button for Recurring */}
        {isRecurring && (
          <Button
            variant="ghost"
            size="small"
            onClick={() => setExpanded(!expanded)}
            className="text-primary-600 dark:text-primary-400"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                {t('transactionCard.hideDetails')}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                {t('transactionCard.showDetails')}
              </>
            )}
          </Button>
        )}
        
        {/* Action Buttons */}
        {showActions && (
          <div className={cn(
            'flex items-center gap-2',
            !isRecurring && 'ml-auto'
          )}>
            <Button
              variant="ghost"
              size="small"
              onClick={() => onEdit?.(transaction)}
              className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="small"
              onClick={() => onDelete?.(transaction)}
              className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      <motion.div
        variants={expandVariants}
        initial="hidden"
        animate={expanded ? "visible" : "hidden"}
        className="overflow-hidden"
      >
        <div className="pt-4 space-y-3">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
            {/* Next Occurrence */}
            {transaction.next_recurrence_date && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {t('transactionCard.nextOccurrence')}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {dateHelpers.format(transaction.next_recurrence_date, 'PP', language)}
                </span>
              </div>
            )}
            
            {/* Recurring Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <RefreshCw className="w-4 h-4" />
                {t('transactionCard.frequency')}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatFrequency(transaction.recurring_interval)}
              </span>
            </div>
            
            {/* End Date */}
            {transaction.recurring_end_date && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('transactions.endsOn')}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {dateHelpers.format(transaction.recurring_end_date, 'PP', language)}
                </span>
              </div>
            )}
            
            {/* Daily Amount */}
            {transaction.daily_amount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {t('transactionCard.dailyEquivalent')}
                </span>
                <span className={cn(
                  'font-medium',
                  isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                )}>
                  {formatAmount(transaction.daily_amount)}
                </span>
              </div>
            )}
          </div>
          
          {/* Info Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('transactions.recurringNote', { 
                type: t(`transactions.${transaction.transaction_type}`)
              })}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TransactionCard;