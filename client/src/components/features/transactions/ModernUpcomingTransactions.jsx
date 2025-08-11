/**
 * 🌟 MODERN UPCOMING TRANSACTIONS - Revolutionary Design
 * Features: Stunning visuals, Perfect animations, Advanced upcoming transaction display
 * Mobile-first, Premium UX matching the new modern design system
 * @version 1.0.0 - REVOLUTIONARY DESIGN
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Settings, ChevronDown, ChevronUp, ArrowRight, 
  RefreshCw, Eye, EyeOff, Clock, Sparkles, TrendingUp,
  TrendingDown, Zap, Target, Users, BarChart3, AlertCircle
} from 'lucide-react';

// ✅ Import stores and hooks
import { useTranslation, useCurrency, useTheme } from '../../../stores';
import { useUpcomingTransactions } from '../../../hooks/useUpcomingTransactions';
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

// ✨ Modern Stats Card for Summary
const UpcomingSummaryCard = ({ title, value, icon: Icon, color = 'blue', trend }) => {
  const { formatCurrency } = useCurrency();
  
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 shadow-lg border-2",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border-gray-200 dark:border-gray-700",
        "hover:shadow-xl transition-all duration-300"
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 opacity-5",
        color === 'green' && "bg-gradient-to-br from-green-400 to-emerald-600",
        color === 'blue' && "bg-gradient-to-br from-blue-400 to-indigo-600",
        color === 'purple' && "bg-gradient-to-br from-purple-400 to-violet-600"
      )} />
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </p>
        </div>
        
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
          color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
          color === 'purple' && "bg-gradient-to-br from-purple-500 to-violet-600 text-white"
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};

// ✨ Modern Group Header
const GroupHeader = ({ title, count, totalAmount, isExpanded, onToggle }) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();
  
  return (
    <motion.div
      variants={headerVariants}
      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <Calendar className="w-5 h-5" />
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline" className="bg-white dark:bg-gray-800">
              {count} {t('transactions.count', 'transactions')}
            </Badge>
            {totalAmount !== 0 && (
              <span className={cn(
                "text-sm font-medium",
                totalAmount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(totalAmount)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </Button>
    </motion.div>
  );
};

// 🌟 MAIN MODERN UPCOMING TRANSACTIONS COMPONENT
const ModernUpcomingTransactions = ({ onOpenRecurringManager }) => {
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');
  
  // ✅ Get upcoming transactions
  const {
    upcomingTransactions,
    isLoading,
    refetch
  } = useUpcomingTransactions();

  // ✅ Process and group upcoming transactions
  const { futureTransactions, groupedTransactions, summary } = useMemo(() => {
    if (!upcomingTransactions) return { futureTransactions: [], groupedTransactions: {}, summary: {} };
    
    const now = new Date();
    const future = upcomingTransactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate > now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 20); // Show next 20 transactions

    // Group by time periods
    const groups = future.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      let groupKey;
      if (date.toDateString() === tomorrow.toDateString()) {
        groupKey = 'tomorrow';
      } else if (date <= nextWeek) {
        groupKey = 'thisWeek';
      } else {
        groupKey = 'later';
      }
      
      if (!acc[groupKey]) {
        acc[groupKey] = {
          title: groupKey === 'tomorrow' 
            ? t('upcoming.tomorrow', 'Tomorrow')
            : groupKey === 'thisWeek'
            ? t('upcoming.thisWeek', 'This Week')
            : t('upcoming.later', 'Later'),
          transactions: [],
          count: 0,
          totalAmount: 0
        };
      }
      
      acc[groupKey].transactions.push(transaction);
      acc[groupKey].count += 1;
      acc[groupKey].totalAmount += transaction.amount || 0;
      
      return acc;
    }, {});

    const summaryData = {
      totalCount: future.length,
      totalIncome: future.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalExpenses: future.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      recurringCount: future.filter(t => t.template_id || t.is_recurring).length
    };
    
    return {
      futureTransactions: future,
      groupedTransactions: groups,
      summary: summaryData
    };
  }, [upcomingTransactions, t]);

  if (isLoading) {
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
              {t('upcoming.loading', 'Loading upcoming transactions...')}
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
                {t('upcoming.noUpcoming', 'No Upcoming Transactions')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                {t('upcoming.noUpcomingDesc', 'No future transactions scheduled. Set up recurring transactions to see them here.')}
              </p>
              <Button 
                onClick={onOpenRecurringManager}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('upcoming.manageRecurring', 'Manage Recurring')}
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
      {/* ✨ Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UpcomingSummaryCard
          title={t('upcoming.totalTransactions', 'Total Upcoming')}
          value={summary.totalCount}
          icon={Clock}
          color="blue"
        />
        <UpcomingSummaryCard
          title={t('upcoming.expectedIncome', 'Expected Income')}
          value={summary.totalIncome}
          icon={TrendingUp}
          color="green"
        />
        <UpcomingSummaryCard
          title={t('upcoming.expectedExpenses', 'Expected Expenses')}
          value={summary.totalExpenses}
          icon={TrendingDown}
          color="purple"
        />
      </div>

      {/* ✨ Upcoming Transactions by Groups */}
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
                  {t('upcoming.title', 'Upcoming Transactions')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('upcoming.subtitle', 'Your scheduled transactions')} • {summary.totalCount} {t('transactions.total', 'total')}
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
                {t('upcoming.manage', 'Manage')}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 space-y-6"
            >
              {Object.entries(groupedTransactions).map(([groupKey, group]) => (
                <div key={groupKey} className="space-y-4">
                  <GroupHeader
                    title={group.title}
                    count={group.count}
                    totalAmount={group.totalAmount}
                    isExpanded={selectedGroup === groupKey || selectedGroup === 'all'}
                    onToggle={() => setSelectedGroup(
                      selectedGroup === groupKey ? 'all' : groupKey
                    )}
                  />
                  
                  <AnimatePresence>
                    {(selectedGroup === groupKey || selectedGroup === 'all') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3 pl-4"
                      >
                        {group.transactions.map((transaction, index) => (
                          <motion.div
                            key={transaction.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {isExpanded && (
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {t('upcoming.showingNext', { count: futureTransactions.length })}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenRecurringManager}
                className="text-purple-600 hover:text-purple-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('upcoming.manageRecurring', 'Manage Recurring')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default ModernUpcomingTransactions;
