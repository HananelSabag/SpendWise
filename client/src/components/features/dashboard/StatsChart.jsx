/**
 * StatsChart Component - Fixed Infinite Re-render Issue
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDashboard } from '../../../hooks/useDashboard';
import { useTransactions } from '../../../hooks/useTransactions';
import { cn, dateHelpers } from '../../../utils/helpers';
import { Card, Button, Badge } from '../../ui';
import LoadingSpinner from '../../ui/LoadingSpinner';

/**
 * StatsChart Component - Uses only dashboard data to avoid conflicts
 */
const StatsChart = ({ 
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';
  
  // State for range selection
  const [selectedRange, setSelectedRange] = useState('month');
  const [chartType, setChartType] = useState('trend');
  
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
      period: 'year'
    }
  ];

  // ✅ FIX: Use only dashboard hook to avoid conflicts
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError 
  } = useDashboard();
  
  // ✅ REMOVE: The problematic useTransactions hook that caused infinite re-renders
  // const currentRange = ranges.find(r => r.key === selectedRange);
  // const { 
  //   transactions: periodTransactions, 
  //   isLoading: transactionsLoading,
  //   error: transactionsError,
  //   updateFilters
  // } = useTransactions({
  //   limit: 1000,
  //   sortBy: 'date',
  //   sortOrder: 'DESC'
  // });

  // ✅ REMOVE: The problematic useEffect that caused infinite updates
  // useEffect(() => {
  //   if (currentRange) {
  //     const now = new Date();
  //     let startDate = null;
      
  //     if (currentRange.days) {
  //       startDate = new Date(now);
  //       startDate.setDate(startDate.getDate() - currentRange.days);
  //     } else if (currentRange.year) {
  //       startDate = new Date(now.getFullYear(), 0, 1);
  //     }
      
  //     updateFilters({
  //       startDate: startDate ? startDate.toISOString().split('T')[0] : null,
  //       endDate: now.toISOString().split('T')[0]
  //     });
  //   }
  // }, [selectedRange, currentRange, updateFilters]);

  // ✅ FIX: Generate trend data from dashboard data only
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

  // ✅ FIX: Calculate statistics using only dashboard data
  const stats = useMemo(() => {
    // Use recent transactions from dashboard data
    const transactions = dashboardData?.recentTransactions || [];
    
    if (transactions.length === 0 || dashboardLoading) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        transactionCount: 0,
        dailyAverage: 0,
        categoryBreakdown: [],
        trendData: [],
        loading: dashboardLoading
      };
    }

    // Process data more efficiently
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
    const currentRange = ranges.find(r => r.key === selectedRange);
    const days = currentRange?.days || 30;
    const dailyAverage = totalExpenses > 0 ? totalExpenses / days : 0;
    
    // Category breakdown (top 6 categories)
    const categoryMap = new Map();
    transactions.forEach(tx => {
      if (tx.category_name) {
        const current = categoryMap.get(tx.category_name) || 0;
        categoryMap.set(tx.category_name, current + parseFloat(tx.amount || 0));
      }
    });
    
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ 
        name, 
        amount, 
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0 
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // Generate trend data
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
      expenseCount: totals.expenseCount,
      loading: false
    };
  }, [dashboardData, dashboardLoading, selectedRange, ranges, generateTrendData]);

  const isLoading = dashboardLoading;
  const error = dashboardError;

  // ✅ REMOVE: Debug logging that caused spam
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_stats') === 'true') {
  //     console.log('📊 [STATS-CHART] Data sources:', {
  //       dashboardData: !!dashboardData,
  //       periodTransactions: periodTransactions?.length || 0,
  //       selectedRange,
  //     });
  //   }
  // }, [dashboardData, periodTransactions, selectedRange]);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" text={t('stats.loadingStats') || 'Loading stats...'} />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              {t('stats.error') || 'Failed to load statistics'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('dashboard.stats.title') || 'Statistics'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboard.stats.subtitle') || 'Transaction insights and trends'}
            </p>
          </div>
          
          {/* Range Selector */}
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            {ranges.map((range) => (
              <button
                key={range.key}
                onClick={() => setSelectedRange(range.key)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedRange === range.key
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
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
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
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
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
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
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
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
        {stats.categoryBreakdown.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('stats.topCategories') || 'Top Categories'}
            </h3>
            <div className="space-y-2">
              {stats.categoryBreakdown.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px] text-right">
                      {formatAmount(category.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {t('stats.noData') || 'No data available for the selected period'}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsChart;