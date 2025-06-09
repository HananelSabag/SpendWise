/**
 * Enhanced StatsChart Component - Beautiful Graphs & Animations
 * ✅ Based on your working version
 * ✅ Added beautiful animated graphs (Pie & Bar charts)
 * ✅ More alive animations in the main row
 * ✅ User-friendly graph type selection
 * ✅ Smooth transitions and micro-interactions
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDashboard } from '../../../hooks/useDashboard';
import { cn } from '../../../utils/helpers';
import { Card, Badge } from '../../ui';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { PieChart, BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';

/**
 * ✅ Beautiful Pie Chart Component
 */
const AnimatedPieChart = ({ data, formatAmount }) => {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  let currentAngle = 0;
  
  const slices = data.map((item, index) => {
    const percentage = (item.amount / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    const x1 = 50 + 45 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 50 + 45 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 50 + 45 * Math.cos(((startAngle + angle) * Math.PI) / 180);
    const y2 = 50 + 45 * Math.sin(((startAngle + angle) * Math.PI) / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    const pathData = `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`;
    
    const hue = (index * 360) / data.length;
    const color = `hsl(${hue}, 70%, ${item.isIncome ? '55%' : '60%'})`;
    
    return {
      ...item,
      pathData,
      color,
      percentage,
      angle: startAngle + angle / 2
    };
  });

  return (
    <div className="relative w-80 h-80 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {slices.map((slice, index) => (
          <motion.path
            key={slice.name}
            d={slice.pathData}
            fill={slice.color}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setHoveredSlice(slice)}
            onMouseLeave={() => setHoveredSlice(null)}
            style={{
              filter: hoveredSlice?.name === slice.name ? 'brightness(1.1)' : 'none',
              transformOrigin: '50% 50%'
            }}
          />
        ))}
      </svg>
      
      {/* Center Info */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-lg">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {data.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Categories
          </div>
        </div>
      </div>
      
      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredSlice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {hoveredSlice.name}
            </div>
            <div className="text-lg font-bold" style={{ color: hoveredSlice.color }}>
              {formatAmount(hoveredSlice.amount)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {hoveredSlice.percentage.toFixed(1)}% • {hoveredSlice.count} transactions
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * ✅ Beautiful Bar Chart Component
 */
const AnimatedBarChart = ({ data, formatAmount }) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const maxAmount = Math.max(...data.map(item => item.amount));
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = (item.amount / maxAmount) * 100;
        const hue = (index * 360) / data.length;
        const color = `hsl(${hue}, 70%, ${item.isIncome ? '55%' : '60%'})`;
        
        return (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
            onMouseEnter={() => setHoveredBar(item)}
            onMouseLeave={() => setHoveredBar(null)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {item.count}
                </Badge>
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {formatAmount(item.amount)}
              </span>
            </div>
            
            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full relative"
                style={{ backgroundColor: color }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ 
                    duration: 2, 
                    delay: index * 0.1 + 0.5,
                    ease: "easeInOut" 
                  }}
                />
              </motion.div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {item.percentage.toFixed(1)}% • Avg: {formatAmount(item.amount / item.count)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/**
 * ✅ Main StatsChart Component (Enhanced version of your working code)
 */
const StatsChart = ({ className = '' }) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  
  // State management
  const [selectedRange, setSelectedRange] = useState('month');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  
  // ✅ Your working range configurations
  const ranges = [
    { key: 'week', label: t('common.last7Days') || 'Last 7 Days', days: 7 },
    { key: 'month', label: t('common.last30Days') || 'Last 30 Days', days: 30 },
    { key: 'quarter', label: t('common.last90Days') || 'Last 90 Days', days: 90 },
    { key: 'year', label: t('common.thisYear') || 'This Year', days: 365 }
  ];

  // ✅ Your working dashboard data usage
  const { data: dashboardData, isLoading, error } = useDashboard();

  // ✅ Your working stats calculation (keeping exactly as you had it)
  const stats = useMemo(() => {
    if (!dashboardData?.recentTransactions) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        transactionCount: 0,
        dailyAverage: 0,
        categoryBreakdown: [],
        incomeCount: 0,
        expenseCount: 0,
        averageTransaction: 0,
        biggestExpense: 0,
        biggestIncome: 0
      };
    }

    const currentRange = ranges.find(r => r.key === selectedRange);
    const daysToFilter = currentRange?.days || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToFilter);

    const filteredTransactions = dashboardData.recentTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= cutoffDate;
    });

    const totals = filteredTransactions.reduce((acc, tx) => {
      const amount = Math.abs(parseFloat(tx.amount || 0));
      const isIncome = tx.transaction_type === 'income' || tx.type === 'income';
      
      if (isIncome) {
        acc.totalIncome += amount;
        acc.incomeCount++;
        acc.incomeAmounts.push(amount);
      } else {
        acc.totalExpenses += amount;
        acc.expenseCount++;
        acc.expenseAmounts.push(amount);
      }
      acc.allAmounts.push(amount);
      return acc;
    }, { 
      totalIncome: 0, 
      totalExpenses: 0, 
      incomeCount: 0, 
      expenseCount: 0,
      incomeAmounts: [],
      expenseAmounts: [],
      allAmounts: []
    });

    const netBalance = totals.totalIncome - totals.totalExpenses;
    const dailyAverage = totals.totalExpenses > 0 ? totals.totalExpenses / daysToFilter : 0;
    
    const averageTransaction = totals.allAmounts.length > 0 
      ? totals.allAmounts.reduce((a, b) => a + b, 0) / totals.allAmounts.length 
      : 0;
    
    const biggestExpense = totals.expenseAmounts.length > 0 ? Math.max(...totals.expenseAmounts) : 0;
    const biggestIncome = totals.incomeAmounts.length > 0 ? Math.max(...totals.incomeAmounts) : 0;
    
    // Category breakdown
    const categoryMap = new Map();
    filteredTransactions.forEach(tx => {
      if (tx.category_name || tx.category) {
        const categoryName = tx.category_name || tx.category;
        const amount = Math.abs(parseFloat(tx.amount || 0));
        const current = categoryMap.get(categoryName) || { amount: 0, count: 0, isIncome: false };
        const isIncome = tx.transaction_type === 'income' || tx.type === 'income';
        
        categoryMap.set(categoryName, {
          amount: current.amount + amount,
          count: current.count + 1,
          isIncome: isIncome || current.isIncome
        });
      }
    });
    
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ 
        name, 
        amount: data.amount,
        count: data.count,
        isIncome: data.isIncome,
        percentage: (totals.totalIncome + totals.totalExpenses) > 0 
          ? (data.amount / (totals.totalIncome + totals.totalExpenses)) * 100 
          : 0 
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    return {
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpenses,
      netBalance,
      transactionCount: filteredTransactions.length,
      dailyAverage,
      categoryBreakdown,
      incomeCount: totals.incomeCount,
      expenseCount: totals.expenseCount,
      averageTransaction,
      biggestExpense,
      biggestIncome
    };
  }, [dashboardData?.recentTransactions, selectedRange, ranges]);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="large" text={t('stats.loadingStats') || 'Loading stats...'} />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-32">
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
      {/* ✅ ENHANCED: More alive header with better animations */}
      <motion.div 
        className="p-4 bg-gradient-to-r from-primary-50 via-blue-50 to-purple-50 dark:from-primary-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700"
        whileHover={{ backgroundPosition: "200% 0" }}
        transition={{ duration: 0.5 }}
        style={{ backgroundSize: "200% 100%" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.div 
                className="w-5 h-5 bg-primary-600 dark:bg-primary-400 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <span className="text-white text-xs">📊</span>
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('dashboard.stats.title') || 'Statistics'}
              </h3>
            </motion.div>
            
            {/* ✅ ENHANCED: Animated range selector */}
            <div className="flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              {ranges.map((range) => (
                <motion.button
                  key={range.key}
                  onClick={() => setSelectedRange(range.key)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all relative overflow-hidden ${
                    selectedRange === range.key
                      ? 'text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {selectedRange === range.key && (
                    <motion.div
                      layoutId="activeRange"
                      className="absolute inset-0 bg-primary-500 rounded-md"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{range.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ✅ ENHANCED: More alive expand button */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronDownIcon className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* ✅ ENHANCED: More alive key stats row */}
      <div className="p-4 bg-white dark:bg-gray-800">
        <div className="grid grid-cols-4 gap-4">
          {/* ✅ Balance with animation */}
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <motion.span 
                className={stats.netBalance >= 0 ? "text-green-500 text-sm" : "text-red-500 text-sm"}
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {stats.netBalance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              </motion.span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('common.balance') || 'Balance'}
              </span>
            </div>
            <motion.div 
              className={cn(
                'text-xl font-bold',
                stats.netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
              key={stats.netBalance} // Re-animate when value changes
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              {formatAmount(stats.netBalance)}
            </motion.div>
          </motion.div>

          {/* ✅ Income with animation */}
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <motion.div 
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('transactions.income') || 'Income'}
              </span>
            </div>
            <motion.div 
              className="text-xl font-bold text-green-600 dark:text-green-400"
              key={stats.totalIncome}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              {formatAmount(stats.totalIncome)}
            </motion.div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stats.incomeCount} {t('transactions.items') || 'items'}
            </div>
          </motion.div>

          {/* ✅ Expenses with animation */}
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <motion.div 
                className="w-2 h-2 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('transactions.expense') || 'Expenses'}
              </span>
            </div>
            <motion.div 
              className="text-xl font-bold text-red-600 dark:text-red-400"
              key={stats.totalExpenses}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              {formatAmount(stats.totalExpenses)}
            </motion.div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stats.expenseCount} {t('transactions.items') || 'items'}
            </div>
          </motion.div>

          {/* ✅ Daily Average with animation */}
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <CalendarIcon className="w-3 h-3 text-purple-500" />
              </motion.div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('stats.dailyAverage') || 'Daily Avg'}
              </span>
            </div>
            <motion.div 
              className="text-xl font-bold text-purple-600 dark:text-purple-400"
              key={stats.dailyAverage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              {formatAmount(stats.dailyAverage)}
            </motion.div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('stats.perDay') || 'per day'}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ✅ ENHANCED: Beautiful expandable section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
          >
            {/* ✅ ENHANCED: View selector with chart type toggle */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {[
                    { key: 'overview', label: 'Overview', icon: '📈' },
                    { key: 'categories', label: 'Categories', icon: '📊' }
                  ].map(({ key, label, icon }) => (
                    <motion.button
                      key={key}
                      onClick={() => setActiveView(key)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative',
                        activeView === key
                          ? 'text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {activeView === key && (
                        <motion.div
                          layoutId="activeView"
                          className="absolute inset-0 bg-primary-500 rounded-lg"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 text-sm">{icon}</span>
                      <span className="relative z-10">{label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* ✅ Chart Type Selector (only show for categories) */}
                {activeView === 'categories' && stats.categoryBreakdown.length > 0 && (
                  <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                    <motion.button
                      onClick={() => setChartType('bar')}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all relative',
                        chartType === 'bar' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {chartType === 'bar' && (
                        <motion.div
                          layoutId="chartType"
                          className="absolute inset-0 bg-primary-500 rounded-md"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <BarChart3 className="w-3 h-3 relative z-10" />
                      <span className="relative z-10">Bar</span>
                    </motion.button>
                    <motion.button
                      onClick={() => setChartType('pie')}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all relative',
                        chartType === 'pie' ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {chartType === 'pie' && (
                        <motion.div
                          layoutId="chartType"
                          className="absolute inset-0 bg-primary-500 rounded-md"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <PieChart className="w-3 h-3 relative z-10" />
                      <span className="relative z-10">Pie</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ ENHANCED: Beautiful content sections */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeView === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <motion.div 
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                          Average Transaction
                        </div>
                        <motion.div 
                          className="text-2xl font-bold text-blue-700 dark:text-blue-300"
                          key={stats.averageTransaction}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        >
                          {formatAmount(stats.averageTransaction)}
                        </motion.div>
                      </motion.div>
                      
                      <motion.div 
                        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                          Biggest Income
                        </div>
                        <motion.div 
                          className="text-2xl font-bold text-green-700 dark:text-green-300"
                          key={stats.biggestIncome}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        >
                          {formatAmount(stats.biggestIncome)}
                        </motion.div>
                      </motion.div>
                      
                      <motion.div 
                        className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                          Biggest Expense
                        </div>
                        <motion.div 
                          className="text-2xl font-bold text-red-700 dark:text-red-300"
                          key={stats.biggestExpense}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        >
                          {formatAmount(stats.biggestExpense)}
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {activeView === 'categories' && (
                  <motion.div
                    key="categories"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {stats.categoryBreakdown.length > 0 ? (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                          Category Breakdown
                        </h4>
                        
                        {/* ✅ Beautiful Charts */}
                        <AnimatePresence mode="wait">
                          {chartType === 'pie' ? (
                            <motion.div
                              key="pie"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.3 }}
                            >
                              <AnimatedPieChart data={stats.categoryBreakdown} formatAmount={formatAmount} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="bar"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.3 }}
                            >
                              <AnimatedBarChart data={stats.categoryBreakdown} formatAmount={formatAmount} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <motion.div 
                          className="w-12 h-12 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <span className="text-white text-2xl">📊</span>
                        </motion.div>
                        <div className="text-gray-500 dark:text-gray-400">
                          No category data available for the selected period
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default StatsChart;