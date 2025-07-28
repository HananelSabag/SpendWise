/**
 * 📊 useDashboard Hook - COMPLETE UNIFIED API INTEGRATION
 * Simplified performance-optimized dashboard data management
 * NOW USES UNIFIED API + ZUSTAND STORES! 🎉
 * @version 3.0.0
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ✅ NEW: Import unified API instead of old utils/api
import { api } from '../api';

// ✅ NEW: Import from Zustand stores instead of Context
import { useAppStore } from '../stores';

import { numbers, debounce } from '../utils/helpers';
import { queryConfigs } from '../config/queryClient';

export const useDashboard = (date = null, forceRefresh = null) => {
  // ✅ NEW: Use Zustand app store for date management
  const { selectedDate, dateFormat } = useAppStore();
  const getDateForServer = useAppStore((state) => state.actions.getDateForServer);
  
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

  // ✅ FIX: Force refresh handler with proper cleanup
  useEffect(() => {
    if (forceRefresh) {
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [forceRefresh, queryClient, queryKey]);

  // ✅ ENHANCED: Dashboard query with unified API integration
  const dashboardQuery = useQuery({
    queryKey,
    queryFn: async () => {
      // ✅ FIXED: Simplified API call without debug logs
      const result = await api.analytics.dashboard.getSummary(formattedDate);
      
      if (result.success) {
        return { data: result.data };
      } else {
        throw new Error(result.error?.message || 'Failed to fetch dashboard data');
      }
    },
    ...queryConfigs.dynamic,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) return false;
      if (error?.response?.status >= 500 && failureCount < 2) return true;
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    select: useCallback((data) => {
      // Improved data transformation with error handling
      const response = data?.data;
      
      if (!response) {
        return {
          balance: { current: 0, currency: 'USD' },
          monthlyStats: { income: 0, expenses: 0, net: 0 },
          recentTransactions: [],
          chartData: [],
          summary: {},
          isEmpty: true
        };
      }

      // ✅ FIX: Handle different response formats gracefully
      const dashboardData = response.data || response;
      
      if (!dashboardData) {
        return {
          balance: { current: 0, currency: 'USD' },
          monthlyStats: { income: 0, expenses: 0, net: 0 },
          recentTransactions: [],
          chartData: [],
          summary: {},
          isEmpty: true
        };
      }

      // Enhanced data processing with validation
      const processedData = {
        // Balance with currency formatting
        balance: {
          current: numbers.safeNumber(dashboardData.balance?.current, 0),
          previous: numbers.safeNumber(dashboardData.balance?.previous, 0),
          change: numbers.safeNumber(dashboardData.balance?.change, 0),
          currency: dashboardData.balance?.currency || 'USD'
        },
        
        // Monthly statistics with proper calculations
        monthlyStats: {
          income: numbers.safeNumber(dashboardData.monthlyStats?.income, 0),
          expenses: numbers.safeNumber(dashboardData.monthlyStats?.expenses, 0),
          net: numbers.safeNumber(dashboardData.monthlyStats?.net, 0),
          transactionCount: dashboardData.monthlyStats?.transactionCount || 0
        },
        
        // Recent transactions with enhanced processing
        recentTransactions: (dashboardData.recentTransactions || []).map(transaction => ({
          ...transaction,
          amount: numbers.safeNumber(transaction.amount, 0),
          formattedAmount: numbers.formatCurrency(transaction.amount),
          date: transaction.date || new Date().toISOString()
        })),
        
        // Chart data with validation
        chartData: (dashboardData.chartData || []).map(point => ({
          ...point,
          income: numbers.safeNumber(point.income, 0),
          expenses: numbers.safeNumber(point.expenses, 0),
          net: numbers.safeNumber(point.net, 0)
        })),
        
        // Summary with computed values
        summary: {
          ...dashboardData.summary,
          totalTransactions: dashboardData.summary?.totalTransactions || 0,
          categoriesUsed: dashboardData.summary?.categoriesUsed || 0,
          avgTransactionAmount: numbers.safeNumber(dashboardData.summary?.avgTransactionAmount, 0)
        },
        
        // Metadata
        dateRange: dashboardData.dateRange || { start: formattedDate, end: formattedDate },
        lastUpdated: dashboardData.lastUpdated || new Date().toISOString(),
        isEmpty: (dashboardData.recentTransactions || []).length === 0
      };

      return processedData;
    }, [formattedDate])
  });

  // Enhanced refresh function with loading state
  const refreshDashboard = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey });
      await dashboardQuery.refetch();
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('dashboard-refreshed', {
        detail: { date: formattedDate }
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
      return { success: false, error };
    }
  }, [queryClient, queryKey, dashboardQuery, formattedDate]);

  // ✅ FIX: Computed loading states
  const isLoading = dashboardQuery.isLoading || dashboardQuery.isFetching;
  const isError = dashboardQuery.isError;
  const isEmpty = dashboardQuery.data?.isEmpty || false;

  return {
    // Data
    data: dashboardQuery.data,
    error: dashboardQuery.error,
    
    // Loading states
    isLoading,
    isError,
    isEmpty,
    isRefetching: dashboardQuery.isFetching && !dashboardQuery.isLoading,
    
    // Actions
    refresh: refreshDashboard,
    refetch: dashboardQuery.refetch,
    
    // Metadata
    lastFetched: dashboardQuery.dataUpdatedAt,
    isStale: dashboardQuery.isStale,
    
    // Date context
    currentDate: targetDate,
    formattedDate,
    
    // Raw query for advanced usage
    query: dashboardQuery
  };
};

// ✅ Backward compatibility - export as default
export default useDashboard;