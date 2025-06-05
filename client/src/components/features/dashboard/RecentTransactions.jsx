import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Package, Eye } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useDate } from '../../../context/DateContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { Card } from '../../../components/ui';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

/**
 * RecentTransactions Component - Compact Version
 * Displays the 5 most recent transactions on the dashboard in a minimal format
 * Optimized for mobile and smaller screen spaces
 */
const RecentTransactions = ({ 
  transactions = [], 
  loading = false, 
  limit = 5 
}) => {
  const { t, language } = useLanguage();
  
  const isRTL = language === 'he';

  // ✅ FIX: Filter out future transactions and only show past/current transactions
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  const filteredTransactions = transactions
    .filter(transaction => {
      try {
        const transactionDate = new Date(transaction.date);
        // Only show transactions up to today (no future transactions)
        return transactionDate <= today && !isNaN(transactionDate.getTime());
      } catch (error) {
        console.warn('Invalid transaction date:', transaction.date);
        return false;
      }
    })
    .slice(0, limit);

  const { formatDate } = useDate();
  const { formatAmount } = useCurrency();
  
  // Empty state content - simplified
  const renderEmptyState = () => (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-2">
        <Package className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
        {t('dashboard.transactions.noTransactions')}
      </p>
    </div>
  );

  // Transaction item - simplified compact version
  const TransactionItem = ({ transaction }) => {
    // ✅ FIX: Better transaction type detection with fallbacks
    let transactionType = transaction.transaction_type;
    
    // Fallback detection if transaction_type is undefined
    if (!transactionType) {
      // Try to determine from amount (positive = income, negative = expense)
      transactionType = transaction.amount >= 0 ? 'income' : 'expense';
      
      // Or try alternative field names
      if (transaction.type) {
        transactionType = transaction.type;
      }
    }
    
    const isIncome = transactionType === 'income';
    const isExpense = transactionType === 'expense';
    
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <div className="flex items-center gap-3">
          {/* ✅ FIX: Correct color based on detected transaction type */}
          <div className={`w-2 h-2 rounded-full ${isIncome ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
              {transaction.description || t('transactions.noDescription')}
            </p>
            <p className="text-xs text-gray-500">
              {/* ✅ IMPROVED: Better date formatting with error handling */}
              {(() => {
                try {
                  const date = new Date(transaction.date);
                  // Validate date
                  if (isNaN(date.getTime())) {
                    return 'Invalid date';
                  }
                  
                  return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC' // Prevent timezone shifts
                  });
                } catch (error) {
                  console.warn('Date formatting error:', error);
                  return transaction.date || 'No date';
                }
              })()}
            </p>
          </div>
        </div>
        {/* ✅ FIX: Correct amount display with proper signs and absolute values */}
        <div className={`text-sm font-medium ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isIncome ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-3 overflow-hidden" data-component="RecentTransactions">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 overflow-hidden" data-component="RecentTransactions">
      {/* Header with View All link */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('dashboard.transactions.recent')}
        </h3>
        <Link 
          to="/transactions" 
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium"
        >
          {t('dashboard.transactions.viewAll')}
        </Link>
      </div>
      
      {/* Content */}
      <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
        {filteredTransactions.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-1">
            {filteredTransactions.map(transaction => (
              <TransactionItem 
                key={`${transaction.id}-${transaction.transaction_type || 'unknown'}-${transaction.date}`}
                transaction={transaction}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* View All link at bottom */}
      <div className="mt-2 text-center pt-1 border-t border-gray-100 dark:border-gray-800">
        <Link 
          to="/transactions"
          className="inline-flex items-center justify-center px-3 py-1 text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
        >
          {t('dashboard.transactions.viewAll')}
          <ArrowRight className={`w-3 h-3 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
        </Link>
      </div>
    </Card>
  );
};

export default RecentTransactions;
