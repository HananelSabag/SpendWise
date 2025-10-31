/**
 * 🔮 Future Transactions Collapsible Card
 * Displays upcoming/scheduled transactions in a collapsible card
 * Used in the All Transactions tab for quick access to future transactions
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, ChevronDown, ChevronUp, Clock, Repeat
} from 'lucide-react';

// ✅ Import stores and hooks
import { useTranslation, useCurrency, useTheme } from '../../../stores';
import { Badge, Card } from '../../ui';
import ModernTransactionCard from './ModernTransactionCard';
import { cn } from '../../../utils/helpers';

/**
 * Collapsible card showing future transactions
 */
const FutureTransactionsCollapsible = ({ transactions = [], loading = false }) => {
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // ✅ Filter and process future transactions
  const { futureTransactions, summary } = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) {
      return { futureTransactions: [], summary: { count: 0, totalIncome: 0, totalExpenses: 0 } };
    }
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Filter for future transactions (from tomorrow onwards)
    const future = transactions.filter(transaction => {
      const dateStr = transaction.date || transaction.transaction_date;
      if (!dateStr) return false;
      
      const transactionDate = new Date(dateStr);
      return transactionDate >= tomorrow;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate summary
    const totalIncome = future
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    const totalExpenses = future
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
    
    return {
      futureTransactions: future,
      summary: {
        count: future.length,
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses
      }
    };
  }, [transactions]);
  
  // Don't render if no future transactions
  if (summary.count === 0) {
    return null;
  }
  
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-lg">
      {/* Header - Always visible */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Clock className="w-5 h-5" />
          </div>
          
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                {t('transactions.futureTransactions', 'Future Transactions')}
              </h3>
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {summary.count}
              </Badge>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm flex-wrap">
              {summary.totalIncome > 0 && (
                <span className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                  +{formatCurrency(summary.totalIncome)}
                </span>
              )}
              {summary.totalExpenses > 0 && (
                <span className="font-semibold text-red-600 dark:text-red-400 tabular-nums">
                  -{formatCurrency(summary.totalExpenses)}
                </span>
              )}
              {summary.netAmount !== 0 && (
                <>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <span className={cn(
                    "font-bold tabular-nums",
                    summary.netAmount >= 0 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {t('transactions.net', 'Net')}: {summary.netAmount >= 0 ? '+' : ''}{formatCurrency(summary.netAmount)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </motion.div>
      </motion.button>
      
      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3 border-t border-blue-200 dark:border-blue-700">
              {futureTransactions.slice(0, 10).map((transaction, index) => (
                <motion.div
                  key={transaction.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ModernTransactionCard
                    transaction={transaction}
                    viewMode="list"
                    // Disable actions for future transactions (they're from recurring templates)
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onDuplicate={() => {}}
                  />
                </motion.div>
              ))}
              
              {futureTransactions.length > 10 && (
                <div className="text-center pt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('transactions.andMore', `And ${futureTransactions.length - 10} more...`)}
                </div>
              )}
              
              {futureTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('transactions.noFutureTransactions', 'No future transactions scheduled')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default FutureTransactionsCollapsible;

