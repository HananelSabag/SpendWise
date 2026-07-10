/**
 * 📊 useDashboard Hook
 *
 * Consumes GET /transactions/dashboard, which now returns a financial-period
 * summary (based on the user's billing_cycle_day, not a rolling day window),
 * a category/pattern breakdown, bank costs (fees/interest/loans/cash), and
 * per-institution activity — see transactionController.getDashboardData.
 */

import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../api';
import { useAuthStore } from '../stores/authStore';
import { getAccessToken } from '../auth/tokenStorage';
import { queryConfigs } from '../config/queryClient';

const EMPTY_DASHBOARD = {
  period: null,
  summary: {
    total_transactions: 0,
    total_income: 0,
    total_expenses: 0,
    net_balance: 0,
    bank_income: 0,
    bank_direct_expenses: 0,
    bank_card_settlements: 0,
    card_charges: 0,
    manual_expenses: 0,
    excluded_bank_card_settlements: 0,
    has_card_detail: false,
  },
  categoryBreakdown: [],
  bankCosts: { feesInterest: 0, loanPayments: 0, cashWithdrawn: 0, cashWithdrawalCount: 0 },
  sources: [],
  recentTransactions: [],
  recurringPatterns: [],
  isEmpty: true,
};

export const useDashboard = ({ periodOffset = 0 } = {}) => {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const userCycleDay = Number(user?.billing_cycle_day) || 1;
  const queryKey = useMemo(
    () => ['dashboard', user?.id, userCycleDay, periodOffset],
    [user?.id, userCycleDay, periodOffset]
  );

  const dashboardQuery = useQuery({
    queryKey,
    enabled: isAuthenticated && !!getAccessToken(),
    queryFn: async () => {
      if (!getAccessToken()) return null;
      const result = await api.transactions.getDashboardData({ periodOffset });
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch dashboard data');
      return result.data?.data ?? result.data;
    },
    ...queryConfigs.dashboard,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) return false;
      if (error?.response?.status >= 500 && failureCount < 2) return true;
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    select: useCallback((raw) => {
      if (!raw) return EMPTY_DASHBOARD;

      const summary = raw.summary || {};
      const recentTransactions = raw.recent_transactions || [];

      return {
        period: raw.period || null,
        summary: {
          total_transactions: parseInt(summary.total_transactions) || 0,
          total_income: parseFloat(summary.total_income) || 0,
          total_expenses: parseFloat(summary.total_expenses) || 0,
          net_balance: parseFloat(summary.net_balance) || 0,
          bank_income: parseFloat(summary.bank_income) || 0,
          bank_direct_expenses: parseFloat(summary.bank_direct_expenses) || 0,
          bank_card_settlements: parseFloat(summary.bank_card_settlements) || 0,
          card_charges: parseFloat(summary.card_charges) || 0,
          manual_expenses: parseFloat(summary.manual_expenses) || 0,
          excluded_bank_card_settlements: parseFloat(summary.excluded_bank_card_settlements) || 0,
          has_card_detail: summary.has_card_detail === true,
        },
        categoryBreakdown: raw.categoryBreakdown || [],
        bankCosts: raw.bankCosts || EMPTY_DASHBOARD.bankCosts,
        sources: raw.sources || [],
        recentTransactions,
        recurringPatterns: raw.recurringPatterns || [],
        isEmpty: recentTransactions.length === 0 && (parseInt(summary.total_transactions) || 0) === 0,
      };
    }, []),
  });

  const { refetch: queryRefetch } = dashboardQuery;
  const refreshDashboard = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey });
      await queryRefetch();
      window.dispatchEvent(new CustomEvent('dashboard-refreshed'));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [queryClient, queryKey, queryRefetch]);

  const isLoading = dashboardQuery.isLoading || dashboardQuery.isFetching;

  return {
    data: dashboardQuery.data,
    error: dashboardQuery.error,
    isLoading,
    isError: dashboardQuery.isError,
    isEmpty: dashboardQuery.data?.isEmpty || false,
    isRefetching: dashboardQuery.isFetching && !dashboardQuery.isLoading,
    refresh: refreshDashboard,
    refetch: dashboardQuery.refetch,
    lastFetched: dashboardQuery.dataUpdatedAt,
    isStale: dashboardQuery.isStale,
    query: dashboardQuery,
  };
};

export default useDashboard;
