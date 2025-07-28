/**
 * 📊 ANALYTICS API MODULE - Financial Intelligence System
 * Features: Financial health, Spending patterns, Category analytics, Business intelligence, AI-like insights
 * @module api/analytics
 */

import { api } from './client.js';

// ✅ Analytics API Module - ALIGNED WITH SERVER ROUTES
export const analyticsAPI = {
  // Dashboard analytics summary (matches: GET /analytics/dashboard/summary)
  async getDashboardSummary(params = {}) {
    try {
      const response = await api.cachedRequest('/analytics/dashboard/summary', {
        method: 'GET',
        params
      }, `analytics-dashboard-${JSON.stringify(params)}`, 5 * 60 * 1000); // 5 minute cache

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // User analytics (matches: GET /analytics/user)
  async getUserAnalytics(params = {}) {
    try {
      const response = await api.cachedRequest('/analytics/user', {
        method: 'GET',
        params
      }, `analytics-user-${JSON.stringify(params)}`, 10 * 60 * 1000); // 10 minute cache

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ LEGACY COMPATIBILITY (remove these when components are updated)
  user: {
    // Get comprehensive user analytics (DEPRECATED - use getUserAnalytics() instead)
    async getAnalytics(months = 12) {
      try {
        const response = await api.cachedRequest(`/analytics/user?months=${months}`, {
          method: 'GET'
        }, `user-analytics-${months}`, 10 * 60 * 1000); // 10 minute cache

        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get financial health score
    async getFinancialHealth(months = 6) {
      try {
        const analytics = await this.getAnalytics(months);
        if (!analytics.success) return analytics;

        const { financial_health } = analytics.data;
        
        if (!financial_health) {
          return {
            success: true,
            data: {
              score: null,
              level: 'insufficient_data',
              message: 'Not enough data to calculate financial health'
            }
          };
        }

        // Calculate health score (0-100)
        let score = 50; // Base score
        const { current_balance, average_savings_rate, spending_variance, debt_to_income } = financial_health;

        // Positive balance increases score
        if (current_balance > 0) {
          score += Math.min(30, current_balance / 1000 * 5); // Up to 30 points for balance
        } else {
          score -= Math.abs(current_balance) / 1000 * 2; // Penalty for negative balance
        }

        // Good savings rate increases score
        if (average_savings_rate > 20) score += 20;
        else if (average_savings_rate > 10) score += 10;
        else if (average_savings_rate > 0) score += 5;

        // Low spending variance is good (consistency)
        if (spending_variance < 500) score += 10;
        else if (spending_variance > 2000) score -= 10;

        // Low debt-to-income ratio is good
        if (debt_to_income < 0.3) score += 10;
        else if (debt_to_income > 0.5) score -= 15;

        // Ensure score is between 0-100
        score = Math.max(0, Math.min(100, Math.round(score)));

        // Determine level and message
        let level, message;
        if (score >= 80) {
          level = 'excellent';
          message = 'Excellent financial health! Keep up the great work.';
        } else if (score >= 60) {
          level = 'good';
          message = 'Good financial management with room for improvement.';
        } else if (score >= 40) {
          level = 'fair';
          message = 'Fair financial health. Consider reviewing your spending habits.';
        } else {
          level = 'poor';
          message = 'Your finances need attention. Consider seeking financial advice.';
        }

        return {
          success: true,
          data: {
            score,
            level,
            message,
            details: financial_health,
            recommendations: this.generateRecommendations(financial_health, score)
          }
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Generate AI-like financial recommendations
    generateRecommendations(healthData, score) {
      const recommendations = [];
      const { current_balance, average_savings_rate, spending_variance, debt_to_income } = healthData;

      // Balance recommendations
      if (current_balance < 1000) {
        recommendations.push({
          type: 'emergency_fund',
          priority: 'high',
          title: 'Build Emergency Fund',
          description: 'Aim to save at least $1,000 for emergencies.',
          action: 'Set up automatic transfers to savings'
        });
      } else if (current_balance < 5000) {
        recommendations.push({
          type: 'emergency_fund',
          priority: 'medium',
          title: 'Expand Emergency Fund',
          description: 'Work towards 3-6 months of expenses in emergency savings.',
          action: 'Increase monthly savings contributions'
        });
      }

      // Savings rate recommendations
      if (average_savings_rate < 10) {
        recommendations.push({
          type: 'savings_rate',
          priority: 'high',
          title: 'Increase Savings Rate',
          description: 'Aim to save at least 10-20% of your income.',
          action: 'Review and reduce unnecessary expenses'
        });
      } else if (average_savings_rate < 20) {
        recommendations.push({
          type: 'savings_rate',
          priority: 'medium',
          title: 'Optimize Savings',
          description: 'Great progress! Consider increasing to 20% for faster wealth building.',
          action: 'Look for additional income opportunities'
        });
      }

      // Spending consistency recommendations
      if (spending_variance > 1500) {
        recommendations.push({
          type: 'spending_consistency',
          priority: 'medium',
          title: 'Stabilize Spending',
          description: 'Your spending varies significantly month to month.',
          action: 'Create a detailed budget and track expenses daily'
        });
      }

      // Debt recommendations
      if (debt_to_income > 0.4) {
        recommendations.push({
          type: 'debt_management',
          priority: 'high',
          title: 'Reduce Debt Burden',
          description: 'Your debt-to-income ratio is concerning.',
          action: 'Consider debt consolidation or payment prioritization'
        });
      }

      return recommendations;
    },

    // Get spending patterns analysis
    async getSpendingPatterns(months = 6) {
      try {
        const analytics = await this.getAnalytics(months);
        if (!analytics.success) return analytics;

        const { spending_patterns } = analytics.data;
        
        return {
          success: true,
          data: spending_patterns || {}
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get monthly trends
    async getMonthlyTrends(months = 12) {
      try {
        const analytics = await this.getAnalytics(months);
        if (!analytics.success) return analytics;

        const { monthly_trends } = analytics.data;
        
        return {
          success: true,
          data: monthly_trends || []
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    }
  },

  // ✅ Category Analytics APIs
  categories: {
    // Get category analytics
    async getAnalytics(months = 6) {
      try {
        const response = await api.cachedRequest(`/categories/analytics?months=${months}`, {
          method: 'GET'
        }, `category-analytics-${months}`, 15 * 60 * 1000); // 15 minute cache

        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get category performance
    async getPerformance(months = 6) {
      try {
        const analytics = await this.getAnalytics(months);
        if (!analytics.success) return analytics;

        const { category_performance } = analytics.data;
        
        return {
          success: true,
          data: category_performance || []
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get top spending categories
    async getTopSpending(limit = 10, months = 3) {
      try {
        const analytics = await this.getAnalytics(months);
        if (!analytics.success) return analytics;

        const { category_performance } = analytics.data;
        
        if (!category_performance) {
          return {
            success: true,
            data: []
          };
        }

        // Sort by total amount and limit
        const topCategories = category_performance
          .sort((a, b) => b.total_amount - a.total_amount)
          .slice(0, limit);

        return {
          success: true,
          data: topCategories
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get category trends
    async getTrends(categoryId, months = 6) {
      try {
        const analytics = await this.getAnalytics(months);
        if (!analytics.success) return analytics;

        const { monthly_breakdowns } = analytics.data;
        
        if (!monthly_breakdowns) {
          return {
            success: true,
            data: []
          };
        }

        // Extract trend for specific category
        const categoryTrend = monthly_breakdowns.map(month => {
          const categoryData = month.categories.find(cat => cat.category_id === categoryId);
          return {
            month: month.month,
            year: month.year,
            amount: categoryData ? categoryData.total_amount : 0,
            transaction_count: categoryData ? categoryData.transaction_count : 0
          };
        });

        return {
          success: true,
          data: categoryTrend
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    }
  },

  // ✅ Dashboard Analytics APIs
  dashboard: {
    // Get dashboard summary
    async getSummary(date = null) {
      try {
        const params = date ? { date } : {};
        
        const response = await api.cachedRequest('/analytics/dashboard/summary', {
          method: 'GET',
          params
        }, `dashboard-summary-${date || 'current'}`, 5 * 60 * 1000); // 5 minute cache

        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get monthly summary
    async getMonthlySummary(year, month) {
      try {
        const response = await api.cachedRequest(`/transactions/summary/monthly?year=${year}&month=${month}`, {
          method: 'GET'
        }, `monthly-summary-${year}-${month}`, 30 * 60 * 1000); // 30 minute cache

        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Get quick insights for dashboard
    async getQuickInsights() {
      try {
        const [userAnalytics, categoryAnalytics, dashboardSummary] = await Promise.all([
          this.parent.user.getAnalytics(6),
          this.parent.categories.getAnalytics(3),
          this.getSummary()
        ]);

        const insights = [];

        // Financial health insight
        if (userAnalytics.success) {
          const healthResult = await this.parent.user.getFinancialHealth(6);
          if (healthResult.success && healthResult.data.score !== null) {
            insights.push({
              type: 'financial_health',
              title: 'Financial Health',
              value: `${healthResult.data.score}/100`,
              trend: healthResult.data.level,
              message: healthResult.data.message
            });
          }
        }

        // Top spending category insight
        if (categoryAnalytics.success) {
          const topCategories = await this.parent.categories.getTopSpending(1, 3);
          if (topCategories.success && topCategories.data.length > 0) {
            const topCategory = topCategories.data[0];
            insights.push({
              type: 'top_spending',
              title: 'Top Spending Category',
              value: topCategory.category_name,
              trend: `$${topCategory.total_amount.toLocaleString()}`,
              message: `${topCategory.transaction_count} transactions in last 3 months`
            });
          }
        }

        // Monthly comparison insight
        if (dashboardSummary.success && dashboardSummary.data.monthly_comparison) {
          const comparison = dashboardSummary.data.monthly_comparison;
          const changePercent = comparison.expense_change_percent;
          insights.push({
            type: 'monthly_change',
            title: 'Monthly Spending',
            value: changePercent > 0 ? `+${changePercent.toFixed(1)}%` : `${changePercent.toFixed(1)}%`,
            trend: changePercent > 0 ? 'increase' : 'decrease',
            message: `Compared to last month`
          });
        }

        return {
          success: true,
          data: insights
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    }
  },

  // ✅ Comparison and Forecasting
  insights: {
    // Compare periods
    async comparePeriods(currentStart, currentEnd, previousStart, previousEnd) {
      try {
        const [current, previous] = await Promise.all([
          api.client.get('/transactions/summary', {
            params: { start_date: currentStart, end_date: currentEnd }
          }),
          api.client.get('/transactions/summary', {
            params: { start_date: previousStart, end_date: previousEnd }
          })
        ]);

        const currentData = current.data;
        const previousData = previous.data;

        // Calculate changes
        const incomeChange = currentData.total_income - previousData.total_income;
        const expenseChange = currentData.total_expenses - previousData.total_expenses;
        const balanceChange = currentData.balance - previousData.balance;

        const incomeChangePercent = previousData.total_income > 0 
          ? (incomeChange / previousData.total_income) * 100 
          : 0;
        const expenseChangePercent = previousData.total_expenses > 0 
          ? (expenseChange / previousData.total_expenses) * 100 
          : 0;

        return {
          success: true,
          data: {
            current: currentData,
            previous: previousData,
            changes: {
              income: {
                amount: incomeChange,
                percent: incomeChangePercent
              },
              expenses: {
                amount: expenseChange,
                percent: expenseChangePercent
              },
              balance: {
                amount: balanceChange
              }
            }
          }
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    },

    // Simple spending forecast (next month prediction)
    async getSpendingForecast() {
      try {
        const userAnalytics = await this.parent.user.getAnalytics(6);
        if (!userAnalytics.success) return userAnalytics;

        const { monthly_trends } = userAnalytics.data;
        if (!monthly_trends || monthly_trends.length < 3) {
          return {
            success: true,
            data: {
              prediction: null,
              confidence: 'low',
              message: 'Not enough data for reliable forecast'
            }
          };
        }

        // Simple moving average forecast
        const recentMonths = monthly_trends.slice(-3);
        const avgExpenses = recentMonths.reduce((sum, month) => sum + month.total_expenses, 0) / recentMonths.length;
        
        // Calculate trend
        const oldestMonth = recentMonths[0].total_expenses;
        const newestMonth = recentMonths[recentMonths.length - 1].total_expenses;
        const trend = (newestMonth - oldestMonth) / oldestMonth;

        // Apply trend to average
        const forecastExpenses = avgExpenses * (1 + trend * 0.5); // Dampen trend effect

        // Confidence based on variance
        const variance = recentMonths.reduce((sum, month) => 
          sum + Math.pow(month.total_expenses - avgExpenses, 2), 0) / recentMonths.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / avgExpenses;
        
        let confidence;
        if (coefficientOfVariation < 0.1) confidence = 'high';
        else if (coefficientOfVariation < 0.2) confidence = 'medium';
        else confidence = 'low';

        return {
          success: true,
          data: {
            prediction: Math.round(forecastExpenses),
            confidence,
            trend: trend > 0.05 ? 'increasing' : trend < -0.05 ? 'decreasing' : 'stable',
            message: `Based on last 3 months of spending patterns`
          }
        };
      } catch (error) {
        return {
          success: false,
          error: api.normalizeError(error)
        };
      }
    }
  }
};

// Add parent reference for cross-module access
analyticsAPI.dashboard.parent = analyticsAPI;
analyticsAPI.insights.parent = analyticsAPI;

export default analyticsAPI; 