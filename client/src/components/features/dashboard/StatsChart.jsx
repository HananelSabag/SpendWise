/**
 * Enhanced StatsChart Component - Intelligent Financial Analytics
 * ✅ Smart data analysis with actionable insights
 * ✅ Multiple visualization options (pie chart, bar chart, trends)
 * ✅ Advanced financial health scoring
 * ✅ Mobile-first responsive design
 * ✅ Real-time period switching with smooth animations
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
  ArrowDownRight,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react';

/**
 * Beautiful Income vs Expense Pie Chart with enhanced animations
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
            <motion.path
              d={incomePathData}
              fill="hsl(142, 70%, 55%)"
              filter="blur(2px)"
              opacity="0.3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.3 }}
              transition={{ duration: 0.8, type: "spring" }}
            />
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
            <motion.path
              d={expensePathData}
              fill="hsl(0, 70%, 60%)"
              filter="blur(2px)"
              opacity="0.3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.3 }}
              transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
            />
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
 * Enhanced Mini Bar Chart for spending trends
 */
const MiniBarChart = ({ data, formatAmount, t }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400 text-sm">
        {t('dashboard.stats.noTrendData')}
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  
  return (
    <div className="flex items-end justify-between h-32 gap-1 px-2">
      {data.map((item, index) => {
        const height = maxValue > 0 ? (Math.abs(item.value) / maxValue) * 100 : 0;
        const isPositive = item.value >= 0;
        
        return (
          <motion.div
            key={index}
            className="flex flex-col items-center gap-1 flex-1"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div 
              className={`w-full rounded-t-sm ${
                isPositive 
                  ? 'bg-gradient-to-t from-green-500 to-green-400' 
                  : 'bg-gradient-to-t from-red-500 to-red-400'
              } shadow-sm`}
              style={{ height: `${height}%`, minHeight: '4px' }}
              title={`${item.label}: ${formatAmount(item.value)}`}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {item.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

/**
 * Smart Financial Health Score Calculator
 */
const calculateFinancialHealth = (dashboardData, selectedPeriod, t) => {
  if (!dashboardData?.balances) {
    return { score: 0, insights: [], level: 'poor' };
  }

  const balance = dashboardData.balances[selectedPeriod] || {};
  const recurringInfo = dashboardData.recurringInfo || {};
  const recentTransactions = dashboardData.recentTransactions || [];
  
  const income = Math.abs(parseFloat(balance.income) || 0);
  const expenses = Math.abs(parseFloat(balance.expenses) || 0);
  const netBalance = parseFloat(balance.balance) || 0;
  
  const recurringIncome = parseFloat(recurringInfo.recurring_income) || 0;
  const recurringExpenses = parseFloat(recurringInfo.recurring_expense) || 0;
  
  let score = 50; // Base score
  const insights = [];
  
  // 1. Savings Rate Analysis (25 points)
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  if (savingsRate > 20) {
    score += 25;
          insights.push({
        type: 'positive',
        message: `${t('dashboard.stats.excellentSavingsRate')} ${savingsRate.toFixed(1)}%`,
        impact: 'high'
      });
    } else if (savingsRate > 10) {
      score += 15;
      insights.push({
        type: 'neutral', 
        message: `${t('dashboard.stats.goodSavingsRate')} ${savingsRate.toFixed(1)}%`,
        impact: 'medium'
      });
    } else if (savingsRate > 0) {
      score += 5;
      insights.push({
        type: 'warning',
        message: `${t('dashboard.stats.lowSavingsRate')} ${savingsRate.toFixed(1)}%`,
        impact: 'high'
      });
    } else {
      score -= 10;
      insights.push({
        type: 'negative',
        message: t('dashboard.stats.spendingExceedsIncome'),
        impact: 'critical'
      });
  }
  
  // 2. Expense Ratio Analysis (20 points)
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 100;
      if (expenseRatio < 70) {
      score += 20;
      insights.push({
        type: 'positive',
        message: t('dashboard.stats.healthyExpenseRatio'),
        impact: 'medium'
      });
    } else if (expenseRatio < 90) {
      score += 10;
    } else {
      score -= 5;
      insights.push({
        type: 'warning',
        message: t('dashboard.stats.highExpenseRatio'),
        impact: 'high'
      });
    }
  
  // 3. Recurring Income Stability (15 points)
  const recurringIncomeRatio = income > 0 ? (recurringIncome / income) * 100 : 0;
      if (recurringIncomeRatio > 70) {
      score += 15;
      insights.push({
        type: 'positive',
        message: t('dashboard.stats.strongRecurringIncome'),
        impact: 'medium'
      });
    } else if (recurringIncomeRatio > 40) {
      score += 8;
      insights.push({
        type: 'neutral',
        message: t('dashboard.stats.moderateRecurringIncome'),
        impact: 'medium'
      });
    } else if (recurringIncomeRatio > 0) {
      score += 3;
      insights.push({
        type: 'warning',
        message: t('dashboard.stats.limitedRecurringIncome'),
        impact: 'medium'
      });
    }
  
  // 4. Transaction Activity Analysis (10 points)
  const transactionCount = recentTransactions.length;
  if (transactionCount > 0) {
    const avgTransactionSize = expenses / Math.max(transactionCount, 1);
    const largeTransactions = recentTransactions.filter(t => 
      Math.abs(parseFloat(t.amount)) > avgTransactionSize * 2
    ).length;
    
          if (largeTransactions / transactionCount < 0.2) {
        score += 10;
        insights.push({
          type: 'positive',
          message: t('dashboard.stats.consistentSpending'),
          impact: 'low'
        });
      } else if (largeTransactions / transactionCount > 0.5) {
        score -= 5;
        insights.push({
          type: 'warning',
          message: t('dashboard.stats.irregularSpending'),
          impact: 'medium'
        });
      }
  }
  
  // 5. Balance Trend (10 points)
      if (netBalance > 0) {
      score += 10;
      insights.push({
        type: 'positive',
        message: t('dashboard.stats.positiveBalance'),
        impact: 'medium'
      });
    } else if (netBalance < 0) {
      score -= 5;
      insights.push({
        type: 'negative',
        message: t('dashboard.stats.negativeBalance'),
        impact: 'high'
      });
    }
  
  // Determine level
  let level = 'poor';
  if (score >= 80) level = 'excellent';
  else if (score >= 65) level = 'good';
  else if (score >= 50) level = 'fair';
  
  return {
    score: Math.max(0, Math.min(100, score)),
    insights: insights.slice(0, 4), // Limit to most important insights
    level,
    breakdown: {
      savingsRate: savingsRate.toFixed(1),
      expenseRatio: expenseRatio.toFixed(1),
      recurringIncomeRatio: recurringIncomeRatio.toFixed(1),
      transactionCount,
      netBalance
    }
  };
};

/**
 * Main Enhanced StatsChart Component
 */
const StatsChart = ({ className = '' }) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';
  
  // State management
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartType, setChartType] = useState('pie'); // 'pie' or 'bars'
  
  // Enhanced range configurations
  const ranges = [
    { key: 'daily', label: t('dashboard.balance.periods.daily'), days: 1, icon: '1D', shortLabel: 'Day' },
    { key: 'weekly', label: t('dashboard.balance.periods.weekly'), days: 7, icon: '7D', shortLabel: 'Week' },
    { key: 'monthly', label: t('dashboard.balance.periods.monthly'), days: 30, icon: '1M', shortLabel: 'Month' },
    { key: 'yearly', label: t('dashboard.balance.periods.yearly'), days: 365, icon: '1Y', shortLabel: 'Year' }
  ];

  // Get dashboard data
  const { data: dashboardData, isLoading, error } = useDashboard();

  // Helper functions - defined before use
  const getDaysInPeriod = useCallback((period) => {
    const range = ranges.find(r => r.key === period);
    return range ? range.days : 30;
  }, [ranges]);

  const calculateExpenseVolatility = useCallback((transactions) => {
    if (!transactions || transactions.length < 2) return 0;
    
    const expenseAmounts = transactions
      .filter(tx => tx.transaction_type === 'expense')
      .map(tx => Math.abs(parseFloat(tx.amount) || 0));
    
    if (expenseAmounts.length < 2) return 0;
    
    const mean = expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length;
    const variance = expenseAmounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / expenseAmounts.length;
    
    return Math.sqrt(variance) / mean * 100; // Coefficient of variation as percentage
  }, []);

  const generateRecommendations = useCallback((metrics, health, income, expenses, t) => {
    const recommendations = [];
    
    if (metrics.savingsRate < 10) {
      recommendations.push({
        type: 'savings',
        priority: 'high',
        title: t('dashboard.stats.increaseSavingsRate'),
        description: t('dashboard.stats.currentSavingsRateAim', { rate: metrics.savingsRate.toFixed(1) }),
        action: t('dashboard.stats.reviewExpenses')
      });
    }
    
    if (metrics.expenseVolatility > 50) {
      recommendations.push({
        type: 'consistency',
        priority: 'medium',
        title: t('dashboard.stats.stabilizeSpending'),
        description: t('dashboard.stats.highSpendingVolatility'),
        action: t('dashboard.stats.createBudget')
      });
    }
    
    if (metrics.recurringCoverage < 50) {
      recommendations.push({
        type: 'income',
        priority: 'medium',
        title: t('dashboard.stats.buildRecurringIncome'),
        description: t('dashboard.stats.onlyRecurringIncome', { percent: metrics.recurringCoverage.toFixed(1) }),
        action: t('dashboard.stats.considerRecurringIncome')
      });
    }
    
    if (metrics.burnRate > income / 20) { // If daily burn rate is > 5% of income
      recommendations.push({
        type: 'expenses',
        priority: 'high',
        title: t('dashboard.stats.highBurnRate'),
        description: t('dashboard.stats.dailySpendingHigh'),
        action: t('dashboard.stats.reduceExpenses')
      });
    }
    
    return recommendations.slice(0, 3); // Top 3 recommendations
  }, []);

  // Enhanced analytics calculations
  const analytics = useMemo(() => {
    if (!dashboardData?.balances) {
      return {
        currentPeriod: { income: 0, expenses: 0, balance: 0 },
        financialHealth: { score: 0, insights: [], level: 'poor' },
        trends: [],
        keyMetrics: {},
        recommendations: []
      };
    }

    const currentBalance = dashboardData.balances[selectedRange] || { income: 0, expenses: 0, balance: 0 };
    const totalIncome = Math.abs(parseFloat(currentBalance.income) || 0);
    const totalExpenses = Math.abs(parseFloat(currentBalance.expenses) || 0);
    const netBalance = parseFloat(currentBalance.balance) || 0;
    
          // Calculate financial health
      const financialHealth = calculateFinancialHealth(dashboardData, selectedRange, t);
    
    // Generate trend data for mini chart
    const allPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
    const trends = allPeriods
      .filter(period => period !== selectedRange)
      .slice(0, 4)
      .map(period => {
        const balance = dashboardData.balances[period] || { balance: 0 };
        return {
          label: ranges.find(r => r.key === period)?.icon || period[0].toUpperCase(),
          value: parseFloat(balance.balance) || 0
        };
      });
    
    // Key metrics calculation
    const recurringInfo = dashboardData.recurringInfo || {};
    const recentTransactions = dashboardData.recentTransactions || [];
    
    const avgTransactionSize = recentTransactions.length > 0 
      ? recentTransactions.reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount) || 0), 0) / recentTransactions.length
      : 0;
    
    const largestTransaction = recentTransactions.length > 0
      ? Math.max(...recentTransactions.map(tx => Math.abs(parseFloat(tx.amount) || 0)))
      : 0;
    
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const burnRate = getDaysInPeriod(selectedRange) > 0 ? totalExpenses / getDaysInPeriod(selectedRange) : 0;
    
    const keyMetrics = {
      savingsRate,
      burnRate,
      avgTransactionSize,
      largestTransaction,
      transactionFrequency: recentTransactions.length / Math.max(getDaysInPeriod(selectedRange), 1),
      recurringCoverage: totalIncome > 0 ? ((parseFloat(recurringInfo.recurring_income) || 0) / totalIncome) * 100 : 0,
      expenseVolatility: calculateExpenseVolatility(recentTransactions)
    };
    
    // Generate smart recommendations
    const recommendations = generateRecommendations(keyMetrics, financialHealth, totalIncome, totalExpenses, t);
    
    return {
      currentPeriod: { income: totalIncome, expenses: totalExpenses, balance: netBalance },
      financialHealth,
      trends,
      keyMetrics,
      recommendations
    };
  }, [dashboardData, selectedRange, ranges, getDaysInPeriod, calculateExpenseVolatility, generateRecommendations, t]);

  // Event handlers
  const handlePeriodChange = useCallback((newPeriod) => {
    setSelectedRange(newPeriod);
  }, []);

  const handleChartTypeChange = useCallback((newType) => {
    setChartType(newType);
  }, []);

  // Loading and error states

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
        data-component="StatsChart"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 opacity-100 rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 rounded-2xl"></div>
        </div>
        
        <Card className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
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
        {/* Header */}
        <div className="relative p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 blur-xl"></div>
          
          <div className="relative z-10">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              {/* Title */}
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <motion.div 
                  className="relative p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.05, rotate: isRTL ? -5 : 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur-lg opacity-70"></div>
                  <BarChart3 className="relative w-4 h-4 text-white" />
                </motion.div>
                
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-900 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                    {t('dashboard.stats.title')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.stats.subtitle')}
                  </p>
                </div>
              </div>
              
              {/* Controls */}
              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                {/* Chart Type Toggle */}
                <div className="flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-white/20 shadow-lg">
                  <motion.button
                    onClick={() => handleChartTypeChange('pie')}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                      chartType === 'pie'
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {chartType === 'pie' && (
                      <motion.div
                        layoutId="activeChartType"
                        className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <PieChart className="relative z-10 w-3 h-3" />
                    <span className="relative z-10 hidden sm:inline">{t('dashboard.stats.pieChart')}</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => handleChartTypeChange('bars')}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                      chartType === 'bars'
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {chartType === 'bars' && (
                      <motion.div
                        layoutId="activeChartType"
                        className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <BarChart3 className="relative z-10 w-3 h-3" />
                    <span className="relative z-10 hidden sm:inline">{t('dashboard.stats.barsChart')}</span>
                  </motion.button>
                </div>
                
                {/* Period Selector */}
                <div className="flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-white/20 shadow-lg overflow-x-auto">
                  {ranges.map((range) => (
                    <motion.button
                      key={range.key}
                      onClick={() => handlePeriodChange(range.key)}
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
                      <span className="relative z-10 hidden sm:inline">{range.label}</span>
                      <span className="relative z-10 sm:hidden font-bold text-[10px]">{range.icon}</span>
                    </motion.button>
                  ))}
                </div>
                
                <motion.button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 ${isRTL ? 'flex-row-reverse' : ''}`}
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
            
            {/* Financial Health Score - Mobile & Desktop */}
            <motion.div
              className="bg-gradient-to-r from-white/60 via-gray-50/80 to-white/60 dark:from-gray-800/60 dark:via-gray-700/80 dark:to-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-white/30 shadow-inner mb-4"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                      analytics.financialHealth.level === 'excellent'
                        ? 'bg-gradient-to-br from-green-400 to-green-600'
                        : analytics.financialHealth.level === 'good'
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                        : analytics.financialHealth.level === 'fair'
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                        : 'bg-gradient-to-br from-red-400 to-red-600'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {analytics.financialHealth.score}
                  </motion.div>
                  
                                  <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    {t('dashboard.stats.financialHealthScore')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {t(`dashboard.stats.${analytics.financialHealth.level}`)} • {analytics.financialHealth.insights.length} {t('dashboard.stats.insights')}
                  </p>
                </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {analytics.financialHealth.level === 'excellent' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {analytics.financialHealth.level === 'good' && <Info className="w-5 h-5 text-blue-500" />}
                  {(analytics.financialHealth.level === 'fair' || analytics.financialHealth.level === 'poor') && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                </div>
              </div>
            </motion.div>
            
            {/* Key Metrics Grid - Enhanced for Mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
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
                    {analytics.keyMetrics.savingsRate.toFixed(1)}%
                  </div>
                  <div className="text-xs opacity-75">
                    {analytics.keyMetrics.savingsRate > 15 ? t('dashboard.stats.excellent') : analytics.keyMetrics.savingsRate > 5 ? t('dashboard.stats.good') : t('dashboard.stats.improve')}
                  </div>
                </div>
              </motion.div>

              {/* Burn Rate */}
              <motion.div
                className="group relative overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-xl p-2.5 sm:p-3 shadow-lg"
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300 via-indigo-400 to-purple-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium opacity-90">{t('dashboard.stats.dailyBurn')}</span>
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold">
                    {formatAmount(analytics.keyMetrics.burnRate)}
                  </div>
                  <div className="text-xs opacity-75">{t('dashboard.stats.perDaySpending')}</div>
                </div>
              </motion.div>

              {/* Transaction Frequency */}
              <motion.div
                className="group relative overflow-hidden bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 rounded-xl p-2.5 sm:p-3 shadow-lg"
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-300 via-purple-400 to-indigo-500 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-500"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium opacity-90">{t('dashboard.stats.frequency')}</span>
                    <Activity className="w-3 h-3" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold">
                    {analytics.keyMetrics.transactionFrequency.toFixed(1)}
                  </div>
                  <div className="text-xs opacity-75">{t('dashboard.stats.transactionsPerDay')}</div>
                </div>
              </motion.div>

              {/* Expense Volatility */}
              <motion.div
                className={`group relative overflow-hidden rounded-xl p-2.5 sm:p-3 shadow-lg ${
                  analytics.keyMetrics.expenseVolatility > 50
                    ? 'bg-gradient-to-br from-red-400 via-rose-500 to-pink-600'
                    : analytics.keyMetrics.expenseVolatility > 25
                    ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600'
                }`}
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className={`absolute inset-0 rounded-xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity ${
                  analytics.keyMetrics.expenseVolatility > 50
                    ? 'bg-gradient-to-br from-red-300 via-rose-400 to-pink-500'
                    : analytics.keyMetrics.expenseVolatility > 25
                    ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-green-300 via-emerald-400 to-teal-500'
                }`}></div>
                <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-700"></div>
                
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium opacity-90">{t('dashboard.stats.volatility')}</span>
                    <Zap className="w-3 h-3" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold">
                    {analytics.keyMetrics.expenseVolatility.toFixed(0)}%
                  </div>
                  <div className="text-xs opacity-75">
                    {analytics.keyMetrics.expenseVolatility > 50 ? t('dashboard.stats.high') : analytics.keyMetrics.expenseVolatility > 25 ? t('dashboard.stats.medium') : t('dashboard.stats.low')}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Expandable Section */}
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
                  {/* Chart Visualization */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      {chartType === 'pie' ? (
                        <>
                          <PieChart className="w-4 h-4" />
                          {t('dashboard.stats.incomeVsExpenses')}
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4" />
                          {t('dashboard.stats.balanceTrends')}
                        </>
                      )}
                    </h4>
                    
                    <AnimatePresence mode="wait">
                      {chartType === 'pie' ? (
                        <motion.div
                          key="pie-chart"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                        >
                          <IncomeExpensePieChart 
                            income={analytics.currentPeriod.income} 
                            expenses={analytics.currentPeriod.expenses} 
                            formatAmount={formatAmount}
                            t={t}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="bar-chart"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                        >
                          <MiniBarChart 
                            data={analytics.trends}
                            formatAmount={formatAmount}
                            t={t}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Insights and Recommendations */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {t('dashboard.stats.smartInsights')}
                    </h4>
                    
                    {/* Financial Health Insights */}
                    <div className="space-y-3">
                      {analytics.financialHealth.insights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg border-l-4 ${
                            insight.type === 'positive'
                              ? 'bg-green-50 border-green-500 dark:bg-green-900/20 dark:border-green-400'
                              : insight.type === 'warning'
                              ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-400'
                              : insight.type === 'negative'
                              ? 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-400'
                              : 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {insight.type === 'positive' && <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />}
                            {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />}
                            {insight.type === 'negative' && <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />}
                            {insight.type === 'neutral' && <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />}
                            
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                insight.type === 'positive'
                                  ? 'text-green-800 dark:text-green-200'
                                  : insight.type === 'warning'
                                  ? 'text-yellow-800 dark:text-yellow-200'
                                  : insight.type === 'negative'
                                  ? 'text-red-800 dark:text-red-200'
                                  : 'text-blue-800 dark:text-blue-200'
                              }`}>
                                {insight.message}
                              </p>
                              {insight.impact && (
                                <Badge 
                                  variant={insight.impact === 'critical' ? 'destructive' : insight.impact === 'high' ? 'default' : 'secondary'}
                                  className="mt-1 text-xs"
                                >
                                  {t(`dashboard.stats.${insight.impact}Impact`)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Recommendations */}
                    {analytics.recommendations.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {t('dashboard.stats.recommendations')}
                        </h5>
                        {analytics.recommendations.map((rec, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start gap-2">
                              <Badge variant={rec.priority === 'high' ? 'destructive' : 'default'} className="text-xs mt-0.5">
                                {t(`dashboard.stats.${rec.priority}Priority`)}
                              </Badge>
                              <div className="flex-1">
                                <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                                  {rec.title}
                                </h6>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {rec.description}
                                </p>
                                <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 font-medium">
                                  💡 {rec.action}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
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