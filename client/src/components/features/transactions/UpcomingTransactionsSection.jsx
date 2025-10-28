/**
 * 📅 UPCOMING TRANSACTIONS SECTION - Clean Version
 * Smart 3-month ahead transaction display with good functionality
 * @version 2.0.0 - STABLE CLEAN VERSION
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Trash2,
  StopCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  EyeOff,
  BarChart3,
  Target,
  Settings,
  Filter,
  Sparkles
} from 'lucide-react';

import { useUpcomingTransactions } from '../../../hooks/useUpcomingTransactions';
import { useTranslation, useCurrency, useTheme } from '../../../stores';
import { Button, Card, Badge, LoadingSpinner } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';
import SimpleTransactionCard from '../transactions-v2/SimpleTransactionCard';

// Helper function for relative time
const getRelativeTimeString = (date) => {
  return dateHelpers.formatDistance(date);
};

const UpcomingTransactionsSection = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [groupBy, setGroupBy] = useState('template'); // template | date | type
  const [showActions, setShowActions] = useState(true);

  const {
    upcomingTransactions,
    summary,
    isLoading,
    isDeleting,
    isStopping,
    deleteUpcoming,
    stopGeneration
  } = useUpcomingTransactions();

  // ✅ GROUP TRANSACTIONS
  const groupedTransactions = React.useMemo(() => {
    if (!upcomingTransactions.length) return {};

    switch (groupBy) {
      case 'template':
        return upcomingTransactions.reduce((groups, transaction) => {
          const key = transaction.template_name || 'Unnamed Template';
          if (!groups[key]) {
            groups[key] = {
              title: key,
              count: 0,
              totalAmount: 0,
              transactions: []
            };
          }
          groups[key].count += 1;
          groups[key].totalAmount += transaction.amount;
          groups[key].transactions.push(transaction);
          return groups;
        }, {});

      case 'date':
        return upcomingTransactions.reduce((groups, transaction) => {
          const date = new Date(transaction.date);
          const key = date.toISOString().split('T')[0];
          const title = dateHelpers.formatMedium(date);
          if (!groups[key]) {
            groups[key] = {
              title,
              count: 0,
              totalAmount: 0,
              transactions: []
            };
          }
          groups[key].count += 1;
          groups[key].totalAmount += transaction.amount;
          groups[key].transactions.push(transaction);
          return groups;
        }, {});

      case 'type':
        return upcomingTransactions.reduce((groups, transaction) => {
          const key = transaction.type;
          const title = transaction.type === 'income' ? 'Income' : 'Expenses';
          if (!groups[key]) {
            groups[key] = {
              title,
              count: 0,
              totalAmount: 0,
              transactions: []
            };
          }
          groups[key].count += 1;
          groups[key].totalAmount += transaction.amount;
          groups[key].transactions.push(transaction);
          return groups;
        }, {});

      default:
        return {};
    }
  }, [upcomingTransactions, groupBy]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading upcoming transactions...</span>
        </div>
      </Card>
    );
  }

  if (!upcomingTransactions.length) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            No Upcoming Transactions
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            You don't have any upcoming transactions scheduled. Create recurring transactions to see them here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ✨ BEAUTIFUL SECTION HEADER */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-0 shadow-lg">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-200/20 to-transparent rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Enhanced Icon */}
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Enhanced Title */}
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Upcoming Transactions
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-600 dark:text-gray-400">
                    {summary.total} transactions planned for the next 3 months
                  </p>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    Smart Preview
                  </Badge>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
              >
                {showActions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* ✨ BEAUTIFUL SUMMARY STATS */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Total Transactions */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Transactions</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summary.total}</p>
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/50">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(summary.totalAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Group By Controls */}
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
                <div className="relative">
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-3">Group By</p>
                  <div className="flex gap-1">
                    {['template', 'date', 'type'].map((option) => (
                      <Button
                        key={option}
                        variant={groupBy === option ? "default" : "ghost"}
                        size="xs"
                        onClick={() => setGroupBy(option)}
                        className={cn(
                          "text-xs capitalize transition-all duration-200",
                          groupBy === option 
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md" 
                            : "text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                        )}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* ✨ BEAUTIFUL GROUPED TRANSACTIONS */}
      <AnimatePresence mode="popLayout">
        {isExpanded && Object.entries(groupedTransactions).map(([groupKey, group], index) => (
          <motion.div
            key={groupKey}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200">
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-100/30 dark:from-gray-700/30 to-transparent rounded-full -translate-y-12 translate-x-12" />
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center">
                      <Filter className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{group.title}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                          {group.count} transactions
                        </Badge>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {formatCurrency(group.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✨ UPCOMING TRANSACTIONS LIST WITH PROPER TRANSACTIONCARD */}
                <div className="space-y-3">
                  {group.transactions.map((transaction, transactionIndex) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: transactionIndex * 0.05 }}
                    >
                      <SimpleTransactionCard
                        transaction={transaction}
                        onSelect={undefined}
                        onEdit={undefined}
                        onDelete={(tx) => {
                          deleteUpcoming(tx.id);
                        }}
                        onDuplicate={undefined}
                        className="border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default UpcomingTransactionsSection;