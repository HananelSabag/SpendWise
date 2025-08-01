/**
 * 📅 UPCOMING TRANSACTIONS SECTION
 * Smart 3-month ahead transaction display with user controls
 * @version 1.0.0 - UPCOMING TRANSACTIONS SYSTEM
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
  EyeOff
} from 'lucide-react';

import { useUpcomingTransactions } from '../../../hooks/useUpcomingTransactions';
import { useTranslation, useCurrency, useTheme } from '../../../stores';
import { Button, Card, Badge, LoadingSpinner } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

// Helper function for relative time
const getRelativeTimeString = (date) => {
  return dateHelpers.formatDistance(date);
};

const UpcomingTransactionsSection = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  
  const [isExpanded, setIsExpanded] = useState(true);
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
        return summary.byTemplate;
      case 'date':
        return upcomingTransactions.reduce((acc, transaction) => {
          const dateKey = dateHelpers.format(transaction.date, 'yyyy-MM-dd');
          if (!acc[dateKey]) {
            acc[dateKey] = {
              name: dateHelpers.format(transaction.date, 'MMM dd, yyyy'),
              count: 0,
              transactions: []
            };
          }
          acc[dateKey].count++;
          acc[dateKey].transactions.push(transaction);
          return acc;
        }, {});
      case 'type':
        return upcomingTransactions.reduce((acc, transaction) => {
          const type = transaction.type;
          if (!acc[type]) {
            acc[type] = {
              name: type === 'income' ? 'Income' : 'Expenses',
              count: 0,
              transactions: []
            };
          }
          acc[type].count++;
          acc[type].transactions.push(transaction);
          return acc;
        }, {});
      default:
        return {};
    }
  }, [upcomingTransactions, summary.byTemplate, groupBy]);

  // ✅ HANDLE ACTIONS
  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this upcoming transaction?')) {
      try {
        await deleteUpcoming(transactionId);
      } catch (error) {
        console.error('Failed to delete upcoming transaction:', error);
      }
    }
  };

  const handleStopGeneration = async (templateId, templateName) => {
    if (window.confirm(`Are you sure you want to stop generating upcoming transactions for "${templateName}"? This will remove all future upcoming transactions for this template.`)) {
      try {
        await stopGeneration(templateId);
      } catch (error) {
        console.error('Failed to stop generation:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading upcoming transactions...</span>
        </div>
      </Card>
    );
  }

  if (!upcomingTransactions.length) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Upcoming Transactions
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create recurring transactions to see your upcoming financial schedule.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Upcoming Transactions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {summary.total} transactions planned for the next 3 months
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Regeneration Warning */}
            {summary.needsRegeneration && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/20 rounded-lg"
              >
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Regeneration Needed
                </span>
              </motion.div>
            )}

            {/* Toggle Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="p-2"
            >
              {showActions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Income</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Expenses</span>
              </div>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Next Due</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {summary.nearestDue 
                  ? getRelativeTimeString(summary.nearestDue.date)
                  : 'No upcoming transactions'
                }
              </p>
            </div>
          </motion.div>
        )}

        {/* Group By Controls */}
        {isExpanded && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Group by:</span>
            {['template', 'date', 'type'].map((option) => (
              <Button
                key={option}
                variant={groupBy === option ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setGroupBy(option)}
                className="capitalize"
              >
                {option}
              </Button>
            ))}
          </div>
        )}
      </Card>

      {/* Grouped Transactions */}
      <AnimatePresence>
        {isExpanded && Object.entries(groupedTransactions).map(([groupKey, group]) => (
          <motion.div
            key={groupKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  <Badge variant="secondary" size="sm">
                    {group.count} transactions
                  </Badge>
                </div>

                {/* Template Actions */}
                {showActions && groupBy === 'template' && group.templateId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStopGeneration(group.templateId, group.name)}
                    disabled={isStopping}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Stop Generation</span>
                  </Button>
                )}
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                {group.transactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        transaction.type === 'income' ? "bg-green-500" : "bg-red-500"
                      )} />
                      
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description || transaction.template_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {dateHelpers.format(transaction.date, 'MMM dd, yyyy')} • {transaction.category_name || 'No Category'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className={cn(
                        "font-bold",
                        transaction.type === 'income' ? "text-green-600" : "text-red-600"
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>

                      {/* Individual Transaction Actions */}
                      {showActions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          disabled={isDeleting}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default UpcomingTransactionsSection;