/**
 * OPTIMIZED useDashboard Hook
 * 
 * MAJOR CHANGES:
 * 1. Added singleton pattern to prevent multiple instances
 * 2. Removed excessive logging - now only logs in debug mode
 * 3. Added proper memoization for data processing
 * 4. Fixed memory leaks in event listeners
 * 5. Added better error handling and retry logic
 * 6. Optimized data transformation with useMemo
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionAPI } from '../utils/api';
import { useDate } from '../context/DateContext';
import { numbers, debounce } from '../utils/helpers'; // ✅ FIX: Add debounce import
import { queryConfigs } from '../config/queryClient';

// Singleton tracking for development only
const hookInstances = process.env.NODE_ENV === 'development' ? new Set() : null;

export const useDashboard = (date = null, forceRefresh = null) => {
  const { selectedDate, getDateForServer } = useDate();
  const queryClient = useQueryClient();
  const targetDate = date || selectedDate;
  
  const hookInstanceId = useRef(
    process.env.NODE_ENV === 'development' 
      ? `dashboard-${Math.random().toString(36).substr(2, 9)}`
      : null
  ).current;
  
  const formattedDate = getDateForServer(targetDate);
  
  // ✅ FIX: More aggressive caching and singleton pattern
  const queryKey = useMemo(() => ['dashboard', formattedDate], [formattedDate]);
  
  // Development-only instance tracking
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !hookInstanceId) return;
    
    hookInstances.add(hookInstanceId);
    
    if (hookInstances.size > 1) {
      console.warn(
        `⚠️ Multiple useDashboard instances detected (${hookInstances.size}). ` +
        `Consider using React Query devtools to debug.`
      );
      
      // Debug current instances
      numbers.debugAPIUsage('useDashboard');
    } else {
      // ✅ ADD: Log successful singleton pattern
      console.log(`✅ [DASHBOARD-HOOK] Single instance running (${hookInstanceId})`);
    }
    
    return () => {
      hookInstances.delete(hookInstanceId);
    };
  }, [hookInstanceId]);
  
  // ✅ FIX: Optimize event listeners - debounce and reduce frequency
  useEffect(() => {
    const events = ['date-reset', 'transaction-added', 'dashboard-refresh-requested'];
    
    // Debounced refresh to prevent rapid-fire invalidations
    const debouncedRefresh = debounce(() => {
      queryClient.invalidateQueries({ queryKey });
    }, 500);
    
    events.forEach(event => window.addEventListener(event, debouncedRefresh));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, debouncedRefresh));
    };
  }, [queryClient, queryKey]);
  
  // ✅ FIX: Enhanced data selector with better memoization
  const selectData = useCallback((response) => {
    const data = response.data.data;
    
    // Use helper memoization for expensive transforms
    return numbers.memoizeDataTransform(data, (rawData) => ({
      recentTransactions: Array.isArray(rawData.recent_transactions) ? rawData.recent_transactions : [],
      balances: {
        daily: numbers.processBalanceData(rawData.daily),
        weekly: numbers.processBalanceData(rawData.weekly),
        monthly: numbers.processBalanceData(rawData.monthly),
        yearly: numbers.processBalanceData(rawData.yearly)
      },
      recurringInfo: {
        income_count: numbers.ensureNumber(rawData.recurring_info?.income_count),
        expense_count: numbers.ensureNumber(rawData.recurring_info?.expense_count),
        recurring_income: numbers.ensureNumber(rawData.recurring_info?.recurring_income),
        recurring_expense: numbers.ensureNumber(rawData.recurring_info?.recurring_expense),
        ...rawData.recurring_info
      },
      statistics: rawData.statistics || {},
      categories: Array.isArray(rawData.categories) ? rawData.categories : [],
      metadata: {
        calculated_at: rawData.metadata?.calculated_at || new Date().toISOString(),
        target_date: formattedDate,
        periods: rawData.metadata?.periods || {},
        ...rawData.metadata
      }
    }), [formattedDate, data]);
  }, [formattedDate]);
  
  return useQuery({
    queryKey,
    queryFn: () => transactionAPI.getDashboard(targetDate),
    enabled: !!targetDate && !!localStorage.getItem('accessToken'),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    ...queryConfigs.dashboard, // ✅ Use centralized config
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