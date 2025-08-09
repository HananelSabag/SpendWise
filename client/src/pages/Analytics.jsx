/**
 * 📊 ANALYTICS - Financial Analytics Dashboard with Real Data
 * @version 3.0.0 - REAL DATA IMPLEMENTATION
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  BarChart3, Calendar, Target, AlertCircle,
  Coffee, Car, Home, ShoppingBag, Briefcase,
  RefreshCw, Download
} from 'lucide-react';

// Import stores and API
import { useTranslation, useCurrency, useNotifications } from '../stores';
import analyticsAPI from '../api/analytics';

// UI Components
import { Card, Badge, Button } from '../components/ui';
import { cn } from '../utils/helpers';

const Analytics = () => {
  const { t } = useTranslation('analytics');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // Fetch analytics data
  const analyticsQuery = useQuery({
    queryKey: ['analytics-summary', selectedPeriod],
    queryFn: async () => {
      const response = await analyticsAPI.dashboard.getSummary(selectedPeriod);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch analytics');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      addNotification({
        type: 'error',
        message: `Analytics Error: ${error.message}`,
        duration: 5000
      });
    }
  });

  // Get icon component for categories
  const getIconComponent = (iconName) => {
    const iconMap = {
      Coffee, Car, Home, ShoppingBag, Briefcase,
      DollarSign, PieChart, BarChart3
    };
    return iconMap[iconName] || DollarSign;
  };

  const isLoading = analyticsQuery.isLoading;
  const isError = analyticsQuery.isError;
  const data = analyticsQuery.data;

  // Calculate financial health score
  const calculateHealthScore = (data) => {
    if (!data?.monthlyStats) return 0;
    
    const { income, expenses } = data.monthlyStats;
    if (income === 0) return expenses === 0 ? 50 : 20; // No income = poor unless no expenses
    
    const savingsRate = ((income - expenses) / income) * 100;
    const baseScore = 50;
    
    // Positive savings increases score
    if (savingsRate > 20) return Math.min(100, baseScore + 30);
    if (savingsRate > 10) return Math.min(100, baseScore + 20);
    if (savingsRate > 0) return Math.min(100, baseScore + 10);
    
    // Negative savings decreases score
    return Math.max(0, baseScore - Math.abs(savingsRate));
  };

  const healthScore = data ? calculateHealthScore(data) : 0;
  const healthLevel = healthScore >= 80 ? 'excellent' : 
                     healthScore >= 60 ? 'good' : 
                     healthScore >= 40 ? 'fair' : 'poor';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Beautiful Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Page Title */}
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <BarChart3 className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-gray-900 dark:text-white"
                >
                  Analytics
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  Real-time insights from your financial data
                </motion.p>
              </div>
            </div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              {/* Refresh Button */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  onClick={() => analyticsQuery.refetch()}
                  disabled={isLoading}
                  className="p-2.5 h-auto rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Period Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            
            {/* Period Selector */}
            <div className="flex gap-2">
              {[7, 30, 90, 365].map((days) => (
                <Button
                  key={days}
                  variant={selectedPeriod === days ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(days)}
                >
                  {days === 7 ? '7D' : days === 30 ? '30D' : days === 90 ? '3M' : '1Y'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="p-6 mb-8 border-red-200 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Failed to Load Analytics
                </h3>
                <p className="text-red-700 dark:text-red-300">
                  {analyticsQuery.error?.message || 'Unable to fetch analytics data'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => analyticsQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Analytics Data */}
        {data && (
          <>
            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Financial Health */}
              <Card className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${
                    healthLevel === 'excellent' ? 'bg-green-100' :
                    healthLevel === 'good' ? 'bg-blue-100' :
                    healthLevel === 'fair' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <TrendingUp className={`w-8 h-8 ${
                      healthLevel === 'excellent' ? 'text-green-600' :
                      healthLevel === 'good' ? 'text-blue-600' :
                      healthLevel === 'fair' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Financial Health</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {healthScore}/100
                    </p>
                    <Badge variant={
                      healthLevel === 'excellent' ? 'success' :
                      healthLevel === 'good' ? 'info' :
                      healthLevel === 'fair' ? 'warning' : 'danger'
                    }>
                      {healthLevel.charAt(0).toUpperCase() + healthLevel.slice(1)}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Savings Rate */}
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Rate</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {data.summary?.savingsRate || 0}%
                    </p>
                    <p className="text-sm text-gray-500">Last {selectedPeriod} days</p>
                  </div>
                </div>
              </Card>

              {/* Top Category */}
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <PieChart className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories Used</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {data.summary?.categoriesUsed || 0}
                    </p>
                    <p className="text-sm text-gray-500">Active categories</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Financial Summary ({selectedPeriod} days)
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-gray-600 dark:text-gray-400">Income</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.monthlyStats?.income || 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <span className="text-gray-600 dark:text-gray-400">Expenses</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(data.monthlyStats?.expenses || 0)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900 dark:text-white">Net Balance</span>
                      </div>
                      <span className={`font-bold text-lg ${
                        (data.monthlyStats?.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(data.monthlyStats?.net || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Transaction Insights */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Transaction Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Transactions</span>
                    <span className="font-semibold">
                      {data.summary?.totalTransactions || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg. Transaction</span>
                    <span className="font-semibold">
                      {formatCurrency(data.summary?.avgTransactionAmount || 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Categories Used</span>
                    <span className="font-semibold">
                      {data.summary?.categoriesUsed || 0}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Transactions */}
            {data.recentTransactions && data.recentTransactions.length > 0 && (
              <Card className="p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Transactions
                </h3>
                <div className="space-y-3">
                  {data.recentTransactions.slice(0, 5).map((transaction) => {
                    const IconComponent = getIconComponent(transaction.category_icon);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {transaction.description || 'Transaction'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {transaction.category_name} • {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Analytics Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/analytics/health"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Financial Health
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive analysis of your financial well-being with personalized recommendations
            </p>
          </Link>

          <Link
            to="/analytics/insights"
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Smart Insights
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered insights and spending forecasts to help you make better financial decisions
            </p>
          </Link>
        </div>

        {/* Data Source Info */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Calendar className="w-4 h-4" />
            <span>
              Data updated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'Real-time'}
              {data && ` • Showing ${selectedPeriod} day period`}
            </span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Analytics;