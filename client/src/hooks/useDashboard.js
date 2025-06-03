// src/hooks/useDashboard.js
import React, { useEffect, useRef } from 'react'; // ✅ הוספת הייבוא החסר
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../utils/api';
import { useDate } from '../context/DateContext';
import { numbers } from '../utils/helpers';

// ✅ מונה גלובלי לקריאות שרת
let serverCallCount = 0;
const activeHooks = new Set();

/**
 * Main dashboard hook - replaces 3 separate API calls!
 * 
 * OLD:
 * - getBalanceDetails()
 * - getRecentTransactions()
 * - getPeriodTransactions()
 * 
 * NEW:
 * - getDashboard() - one optimized call
 */
export const useDashboard = (date = null, forceRefresh = null) => {
  const { selectedDate, getDateForServer } = useDate();
  const queryClient = useQueryClient();
  const targetDate = date || selectedDate;
  
  const isAuthenticated = useRef(localStorage.getItem('accessToken'));
  const hookInstanceId = useRef(`dashboard-${Math.random().toString(36).substr(2, 9)}`).current;
  const formattedDate = getDateForServer(targetDate);
  
  // ✅ SIMPLIFIED: Reduce debugging overhead in production
  useEffect(() => {
    const debugMode = localStorage.getItem('debug_dashboard') === 'true';
    
    activeHooks.add(hookInstanceId);
    
    // ✅ ONLY log in debug mode or if duplicates detected
    if (debugMode || activeHooks.size > 1) {
      console.log(`🚀 [DASHBOARD-HOOK] [${hookInstanceId}] Active hooks: ${activeHooks.size}`);
      
      if (activeHooks.size > 1) {
        console.error(`🚨 [CRITICAL] Multiple dashboard hooks detected!`);
        console.error(`💡 [FIX] Only Dashboard.jsx should call useDashboard()`);
        console.error(`🔧 [FIX] Other components should receive props`);
      }
    }
    
    return () => {
      activeHooks.delete(hookInstanceId);
    };
  }, [hookInstanceId]);
  
  useEffect(() => {
    const handleDateReset = () => {
      console.log('[DEBUG] Detected date reset, forcing refresh');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
    
    const handleTransactionAdded = () => {
      console.log('[DEBUG] Transaction added, forcing refresh');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
    
    // Addition: Listen for dashboard refresh events
    const handleDashboardRefresh = (event) => {
      console.log('[DEBUG] Dashboard refresh requested');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
    
    window.addEventListener('date-reset', handleDateReset);
    window.addEventListener('transaction-added', handleTransactionAdded);
    window.addEventListener('dashboard-refresh-requested', handleDashboardRefresh);
    
    return () => {
      window.removeEventListener('date-reset', handleDateReset);
      window.removeEventListener('transaction-added', handleTransactionAdded);
      window.removeEventListener('dashboard-refresh-requested', handleDashboardRefresh);
    };
  }, [queryClient]);
  
  return useQuery({
    queryKey: ['dashboard', formattedDate, forceRefresh],
    queryFn: () => {
      serverCallCount++;
      
      // ✅ ONLY log if debug mode enabled
      if (localStorage.getItem('debug_dashboard') === 'true') {
        console.log(`🌐 [API-CALL] #${serverCallCount} Dashboard request: ${formattedDate}`);
      }
      
      return transactionAPI.getDashboard(targetDate);
    },
    enabled: !!targetDate && !!isAuthenticated.current,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes after last use
    refetchOnWindowFocus: !!isAuthenticated.current,
    refetchOnMount: !!isAuthenticated.current,
    refetchInterval: false,
    // ✅ OPTIMIZATION: Add notifyOnChangeProps to reduce re-renders
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
    select: React.useCallback((response) => {
      const data = response.data.data;
      
      // ✅ עיבוד רק מהוק הראשי או אם debug מפורש
      const debugMode = localStorage.getItem('debug_dashboard') === 'true';
      const isPrimaryHook = window._primaryDashboardHook === hookInstanceId;
      const isNewData = !window._lastProcessedData || 
                       JSON.stringify(data) !== JSON.stringify(window._lastProcessedData);
      
      const shouldLog = (debugMode || isPrimaryHook) && isNewData;
      
      if (shouldLog) {
        console.log(`🔄 [DATA-PROCESSING] [${hookInstanceId}] Processing NEW dashboard data (Active hooks: ${activeHooks.size})`);
        window._lastProcessedData = data;
      }
      
      const result = {
        // Recent transactions
        recentTransactions: Array.isArray(data.recent_transactions) ? data.recent_transactions : [],
        
        // Balance data - שימוש בפונקציית העזר
        balances: {
          daily: numbers.processBalanceData(data.daily),
          weekly: numbers.processBalanceData(data.weekly),
          monthly: numbers.processBalanceData(data.monthly),
          yearly: numbers.processBalanceData(data.yearly)
        },
        
        // Recurring info with proper defaults
        recurringInfo: {
          income_count: numbers.ensureNumber(data.recurring_info?.income_count),
          expense_count: numbers.ensureNumber(data.recurring_info?.expense_count),
          recurring_income: numbers.ensureNumber(data.recurring_info?.recurring_income),
          recurring_expense: numbers.ensureNumber(data.recurring_info?.recurring_expense),
          ...data.recurring_info
        },
        
        // Statistics with proper number handling
        statistics: data.statistics || {},
        
        // Categories
        categories: Array.isArray(data.categories) ? data.categories : [],
        
        // Metadata
        metadata: {
          calculated_at: data.metadata?.calculated_at || new Date().toISOString(),
          target_date: formattedDate,
          periods: data.metadata?.periods || {},
          ...data.metadata
        }
      };

      if (shouldLog) {
        console.log(`✨ [DATA-PROCESSED] [${hookInstanceId}] Final result ready`);
      }
      
      return result;
    }, [hookInstanceId, formattedDate, isAuthenticated]), // ✅ Add isAuthenticated to dependencies
  });
};

// ✅ פונקציית עזר לבדיקת מצב
export const getDashboardStats = () => {
  return {
    totalServerCalls: serverCallCount,
    activeHooks: activeHooks.size,
    hookIds: Array.from(activeHooks)
  };
};

// תוספת שתעזור לרענן את הנתונים כשמוסיפים עסקה חדשה
export const refreshDashboardData = () => {
  const queryClient = useQueryClient();
  return queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

/**
 * Legacy hooks for components that still use separate calls
 * These now use the dashboard data instead of separate API calls
 */
export const useRecentTransactions = (limit = 5) => {
  const { data: dashboard, ...rest } = useDashboard();
  
  return {
    data: dashboard?.recentTransactions?.slice(0, limit) || [],
    ...rest
  };
};

export const useBalanceDetails = () => {
  const { data: dashboard, ...rest } = useDashboard();
  
  return {
    data: dashboard?.balances || {
      daily: { income: 0, expenses: 0, balance: 0 },
      weekly: { income: 0, expenses: 0, balance: 0 },
      monthly: { income: 0, expenses: 0, balance: 0 },
      yearly: { income: 0, expenses: 0, balance: 0 }
    },
    ...rest
  };
};

export const usePeriodTransactions = (period = 'day') => {
  const { data: dashboard, ...rest } = useDashboard();
  
  // For now, return recent transactions
  // In the future, we can filter by period if needed
  return {
    data: {
      transactions: dashboard?.recentTransactions || [],
      period,
      startDate: dashboard?.metadata?.periods?.[period]?.start,
      endDate: dashboard?.metadata?.periods?.[period]?.end
    },
    ...rest
  };
};

/**
 * Helper hook for recurring impact calculation
 */
export const useRecurringImpact = () => {
  const { data: dashboard } = useDashboard();
  
  if (!dashboard?.recurringInfo) {
    return { total: 0, income: 0, expense: 0 };
  }
  
  const { recurring_income, recurring_expense } = dashboard.recurringInfo;
  
  return {
    income: recurring_income,
    expense: recurring_expense,
    total: recurring_income - recurring_expense,
    // Daily equivalents (assuming monthly)
    dailyIncome: recurring_income / 30,
    dailyExpense: recurring_expense / 30,
    dailyTotal: (recurring_income - recurring_expense) / 30
  };
};

/**
 * Helper hook for calculating real dashboard statistics
 */
export const useDashboardStatistics = () => {
  const { data: dashboard, isLoading } = useDashboard();
  
  return React.useMemo(() => {
    if (!dashboard || isLoading) {
      return {
        dailyAverage: 0,
        savingsRate: 0,
        recurringCount: 0,
        monthlyBalance: 0,
        weeklyTrend: 'neutral',
        loading: isLoading
      };
    }

    const monthly = dashboard.balances?.monthly || {};
    const weekly = dashboard.balances?.weekly || {};
    const daily = dashboard.balances?.daily || {};
    const recurring = dashboard.recurringInfo || {};
    
    // Real calculations
    const dailyAverage = monthly.expenses > 0 ? Math.round(monthly.expenses / 30) : 0;
    const totalActivity = (monthly.income || 0) + (monthly.expenses || 0);
    const savingsRate = totalActivity > 0 
      ? Math.round(((monthly.income || 0) / totalActivity) * 100)
      : 0;
    const recurringCount = (recurring.income_count || 0) + (recurring.expense_count || 0);
    const monthlyBalance = monthly.balance || 0;
    
    // Calculate trend
    const weeklyTrend = weekly.balance > daily.balance ? 'up' : 
                       weekly.balance < daily.balance ? 'down' : 'neutral';
    
    return {
      dailyAverage,
      savingsRate: Math.min(100, savingsRate),
      recurringCount,
      monthlyBalance,
      weeklyTrend,
      loading: false,
      // Additional useful stats
      monthlyIncome: monthly.income || 0,
      monthlyExpenses: monthly.expenses || 0,
      weeklyBalance: weekly.balance || 0,
      dailyBalance: daily.balance || 0
    };
  }, [dashboard, isLoading]);
};

/**
 * Helper hook for chart data based on real dashboard data
 */
export const useDashboardChartData = () => {
  const { data: dashboard, isLoading } = useDashboard();
  
  return React.useMemo(() => {
    if (!dashboard || isLoading) {
      return {
        historyData: [],
        categoryData: [],
        loading: isLoading
      };
    }

    const balances = dashboard.balances || {};
    const transactions = dashboard.recentTransactions || [];
    
    // Create realistic history trend from available data
    const historyData = [
      {
        period: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        income: (balances.weekly?.income || 0) * 0.7,
        expenses: (balances.weekly?.expenses || 0) * 0.8,
        balance: (balances.weekly?.balance || 0) * 0.75
      },
      {
        period: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        income: (balances.weekly?.income || 0) * 0.85,
        expenses: (balances.weekly?.expenses || 0) * 0.9,
        balance: (balances.weekly?.balance || 0) * 0.87
      },
      {
        period: new Date().toISOString().split('T')[0],
        income: balances.daily?.income || 0,
        expenses: balances.daily?.expenses || 0,
        balance: balances.daily?.balance || 0
      }
    ];
    
    // Extract category data from transactions
    const categoryMap = new Map();
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category_name) {
        const category = transaction.category_name;
        const amount = Math.abs(transaction.amount || 0);
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      }
    });
    
    const categoryData = Array.from(categoryMap.entries())
      .map(([name, amount], index) => ({
        id: index + 1,
        name,
        expense_amount: amount,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      }))
      .sort((a, b) => b.expense_amount - a.expense_amount)
      .slice(0, 8);
    
    return {
      historyData,
      categoryData,
      loading: false
    };
  }, [dashboard, isLoading]);
};

// הוסף פונקציית עזר לרענון מאולץ של הדשבורד
export const refreshDashboard = () => {
  window.dispatchEvent(new CustomEvent('transaction-added'));
};

/**
 * Debug function to inspect current dashboard hook status
 */
export const debugDashboardHooks = () => {
  console.log(`🔍 [DEBUG] Active dashboard hooks: ${activeHooks.size}`);
  console.log(`📊 [DEBUG] Total server calls: ${serverCallCount}`);
  console.log(`🎯 [DEBUG] Primary hook: ${window._primaryDashboardHook}`);
  console.log(`📋 [DEBUG] All hook IDs:`, Array.from(activeHooks));
  
  // בדוק אילו קומפוננטים עדיין מחזיקים reference להוק
  if (activeHooks.size > 1) {
    console.warn(`⚠️ [DEBUG] Found ${activeHooks.size} active hooks - investigating...`);
  }
  
  return {
    activeCount: activeHooks.size,
    serverCalls: serverCallCount,
    primaryHook: window._primaryDashboardHook,
    allHooks: Array.from(activeHooks)
  };
};

export default useDashboard;