/**
 * 💰 BALANCE PANEL - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Component orchestration, View modes, Performance optimized
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useCallback, useMemo } from 'react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useNotifications
} from '../../../stores';

import { Button, Card } from '../../ui';
import { cn } from '../../../utils/helpers';

// ✅ Import hooks to get real transaction data
import { useTransactions } from '../../../hooks/useTransactions';

/**
 * 💰 Balance Panel Main Component
 */
const BalancePanel = ({
  data = {},
  showDetails = true,
  onToggleDetails,
  className = ''
}) => {
  // ✅ Zustand stores
  const { t, isRTL } = useTranslation('dashboard');
  const { addNotification } = useNotifications();

  // ✅ Get real transactions data
  const { transactions, loading: transactionsLoading } = useTransactions({
    pageSize: 1000, // Get more data for accurate calculations
    enableAI: false // Disable AI for performance
  });



  // ✅ State management
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly, yearly
  const [showBalances, setShowBalances] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ REAL DATA: Calculate actual balances from transactions
  const enhancedData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Return default structure while loading
      return {
        accounts: [{
          id: 'main',
          name: t('accounts.main'),
          type: 'checking',
          balance: 0,
          change: 0,
          trend: [],
          isFavorite: true,
          lastTransaction: t('account.noTransactions')
        }],
        summary: {
          totalBalance: 0,
          totalChange: 0,
          trendData: [],
          dailyBalance: 0,
          weeklyBalance: 0,
          monthlyBalance: 0,
          yearlyBalance: 0,
          income: 0,
          expenses: 0,
          savings: 0,
          savingsRate: 0
        }
      };
    }

    // Calculate real daily balance data
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);



    // Filter transactions by time periods

    
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date || t.created_at);
      const isToday = transactionDate >= today;

      return isToday;
    });

    const weekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date || t.created_at);
      return transactionDate >= weekAgo;
    });

    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date || t.created_at);
      return transactionDate >= monthAgo;
    });

    const yearTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date || t.created_at);
      return transactionDate >= yearAgo;
    });

    

    // Calculate balances for each period
    const calculateBalance = (transactionList) => {
      return transactionList.reduce((balance, transaction) => {
        const amount = parseFloat(transaction.amount) || 0;
        return transaction.type === 'income' ? balance + amount : balance - amount;
      }, 0);
    };

    const calculateIncomeExpenses = (transactionList) => {
      return transactionList.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount) || 0;
        if (transaction.type === 'income') {
          acc.income += amount;
        } else {
          acc.expenses += amount;
        }
        return acc;
      }, { income: 0, expenses: 0 });
    };

    // ✅ NEW: Smart recurring transaction logic
    const calculateSmartBalance = () => {
      // Identify recurring transactions (monthly patterns)
      const recurringTransactions = transactions.filter(t => 
        t.description && (
          t.description.toLowerCase().includes('monthly') ||
          t.description.toLowerCase().includes('salary') ||
          t.description.toLowerCase().includes('rent') ||
          t.description.toLowerCase().includes('recurring')
        )
      );

      // Identify one-time transactions  
      const oneTimeTransactions = transactions.filter(t => 
        !recurringTransactions.some(rt => rt.id === t.id)
      );



      // Calculate daily recurring rate
      const recurringMonthlyIncome = recurringTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const recurringMonthlyExpenses = recurringTransactions
        .filter(t => t.type === 'expense') 
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const currentDate = new Date();
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const currentDayOfMonth = currentDate.getDate();
      const currentDayOfWeek = currentDate.getDay(); // 0 = Sunday
      const daysElapsedInWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek; // Treat Sunday as end of week

      // Daily rates from recurring transactions
      const dailyRecurringIncome = recurringMonthlyIncome / daysInMonth;
      const dailyRecurringExpenses = recurringMonthlyExpenses / daysInMonth;
      const dailyRecurringNet = dailyRecurringIncome - dailyRecurringExpenses;


      
      // ✅ FORCE CALCULATION: Treat "Monthly" transactions as recurring for user's logic
      if (recurringTransactions.length === 0) {

        
        // Override: Treat "Monthly" transactions as recurring
        const forcedRecurringIncome = transactions
          .filter(t => t.type === 'income' && t.description && t.description.toLowerCase().includes('monthly'))
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
          
        const forcedRecurringExpenses = transactions
          .filter(t => t.type === 'expense' && t.description && t.description.toLowerCase().includes('monthly'))
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
          

        
        // Override the calculation with forced values
        if (forcedRecurringIncome > 0 || forcedRecurringExpenses > 0) {
          const forcedDailyNet = (forcedRecurringIncome - forcedRecurringExpenses) / daysInMonth;
  
          
          // Use forced calculation
          return {
            dailyBalance: forcedDailyNet,
            weeklyBalance: forcedDailyNet * daysElapsedInWeek,
            monthlyBalance: forcedRecurringIncome - forcedRecurringExpenses,
            yearlyBalance: (forcedRecurringIncome - forcedRecurringExpenses) * 12,
            recurringDailyIncome: forcedRecurringIncome / daysInMonth,
            recurringDailyExpenses: forcedRecurringExpenses / daysInMonth,
            recurringDailyNet: forcedDailyNet,
            oneTimeBalances: { today: 0, week: 0, month: 0, year: 0 }
          };
        }
      }

      // Filter one-time transactions by periods
      const todayOneTime = oneTimeTransactions.filter(t => {
        const transactionDate = new Date(t.date || t.created_at);
        return transactionDate >= today;
      });

      const weekOneTime = oneTimeTransactions.filter(t => {
        const transactionDate = new Date(t.date || t.created_at);
        return transactionDate >= weekAgo;
      });

      const monthOneTime = oneTimeTransactions.filter(t => {
        const transactionDate = new Date(t.date || t.created_at);
        return transactionDate >= monthAgo;
      });

      const yearOneTime = oneTimeTransactions.filter(t => {
        const transactionDate = new Date(t.date || t.created_at);
        return transactionDate >= yearAgo;
      });

      // Calculate balances with your logic
      const todayOneTimeBalance = calculateBalance(todayOneTime);
      const weekOneTimeBalance = calculateBalance(weekOneTime);
      const monthOneTimeBalance = calculateBalance(monthOneTime);
      const yearOneTimeBalance = calculateBalance(yearOneTime);

      return {
        // Daily: Recurring daily rate + today's one-time transactions
        dailyBalance: dailyRecurringNet + todayOneTimeBalance,
        
        // Weekly: Recurring daily rate × days elapsed in week + week's one-time transactions
        weeklyBalance: (dailyRecurringNet * daysElapsedInWeek) + weekOneTimeBalance,
        
        // Monthly: Full recurring amounts + month's one-time transactions
        monthlyBalance: (recurringMonthlyIncome - recurringMonthlyExpenses) + monthOneTimeBalance,
        
        // Yearly: Recurring × 12 months + year's one-time transactions  
        yearlyBalance: ((recurringMonthlyIncome - recurringMonthlyExpenses) * 12) + yearOneTimeBalance,
        
        // For display/debugging
        recurringDailyIncome: dailyRecurringIncome,
        recurringDailyExpenses: dailyRecurringExpenses,
        recurringDailyNet: dailyRecurringNet,
        oneTimeBalances: {
          today: todayOneTimeBalance,
          week: weekOneTimeBalance, 
          month: monthOneTimeBalance,
          year: yearOneTimeBalance
        }
      };
    };

    // ✅ Use smart balance calculation
    const smartBalances = calculateSmartBalance();

    // Calculate for different periods
    const dailyBalance = smartBalances.dailyBalance;
    const weeklyBalance = smartBalances.weeklyBalance;
    const monthlyBalance = smartBalances.monthlyBalance;
    const yearlyBalance = smartBalances.yearlyBalance;
    const totalBalance = calculateBalance(transactions);

    

    const monthlyStats = calculateIncomeExpenses(monthTransactions);
    const yearlyStats = calculateIncomeExpenses(yearTransactions);

    // Calculate daily trend for last 7 days
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date || t.created_at);
        return transactionDate.toDateString() === date.toDateString();
      });
      const dayBalance = calculateBalance(dayTransactions);
      dailyTrend.push(dayBalance);
    }

    // Main account with real data
    const accounts = [{
      id: 'main',
      name: t('accounts.main'),
      type: 'checking',
      balance: totalBalance,
      change: dailyBalance,
      trend: dailyTrend,
      isFavorite: true,
      lastTransaction: transactions.length > 0 ? 
        new Date(transactions[0]?.date || transactions[0]?.created_at).toLocaleDateString() : 
        t('account.noTransactions')
    }];

    // Calculate stats for each period
    const todayStats = calculateIncomeExpenses(todayTransactions);
    const weekStats = calculateIncomeExpenses(weekTransactions);
    const yearStats = calculateIncomeExpenses(yearTransactions);

    // ✅ FIXED: Calculate proper income/expenses using recurring logic
    const recurringTransactions = transactions.filter(t => {
      const description = (t.description || '').toLowerCase();
      return ['monthly', 'salary', 'rent', 'recurring'].some(keyword => description.includes(keyword));
    });
    
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDayOfWeek = new Date().getDay();
    const daysElapsedInWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
    
    // Calculate recurring amounts
    const recurringMonthlyIncome = recurringTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const recurringMonthlyExpenses = recurringTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    // ✅ Daily amounts (prorated from monthly recurring per user's logic)
    const proRatedDailyIncome = recurringMonthlyIncome / daysInMonth;  // ₪12,000 / 31 = ₪387.09
    const proRatedDailyExpenses = recurringMonthlyExpenses / daysInMonth; // ₪5,000 / 31 = ₪161.29
    
    // ✅ Weekly amounts (daily × days elapsed in week per user's logic)
    const proRatedWeeklyIncome = proRatedDailyIncome * daysElapsedInWeek;
    const proRatedWeeklyExpenses = proRatedDailyExpenses * daysElapsedInWeek;
    
    // ✅ Yearly amounts (monthly × 12 per user's logic)
    const proRatedYearlyIncome = recurringMonthlyIncome * 12;
    const proRatedYearlyExpenses = recurringMonthlyExpenses * 12;



    const summary = {
      totalBalance,
      totalChange: dailyBalance,
      trendData: dailyTrend,
      dailyBalance,
      weeklyBalance,
      monthlyBalance,
      yearlyBalance,
      // ✅ FIXED: Use pro-rated amounts per user's custom logic  
      dailyIncome: proRatedDailyIncome,
      dailyExpenses: proRatedDailyExpenses,
      weeklyIncome: (recurringMonthlyIncome / daysInMonth) * daysElapsedInWeek, // Force weekly
      weeklyExpenses: (recurringMonthlyExpenses / daysInMonth) * daysElapsedInWeek, // Force weekly
      monthlyIncome: recurringMonthlyIncome, // Force ₪12,000
      monthlyExpenses: recurringMonthlyExpenses, // Force ₪5,000
      yearlyIncome: recurringMonthlyIncome * 12, // Force ₪144,000
      yearlyExpenses: recurringMonthlyExpenses * 12, // Force ₪60,000
      // Current selected period (will be updated based on viewMode)
      income: monthlyStats.income,
      expenses: monthlyStats.expenses,
      savings: monthlyStats.income - monthlyStats.expenses,
      savingsRate: monthlyStats.income > 0 ? ((monthlyStats.income - monthlyStats.expenses) / monthlyStats.income) * 100 : 0
    };

    return { accounts, summary };
  }, [transactions, t, viewMode]); // Normal dependencies

  // ✅ Get current period data based on selected viewMode
  const currentPeriodData = useMemo(() => {
    if (!enhancedData?.summary) return { income: 0, expenses: 0, balance: 0 };
    
    // ✅ Get period-specific income/expenses from enhanced data
    const income = enhancedData.summary[`${viewMode}Income`] || 0;
    const expenses = enhancedData.summary[`${viewMode}Expenses`] || 0;
    const balance = enhancedData.summary[`${viewMode}Balance`] || 0;
    
    return { income, expenses, balance };
  }, [enhancedData, viewMode]);

  // ✅ Handle balance visibility toggle
  const handleToggleVisibility = useCallback(() => {
    setShowBalances(!showBalances);
    addNotification({
      type: 'info',
      message: showBalances ? t('balance.balancesHidden') : t('balance.balancesShown'),
      duration: 2000
    });
  }, [showBalances, addNotification, t]);

  // ✅ Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      addNotification({
        type: 'success',
        message: t('balance.refreshed'),
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('errors.refreshFailed'),
        duration: 4000
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [addNotification, t]);

  // ✅ Account management
  const handleAccountSelect = useCallback((account) => {
    setSelectedAccount(account);
  }, []);

  const handleAccountEdit = useCallback((account) => {
    addNotification({
      type: 'info',
      message: t('account.editStarted', { name: account.name })
    });
    // TODO: Open account edit modal
  }, [addNotification, t]);

  const handleToggleFavorite = useCallback((accountId) => {
    addNotification({
      type: 'success',
      message: t('account.favoriteToggled')
    });
    // TODO: Update account favorite status
  }, [addNotification, t]);

  const handleAddAccount = useCallback(() => {
    addNotification({
      type: 'info',
      message: t('account.addStarted')
    });
    // TODO: Open add account modal
  }, [addNotification, t]);

  // ✅ Insights management
  const handleInsightAction = useCallback((insight) => {
    addNotification({
      type: 'info',
      message: t('insights.actionStarted', { title: insight.title })
    });
    // TODO: Handle insight action
  }, [addNotification, t]);

  const handleInsightDismiss = useCallback((insightId) => {
    addNotification({
      type: 'success',
      message: t('insights.dismissed')
    });
    // TODO: Dismiss insight
  }, [addNotification, t]);

  const handleGenerateInsights = useCallback(() => {
    addNotification({
      type: 'info',
      message: t('insights.generating')
    });
    // TODO: Generate new insights
  }, [addNotification, t]);

  // ✅ AI recommendations
  const handleRecommendationAccept = useCallback((recommendation) => {
    addNotification({
      type: 'success',
      message: t('ai.recommendationAccepted', { title: recommendation.title })
    });
    // TODO: Implement recommendation
  }, [addNotification, t]);

  const handleRecommendationDecline = useCallback((recommendation) => {
    addNotification({
      type: 'info',
      message: t('ai.recommendationDeclined')
    });
    // TODO: Decline recommendation
  }, [addNotification, t]);

  // ✅ Health management
  const handleViewHealthReport = useCallback(() => {
    addNotification({
      type: 'info',
      message: t('health.reportOpening')
    });
    // TODO: Open health report
  }, [addNotification, t]);

  const handleImproveScore = useCallback(() => {
    addNotification({
      type: 'info',
      message: t('health.improvementStarted')
    });
    // TODO: Open improvement guide
  }, [addNotification, t]);





    return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('balance.title')}
        </h2>
        <Button
          variant="ghost"
          onClick={handleToggleVisibility}
          className="text-sm"
        >
          {showBalances ? t('common.hide') : t('common.show')}
        </Button>
      </div>

      {/* Period Tabs */}
      <div className="flex space-x-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setViewMode('daily')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            viewMode === 'daily'
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          {t('timePeriods.daily')}
        </button>
        <button
          onClick={() => setViewMode('weekly')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            viewMode === 'weekly'
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          {t('timePeriods.weekly')}
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            viewMode === 'monthly'
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          {t('timePeriods.monthly')}
        </button>
        <button
          onClick={() => setViewMode('yearly')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            viewMode === 'yearly'
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          {t('timePeriods.yearly')}
        </button>
      </div>

      {/* Balance Display for Selected Period */}
      <div className="grid grid-cols-3 gap-4">
        {/* Income */}
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
            {t('balance.income')}
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {showBalances ? `₪${currentPeriodData.income.toFixed(0)}` : '••••'}
          </div>
        </div>

        {/* Expenses */}
        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700">
          <div className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">
            {t('balance.expenses')}
          </div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {showBalances ? `₪${currentPeriodData.expenses.toFixed(0)}` : '••••'}
          </div>
        </div>

        {/* Net Total */}
        <div className={cn(
          "text-center p-4 rounded-xl border",
          currentPeriodData.balance >= 0
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
        )}>
          <div className={cn(
            "text-sm font-medium mb-1",
            currentPeriodData.balance >= 0
              ? "text-blue-600 dark:text-blue-400"
              : "text-red-600 dark:text-red-400"
          )}>
            {t('balance.net')}
          </div>
          <div className={cn(
            "text-2xl font-bold",
            currentPeriodData.balance >= 0
              ? "text-blue-700 dark:text-blue-300"
              : "text-red-700 dark:text-red-300"
          )}>
            {showBalances ? `₪${currentPeriodData.balance.toFixed(0)}` : '••••'}
          </div>
        </div>
      </div>

      {/* Period Summary */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {viewMode === 'daily' && t('periodSummary.daily')}
          {viewMode === 'weekly' && t('periodSummary.weekly')}
          {viewMode === 'monthly' && t('periodSummary.monthly')}
          {viewMode === 'yearly' && t('periodSummary.yearly')}
        </div>
      </div>
    </Card>
  );
};

export default BalancePanel;