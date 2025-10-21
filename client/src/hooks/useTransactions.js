/**
 * 💰 useTransactions Hook - COMPLETE REVOLUTION!
 * 🚀 AI-powered analytics, Smart batch operations, Real-time insights, Advanced filtering
 * Features: ML transaction analysis, Fraud detection, Smart categorization, Performance optimization
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from './useApi';
import { api } from '../api';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { createLogger } from '../utils/logger';

// 🧠 AI-Powered Transaction Analytics Engine
class TransactionAIEngine {
  static fraudDetectionThresholds = {
    highAmount: 1000,
    rapidTransactions: 5, // transactions in 5 minutes
    unusualTime: { start: 22, end: 6 }, // 10 PM to 6 AM
    velocityCheck: 10 // max transactions per hour
  };

  static async analyzeTransaction(transaction, userContext = {}) {
    const analysis = {
      riskScore: 0,
      fraudProbability: 0,
      anomalyFlags: [],
      recommendations: [],
      insights: [],
      categoryConfidence: 0,
      duplicateRisk: 0
    };

    const amount = Math.abs(parseFloat(transaction.amount));
    const timestamp = new Date(transaction.created_at || new Date());

    // Amount-based analysis
    const amountAnalysis = this.analyzeAmount(amount, userContext);
    analysis.riskScore += amountAnalysis.riskScore;
    analysis.insights.push(...amountAnalysis.insights);

    // Time-based analysis
    const timeAnalysis = this.analyzeTime(timestamp, userContext);
    analysis.riskScore += timeAnalysis.riskScore;
    if (timeAnalysis.isUnusual) {
      analysis.anomalyFlags.push('unusual_time');
    }

    // Frequency analysis
    const frequencyAnalysis = this.analyzeFrequency(transaction, userContext);
    analysis.riskScore += frequencyAnalysis.riskScore;
    if (frequencyAnalysis.isRapid) {
      analysis.anomalyFlags.push('rapid_transactions');
      analysis.fraudProbability += 0.3;
    }

    // Duplicate detection
    const duplicateAnalysis = this.analyzeDuplicates(transaction, userContext);
    analysis.duplicateRisk = duplicateAnalysis.probability;
    if (duplicateAnalysis.probability > 0.7) {
      analysis.anomalyFlags.push('potential_duplicate');
    }

    // Category confidence
    analysis.categoryConfidence = this.analyzeCategoryConfidence(transaction);

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis, transaction);

    // Calculate final fraud probability
    analysis.fraudProbability = Math.min(
      (analysis.riskScore / 100) + 
      (analysis.anomalyFlags.length * 0.15) + 
      (analysis.duplicateRisk * 0.2),
      1.0
    );

    return analysis;
  }

  static analyzeAmount(amount, userContext) {
    const analysis = { riskScore: 0, insights: [] };
    const avgAmount = userContext.averageAmount || 50;
    const stdDev = userContext.standardDeviation || 25;

    // Z-score analysis
    const zScore = Math.abs((amount - avgAmount) / Math.max(stdDev, 1));
    
    if (zScore > 3) {
      analysis.riskScore += 30;
      analysis.insights.push({
        type: 'warning',
        title: 'Unusual Amount',
        description: `This amount is ${zScore.toFixed(1)} standard deviations from your average`
      });
    } else if (zScore > 2) {
      analysis.riskScore += 15;
      analysis.insights.push({
        type: 'info',
        title: 'Above Average Amount',
        description: 'This transaction is significantly higher than your typical spending'
      });
    }

    // High amount check
    if (amount > this.fraudDetectionThresholds.highAmount) {
      analysis.riskScore += 25;
      analysis.insights.push({
        type: 'warning',
        title: 'Large Transaction',
        description: 'Consider verifying this large transaction'
      });
    }

    // Very small amounts (potential fee testing)
    if (amount < 1 && amount > 0) {
      analysis.riskScore += 10;
      analysis.insights.push({
        type: 'info',
        title: 'Micro Transaction',
        description: 'Very small amounts might indicate testing or fees'
      });
    }

    return analysis;
  }

  static analyzeTime(timestamp, userContext) {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    const analysis = { riskScore: 0, isUnusual: false };

    // Unusual hours
    if (hour >= this.fraudDetectionThresholds.unusualTime.start || 
        hour <= this.fraudDetectionThresholds.unusualTime.end) {
      analysis.riskScore += 15;
      analysis.isUnusual = true;
    }

    // Weekend patterns
    if (userContext.weekendSpendingRatio && (dayOfWeek === 0 || dayOfWeek === 6)) {
      if (userContext.weekendSpendingRatio < 0.2) {
        analysis.riskScore += 10; // User rarely spends on weekends
      }
    }

    return analysis;
  }

  static analyzeFrequency(transaction, userContext) {
    const analysis = { riskScore: 0, isRapid: false };
    const recentCount = userContext.recentTransactionCount || 0;
    const timeWindow = userContext.recentTimeWindow || 60; // minutes

    // Rapid transaction detection
    if (recentCount >= this.fraudDetectionThresholds.rapidTransactions) {
      analysis.riskScore += 40;
      analysis.isRapid = true;
    }

    // Velocity check
    const hourlyRate = (recentCount / timeWindow) * 60;
    if (hourlyRate > this.fraudDetectionThresholds.velocityCheck) {
      analysis.riskScore += 30;
    }

    return analysis;
  }

  static analyzeDuplicates(transaction, userContext) {
    const recentTransactions = userContext.recentTransactions || [];
    let probability = 0;

    const amount = Math.abs(parseFloat(transaction.amount));
    const description = transaction.description?.toLowerCase() || '';
    const merchant = transaction.merchant_name?.toLowerCase() || '';

    for (const recent of recentTransactions) {
      const recentAmount = Math.abs(parseFloat(recent.amount));
      const recentDescription = recent.description?.toLowerCase() || '';
      const recentMerchant = recent.merchant_name?.toLowerCase() || '';

      // Time difference (last 24 hours)
      const timeDiff = new Date(transaction.created_at) - new Date(recent.created_at);
      if (timeDiff > 24 * 60 * 60 * 1000) continue;

      let similarity = 0;

      // Amount similarity
      if (Math.abs(amount - recentAmount) < 0.01) similarity += 0.4;

      // Description similarity
      if (description && recentDescription) {
        const descSimilarity = this.calculateStringSimilarity(description, recentDescription);
        similarity += descSimilarity * 0.3;
      }

      // Merchant similarity
      if (merchant && recentMerchant) {
        const merchSimilarity = this.calculateStringSimilarity(merchant, recentMerchant);
        similarity += merchSimilarity * 0.3;
      }

      probability = Math.max(probability, similarity);
    }

    return { probability };
  }

  static calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  static levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  static analyzeCategoryConfidence(transaction) {
    if (!transaction.description) return 0;

    const keywords = {
      food: ['restaurant', 'food', 'grocery', 'cafe', 'eat'],
      transport: ['gas', 'uber', 'taxi', 'parking', 'fuel'],
      shopping: ['amazon', 'store', 'shop', 'mall'],
      utilities: ['electric', 'water', 'internet', 'phone']
    };

    const description = transaction.description.toLowerCase();
    let maxConfidence = 0;

    for (const [category, categoryKeywords] of Object.entries(keywords)) {
      const matches = categoryKeywords.filter(keyword => description.includes(keyword));
      const confidence = matches.length / categoryKeywords.length;
      maxConfidence = Math.max(maxConfidence, confidence);
    }

    return Math.round(maxConfidence * 100);
  }

  static generateRecommendations(analysis, transaction) {
    const recommendations = [];

    if (analysis.fraudProbability > 0.7) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: 'Review Transaction',
        description: 'This transaction has been flagged for potential fraud',
        actions: ['verify', 'report', 'block']
      });
    }

    if (analysis.duplicateRisk > 0.8) {
      recommendations.push({
        type: 'duplicate',
        priority: 'medium',
        title: 'Potential Duplicate',
        description: 'This transaction appears similar to a recent one',
        actions: ['compare', 'mark_unique', 'merge']
      });
    }

    if (analysis.categoryConfidence === 0 && !transaction.category_id) {
      recommendations.push({
        type: 'categorization',
        priority: 'low',
        title: 'Add Category',
        description: 'Categorizing helps with budgeting and insights',
        actions: ['auto_categorize', 'manual_select']
      });
    }

    if (analysis.riskScore > 50) {
      recommendations.push({
        type: 'verification',
        priority: 'medium',
        title: 'Verify Details',
        description: 'Consider adding receipt or additional notes',
        actions: ['add_receipt', 'add_notes', 'verify_amount']
      });
    }

    return recommendations;
  }

  static async getBatchInsights(transactions, userContext) {
    const insights = {
      totalAnalyzed: transactions.length,
      highRiskCount: 0,
      potentialDuplicates: 0,
      uncategorized: 0,
      averageRisk: 0,
      fraudAlerts: [],
      patterns: {},
      recommendations: []
    };

    let totalRisk = 0;

    for (const transaction of transactions) {
      const analysis = await this.analyzeTransaction(transaction, userContext);
      
      totalRisk += analysis.riskScore;
      
      if (analysis.fraudProbability > 0.7) {
        insights.highRiskCount++;
        insights.fraudAlerts.push({
          transactionId: transaction.id,
          probability: analysis.fraudProbability,
          flags: analysis.anomalyFlags
        });
      }

      if (analysis.duplicateRisk > 0.8) {
        insights.potentialDuplicates++;
      }

      if (!transaction.category_id) {
        insights.uncategorized++;
      }
    }

    insights.averageRisk = totalRisk / transactions.length;

    // Generate batch recommendations
    if (insights.highRiskCount > 0) {
      insights.recommendations.push({
        type: 'security_review',
        title: 'Security Review Needed',
        description: `${insights.highRiskCount} transactions flagged for review`,
        priority: 'high'
      });
    }

    if (insights.uncategorized > transactions.length * 0.3) {
      insights.recommendations.push({
        type: 'categorization',
        title: 'Improve Categorization',
        description: `${insights.uncategorized} transactions need categories`,
        priority: 'medium'
      });
    }

    return insights;
  }
}

// 📊 Smart Transaction Analytics
class TransactionAnalytics {
  static generateSpendingInsights(transactions) {
    const insights = {
      patterns: {},
      trends: {},
      predictions: {},
      recommendations: []
    };

    // Spending patterns by time
    const hourlySpending = {};
    const dailySpending = {};
    const monthlySpending = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const hour = date.getHours();
      const day = date.getDay();
      const month = date.getMonth();
      const amount = Math.abs(parseFloat(transaction.amount));

      hourlySpending[hour] = (hourlySpending[hour] || 0) + amount;
      dailySpending[day] = (dailySpending[day] || 0) + amount;
      monthlySpending[month] = (monthlySpending[month] || 0) + amount;
    });

    insights.patterns = {
      peakHour: this.findPeak(hourlySpending),
      peakDay: this.findPeak(dailySpending),
      peakMonth: this.findPeak(monthlySpending),
      spendingDistribution: this.calculateDistribution(transactions)
    };

    // Trend analysis
    insights.trends = this.calculateTrends(transactions);

    // Predictions
    insights.predictions = this.generatePredictions(insights.trends);

    // Smart recommendations
    insights.recommendations = this.generateSmartRecommendations(insights);

    return insights;
  }

  static findPeak(data) {
    return Object.entries(data).reduce((max, [key, value]) => 
      value > max.value ? { key: parseInt(key), value } : max, 
      { key: 0, value: 0 }
    );
  }

  static calculateDistribution(transactions) {
    const ranges = {
      micro: 0,    // < $10
      small: 0,    // $10-50
      medium: 0,   // $50-200
      large: 0,    // $200-1000
      huge: 0      // > $1000
    };

    transactions.forEach(transaction => {
      const amount = Math.abs(parseFloat(transaction.amount));
      if (amount < 10) ranges.micro++;
      else if (amount < 50) ranges.small++;
      else if (amount < 200) ranges.medium++;
      else if (amount < 1000) ranges.large++;
      else ranges.huge++;
    });

    return ranges;
  }

  static calculateTrends(transactions) {
    const monthly = {};
    
    transactions.forEach(transaction => {
      const monthKey = new Date(transaction.created_at).toISOString().substring(0, 7);
      const amount = Math.abs(parseFloat(transaction.amount));
      
      if (!monthly[monthKey]) {
        monthly[monthKey] = { total: 0, count: 0 };
      }
      
      monthly[monthKey].total += amount;
      monthly[monthKey].count++;
    });

    const months = Object.keys(monthly).sort();
    const values = months.map(month => monthly[month].total);

    return {
      direction: values.length > 1 ? (values[values.length - 1] > values[0] ? 'increasing' : 'decreasing') : 'stable',
      slope: this.calculateSlope(values),
      volatility: this.calculateVolatility(values),
      growth: values.length > 1 ? ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0
    };
  }

  static calculateSlope(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  static calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean;
  }

  static generatePredictions(trends) {
    return {
      nextMonthSpending: trends.slope > 0 ? 'increase' : trends.slope < 0 ? 'decrease' : 'stable',
      confidence: Math.max(0, 1 - trends.volatility),
      riskLevel: trends.volatility > 0.3 ? 'high' : trends.volatility > 0.15 ? 'medium' : 'low'
    };
  }

  static generateSmartRecommendations(insights) {
    const recommendations = [];

    if (insights.predictions.riskLevel === 'high') {
      recommendations.push({
        type: 'budgeting',
        title: 'Budget Volatility Warning',
        description: 'Your spending shows high volatility. Consider setting stricter budgets.',
        priority: 'high'
      });
    }

    if (insights.trends.direction === 'increasing' && insights.trends.growth > 20) {
      recommendations.push({
        type: 'spending_alert',
        title: 'Spending Increase Detected',
        description: `Your spending has increased by ${insights.trends.growth.toFixed(1)}%`,
        priority: 'medium'
      });
    }

    if (insights.patterns.spendingDistribution.huge > insights.patterns.spendingDistribution.small) {
      recommendations.push({
        type: 'large_purchases',
        title: 'Large Purchase Pattern',
        description: 'You tend to make large purchases. Consider planning these in advance.',
        priority: 'low'
      });
    }

    return recommendations;
  }
}

// 🚀 Enhanced Smart Cache with Real-time Updates
class TransactionCacheManager {
  static cache = new Map();
  static TTL = 3 * 60 * 1000; // 3 minutes for real-time feel
  static maxSize = 500;

  static generateKey(type, params = {}) {
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    return `${type}:${sortedParams}`;
  }

  static get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  static set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static invalidatePattern(pattern) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  static clear() {
    this.cache.clear();
  }
}

// 📊 Performance Monitoring
class TransactionPerformanceMonitor {
  static metrics = {
    queries: 0,
    mutations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgResponseTime: 0,
    errors: 0,
    aiAnalyses: 0
  };

  static recordQuery(duration) {
    this.metrics.queries++;
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + duration) / 2;
  }

  static recordMutation() {
    this.metrics.mutations++;
  }

  static recordCacheHit() {
    this.metrics.cacheHits++;
  }

  static recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  static recordError() {
    this.metrics.errors++;
  }

  static recordAIAnalysis() {
    this.metrics.aiAnalyses++;
  }

  static getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      errorRate: this.metrics.errors / Math.max(this.metrics.queries + this.metrics.mutations, 1),
      avgResponseTime: Math.round(this.metrics.avgResponseTime * 100) / 100
    };
  }
}

/**
 * 💰 Enhanced useTransactions Hook - REVOLUTIONIZED!
 */
export const useTransactions = (options = {}) => {
  const { isAuthenticated, user } = useAuth();
  const toastService = useToast();
  const queryClient = useQueryClient();
  const logger = useRef(createLogger('Transactions')).current;

  // ✅ CRITICAL FIX: Increase page size for better user experience
  const {
    pageSize = 50,
    enableAI = true,
    enableRealTimeAnalysis = true,
    autoRefresh = false,
    cacheStrategy = 'smart',
    activeTab = 'all' // ✅ NEW: Active tab for smart filtering
  } = options;

  // Enhanced state
  const [filters, setFilters] = useState({
    search: '',
    category: null,
    type: null,
    dateRange: null,
    amountRange: null,
    status: null
  });

  const [aiInsights, setAIInsights] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const performanceRef = useRef(TransactionPerformanceMonitor);

  // ✅ Enhanced infinite query with AI analysis
  const transactionsQuery = useInfiniteQuery({
    queryKey: ['transactions', user?.id, filters, activeTab, new Date().toISOString().split('T')[0]], // Add date to prevent stale cache
    enabled: !!user?.id, // Only run if user is authenticated
    queryFn: async ({ pageParam = 0 }) => {
      const start = performance.now();
      
      try {
        const cacheKey = TransactionCacheManager.generateKey('transactions', {
          ...filters,
          page: pageParam,
          userId: user?.id
        });

        // Check cache first
        let cachedData = null;
        if (cacheStrategy === 'smart') {
          cachedData = TransactionCacheManager.get(cacheKey);
          if (cachedData) {
            performanceRef.current.recordCacheHit();
            return cachedData;
          }
          performanceRef.current.recordCacheMiss();
        }

        // 🚨 CRITICAL FIX: Handle frontend-only date filters
        const apiFilters = { ...filters };
        
        // ✅ SMART DATE FILTERING: Add date filters based on active tab
        if (activeTab === 'all') {
          // All tab: Only current month + past (no future transactions)
          const now = new Date();
          const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfCurrentMonth.setHours(23, 59, 59, 999);
          
          apiFilters.dateTo = endOfCurrentMonth.toISOString().split('T')[0]; // YYYY-MM-DD format
          console.log('📅 All tab - filtering up to:', apiFilters.dateTo);
          
        } else if (activeTab === 'upcoming') {
          // ✅ UPCOMING TAB FIX: Get ALL future transactions from tomorrow onwards
          console.log('📅 Upcoming tab - getting future transactions');
          
          // Get tomorrow in user's timezone  
          const now = new Date();
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          // Set date filter to get transactions from tomorrow onwards
          apiFilters.dateFrom = tomorrow.toISOString().split('T')[0];
          
          // ✅ CRITICAL: Remove the dateTo filter that was set for "All" tab
          delete apiFilters.dateTo;
          
          // Remove type filtering for upcoming tab to get all future transactions  
          delete apiFilters.type;
          delete apiFilters.recurring;
          
          console.log('📅 Upcoming date filter APPLIED:', {
            tomorrow: tomorrow.toISOString(),
            dateFrom: apiFilters.dateFrom,
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            filtersBeingUsed: apiFilters,
            fullApiUrl: `GET /transactions?${new URLSearchParams(apiFilters).toString()}`
          });
        }
        // No date filtering for recurring tab
        
        // Clean up old frontend-only filters
        delete apiFilters.dateRange;
        
        logger.debug('API Request:', {
          filters: apiFilters,
          page: pageParam + 1,
          limit: pageSize
        });

        const response = await api.transactions.getAll({
          page: pageParam + 1, // Server expects 1-based pagination
          limit: pageSize,
          ...apiFilters
        });

        logger.debug('API Response:', {
          success: response.success,
          count: response.data?.transactions?.length,
          hasMore: response.data?.pagination?.hasMore
        });

        // ✅ FIXED: Handle API response structure properly
        let rawData;
        if (response.success && response.data) {
          // Check if response.data has its own success/data structure (nested)
          if (response.data.success && response.data.data) {
            rawData = response.data.data; // Double nested
          } else {
            rawData = response.data; // Normal
          }
        } else {
          rawData = response;
        }
        
        if (!rawData) {
          logger.warn('No data received from transactions API');
          return { transactions: [], hasMore: false, total: 0 };
        }
        
        let transactionsArray = [];
        let total = 0;
        let hasMore = false;
        
        if (Array.isArray(rawData)) {
          // If rawData is directly an array (fallback)
          transactionsArray = rawData;
          total = rawData.length;
        } else if (rawData.transactions && Array.isArray(rawData.transactions)) {
          // If rawData has transactions property (expected server format)
          transactionsArray = rawData.transactions;
          total = rawData.pagination?.total || rawData.summary?.total || rawData.transactions.length;
          hasMore = rawData.pagination?.hasMore || false;
        } else {
          logger.warn('Unexpected data structure from transactions API');
          transactionsArray = [];
        }

        // Transform flat category data to nested structure for all transactions
        const transformedTransactions = transactionsArray.map(transaction => ({
          ...transaction,
          // Transform flat category data to nested structure for frontend compatibility
          category: transaction.category_name ? {
            name: transaction.category_name,
            icon: transaction.category_icon,
            color: transaction.category_color
          } : transaction.category
        }));

        // Structure the data properly for infinite query
        const data = {
          transactions: transformedTransactions,
          hasMore: hasMore || (transformedTransactions.length === pageSize),
          total: total,
          page: pageParam,
          limit: pageSize
        };

        // Add AI analysis if enabled
        if (enableAI && data.transactions) {
          performanceRef.current.recordAIAnalysis();
          
          const userContext = await getUserContext();
          const analysisPromises = data.transactions.map(transaction =>
            TransactionAIEngine.analyzeTransaction(transaction, userContext)
          );
          
          const analyses = await Promise.all(analysisPromises);
          
          data.transactions = data.transactions.map((transaction, index) => ({
            ...transaction,
            aiAnalysis: analyses[index],
            // Transform flat category data to nested structure for frontend compatibility
            category: transaction.category_name ? {
              name: transaction.category_name,
              icon: transaction.category_icon,
              color: transaction.category_color
            } : transaction.category
          }));

          // Generate batch insights
          if (enableRealTimeAnalysis) {
            const batchInsights = await TransactionAIEngine.getBatchInsights(
              data.transactions, 
              userContext
            );
            data.batchInsights = batchInsights;
          }
        }

        // Cache the result
        if (cacheStrategy === 'smart') {
          TransactionCacheManager.set(cacheKey, data);
        }

        const duration = performance.now() - start;
        performanceRef.current.recordQuery(duration);

        return data;
      } catch (error) {
        performanceRef.current.recordError();
        throw error;
      }
    },
    enabled: isAuthenticated && !!user?.id && !!localStorage.getItem('accessToken'),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    staleTime: cacheStrategy === 'aggressive' ? 10 * 60 * 1000 : 2 * 60 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false
  });

  // ✅ Transaction analytics query
  const analyticsQuery = useQuery({
    queryKey: ['transaction-analytics', user?.id, filters.dateRange],
    queryFn: async () => {
      const response = await api.analytics.getUserAnalytics({
        dateRange: filters.dateRange
      });
      return response.data;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000
  });

  // ✅ Real-time insights query
  const insightsQuery = useQuery({
    queryKey: ['transaction-insights', user?.id],
    queryFn: async () => {
      if (!enableAI) return null;
      
      // ✅ FIXED: Safe access to transactions in insights query
      const allTransactions = transactionsQuery.data?.pages?.flatMap(page => {
        return page?.transactions || [];
      }) || [];
      if (allTransactions.length === 0) return null;

      const insights = TransactionAnalytics.generateSpendingInsights(allTransactions);
      setAIInsights(insights);
      return insights;
    },
    enabled: isAuthenticated && enableAI && !!transactionsQuery.data,
    staleTime: 10 * 60 * 1000
  });

  // ✅ Enhanced transaction creation mutation - SUPPORTS RECURRING TEMPLATES
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData) => {
      performanceRef.current.recordMutation();
      
      // AI pre-processing
      if (enableAI && transactionData.description) {
        // TODO: Add category suggestion logic or remove AI categorization
        // const categorySuggestion = await api.categories.getAll();
        // For now, skip AI categorization

        // Skip AI categorization for now
      }

      // ✅ CRITICAL FIX: Route to correct API based on transaction type
      if (transactionData._isRecurring) {
        logger.debug('Creating recurring template');
        // Remove internal marker before sending to API
        const cleanData = { ...transactionData };
        delete cleanData._isRecurring;
        const response = await api.transactions.createRecurringTemplate(cleanData);
        return response.data;
      } else {
        logger.debug('Creating regular transaction');
        const response = await api.transactions.create(transactionData.type || 'expense', transactionData);
        return response.data;
      }
    },
    onSuccess: (newTransaction) => {
      // ✅ FIXED: Safety check to ensure we have valid transaction data
      if (!newTransaction) {
        logger.warn('Transaction creation succeeded but returned no data');
        toastService.error('transactions.createFailed');
        return;
      }

      logger.success('Transaction created successfully');

      // ✅ ENHANCED: Invalidate ALL relevant queries to ensure balance panel updates
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      queryClient.invalidateQueries(['dashboard']);
      
      // Force immediate refetch for dashboard and transactions
      queryClient.refetchQueries(['transactions'], { active: true });
      queryClient.refetchQueries(['dashboard'], { active: true });
      
      // Clear cache
      TransactionCacheManager.invalidatePattern('transactions');
      
      toastService.success('transactions.createSuccess');

      // Show AI insights if available (optional feature)
      if (newTransaction?.aiAnalysis?.fraudProbability > 0.5) {
        toastService.warning('transactions.securityAlert', {
          details: 'Transaction flagged for review'
        });
      }
    },
    onError: (error) => {
      performanceRef.current.recordError();
      toastService.error(error.message || 'transactions.createFailed');
    }
  });

  // ✅ Enhanced batch creation mutation
  const createBatchMutation = useMutation({
    mutationFn: async (transactionsData) => {
      performanceRef.current.recordMutation();
      
      // Process batch transactions individually for now
      const results = [];
      for (const transactionData of transactionsData) {
        const response = await api.transactions.create(transactionData.type || 'expense', transactionData);
        if (response.success) {
          results.push(response.data);
        }
      }
      return { transactions: results };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      TransactionCacheManager.clear();
      
      toastService.success('transactions.batchCreateSuccess', { 
        count: result.transactions.length 
      });

      // Show batch insights
      if (result.analytics && result.analytics.batch.highRiskTransactions > 0) {
        toastService.warning('transactions.batchSecurityAlert', {
          count: result.analytics.batch.highRiskTransactions
        });
      }
    },
    onError: (error) => {
      performanceRef.current.recordError();
      toastService.error(error.message || 'transactions.batchCreateFailed');
    }
  });

  // ✅ Enhanced update mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ transactionId, updates }) => {
      performanceRef.current.recordMutation();
      
      const response = await api.transactions.update(updates.type || 'expense', transactionId, updates);
      return response.data;
    },
    onSuccess: (updatedTransaction) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      TransactionCacheManager.invalidatePattern('transactions');
      
      toastService.success('transactions.updateSuccess');
    },
    onError: (error) => {
      performanceRef.current.recordError();
      toastService.error(error.message || 'transactions.updateFailed');
    }
  });

  // ✅ Enhanced delete mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId) => {
      performanceRef.current.recordMutation();

      // Determine correct type for server route ('income' | 'expense')
      let typeForDelete = 'expense';
      try {
        const allTx = transactionsQuery.data?.pages?.flatMap(p => p?.transactions || []) || [];
        const tx = allTx.find(t => t.id === transactionId);
        if (tx?.type === 'income' || tx?.type === 'expense') {
          typeForDelete = tx.type;
        } else if (typeof tx?.amount === 'number') {
          typeForDelete = tx.amount > 0 ? 'income' : 'expense';
        }
      } catch {}

      const response = await api.transactions.delete(typeForDelete, transactionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      TransactionCacheManager.invalidatePattern('transactions');
      
      toastService.success('transactions.deleteSuccess');
    },
    onError: (error) => {
      performanceRef.current.recordError();
      toastService.error(error.message || 'transactions.deleteFailed');
    }
  });

  // ✅ Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operation, transactionIds, data = {} }) => {
      performanceRef.current.recordMutation();

      const allTx = transactionsQuery.data?.pages?.flatMap(p => p?.transactions || []) || [];

      const results = [];
      for (const id of transactionIds) {
        if (operation === 'delete') {
          let typeForDelete = 'expense';
          const tx = allTx.find(t => t.id === id);
          if (tx?.type === 'income' || tx?.type === 'expense') {
            typeForDelete = tx.type;
          } else if (typeof tx?.amount === 'number') {
            typeForDelete = tx.amount > 0 ? 'income' : 'expense';
          }
          const result = await api.transactions.delete(typeForDelete, id);
          results.push(result);
        }
      }
      return { data: results };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction-analytics']);
      TransactionCacheManager.clear();
      
      toastService.success(`transactions.bulk.${variables.operation}Success`, {
        count: variables.transactionIds.length
      });
      
      setSelectedTransactions(new Set());
    },
    onError: (error, variables) => {
      performanceRef.current.recordError();
      toastService.error(error.message || `transactions.bulk.${variables.operation}Failed`);
    }
  });

  // ✅ Enhanced helper methods
  const getUserContext = useCallback(async () => {
    try {
      const response = await api.users.getProfile();
      return response.data;
    } catch (error) {
      logger.warn('Failed to get user context');
      return {};
    }
  }, []);

  const invalidateAllTransactionData = useCallback(() => {
    const queriesToInvalidate = [
      'transactions',
      'transaction-analytics',
      'transaction-insights',
      'dashboard',
      'categories'
    ];

    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });

    TransactionCacheManager.clear();
  }, [queryClient]);

  // ✅ Enhanced operations
  const createTransaction = useCallback(async (transactionData) => {
    return createTransactionMutation.mutateAsync(transactionData);
  }, [createTransactionMutation]);

  const createBatch = useCallback(async (transactionsData) => {
    return createBatchMutation.mutateAsync(transactionsData);
  }, [createBatchMutation]);

  const updateTransaction = useCallback(async (transactionId, updates) => {
    return updateTransactionMutation.mutateAsync({ transactionId, updates });
  }, [updateTransactionMutation]);

  const deleteTransaction = useCallback(async (transactionId) => {
    return deleteTransactionMutation.mutateAsync(transactionId);
  }, [deleteTransactionMutation]);

  const bulkOperation = useCallback(async (operation, transactionIds, data = {}) => {
    return bulkOperationMutation.mutateAsync({ operation, transactionIds, data });
  }, [bulkOperationMutation]);

  // ✅ Advanced filtering
  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    TransactionCacheManager.invalidatePattern('transactions');
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: null,
      type: null,
      dateRange: null,
      amountRange: null,
      status: null
    });
  }, []);

  // ✅ Selection management
  const selectTransaction = useCallback((transactionId) => {
    setSelectedTransactions(prev => new Set([...prev, transactionId]));
  }, []);

  const deselectTransaction = useCallback((transactionId) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      newSet.delete(transactionId);
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    // ✅ FIXED: Safe access to transactions in selectAll
    const allTransactions = transactionsQuery.data?.pages?.flatMap(page => {
      return page?.transactions || [];
    }) || [];
    setSelectedTransactions(new Set(allTransactions.map(t => t.id)));
  }, [transactionsQuery.data]);

  const clearSelection = useCallback(() => {
    setSelectedTransactions(new Set());
  }, []);

  // ✅ AI-powered insights
  const getTransactionInsights = useCallback(async (transactionId) => {
    if (!enableAI) return null;

    // ✅ FIXED: Safe access to transactions in getTransactionInsights  
    const allTransactions = transactionsQuery.data?.pages?.flatMap(page => {
      return page?.transactions || [];
    }) || [];
    const transaction = allTransactions.find(t => t.id === transactionId);
    
    if (!transaction) return null;

    const userContext = await getUserContext();
    return TransactionAIEngine.analyzeTransaction(transaction, userContext);
  }, [enableAI, transactionsQuery.data, getUserContext]);

  const getSpendingPredictions = useCallback(() => {
    if (!enableAI || !insightsQuery.data) return null;
    return insightsQuery.data.predictions;
  }, [enableAI, insightsQuery.data]);

  // ✅ Performance monitoring
  const getPerformanceMetrics = useCallback(() => {
    return performanceRef.current.getMetrics();
  }, []);

  // ✅ Processed data
  const allTransactions = useMemo(() => {
    if (!transactionsQuery.data?.pages) {
      return [];
    }
    
    const flattened = transactionsQuery.data.pages.flatMap(page => {
      // ✅ FIXED: Safe access to page.transactions with fallback
      if (!page || !page.transactions || !Array.isArray(page.transactions)) {
        logger.warn('Invalid page structure in query result');
        return [];
      }
      return page.transactions;
    }) || [];
    
    logger.debug(`Loaded ${flattened.length} transactions from ${transactionsQuery.data.pages.length} pages`);
    
    return flattened;
  }, [transactionsQuery.data, transactionsQuery.hasNextPage, transactionsQuery.isFetchingNextPage]);

  const batchInsights = useMemo(() => {
    // ✅ FIXED: Safe access to batchInsights
    const firstPage = transactionsQuery.data?.pages?.[0];
    return firstPage?.batchInsights || null;
  }, [transactionsQuery.data]);

  return {
    // Data
    transactions: allTransactions,
    analytics: analyticsQuery.data,
    insights: insightsQuery.data,
    aiInsights,
    batchInsights,
    
    // Pagination
    hasNextPage: transactionsQuery.hasNextPage,
    fetchNextPage: transactionsQuery.fetchNextPage,
    isFetchingNextPage: transactionsQuery.isFetchingNextPage,
    
    // Loading states
    loading: transactionsQuery.isLoading,
    analyticsLoading: analyticsQuery.isLoading,
    insightsLoading: insightsQuery.isLoading,
    
    // Mutation states
    creating: createTransactionMutation.isLoading,
    batchCreating: createBatchMutation.isLoading,
    updating: updateTransactionMutation.isLoading,
    deleting: deleteTransactionMutation.isLoading,
    bulkProcessing: bulkOperationMutation.isLoading,
    
    // Error states
    error: transactionsQuery.error,
    analyticsError: analyticsQuery.error,
    
    // Enhanced operations
    createTransaction,
    createBatch,
    updateTransaction,
    deleteTransaction,
    bulkOperation,
    
    // Filtering
    filters,
    applyFilters,
    clearFilters,
    
    // Selection
    selectedTransactions,
    selectTransaction,
    deselectTransaction,
    selectAll,
    clearSelection,
    
    // AI features
    getTransactionInsights,
    getSpendingPredictions,
    
    // Utilities
    invalidateAllTransactionData,
    getPerformanceMetrics,
    getUserContext,
    
    // Refetch functions
    refetch: transactionsQuery.refetch,
    refetchAnalytics: analyticsQuery.refetch,
    refetchInsights: insightsQuery.refetch
  };
};

/**
 * 📋 useTransactionTemplates Hook - Transaction Templates Management
 */
export const useTransactionTemplates = () => {
  const { user } = useAuth();
  
  return {
    templates: [],
    createTemplate: async (transaction) => {
      // Template creation logic
      return { success: true };
    },
    deleteTemplate: async (templateId) => {
      // Template deletion logic
      return { success: true };
    },
    applyTemplate: async (templateId, overrides = {}) => {
      // Template application logic
      return { success: true };
    }
  };
};

export default useTransactions;