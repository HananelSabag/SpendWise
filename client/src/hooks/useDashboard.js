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
  
  const hookInstanceId = useRef(`dashboard-${Math.random().toString(36).substr(2, 9)}`).current;
  const formattedDate = getDateForServer(targetDate);
  
  // ✅ שיפור מעקב ההוקים עם stack trace מפורט
  useEffect(() => {
    const debugMode = localStorage.getItem('debug_dashboard') === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    activeHooks.add(hookInstanceId);
    
    // ✅ שמור stack trace מפורט כדי לזהות מי קרא להוק
    const stackTrace = new Error().stack;
    const callerLines = stackTrace.split('\n').slice(1, 6); // קח 5 שורות ראשונות
    const relevantCaller = callerLines.find(line => 
      line.includes('.jsx') || line.includes('.js') && !line.includes('useDashboard')
    ) || 'unknown';
    
    // ✅ תמיד לוג אם יש יותר מהוק אחד כדי לזהות את הבעיה
    const shouldLog = debugMode || 
                     (!isProduction && activeHooks.size === 1) || 
                     activeHooks.size > 1;
    
    if (shouldLog) {
      console.log(`🚀 [DASHBOARD-HOOK] [${hookInstanceId}] Hook initialized. Total active hooks: ${activeHooks.size}`);
      
      // ✅ הצג מידע מפורט אם יש יותר מהוק אחד
      if (activeHooks.size > 1) {
        console.warn(`⚠️ [DASHBOARD-HOOK] DUPLICATE DETECTED! Hook #${activeHooks.size}`);
        console.warn(`📍 [DASHBOARD-HOOK] Called from component:`, relevantCaller.trim());
        console.warn(`🔍 [DASHBOARD-HOOK] Full call stack:`);
        callerLines.forEach((line, i) => {
          if (line.includes('.jsx') || line.includes('.js')) {
            console.warn(`   ${i + 1}. ${line.trim()}`);
          }
        });
        console.warn(`🔍 [DASHBOARD-HOOK] All active hooks:`, Array.from(activeHooks));
        
        // ✅ הוסף breakpoint אוטומטי לדיבאג
        if (debugMode) {
          debugger; // זה יעצור את הביצוע כדי לחקור
        }
      }
    }
    
    // מסמן את הוק הראשי רק אם אין עדיין
    if (!window._primaryDashboardHook) {
      window._primaryDashboardHook = hookInstanceId;
    }
    
    return () => {
      activeHooks.delete(hookInstanceId);
      
      if (shouldLog || window._primaryDashboardHook === hookInstanceId) {
        console.log(`💀 [DASHBOARD-HOOK] [${hookInstanceId}] Hook destroyed. Remaining hooks: ${activeHooks.size}`);
        
        if (window._primaryDashboardHook === hookInstanceId) {
          window._primaryDashboardHook = null;
        }
      }
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
      
      // ✅ לוג רק מהוק הראשי או אם debug מפורש
      const debugMode = localStorage.getItem('debug_dashboard') === 'true';
      const shouldLog = debugMode || window._primaryDashboardHook === hookInstanceId;
      
      if (shouldLog) {
        console.log(`🌐 [API-CALL] #${serverCallCount} [${hookInstanceId}] Sending dashboard request for: ${formattedDate}`);
      }
      
      const startTime = Date.now();
      
      return transactionAPI.getDashboard(targetDate).then(result => {
        const endTime = Date.now();
        if (shouldLog) {
          console.log(`✅ [API-RESPONSE] #${serverCallCount} [${hookInstanceId}] Completed in ${endTime - startTime}ms`);
        }
        return result;
      }).catch(error => {
        const endTime = Date.now();
        console.error(`❌ [API-ERROR] #${serverCallCount} [${hookInstanceId}] Failed after ${endTime - startTime}ms:`, error);
        throw error;
      });
    },
    enabled: !!targetDate,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
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
    }, [hookInstanceId, formattedDate]),
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