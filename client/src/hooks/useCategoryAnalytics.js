/**
 * 📊 useCategoryAnalytics Hook
 * Provides category analytics data and insights
 * @version 1.0.0 - CATEGORY REDESIGN
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '../api';
import { useTranslation } from '../stores';

export const useCategoryAnalytics = ({ timeRange = '30d' } = {}) => {
  const { t } = useTranslation();

  // Fetch category analytics data with better error handling
  const { data: rawAnalytics, isLoading, error, refetch } = useQuery({
    queryKey: ['categoryAnalytics', timeRange],
    queryFn: async () => {
      try {
        // Defensive check - ensure api.analytics exists and has getUserAnalytics method
        if (!api?.analytics?.getUserAnalytics || typeof api.analytics.getUserAnalytics !== 'function') {
          console.warn('getUserAnalytics function not available');
          return null;
        }
        
        const result = await api.analytics.getUserAnalytics({ timeRange });
        return result?.success ? result.data : null;
      } catch (error) {
        console.error('Failed to fetch category analytics:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!api?.analytics?.getUserAnalytics, // Only run if function exists
  });

  // Process and structure analytics data with defensive checks
  const analytics = useMemo(() => {
    if (!rawAnalytics) return null;

    try {
      const { categories = [] } = rawAnalytics || {};

      return {
        // Category usage stats
        topCategories: (categories || [])
          .sort((a, b) => (b?.total_amount || 0) - (a?.total_amount || 0))
          .slice(0, 5),
        
        // Category growth trends
        trends: (categories || []).map(cat => ({
          id: cat?.id,
          name: cat?.name || cat?.category_name || 'Uncategorized',
          color: cat?.color || '#666',
          growth: calculateGrowth(cat),
          usage: cat?.transaction_count || 0,
          amount: cat?.total_amount || 0
        })),

        // Summary stats
        summary: {
          totalCategories: (categories || []).length,
          activeCategories: (categories || []).filter(c => (c?.transaction_count || 0) > 0).length,
          topSpending: categories?.[0]?.total_amount || 0,
          avgPerCategory: (categories || []).length > 0 
            ? (categories || []).reduce((sum, c) => sum + (c?.total_amount || 0), 0) / (categories || []).length 
            : 0
        },

        // Usage patterns
        patterns: {
          mostUsed: (categories || []).reduce((max, cat) => 
            (cat?.transaction_count || 0) > (max?.transaction_count || 0) ? cat : max, null),
          leastUsed: (categories || []).filter(c => (c?.transaction_count || 0) > 0)
            .reduce((min, cat) => 
              (cat?.transaction_count || 0) < (min?.transaction_count || Infinity) ? cat : min, null),
          avgTransactionsPerCategory: (categories || []).length > 0
            ? (categories || []).reduce((sum, c) => sum + (c?.transaction_count || 0), 0) / (categories || []).length
            : 0
        }
      };
    } catch (error) {
      console.error('Error processing analytics data:', error);
      return null;
    }
  }, [rawAnalytics]);

  // Helper function to calculate growth with defensive checks
  const calculateGrowth = (category) => {
    try {
      // Mock growth calculation - in real app would compare with previous period
      const currentAmount = category?.total_amount || 0;
      const mockPreviousAmount = currentAmount * (0.8 + Math.random() * 0.4);
      return currentAmount > 0 && mockPreviousAmount > 0 
        ? ((currentAmount - mockPreviousAmount) / mockPreviousAmount) * 100 
        : 0;
    } catch (error) {
      console.error('Error calculating growth:', error);
      return 0;
    }
  };

  return {
    analytics,
    isLoading,
    error,
    refetch,
    
    // Helper functions with defensive checks
    getCategoryInsights: (categoryId) => {
      try {
        if (!analytics || !categoryId) return null;
        return analytics.trends?.find(t => t?.id === categoryId) || null;
      } catch (error) {
        console.error('Error getting category insights:', error);
        return null;
      }
    },

    getTopSpendingCategories: (limit = 5) => {
      try {
        if (!analytics) return [];
        return (analytics.topCategories || []).slice(0, limit);
      } catch (error) {
        console.error('Error getting top spending categories:', error);
        return [];
      }
    },

    getCategoryGrowth: (categoryId) => {
      try {
        if (!analytics || !categoryId) return 0;
        const trend = analytics.trends?.find(t => t?.id === categoryId);
        return trend?.growth || 0;
      } catch (error) {
        console.error('Error getting category growth:', error);
        return 0;
      }
    }
  };
}; 