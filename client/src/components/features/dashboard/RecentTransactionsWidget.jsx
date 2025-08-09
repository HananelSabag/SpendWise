/**
 * 📋 RECENT TRANSACTIONS WIDGET - DASHBOARD OPTIMIZED
 * Simple, focused component for showing 5 recent transactions
 * Features: Real-time updates, Auto-refresh, Mobile-first, No future transactions
 * @version 1.0.0 - DASHBOARD WIDGET
 */

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ArrowUpRight, ArrowDownRight, 
  Calendar, DollarSign, Tag, Clock, RefreshCw,
  TrendingUp, TrendingDown, Eye
} from 'lucide-react';

// ✅ Import stores and hooks
import { 
  useTranslation, 
  useCurrency,
  useNotifications 
} from '../../../stores';
import { useTransactions } from '../../../hooks/useTransactions';
import { Button, Card, LoadingSpinner } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * 🎯 Transaction Item Component
 */
const TransactionItem = ({ transaction, formatCurrency, isRTL }) => {
  const isIncome = transaction.amount > 0;
  const amount = Math.abs(transaction.amount);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
    >
      <div className="flex items-center space-x-3">
        {/* Transaction Type Icon */}
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          isIncome 
            ? 'bg-green-100 text-green-600' 
            : 'bg-red-100 text-red-600'
        )}>
          {isIncome ? (
            <TrendingUp className="w-5 h-5" />
          ) : (
            <TrendingDown className="w-5 h-5" />
          )}
        </div>
        
        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {transaction.description || (isIncome ? 'Income' : 'Expense')}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(transaction.date || transaction.created_at).toLocaleDateString()}
            </span>
            {transaction.category_name && (
              <>
                <span>•</span>
                <span className="truncate max-w-20">{transaction.category_name}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Amount */}
      <div className="text-right">
        <p className={cn(
          'font-bold',
          isIncome ? 'text-green-600' : 'text-red-600'
        )}>
          {isIncome ? '+' : '-'}{formatCurrency(amount)}
        </p>
        <p className="text-xs text-gray-500">
          {new Date(transaction.date || transaction.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </motion.div>
  );
};

/**
 * 📋 Recent Transactions Widget Component
 */
const RecentTransactionsWidget = ({ 
  className = '',
  onViewAll,
  onAddTransaction 
}) => {
  const { t, isRTL } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  
  // ✅ Get real transactions data with dashboard context for proper updates
  const { 
    transactions: allTransactions, 
    loading, 
    refetch,
    error 
  } = useTransactions({
    pageSize: 20, // Get more to filter properly
    enableAI: false,
    context: 'dashboard', // This ensures updates from quick actions
    autoRefresh: true
  });

  // ✅ Filter and process recent transactions
  const recentTransactions = useMemo(() => {
    if (!allTransactions || !Array.isArray(allTransactions)) return [];
    
    const now = new Date();
    
    return allTransactions
      // ✅ EXCLUDE future/recurring transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date || transaction.created_at);
        
        // Only include past and present transactions
        if (transactionDate > now) return false;
        
        // Exclude future recurring transactions (check for is_recurring flag)
        if (transaction.is_recurring && transactionDate > now) return false;
        
        // Exclude template transactions
        if (transaction.is_template) return false;
        
        return true;
      })
      // Sort by date (most recent first)
      .sort((a, b) => {
        const dateA = new Date(a.date || a.created_at);
        const dateB = new Date(b.date || b.created_at);
        return dateB - dateA;
      })
      // Take only 5 most recent
      .slice(0, 5);
  }, [allTransactions]);

  // ✅ Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      addNotification({
        type: 'success',
        message: t('recentTransactions.refreshed', 'Transactions updated'),
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('recentTransactions.refreshFailed', 'Failed to refresh transactions'),
        duration: 3000
      });
    }
  }, [refetch, addNotification, t]);

  // ✅ Handle view all
  const handleViewAll = useCallback(() => {
    if (onViewAll) {
      onViewAll();
    } else {
      // Default navigation to transactions page
      window.location.href = '/transactions';
    }
  }, [onViewAll]);

  return (
    <Card className={cn('shadow-xl', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('recentTransactions.title', 'Recent Transactions')}
          </h3>
          
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={cn(
                'w-4 h-4',
                loading && 'animate-spin'
              )} />
            </Button>
            
            {/* View All Button */}
            {recentTransactions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAll}
                className="text-blue-600 hover:text-blue-700"
              >
                <span className="hidden sm:inline mr-2">
                  {t('recentTransactions.viewAll', 'View All')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading && recentTransactions.length === 0 ? (
          /* Loading State */
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-500">
              {t('recentTransactions.loading', 'Loading transactions...')}
            </span>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-600 mb-4">
              {t('recentTransactions.error', 'Failed to load transactions')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              {t('common.retry', 'Try Again')}
            </Button>
          </div>
        ) : recentTransactions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">
              {t('recentTransactions.noTransactions', 'No transactions yet')}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {t('recentTransactions.getStarted', 'Start tracking your finances by adding your first transaction')}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={onAddTransaction}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {t('recentTransactions.addFirst', 'Add Transaction')}
            </Button>
          </div>
        ) : (
          /* Transaction List */
          <div className="space-y-1">
            {recentTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id || index}
                transaction={transaction}
                formatCurrency={formatCurrency}
                isRTL={isRTL}
              />
            ))}
            
            {/* Footer */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {t('recentTransactions.showingCount', 'Showing {{count}} of {{total}}', {
                    count: recentTransactions.length,
                    total: allTransactions?.length || 0
                  })}
                </span>
                
                {allTransactions && allTransactions.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewAll}
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                  >
                    {t('recentTransactions.seeMore', 'See more')} →
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentTransactionsWidget;