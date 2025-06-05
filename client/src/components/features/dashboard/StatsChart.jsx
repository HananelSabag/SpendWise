/**
 * StatsChart Component - Option 2: Flexible Ranges
 * NOW RECEIVES DASHBOARD DATA AS PROPS - NO MORE DUPLICATE HOOKS!
 * Displays transaction statistics with configurable time ranges
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Activity,
  Target,
  Info
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
// ✅ REMOVED: import { useDashboard } from '../../../hooks/useDashboard';
import { useTransactionsList } from '../../../hooks/useTransactionsList';
import { cn, dateHelpers } from '../../../utils/helpers';
import { Card, Button, Badge } from '../../ui';
import LoadingSpinner from '../../ui/LoadingSpinner';

/**
 * StatsChart Component - Option 2: Flexible Ranges
 * NOW RECEIVES DASHBOARD DATA AS PROPS - NO MORE DUPLICATE HOOKS!
 * Displays transaction statistics with configurable time ranges
 */
const StatsChart = ({ 
  className = '',
  dashboardData = null,
  loading: dashboardLoading = false 
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';
  
  // State for range selection
  const [selectedRange, setSelectedRange] = useState('month');
  const [chartType, setChartType] = useState('trend'); // 'trend' | 'category'
  
  // Range configurations
  const ranges = [
    { 
      key: 'week', 
      label: t('common.last7Days') || 'Last 7 Days', 
      days: 7,
      period: 'week'
    },
    { 
      key: 'month', 
      label: t('common.last30Days') || 'Last 30 Days', 
      days: 30,
      period: 'month'
    },
    { 
      key: 'quarter', 
      label: t('common.last90Days') || 'Last 90 Days', 
      days: 90,
      period: '3months'
    },
    { 
      key: 'year', 
      label: t('common.thisYear') || 'This Year', 
      year: true,
      period: 'year'
    },
    { 
      key: 'all', 
      label: t('common.allTime') || 'All Time', 
      all: true,
      period: 'year' // Use year as fallback for API
    }
  ];

  // ✅ REMOVED: Duplicate useDashboard() call
  // const { data: dashboardData, isLoading: dashboardLoading } = useDashboard();
  
  // Get detailed transaction data for selected range
  const currentRange = ranges.find(r => r.key === selectedRange);
  const { 
    periodTransactions, 
    loading: transactionsLoading
  } = useTransactionsList({
    period: currentRange?.period || 'month',
    type: null,
    searchTerm: '',
    page: 1,
    limit: 1000 // Get more data for better charts
  });

  // ✅ Generate trend data based on range
  const generateTrendData = React.useCallback((transactions, range) => {
    if (!transactions || transactions.length === 0) return [];
    
    const now = new Date();
    const groupBy = range?.days > 30 ? 'week' : 'day';
    const periods = range?.days > 30 ? Math.ceil(range.days / 7) : range?.days || 30;
    
    const trendMap = new Map();
    
    // Initialize periods
    for (let i = 0; i < periods; i++) {
      const date = new Date(now);
      if (groupBy === 'week') {
        date.setDate(date.getDate() - (i * 7));
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split('T')[0];
        trendMap.set(key, { income: 0, expenses: 0, date: weekStart });
      } else {
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        trendMap.set(key, { income: 0, expenses: 0, date: new Date(date) });
      }
    }
    
    // Fill with actual data
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      let key;
      
      if (groupBy === 'week') {
        const weekStart = new Date(txDate);
        weekStart.setDate(txDate.getDate() - txDate.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = txDate.toISOString().split('T')[0];
      }
      
      if (trendMap.has(key)) {
        const period = trendMap.get(key);
        if (tx.transaction_type === 'income') {
          period.income += parseFloat(tx.amount || 0);
        } else {
          period.expenses += parseFloat(tx.amount || 0);
        }
      }
    });
    
    return Array.from(trendMap.values())
      .sort((a, b) => a.date - b.date)
      .map((period, index) => ({
        ...period,
        balance: period.income - period.expenses,
        label: groupBy === 'week' 
          ? `Week ${index + 1}`
          : dateHelpers.format(period.date, 'MMM dd', language)
      }));
  }, [language]);

  // Calculate statistics for selected range
  // ✅ OPTIMIZATION: Memoize expensive calculations
  const stats = useMemo(() => {
    const transactions = periodTransactions || dashboardData?.recentTransactions || [];
    
    if (transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        transactionCount: 0,
        dailyAverage: 0,
        categoryBreakdown: [],
        trendData: []
      };
    }

    // ✅ OPTIMIZATION: Process data more efficiently
    const totals = transactions.reduce((acc, tx) => {
      const amount = parseFloat(tx.amount || 0);
      if (tx.transaction_type === 'income') {
        acc.totalIncome += amount;
        acc.incomeCount++;
      } else {
        acc.totalExpenses += amount;
        acc.expenseCount++;
      }
      return acc;
    }, { totalIncome: 0, totalExpenses: 0, incomeCount: 0, expenseCount: 0 });

    const totalIncome = totals.totalIncome;
    const totalExpenses = totals.totalExpenses;
    const netBalance = totalIncome - totalExpenses;
    
    // Calculate daily average
    const days = currentRange?.days || 30;
    const dailyAverage = totalExpenses / days;
    
    // Category breakdown (top 6 categories)
    const categoryMap = new Map();
    transactions.forEach(tx => {
      if (tx.category_name) {
        const current = categoryMap.get(tx.category_name) || 0;
        categoryMap.set(tx.category_name, current + parseFloat(tx.amount || 0));
      }
    });
    
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount, percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // ✅ Generate trend data
    const trendData = generateTrendData(transactions, currentRange);

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      transactionCount: transactions.length,
      dailyAverage,
      categoryBreakdown,
      trendData,
      incomeCount: totals.incomeCount,
      expenseCount: totals.expenseCount
    };
  }, [periodTransactions, dashboardData, currentRange, generateTrendData]);

  const isLoading = dashboardLoading || transactionsLoading;

  // ✅ OPTIMIZATION: Reduce debug logs in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_stats') === 'true') {
      console.log('📊 [STATS-CHART] Data sources:', {
        dashboardData: !!dashboardData,
        periodTransactions: periodTransactions?.length || 0,
        selectedRange,
      });
    }
  }, [dashboardData, periodTransactions, selectedRange]);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" text={t('stats.loadingStats') || 'Loading stats...'} />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('stats.title') || 'Statistics'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentRange?.label} • {stats.transactionCount} {t('transactions.items') || 'items'}
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Chart Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setChartType('trend')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  chartType === 'trend'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <TrendingUp className="w-4 h-4 mr-1.5 inline" />
                {t('stats.trend') || 'Trend'}
              </button>
              <button
                onClick={() => setChartType('category')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  chartType === 'category'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <PieChart className="w-4 h-4 mr-1.5 inline" />
                {t('stats.categories') || 'Categories'}
              </button>
            </div>
            
            {/* Range Selector */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {ranges.map(range => (
                <button
                  key={range.key}
                  onClick={() => setSelectedRange(range.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                    selectedRange === range.key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('transactions.income') || 'Income'}
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatAmount(stats.totalIncome)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.incomeCount} {t('transactions.items') || 'items'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('transactions.expense') || 'Expenses'}
              </span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatAmount(stats.totalExpenses)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.expenseCount} {t('transactions.items') || 'items'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('common.balance') || 'Balance'}
              </span>
            </div>
            <div className={cn(
              'text-2xl font-bold',
              stats.netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
            )}>
              {formatAmount(stats.netBalance)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.netBalance >= 0 ? t('common.positive') || 'Positive' : t('common.negative') || 'Negative'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('stats.dailyAverage') || 'Daily Avg'}
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatAmount(stats.dailyAverage)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('stats.perDay') || 'per day'}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {chartType === 'trend' ? (
            <TrendChart key="trend" data={stats.trendData} formatAmount={formatAmount} />
          ) : (
            <CategoryChart key="category" data={stats.categoryBreakdown} formatAmount={formatAmount} />
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

// Trend Chart Component
const TrendChart = ({ data, formatAmount }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No trend data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expenses, Math.abs(d.balance))));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-64"
    >
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((period, index) => (
          <div key={index} className="flex-1 flex flex-col items-center h-full">
            <div className="flex-1 flex flex-col justify-end w-full max-w-16 gap-1">
              {/* Income Bar */}
              <div
                className="bg-green-500 rounded-t-md min-h-[2px] transition-all duration-300 hover:bg-green-600"
                style={{ height: `${maxValue > 0 ? (period.income / maxValue) * 70 : 0}%` }}
                title={`Income: ${formatAmount(period.income)}`}
              />
              {/* Expense Bar */}
              <div
                className="bg-red-500 rounded-t-md min-h-[2px] transition-all duration-300 hover:bg-red-600"
                style={{ height: `${maxValue > 0 ? (period.expenses / maxValue) * 70 : 0}%` }}
                title={`Expenses: ${formatAmount(period.expenses)}`}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              {period.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Category Chart Component
const CategoryChart = ({ data, formatAmount }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No category data available
      </div>
    );
  }

  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {data.map((category, index) => (
        <div key={category.name} className="flex items-center gap-4">
          <div className={cn('w-4 h-4 rounded-full', colors[index % colors.length])} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900 dark:text-white">
                {category.name}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatAmount(category.amount)} ({category.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className={cn('h-2 rounded-full', colors[index % colors.length])}
                initial={{ width: 0 }}
                animate={{ width: `${category.percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export default StatsChart;