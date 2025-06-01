// src/hooks/useDashboard.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../utils/api';
import { useDate } from '../context/DateContext';
import { useEffect, useState } from 'react';

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
export const useDashboard = (date = null) => {
  const { selectedDate, getDateForServer } = useDate();
  const queryClient = useQueryClient(); // Ensure this is imported from the library
  const targetDate = date || selectedDate;
  
  // Debug log the date being sent to server
  const formattedDate = getDateForServer(targetDate);
  console.log('[DEBUG] useDashboard sending date to server:', formattedDate);
  
  // Allow "force refresh" logic when date is reset
  const [forceRefresh, setForceRefresh] = useState(0);
  
  useEffect(() => {
    const handleDateReset = () => {
      console.log('[DEBUG] Detected date reset, forcing refresh');
      setForceRefresh(prev => prev + 1);
    };
    
    const handleTransactionAdded = () => {
      console.log('[DEBUG] Transaction added, forcing refresh');
      setForceRefresh(prev => prev + 1);
    };
    
    // Addition: Listen for dashboard refresh events
    const handleDashboardRefresh = (event) => {
      console.log('[DEBUG] Dashboard refresh requested');
      // Refresh the current query
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // Update the refresh counter
      setForceRefresh(prev => prev + 1);
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
    queryFn: () => transactionAPI.getDashboard(targetDate),
    enabled: !!targetDate,
    staleTime: 30 * 1000, // הקטנה ל-30 שניות כדי לתמוך ברענון תדיר יותר
    refetchInterval: 60 * 1000, // רענון כל דקה
    select: (response) => {
      const data = response.data.data;
      console.log('[DEBUG] useDashboard raw response:', data);

      // Ensure balance data is properly structured
      const ensureBalanceFormat = (balanceData) => {
        if (!balanceData) return { income: 0, expenses: 0, balance: 0, total: 0 };
        
        // Make sure numeric values are properly parsed
        return {
          income: typeof balanceData.income === 'number' ? balanceData.income : parseFloat(balanceData.income || 0),
          expenses: typeof balanceData.expenses === 'number' ? balanceData.expenses : parseFloat(balanceData.expenses || 0),
          balance: typeof balanceData.balance === 'number' ? balanceData.balance : parseFloat(balanceData.balance || 0),
          // Add total for backward compatibility
          total: typeof balanceData.total === 'number' ? balanceData.total : 
                 (parseFloat(balanceData.income || 0) - parseFloat(balanceData.expenses || 0))
        };
      };

      const result = {
        // Recent transactions
        recentTransactions: data.recent_transactions || [],
        
        // Balance data - apply the formatting fix
        balances: {
          daily: ensureBalanceFormat(data.daily),
          weekly: ensureBalanceFormat(data.weekly),
          monthly: ensureBalanceFormat(data.monthly),
          yearly: ensureBalanceFormat(data.yearly)
        },
        
        // Recurring info
        recurringInfo: data.recurring_info || {
          income_count: 0,
          expense_count: 0,
          recurring_income: 0,
          recurring_expense: 0
        },
        
        // Statistics
        statistics: data.statistics || {},
        
        // Categories for quick expense
        categories: data.categories || [],
        
        // Metadata
        metadata: data.metadata || {
          calculated_at: new Date().toISOString(),
          target_date: targetDate.toISOString(),
          periods: {}
        }
      };

      console.log('[DEBUG] useDashboard parsed result:', result);

      return result;
    }
  });
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

export default useDashboard;