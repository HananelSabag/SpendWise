/**
 * SIMPLIFIED useDashboard Hook - Fixed Performance Issues
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../utils/api';
import { useDate } from '../context/DateContext';
import { numbers, debounce } from '../utils/helpers';
import { queryConfigs } from '../config/queryClient';

export const useDashboard = (date = null, forceRefresh = null) => {
  const { selectedDate, getDateForServer } = useDate();
  const queryClient = useQueryClient();
  const targetDate = date || selectedDate;
  
  const formattedDate = getDateForServer(targetDate);
  
  const queryKey = useMemo(() => ['dashboard', formattedDate], [formattedDate]);
  
  // ✅ FIX: Simplified event listeners without excessive debouncing
  useEffect(() => {
    const events = ['transaction-added', 'dashboard-refresh-requested'];
    
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey });
    };
    
    events.forEach(event => window.addEventListener(event, handleRefresh));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleRefresh));
    };
  }, [queryClient, queryKey]);
  
  // ✅ SIMPLIFY: Data selector without excessive memoization
  const selectData = useCallback((response) => {
    const data = response.data.data;
    
    return {
      recentTransactions: Array.isArray(data.recent_transactions) ? data.recent_transactions : [],
      balances: {
        daily: numbers.processBalanceData(data.daily),
        weekly: numbers.processBalanceData(data.weekly),
        monthly: numbers.processBalanceData(data.monthly),
        yearly: numbers.processBalanceData(data.yearly)
      },
      recurringInfo: {
        income_count: numbers.ensureNumber(data.recurring_info?.income_count),
        expense_count: numbers.ensureNumber(data.recurring_info?.expense_count),
        recurring_income: numbers.ensureNumber(data.recurring_info?.recurring_income),
        recurring_expense: numbers.ensureNumber(data.recurring_info?.recurring_expense),
        ...data.recurring_info
      },
      statistics: data.statistics || {},
      categories: Array.isArray(data.categories) ? data.categories : [],
      metadata: {
        calculated_at: data.metadata?.calculated_at || new Date().toISOString(),
        target_date: formattedDate,
        periods: data.metadata?.periods || {},
        ...data.metadata
      }
    };
  }, [formattedDate]);
  
  return useQuery({
    queryKey,
    queryFn: () => transactionAPI.getDashboard(targetDate),
    enabled: !!targetDate && !!localStorage.getItem('accessToken'),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    ...queryConfigs.dashboard,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
    select: selectData
  });
};

// Helper hooks that use the main dashboard data
export const useBalanceDetails = () => {
  const { data: dashboard, ...rest } = useDashboard();
  
  return useMemo(() => ({
    data: dashboard?.balances || {
      daily: { income: 0, expenses: 0, balance: 0 },
      weekly: { income: 0, expenses: 0, balance: 0 },
      monthly: { income: 0, expenses: 0, balance: 0 },
      yearly: { income: 0, expenses: 0, balance: 0 }
    },
    ...rest
  }), [dashboard, rest]);
};

export const useRecurringImpact = () => {
  const { data: dashboard } = useDashboard();
  
  return useMemo(() => {
    if (!dashboard?.recurringInfo) {
      return { total: 0, income: 0, expense: 0, dailyIncome: 0, dailyExpense: 0, dailyTotal: 0 };
    }
    
    const { recurring_income = 0, recurring_expense = 0 } = dashboard.recurringInfo;
    
    return {
      income: recurring_income,
      expense: recurring_expense,
      total: recurring_income - recurring_expense,
      dailyIncome: recurring_income / 30,
      dailyExpense: recurring_expense / 30,
      dailyTotal: (recurring_income - recurring_expense) / 30
    };
  }, [dashboard?.recurringInfo]);
};

// Simplified refresh function
export const refreshDashboard = () => {
  window.dispatchEvent(new CustomEvent('dashboard-refresh-requested'));
};

export default useDashboard;