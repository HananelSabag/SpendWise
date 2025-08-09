/**
 * 📅 UPCOMING TRANSACTIONS SIMPLE - Future Transactions List
 * Simple list showing only future transactions with manage button
 * Features: Clean list view, TransactionCard components, Manage button
 * @version 1.0.0 - SIMPLIFIED UPCOMING
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Settings, ChevronDown, ChevronUp,
  ArrowRight, RefreshCw, Eye, EyeOff
} from 'lucide-react';

// ✅ Import stores and hooks
import { useTranslation, useCurrency } from '../../../stores';
import { useUpcomingTransactions } from '../../../hooks/useUpcomingTransactions';
import { Button, Card, LoadingSpinner } from '../../ui';
import SimpleTransactionCard from '../transactions-v2/SimpleTransactionCard';
import { RecurringManagerPanel } from '../../LazyComponents';
import { cn, dateHelpers } from '../../../utils/helpers';

/**
 * 📅 Simple Upcoming Transactions Component
 */
const UpcomingTransactionsSimple = () => {
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showManager, setShowManager] = useState(false);
  
  // ✅ Get upcoming transactions (future only)
  const {
    upcomingTransactions,
    isLoading,
    refetch
  } = useUpcomingTransactions();

  // ✅ Filter only future transactions (no recurring logic here)
  const futureTransactions = useMemo(() => {
    if (!upcomingTransactions) return [];
    
    const now = new Date();
    return upcomingTransactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate > now; // Only future transactions
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date (earliest first)
      .slice(0, 10); // Limit to next 10 transactions
  }, [upcomingTransactions]);

  // ✅ Summary stats
  const summary = useMemo(() => {
    if (!futureTransactions.length) return { count: 0, totalAmount: 0 };
    
    return {
      count: futureTransactions.length,
      totalAmount: futureTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    };
  }, [futureTransactions]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {t('upcoming.loading', 'Loading upcoming transactions...')}
          </span>
        </div>
      </Card>
    );
  }

  if (!futureTransactions.length) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {t('upcoming.noUpcoming', 'No Upcoming Transactions')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            {t('upcoming.noUpcomingDesc', 'No future transactions scheduled. Set up recurring transactions to see them here.')}
          </p>
          <Button 
            onClick={() => setShowManager(true)}
            variant="primary"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            {t('upcoming.manageRecurring', 'Manage Recurring')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden shadow-lg" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('upcoming.title', 'Upcoming Transactions')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('upcoming.nextCount', { count: summary.count })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManager(true)}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('upcoming.manage', 'Manage')}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Summary */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {summary.count} {t('upcoming.transactions', 'transactions')}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {t('upcoming.totalAmount', 'Total')}: {formatCurrency(summary.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {futureTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SimpleTransactionCard
                      transaction={transaction}
                      index={index}
                      onSelect={undefined}
                      onEdit={() => {
                        // Open manager for editing
                        setShowManager(true);
                      }}
                      onDelete={() => {
                        // Open manager for deletion
                        setShowManager(true);
                      }}
                      onDuplicate={() => {
                        // Open manager for duplication
                        setShowManager(true);
                      }}
                      className="border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-900/10"
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {t('upcoming.showingNext', { count: futureTransactions.length })}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManager(true)}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    {t('upcoming.viewAll', 'View All')} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      
      {/* Recurring Transactions Manager Modal */}
      <RecurringManagerPanel isOpen={showManager} onClose={() => setShowManager(false)} />
    </>
  );
};

export default UpcomingTransactionsSimple;