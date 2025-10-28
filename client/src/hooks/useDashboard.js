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
import { useAuthStore } from '../stores/authStore';

import { numbers, debounce } from '../utils/helpers';
import { queryConfigs } from '../config/queryClient';

export const useDashboard = (date = null, forceRefresh = null) => {
  // ✅ NEW: Use Zustand app store for date management
  const { selectedDate, dateFormat } = useAppStore();
  const getDateForServer = useAppStore((state) => state.actions.getDateForServer);
  
  // ✅ ADD: Auth store for authentication checks
  const { isAuthenticated, initialized, user } = useAuthStore();
  
  const queryClient = useQueryClient();
  const targetDate = date || selectedDate;
  
  const formattedDate = getDateForServer(targetDate);
  
  const queryKey = useMemo(() => ['dashboard', formattedDate], [formattedDate]);
  
  // ✅ FIX: Simplified event listeners without excessive debouncing
  useEffect(() => {
    const events = ['transaction-added', 'dashboard-refresh-requested', 'server-woke'];
    
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
    enabled: initialized && isAuthenticated, // ✅ Only run when user is authenticated
    queryFn: async () => {
      // Gate calls without token to avoid triggering auth recovery and 401 spam
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      if (!token) return { data: null };

      try {
        const result = await api.transactions.getDashboardData({ date: formattedDate });
        
        if (result.success) {
          return { data: result.data };
        } else {
          // ✅ FIX: Throw error instead of silently returning null
          throw new Error(result.error?.message || 'Failed to fetch dashboard data');
        }
      } catch (error) {
        // ✅ FIX: Only catch auth errors silently, let other errors propagate
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return { data: null, authError: true };
        }
        // Let React Query handle the error properly
        throw error;
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
      try {
        // Removed debug logging to prevent re-renders
        
        // ✅ FIXED: Improved data transformation with better error handling
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

      // ✅ FIX: Handle both analytics and transactions endpoint formats
      let dashboardData;
      
      // ✅ FIXED: Handle transactions dashboard endpoint format
      if (response.data && response.data.summary) {
        // This is the /transactions/dashboard format
        const { summary, recent_transactions = [] } = response.data;
        
        // ✅ FIX: Parse values properly - they might be strings from DB
        const totalIncome = parseFloat(summary.total_income) || 0;
        const totalExpenses = parseFloat(summary.total_expenses) || 0;
        const netBalance = parseFloat(summary.net_balance) || 0;
        const transactionCount = parseInt(summary.total_transactions || summary.transaction_count || 0);
        
        // ✅ FIX: Calculate top category from recent transactions
        const categoryCount = {};
        (recent_transactions || []).forEach(tx => {
          if (tx.type === 'expense' && tx.category_name) {
            categoryCount[tx.category_name] = (categoryCount[tx.category_name] || 0) + Math.abs(parseFloat(tx.amount) || 0);
          }
        });
        const topCategoryEntry = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
        const topCategory = topCategoryEntry ? {
          name: topCategoryEntry[0],
          total: topCategoryEntry[1],
          percentage: totalExpenses > 0 ? Math.round((topCategoryEntry[1] / totalExpenses) * 100) : 0
        } : null;
        
        dashboardData = {
          balance: { 
            current: netBalance, 
            currency: 'ILS' 
          },
          monthlyStats: { 
            income: totalIncome, 
            expenses: totalExpenses, 
            net: netBalance,
            transactionCount: transactionCount // ✅ FIX: Properly extract and convert transaction count
          },
          topCategory: topCategory, // ✅ FIX: Add top category calculation
          recentTransactions: recent_transactions || [],
          chartData: [],
          summary: {
            ...summary,
            total_income: totalIncome,
            total_expenses: totalExpenses,
            net_balance: netBalance,
            total_transactions: transactionCount
          },
          isEmpty: transactionCount === 0
        };
      }
      // Check if this is the analytics format
      else if (response.balance && typeof response.balance === 'object' && response.monthlyStats) {
        dashboardData = response;
      }
      // Check if this is the old transactions format
      else if (response.daily || response.recent_transactions) {
        // Transform old format to new format
        dashboardData = {
          balance: { current: 0, currency: 'ILS' },
          monthlyStats: { income: 0, expenses: 0, net: 0 },
          recentTransactions: response.recent_transactions || [],
          chartData: [],
          summary: {}
        };
      }
      // Check if this is direct data (fallback)
      else {
        dashboardData = response;
      }
      
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

      // ✅ FIXED: Enhanced data processing with validation
      const processedData = {
        // Balance with currency formatting
        balance: {
          current: dashboardData.balance?.current || 0,
          previous: dashboardData.balance?.previous || 0,
          change: dashboardData.balance?.change || 0,
          currency: dashboardData.balance?.currency || 'USD'
        },
        
        // Monthly statistics with proper calculations  
        monthlyStats: {
          income: dashboardData.monthlyStats?.income || 0,
          expenses: dashboardData.monthlyStats?.expenses || 0,
          net: dashboardData.monthlyStats?.net || 
               ((dashboardData.monthlyStats?.income || 0) - (dashboardData.monthlyStats?.expenses || 0)),
          transactionCount: dashboardData.monthlyStats?.transactionCount || 0
        },
        
        // Recent transactions with enhanced processing
        recentTransactions: (dashboardData.recentTransactions || []).map(transaction => ({
          ...transaction,
          amount: transaction.amount || 0,
          formattedAmount: transaction.formattedAmount || `$${transaction.amount || 0}`,
          date: transaction.date || new Date().toISOString()
        })),
        
        // Chart data with validation
        chartData: (dashboardData.chartData || []).map(point => ({
          ...point,
          income: point.income || 0,
          expenses: point.expenses || 0,
          net: point.net || 0
        })),
        
        // Summary with computed values
        summary: {
          ...dashboardData.summary,
          totalTransactions: dashboardData.summary?.totalTransactions || 
                            (dashboardData.recentTransactions || []).length,
          categoriesUsed: dashboardData.summary?.categoriesUsed || 0,
          avgTransactionAmount: dashboardData.summary?.avgTransactionAmount || 0
        },
        
        // Metadata
        dateRange: dashboardData.dateRange || { start: formattedDate, end: formattedDate },
        lastUpdated: dashboardData.lastUpdated || new Date().toISOString(),
        isEmpty: (dashboardData.recentTransactions || []).length === 0
      };

      // Removed debug logging to prevent re-renders

      return processedData;
      } catch (error) {
        console.error('❌ Data Transformation Error:', error);
        console.error('❌ Error Stack:', error.stack);
        
        // Return safe fallback data
        return {
          balance: { current: 0, currency: 'USD' },
          monthlyStats: { income: 0, expenses: 0, net: 0 },
          recentTransactions: [],
          chartData: [],
          summary: {},
          isEmpty: true
        };
      }
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

  // Removed debug logging to prevent re-renders
  // console.log('🔍 Hook State Debug:', { queryIsError: dashboardQuery.isError });

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