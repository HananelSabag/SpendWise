/**
 * Enhanced StatsChart Component - Compact Summary Design
 * ✅ One row compact summary with key stats
 * ✅ "Show More" expansion for detailed insights
 * ✅ Income vs Expense pie chart (not categories!)
 * ✅ Transaction insights based on selected period
 * ✅ Stunning visual effects matching other components
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDashboard } from '../../../hooks/useDashboard';
import { cn } from '../../../utils/helpers';
import { Card, Badge } from '../../ui';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Calendar,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

/**
 * ✅ Beautiful Income vs Expense Pie Chart
 */
const IncomeExpensePieChart = ({ income, expenses, formatAmount, t }) => {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  
  const total = income + expenses;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">💰</div>
          <div className="text-sm">{t('dashboard.stats.noData')}</div>
        </div>
      </div>
    );
  }
  
  const incomePercentage = (income / total) * 100;
  const expensePercentage = (expenses / total) * 100;
  
  // Calculate angles for pie slices
  const incomeAngle = (incomePercentage / 100) * 360;
  const expenseAngle = (expensePercentage / 100) * 360;
  
  // Income slice path
  const incomeX1 = 50 + 40 * Math.cos(0);
  const incomeY1 = 50 + 40 * Math.sin(0);
  const incomeX2 = 50 + 40 * Math.cos((incomeAngle * Math.PI) / 180);
  const incomeY2 = 50 + 40 * Math.sin((incomeAngle * Math.PI) / 180);
  const incomeLargeArc = incomeAngle > 180 ? 1 : 0;
  const incomePathData = `M 50 50 L ${incomeX1} ${incomeY1} A 40 40 0 ${incomeLargeArc} 1 ${incomeX2} ${incomeY2} Z`;
  
  // Expense slice path
  const expenseX1 = incomeX2;
  const expenseY1 = incomeY2;
  const expenseX2 = 50 + 40 * Math.cos(((incomeAngle + expenseAngle) * Math.PI) / 180);
  const expenseY2 = 50 + 40 * Math.sin(((incomeAngle + expenseAngle) * Math.PI) / 180);
  const expenseLargeArc = expenseAngle > 180 ? 1 : 0;
  const expensePathData = `M 50 50 L ${expenseX1} ${expenseY1} A 40 40 0 ${expenseLargeArc} 1 ${expenseX2} ${expenseY2} Z`;

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="aspect-square">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(156, 163, 175, 0.2)"
            strokeWidth="2"
          />
          
          {/* Income slice */}
          <motion.g>
            {/* Glow effect */}
            <motion.path
              d={incomePathData}
              fill="hsl(142, 70%, 55%)"
              filter="blur(2px)"
              opacity="0.3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.3 }}
              transition={{ duration: 0.8, type: "spring" }}
            />
            {/* Main slice */}
            <motion.path
              d={incomePathData}
              fill="hsl(142, 70%, 55%)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredSlice('income')}
              onMouseLeave={() => setHoveredSlice(null)}
              style={{
                filter: hoveredSlice === 'income' ? 'brightness(1.15)' : 'none',
                transformOrigin: '50% 50%'
              }}
            />
          </motion.g>
          
          {/* Expense slice */}
          <motion.g>
            {/* Glow effect */}
            <motion.path
              d={expensePathData}
              fill="hsl(0, 70%, 60%)"
              filter="blur(2px)"
              opacity="0.3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.3 }}
              transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
            />
            {/* Main slice */}
            <motion.path
              d={expensePathData}
              fill="hsl(0, 70%, 60%)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredSlice('expense')}
              onMouseLeave={() => setHoveredSlice(null)}
              style={{
                filter: hoveredSlice === 'expense' ? 'brightness(1.15)' : 'none',
                transformOrigin: '50% 50%'
              }}
            />
          </motion.g>
        </svg>
        
        {/* Center Info */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg border border-white/30"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-lg"></div>
            <div className="relative z-10 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {Math.round(incomePercentage)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('dashboard.stats.income')}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredSlice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl p-3 border border-gray-200 dark:border-gray-700 z-20"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {hoveredSlice === 'income' ? t('dashboard.stats.income') : t('dashboard.stats.expenses')}
              </div>
              <div className={`text-lg font-bold ${hoveredSlice === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(hoveredSlice === 'income' ? income : expenses)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {hoveredSlice === 'income' ? incomePercentage.toFixed(1) : expensePercentage.toFixed(1)}% {t('dashboard.stats.ofTotal')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.stats.income')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.stats.expenses')}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * ✅ Main StatsChart Component - Enhanced with Better Financial Insights
 */
const StatsChart = ({ className = '' }) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  
  // State management
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // ✅ Updated range configurations with clearer mobile icons
  const ranges = [
    { key: 'daily', label: t('dashboard.balance.periods.daily') || 'Today', days: 1, icon: '1D', shortLabel: 'Day' },
    { key: 'weekly', label: t('dashboard.balance.periods.weekly') || 'Week', days: 7, icon: '7D', shortLabel: 'Week' },
    { key: 'monthly', label: t('dashboard.balance.periods.monthly') || 'Month', days: 30, icon: '1M', shortLabel: 'Month' },
    { key: 'yearly', label: t('dashboard.balance.periods.yearly') || 'Year', days: 365, icon: '1Y', shortLabel: 'Year' }
  ];

  // ✅ Use dashboard data directly with proper balance periods (no date needed)
  const { data: dashboardData, isLoading, error } = useDashboard();

  // ✅ Enhanced stats calculation using real dashboard data
  const stats = useMemo(() => {
    if (!dashboardData?.balances || !dashboardData?.recentTransactions) {
      return {
        savingsRate: 0,
        dailyAverage: 0,
        transactionCount: 0,
        budgetPerformance: 0,
        recurringImpact: 0,
        averageTransaction: 0,
        mostFrequentCategory: '',
        largestTransaction: 0,
        balanceTrend: 'stable',
        financialHealth: 50
      };
    }

    // Get current period balance data
    const currentBalance = dashboardData.balances[selectedRange] || { income: 0, expenses: 0, balance: 0 };
    const totalIncome = Math.abs(parseFloat(currentBalance.income) || 0);
    const totalExpenses = Math.abs(parseFloat(currentBalance.expenses) || 0);
    const netBalance = parseFloat(currentBalance.balance) || 0;
    
    // Get recent transactions for additional insights
    const recentTransactions = dashboardData.recentTransactions || [];
    const currentRange = ranges.find(r => r.key === selectedRange);
    const daysInPeriod = currentRange?.days || 30;
    
    // Calculate advanced insights
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
    const dailyAverage = totalExpenses / daysInPeriod;
    
    // Budget performance (assuming 70% of income should be expenses for healthy budget)
    const healthyExpenseRatio = 0.7;
    const currentExpenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 0;
    const budgetPerformance = Math.max(0, Math.min(100, 100 - ((currentExpenseRatio - healthyExpenseRatio) * 100)));
    
    // Recurring impact from dashboard data
    const recurringInfo = dashboardData.recurringInfo || {};
    const recurringIncome = parseFloat(recurringInfo.recurring_income) || 0;
    const recurringExpense = parseFloat(recurringInfo.recurring_expense) || 0;
    const recurringImpact = recurringIncome - recurringExpense;
    
    // Transaction insights
    const transactionAmounts = recentTransactions.map(tx => Math.abs(parseFloat(tx.amount) || 0));
    const averageTransaction = transactionAmounts.length > 0 
      ? transactionAmounts.reduce((a, b) => a + b, 0) / transactionAmounts.length 
      : 0;
    const largestTransaction = transactionAmounts.length > 0 ? Math.max(...transactionAmounts) : 0;
    
    // Most frequent category
    const categoryCount = new Map();
    recentTransactions.forEach(tx => {
      const category = tx.category_name || 'Unknown';
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });
    const mostFrequentCategory = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    
    // Balance trend (compare with previous periods if available)
    const balanceTrend = netBalance > 0 ? 'positive' : netBalance < 0 ? 'negative' : 'stable';
    
    // Financial health score (0-100)
    const healthFactors = [
      savingsRate > 10 ? 25 : (savingsRate > 0 ? 15 : 0), // Savings rate
      budgetPerformance > 70 ? 25 : (budgetPerformance > 50 ? 15 : 5), // Budget control
      recurringImpact > 0 ? 25 : (recurringImpact >= 0 ? 15 : 5), // Recurring balance
      recentTransactions.length > 0 ? 25 : 10 // Financial activity
    ];
    const financialHealth = healthFactors.reduce((a, b) => a + b, 0);

    return {
      savingsRate: Math.max(-100, Math.min(100, savingsRate)),
      dailyAverage,
      transactionCount: recentTransactions.length,
      budgetPerformance: Math.round(budgetPerformance),
      recurringImpact,
      averageTransaction,
      mostFrequentCategory,
      largestTransaction,
      balanceTrend,
      financialHealth: Math.min(100, financialHealth),
      // Keep totals for expanded view
      totalIncome,
      totalExpenses,
      netBalance
    };
  }, [dashboardData, selectedRange, ranges]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
        data-component="StatsChart"
      >
        {/* Loading Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 opacity-100 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-2xl"></div>
        </div>
        
        <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
        data-component="StatsChart"
      >
        <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
          <div className="p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              {t('dashboard.stats.error')}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {t('common.retry')}
            </button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
      data-component="StatsChart"
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 opacity-100 rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-2xl"></div>
        
        {/* Floating Orbs */}
        <motion.div 
          className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-4 left-4 w-12 h-12 bg-emerald-300/20 rounded-full blur-lg"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
        {/* Compact Header */}
        <div className="relative p-4 overflow-hidden">
          {/* Header Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              {/* Title */}
              <div className="flex items-center gap-3">
                <motion.div 
                  className="relative p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur-lg opacity-70"></div>
                  <BarChart3 className="relative w-4 h-4 text-white" />
                </motion.div>
                
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-900 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                    {t('dashboard.stats.title')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.stats.subtitle')}
                  </p>
                </div>
              </div>
              
              {/* Range Selector & Show More Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Mobile-friendly range selector */}
                <div className="flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-white/20 shadow-lg overflow-x-auto">
                  {ranges.map((range) => (
                    <motion.button
                      key={range.key}
                      onClick={() => setSelectedRange(range.key)}
                      className={`flex-shrink-0 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all relative min-w-[40px] ${
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
                          className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      {/* Desktop: Full label */}
                      <span className="relative z-10 hidden sm:inline">{range.label}</span>
                      {/* Mobile: Clear period indicators */}
                      <span className="relative z-10 sm:hidden font-bold text-[10px]">{range.icon}</span>
                    </motion.button>
                  ))}
                </div>
                
                <motion.button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{isExpanded ? t('dashboard.stats.showLess') : t('dashboard.stats.showMore')}</span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              </div>
            </div>
            
            {/* 📱 MOBILE RESPONSIVE: Enhanced Financial Insights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Savings Rate */}
              <motion.div
                className="group relative overflow-hidden bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-xl p-2.5 sm:p-3 shadow-lg"
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 via-green-400 to-teal-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium opacity-90">{t('dashboard.stats.savingsRate')}</span>
                    <Target className="w-3 h-3" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold">
                    {stats.savingsRate}%
                  </div>
                  <div className="text-xs opacity-75">
                    {stats.savingsRate > 10 ? t('dashboard.stats.excellent') : stats.savingsRate > 0 ? t('dashboard.stats.good') : t('dashboard.stats.improve')}
                  </div>
                </div>
              </motion.div>

              {/* Daily Average */}
              <motion.div
                className="group relative overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-xl p-2.5 sm:p-3 shadow-lg"
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300 via-indigo-400 to-purple-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium opacity-90">{t('dashboard.stats.dailyAvg')}</span>
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold">
                    {formatAmount(stats.dailyAverage)}
                  </div>
                  <div className="text-xs opacity-75">{t('dashboard.stats.spendingPerDay')}</div>
                </div>
              </motion.div>

              {/* Budget Performance */}
              <motion.div
                className="group relative overflow-hidden bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 rounded-xl p-2.5 sm:p-3 shadow-lg"
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-300 via-purple-400 to-indigo-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-500"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium opacity-90">{t('dashboard.stats.budget')}</span>
                    <BarChart3 className="w-3 h-3" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold">
                    {stats.budgetPerformance}%
                  </div>
                  <div className="text-xs opacity-75">
                    {stats.budgetPerformance > 70 ? t('dashboard.stats.onTrack') : t('dashboard.stats.review')}
                  </div>
                </div>
              </motion.div>

              {/* Financial Health */}
              <motion.div
                className={`group relative overflow-hidden rounded-xl p-2.5 sm:p-3 shadow-lg ${
                  stats.financialHealth > 70
                    ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600'
                    : stats.financialHealth > 40
                    ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-red-400 via-rose-500 to-pink-600'
                }`}
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className={`absolute inset-0 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity ${
                  stats.financialHealth > 70
                    ? 'bg-gradient-to-br from-green-300 via-emerald-400 to-teal-500'
                    : stats.financialHealth > 40
                    ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-red-300 via-rose-400 to-pink-500'
                }`}></div>
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-700"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium opacity-90">{t('dashboard.stats.health')}</span>
                    <Zap className="w-3 h-3" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold">
                    {stats.financialHealth}
                  </div>
                  <div className="text-xs opacity-75">
                    {stats.financialHealth > 70 ? t('dashboard.stats.great') : stats.financialHealth > 40 ? t('dashboard.stats.ok') : t('dashboard.stats.poor')}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Expandable Section - Updated with Income/Expense Chart */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Income vs Expense Chart */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {t('dashboard.stats.incomeVsExpenses')}
                    </h4>
                    <IncomeExpensePieChart 
                      income={stats.totalIncome} 
                      expenses={stats.totalExpenses} 
                      formatAmount={formatAmount}
                      t={t}
                    />
                  </div>

                  {/* Enhanced Transaction Insights */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {t('dashboard.stats.detailedInsights')}
                    </h4>
                    
                    <motion.div 
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                        {t('dashboard.stats.averageTransaction')}
                      </div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {formatAmount(stats.averageTransaction)}
                      </div>
                      <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                        {t('dashboard.stats.totalTransactions', { count: stats.transactionCount })}
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                        {t('dashboard.stats.recurringImpact')}
                      </div>
                      <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                        {formatAmount(stats.recurringImpact)}
                      </div>
                      <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                        {t('dashboard.stats.monthlyRecurringBalance')}
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                        {t('dashboard.stats.largestTransaction')}
                      </div>
                      <div className="text-xl font-bold text-green-700 dark:text-green-300">
                        {formatAmount(stats.largestTransaction)}
                      </div>
                      <div className="text-xs text-green-600/70 dark:text-green-400/70">
                        {t('dashboard.stats.singleTransaction')}
                      </div>
                    </motion.div>
                    
                    {stats.mostFrequentCategory && (
                      <motion.div 
                        className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800"
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                          {t('dashboard.stats.topCategory')}
                        </div>
                        <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                          {stats.mostFrequentCategory}
                        </div>
                        <div className="text-xs text-amber-600/70 dark:text-amber-400/70">
                          {t('dashboard.stats.mostUsedCategory')}
                        </div>
                      </motion.div>
                    )}
                    
                    <motion.div 
                      className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-1">
                        {t('dashboard.stats.balanceTrend')}
                      </div>
                      <div className="text-xl font-bold text-rose-700 dark:text-rose-300 capitalize">
                        {t(`dashboard.stats.trend.${stats.balanceTrend}`)}
                      </div>
                      <div className="text-xs text-rose-600/70 dark:text-rose-400/70">
                        {t('dashboard.stats.currentPeriodTrend')}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default StatsChart;