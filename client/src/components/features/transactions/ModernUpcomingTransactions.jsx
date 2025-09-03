/**
 * 🌟 MODERN UPCOMING TRANSACTIONS - Revolutionary Design
 * Features: Stunning visuals, Perfect animations, Advanced upcoming transaction display
 * Mobile-first, Premium UX matching the new modern design system
 * @version 1.0.0 - REVOLUTIONARY DESIGN
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Settings, ArrowRight
} from 'lucide-react';

// ✅ Import stores and hooks
import { useTranslation, useCurrency, useTheme } from '../../../stores';
import { Button, Card, LoadingSpinner, Badge } from '../../ui';
import ModernTransactionCard from './ModernTransactionCard';
import { cn, dateHelpers } from '../../../utils/helpers';

// ✨ Enhanced Animation Variants
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const headerVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// ✨ Modern Day Header Component (copied from ModernTransactions)
const ModernDayHeader = ({ title, date, totalIncome, totalExpenses, count }) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-2 sm:mb-3 sticky top-0 z-10"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
        
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{title}</h3>
          <div className="flex items-center gap-1 sm:gap-2 text-xs">
            <Badge variant="outline" className="bg-white dark:bg-gray-800 text-xs px-1 py-0">
              {count}
            </Badge>
            
            {totalIncome > 0 && (
              <span className="font-medium text-green-600 dark:text-green-400 tabular-nums">
                +{formatCurrency(totalIncome)}
              </span>
            )}
            
            {totalExpenses > 0 && (
              <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">
                -{formatCurrency(totalExpenses)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {t('transactions.net', 'Net')}
        </div>
        <div className={cn(
          "font-bold whitespace-nowrap tabular-nums text-xs sm:text-sm",
          totalIncome - totalExpenses >= 0 
            ? "text-green-600 dark:text-green-400" 
            : "text-red-600 dark:text-red-400"
        )}>
          {totalIncome - totalExpenses >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpenses)}
        </div>
      </div>
    </motion.div>
  );
};


// 🌟 MAIN MODERN UPCOMING TRANSACTIONS COMPONENT  
const ModernUpcomingTransactions = ({ onOpenRecurringManager, transactions, loading, debugInfo }) => {
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();

  // ✅ Process transactions (already filtered for upcoming in ModernTransactions)
  const { futureTransactions, summary, groupedTransactions } = useMemo(() => {
    console.log('🔮 ModernUpcomingTransactions received:', {
      transactionsCount: transactions?.length || 0,
      isArray: Array.isArray(transactions),
      hasTransactions: !!transactions,
      debugInfo: debugInfo || 'No debug info'
    });
    
    if (!transactions || !Array.isArray(transactions)) {
      console.log('🔮 ModernUpcomingTransactions: No transactions array detected');
      return { futureTransactions: [], summary: {}, groupedTransactions: {} };
    }
    
    // ✅ TIMEZONE AWARE: Use proper timezone-aware date filtering
    const now = new Date();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get tomorrow in user's timezone (Israel is UTC+3)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    console.log('🔮 Timezone debug:', {
      userTimezone,
      nowLocal: now.toLocaleString('en-US', { timeZone: userTimezone }),
      nowUTC: now.toISOString(),
      tomorrowLocal: tomorrow.toLocaleString('en-US', { timeZone: userTimezone }),
      tomorrowUTC: tomorrow.toISOString()
    });
    
    // ✅ FIXED: Filter for transactions from tomorrow onwards (not today)
    const actuallyFuture = transactions.filter((transaction, index) => {
      const dateStr = transaction.date || transaction.transaction_date || transaction.scheduled_date;
      if (!dateStr) {
        console.log(`🔮 Transaction ${index + 1}: NO DATE FOUND`, transaction);
        return false;
      }
      
      const transactionDate = new Date(dateStr);
      // ✅ CRITICAL FIX: Use tomorrow, not today (upcoming = future, not current)
      const isFuture = transactionDate >= tomorrow;
      
      // Enhanced debugging for first few transactions
      if (index < 5) {
        console.log(`🔮 Transaction ${index + 1}:`, {
          id: transaction.id,
          description: transaction.description,
          dateStr,
          transactionDate: transactionDate.toISOString(),
          tomorrowStart: tomorrow.toISOString(),
          isFuture,
          type: transaction.type,
          amount: transaction.amount
        });
      }
      
      return isFuture;
    });
    
    console.log('🔮 After future filtering:', {
      originalCount: transactions.length,
      futureCount: actuallyFuture.length,
      futureTransactions: actuallyFuture.slice(0, 3).map(t => ({
        id: t.id,
        description: t.description,
        date: t.date || t.transaction_date,
        type: t.type
      }))
    });
    
    // ✅ Use the actually future transactions and sort them
    const future = actuallyFuture
      .sort((a, b) => new Date(a.date || a.transaction_date) - new Date(b.date || b.transaction_date))
      .slice(0, 50); // Show next 50 transactions

    const summaryData = {
      totalCount: future.length,
      totalIncome: future.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalExpenses: future.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      recurringCount: future.filter(t => t.template_id || t.is_recurring).length
    };
    
    // ✨ Group future transactions by day (copied from ModernTransactionsList)
    const grouped = future.reduce((groups, transaction, index) => {
      const date = new Date(transaction.date || transaction.transaction_date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let groupKey;
      let groupTitle;
      
      // Enhanced debugging for grouping
      if (index < 3) {
        console.log(`🔮 Grouping transaction ${index + 1}:`, {
          id: transaction.id,
          description: transaction.description,
          date: date.toISOString(),
          dateString: date.toDateString(),
          tomorrowString: tomorrow.toDateString(),
          isToday: date.toDateString() === today.toDateString(),
          isTomorrow: date.toDateString() === tomorrow.toDateString()
        });
      }
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'today';
        groupTitle = t('upcoming.today', 'Today');
      } else if (date.toDateString() === tomorrow.toDateString()) {
        groupKey = 'tomorrow';
        groupTitle = t('upcoming.tomorrow', 'Tomorrow');
      } else if (date >= today && date < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        groupKey = 'thisWeek';
        groupTitle = t('upcoming.thisWeek', 'This Week');
      } else {
        // Use the date as key for other days
        groupKey = date.toDateString();
        groupTitle = date.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          title: groupTitle,
          date: date,
          transactions: [],
          totalIncome: 0,
          totalExpenses: 0,
          count: 0
        };
      }
      
      groups[groupKey].transactions.push(transaction);
      groups[groupKey].count += 1;
      
      if (transaction.type === 'income') {
        groups[groupKey].totalIncome += Math.abs(transaction.amount);
      } else {
        groups[groupKey].totalExpenses += Math.abs(transaction.amount);
      }
      
      return groups;
    }, {});
    
    console.log('🔮 Final grouping result:', {
      futureCount: future.length,
      groupKeys: Object.keys(grouped),
      groupedCount: Object.keys(grouped).length,
      groups: Object.entries(grouped).map(([key, group]) => ({
        key,
        title: group.title,
        count: group.transactions.length
      }))
    });
    
    return {
      futureTransactions: future,
      summary: summaryData,
      groupedTransactions: grouped
    };
  }, [transactions, t, isRTL, debugInfo]);

  if (loading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <Card className="p-8 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="flex items-center justify-center gap-3">
            <LoadingSpinner size="md" />
            <span className="text-gray-600 dark:text-gray-400">
              Loading upcoming transactions...
            </span>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!futureTransactions.length) {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <Card className="p-8 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Upcoming Transactions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                No transactions scheduled for tomorrow and beyond. Set up recurring transactions or create future-dated transactions to see them here.
              </p>
              {debugInfo && (
                <div className="text-xs text-gray-500 mb-4 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  Debug: {debugInfo.rawTransactionCount} total → {debugInfo.filteredTransactionCount} filtered
                </div>
              )}
              <Button 
                onClick={onOpenRecurringManager}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Recurring
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* ✨ Upcoming Transactions List - Same Format as All Transactions */}
      <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Upcoming Transactions
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your scheduled transactions • {summary.totalCount} total
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenRecurringManager}
                className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
        </div>

        {/* Content - Grouped by days like All Transactions */}
        <div className="p-6">
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedTransactions).map(([groupKey, group], groupIndex) => (
                <motion.div
                  key={groupKey}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: groupIndex * 0.1,
                    layout: { duration: 0.3 }
                  }}
                  className="space-y-4"
                >
                  {/* Day Header */}
                  <ModernDayHeader
                    title={group.title}
                    date={group.date}
                    totalIncome={group.totalIncome}
                    totalExpenses={group.totalExpenses}
                    count={group.count}
                  />
                  
                  {/* Transactions for this day */}
                  <div className="space-y-3 pl-3 sm:pl-4">
                    <AnimatePresence mode="popLayout">
                      {group.transactions.map((transaction, index) => (
                        <motion.div
                          key={`${transaction.id}-${groupKey}-${index}`}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.05,
                            layout: { duration: 0.3 }
                          }}
                        >
                          <ModernTransactionCard
                            transaction={transaction}
                            viewMode="list"
                            // Disable actions for upcoming transactions
                            onEdit={() => {}}
                            onDelete={() => {}}
                            onDuplicate={() => {}}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Showing next {futureTransactions.length} transactions
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenRecurringManager}
              className="text-purple-600 hover:text-purple-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Recurring
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ModernUpcomingTransactions;
