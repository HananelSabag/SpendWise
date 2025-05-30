// src/hooks/useDashboard.js
import { useQuery } from '@tanstack/react-query';
import { transactionAPI } from '../utils/api';
import { useDate } from '../context/DateContext';

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
  const { selectedDate } = useDate();
  const targetDate = date || selectedDate;
  
  return useQuery({
    queryKey: ['dashboard', targetDate?.toISOString().split('T')[0]],
    queryFn: () => transactionAPI.getDashboard(targetDate),
    enabled: !!targetDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto refetch every 5 minutes
    select: (response) => {
      const data = response.data.data;
      
      return {
        // Recent transactions
        recentTransactions: data.recent_transactions || [],
        
        // Balance data
        balances: {
          daily: data.daily_balance || { income: 0, expenses: 0, balance: 0 },
          weekly: data.weekly_balance || { income: 0, expenses: 0, balance: 0 },
          monthly: data.monthly_balance || { income: 0, expenses: 0, balance: 0 },
          yearly: data.yearly_balance || { income: 0, expenses: 0, balance: 0 }
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

export default useDashboard;