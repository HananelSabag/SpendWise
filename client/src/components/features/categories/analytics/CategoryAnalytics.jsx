/**
 * 📊 CATEGORY ANALYTICS - Advanced Analytics Component
 * Comprehensive analytics and insights for categories
 * Features: Charts, Trends, Insights, Export, Real-time updates
 * @version 3.0.0 - CATEGORY REDESIGN
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, PieChart, TrendingUp, TrendingDown, Calendar,
  Download, RefreshCw, Filter, Eye, Target, Award,
  DollarSign, Activity, Clock, Lightbulb, AlertTriangle
} from 'lucide-react';

// ✅ Import hooks and stores
import { useCategoryAnalytics } from '../../../../hooks/useCategoryAnalytics';
import { useTranslation, useCurrency, useTheme } from '../../../../stores';

import { Card, Button, Badge, LoadingSpinner, Dropdown } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 📊 Category Analytics Component
 */
const CategoryAnalytics = ({
  timeRange = '30d',
  onTimeRangeChange,
  showExport = true,
  className = ''
}) => {
  const { t } = useTranslation('categories');
  const { formatCurrency } = useCurrency();
  const { theme } = useTheme();
  
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, trends
  
  const {
    analytics,
    summary,
    trends,
    recommendations,
    isLoading,
    refreshAnalytics,
    exportAnalytics,
    getTopCategories
  } = useCategoryAnalytics({ timeRange });

  // ✅ Top categories by different metrics
  const topCategories = useMemo(() => {
    return {
      mostUsed: getTopCategories('transactionCount', 5),
      highestValue: getTopCategories('totalAmount', 5),
      trending: trends?.growingCategories?.slice(0, 5) || []
    };
  }, [getTopCategories, trends]);

  // ✅ Analytics cards data
  const analyticsCards = useMemo(() => [
    {
      title: t('analytics.cards.totalCategories'),
      value: summary?.totalCategories || 0,
      icon: Target,
      color: 'blue',
      trend: null
    },
    {
      title: t('analytics.cards.activeCategories'),
      value: summary?.activeCategories || 0,
      icon: Activity,
      color: 'green',
      trend: summary?.activeCategories && summary?.totalCategories 
        ? Math.round((summary.activeCategories / summary.totalCategories) * 100)
        : null
    },
    {
      title: t('analytics.cards.avgTransactions'),
      value: summary?.avgTransactionsPerCategory || 0,
      icon: BarChart3,
      color: 'purple',
      trend: null
    },
    {
      title: t('analytics.cards.optimization'),
      value: recommendations?.optimization?.length || 0,
      icon: Lightbulb,
      color: 'orange',
      trend: null
    }
  ], [summary, recommendations, t]);

  // ✅ Export options
  const exportOptions = [
    { label: t('export.json'), value: 'json', icon: Download },
    { label: t('export.csv'), value: 'csv', icon: Download },
    { label: t('export.report'), value: 'report', icon: Download }
  ];

  // ✅ Handle export
  const handleExport = async (format) => {
    try {
      const data = await exportAnalytics(format);
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `category-analytics-${timeRange}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-12", className)}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('analytics.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('analytics.subtitle', { timeRange })}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['overview', 'detailed', 'trends'].map(mode => (
              <Button
                key={mode}
                variant={viewMode === mode ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
              >
                {t(`analytics.viewModes.${mode}`)}
              </Button>
            ))}
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAnalytics}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('analytics.refresh')}</span>
          </Button>

          {/* Export */}
          {showExport && (
            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  {t('analytics.export')}
                </Button>
              }
              items={exportOptions.map(option => ({
                label: option.label,
                icon: option.icon,
                onClick: () => handleExport(option.value)
              }))}
            />
          )}
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  {card.trend && (
                    <div className="flex items-center space-x-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">{card.trend}%</span>
                    </div>
                  )}
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  card.color === 'blue' && "bg-blue-100 dark:bg-blue-900/20",
                  card.color === 'green' && "bg-green-100 dark:bg-green-900/20",
                  card.color === 'purple' && "bg-purple-100 dark:bg-purple-900/20",
                  card.color === 'orange' && "bg-orange-100 dark:bg-orange-900/20"
                )}>
                  <card.icon className={cn(
                    "w-6 h-6",
                    card.color === 'blue' && "text-blue-600 dark:text-blue-400",
                    card.color === 'green' && "text-green-600 dark:text-green-400",
                    card.color === 'purple' && "text-purple-600 dark:text-purple-400",
                    card.color === 'orange' && "text-orange-600 dark:text-orange-400"
                  )} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('analytics.topCategories')}
            </h3>
            <div className="space-y-3">
              {topCategories.mostUsed.map((category, index) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Category #{category.id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.transactionCount} transactions
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {formatCurrency(Math.abs(category.totalAmount || 0))}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('analytics.recommendations')}
            </h3>
            <div className="space-y-3">
              {recommendations?.optimization?.slice(0, 5).map((rec, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {rec.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {rec.description}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('analytics.noRecommendations')}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Detailed Mode */}
      {viewMode === 'detailed' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.detailedView')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('analytics.detailedDescription')}
          </p>
          {/* Add detailed charts/tables here */}
        </Card>
      )}

      {/* Trends Mode */}
      {viewMode === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growing Categories */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>{t('analytics.growing')}</span>
            </h3>
            <div className="space-y-2">
              {trends?.growingCategories?.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 dark:text-white">
                    Category #{trend.categoryId}
                  </span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    +{trend.growth}%
                  </Badge>
                </div>
              )) || (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('analytics.noGrowingCategories')}
                </p>
              )}
            </div>
          </Card>

          {/* Declining Categories */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span>{t('analytics.declining')}</span>
            </h3>
            <div className="space-y-2">
              {trends?.decliningCategories?.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 dark:text-white">
                    Category #{trend.categoryId}
                  </span>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    {trend.decline}%
                  </Badge>
                </div>
              )) || (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('analytics.noDecliningCategories')}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CategoryAnalytics; 