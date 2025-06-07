import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Package, Eye } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useDate } from '../../../context/DateContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDashboard } from '../../../hooks/useDashboard';
import { Card } from '../../../components/ui';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

/**
 * RecentTransactions Component - Compact Version
 * Displays the 5 most recent transactions on the dashboard in a minimal format
 * Optimized for mobile and smaller screen spaces
 */
const RecentTransactions = ({ 
  limit = 5 
}) => {
  const { t, language } = useLanguage();
  
  // ✅ Use the dashboard hook to get recent transactions
  const { 
    data: dashboardData, 
    isLoading, 
    error 
  } = useDashboard();
  
  const isRTL = language === 'he';

  // ✅ Extract transactions from dashboard data
  const transactions = dashboardData?.recentTransactions || [];

  // ✅ Filter out future transactions and only show past/current transactions
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
  
  if (isLoading) {
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

  if (error) {
    return (
      <Card className="p-3 overflow-hidden" data-component="RecentTransactions">
        <div className="text-center py-8">
          <div className="text-red-600 dark:text-red-400 mb-4">
            {t('dashboard.transactions.error')}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {t('common.retry')}
          </button>
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
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-2">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {t('dashboard.transactions.noTransactions')}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTransactions.map(transaction => (
              <div key={`${transaction.id}-${transaction.transaction_type || 'unknown'}-${transaction.date}`} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${transaction.transaction_type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                      {transaction.description || t('transactions.noDescription')}
                    </p>
                    <p className="text-xs text-gray-500">
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
                <div className={`text-sm font-medium ${transaction.transaction_type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {transaction.transaction_type === 'income' ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}
                </div>
              </div>
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
