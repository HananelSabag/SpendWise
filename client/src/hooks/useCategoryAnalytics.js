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

  // Fetch category analytics data
  const { data: rawAnalytics, isLoading, error, refetch } = useQuery({
    queryKey: ['categoryAnalytics', timeRange],
    queryFn: () => api.analytics.getUserAnalytics({ timeRange }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Process and structure analytics data
  const analytics = useMemo(() => {
    if (!rawAnalytics) return null;

    const { categories = [] } = rawAnalytics;

    return {
      // Category usage stats
      topCategories: categories
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 5),
      
      // Category growth trends
      trends: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        growth: calculateGrowth(cat),
        usage: cat.transaction_count || 0,
        amount: cat.total_amount || 0
      })),

      // Summary stats
      summary: {
        totalCategories: categories.length,
        activeCategories: categories.filter(c => c.transaction_count > 0).length,
        topSpending: categories[0]?.total_amount || 0,
        avgPerCategory: categories.length > 0 
          ? categories.reduce((sum, c) => sum + c.total_amount, 0) / categories.length 
          : 0
      },

      // Usage patterns
      patterns: {
        mostUsed: categories.reduce((max, cat) => 
          cat.transaction_count > (max?.transaction_count || 0) ? cat : max, null),
        leastUsed: categories.filter(c => c.transaction_count > 0)
          .reduce((min, cat) => 
            cat.transaction_count < (min?.transaction_count || Infinity) ? cat : min, null),
        avgTransactionsPerCategory: categories.length > 0
          ? categories.reduce((sum, c) => sum + (c.transaction_count || 0), 0) / categories.length
          : 0
      }
    };
  }, [rawAnalytics]);

  // Helper function to calculate growth
  const calculateGrowth = (category) => {
    // Mock growth calculation - in real app would compare with previous period
    const currentAmount = category.total_amount || 0;
    const mockPreviousAmount = currentAmount * (0.8 + Math.random() * 0.4);
    return ((currentAmount - mockPreviousAmount) / mockPreviousAmount) * 100;
  };

  return {
    analytics,
    isLoading,
    error,
    refetch,
    
    // Helper functions
    getCategoryInsights: (categoryId) => {
      if (!analytics) return null;
      return analytics.trends.find(t => t.id === categoryId);
    },

    getTopSpendingCategories: (limit = 5) => {
      if (!analytics) return [];
      return analytics.topCategories.slice(0, limit);
    },

    getCategoryGrowth: (categoryId) => {
      if (!analytics) return 0;
      const trend = analytics.trends.find(t => t.id === categoryId);
      return trend?.growth || 0;
    }
  };
}; 