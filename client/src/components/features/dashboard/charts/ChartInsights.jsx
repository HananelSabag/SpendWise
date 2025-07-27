/**
 * 🧠 CHART INSIGHTS - AI Insights & Data Legends
 * Extracted from StatsChart.jsx for better performance and maintainability
 * Features: AI-powered insights, Data legends, Performance indicators
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, Sparkles, TrendingUp, TrendingDown, 
  AlertCircle, Info, Target, Award, Zap,
  Eye, EyeOff, Lightbulb, Star
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🧠 AI Insights Generator
 */
const useAIInsights = (data, selectedMetrics, statistics) => {
  return useMemo(() => {
    if (!data.length || !selectedMetrics.length || !statistics.trends) {
      return [];
    }

    const insights = [];

    // Trend Analysis Insights
    selectedMetrics.forEach(metric => {
      const trend = statistics.trends[metric] || 0;
      const growth = statistics.growth[metric] || 0;
      
      if (Math.abs(trend) > 20) {
        insights.push({
          type: trend > 0 ? 'positive' : 'negative',
          category: 'trend',
          metric,
          title: trend > 0 ? 'Strong Growth Detected' : 'Decline Alert',
          description: `${metric} has ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(trend).toFixed(1)}% over the period`,
          confidence: Math.min(Math.abs(trend) / 50 * 100, 100),
          actionable: true,
          priority: Math.abs(trend) > 50 ? 'high' : 'medium'
        });
      }

      if (Math.abs(growth) > 10) {
        insights.push({
          type: growth > 0 ? 'positive' : 'warning',
          category: 'growth',
          metric,
          title: 'Recent Change Detected',
          description: `Recent ${growth > 0 ? 'increase' : 'decrease'} of ${Math.abs(growth).toFixed(1)}% in ${metric}`,
          confidence: Math.min(Math.abs(growth) / 30 * 100, 100),
          actionable: true,
          priority: 'medium'
        });
      }
    });

    // Performance Insights
    if (statistics.performance) {
      selectedMetrics.forEach(metric => {
        const consistency = statistics.performance.consistency[metric] || 0;
        const efficiency = statistics.performance.efficiency[metric] || 0;

        if (consistency > 50) {
          insights.push({
            type: 'warning',
            category: 'volatility',
            metric,
            title: 'High Volatility Detected',
            description: `${metric} shows high volatility (${consistency.toFixed(1)}% variation)`,
            confidence: Math.min(consistency / 80 * 100, 100),
            actionable: true,
            priority: 'medium'
          });
        }

        if (efficiency < 30) {
          insights.push({
            type: 'negative',
            category: 'efficiency',
            metric,
            title: 'Low Efficiency Warning',
            description: `${metric} shows low positive frequency (${efficiency.toFixed(1)}%)`,
            confidence: Math.min((100 - efficiency) / 70 * 100, 100),
            actionable: true,
            priority: 'high'
          });
        }
      });
    }

    // Comparative Insights
    if (selectedMetrics.includes('income') && selectedMetrics.includes('expenses')) {
      const incomeTotal = statistics.totals.income || 0;
      const expensesTotal = statistics.totals.expenses || 0;
      const ratio = incomeTotal > 0 ? expensesTotal / incomeTotal : 0;

      if (ratio > 0.9) {
        insights.push({
          type: 'warning',
          category: 'ratio',
          title: 'High Expense Ratio',
          description: `Expenses are ${(ratio * 100).toFixed(1)}% of income - consider budget optimization`,
          confidence: 90,
          actionable: true,
          priority: 'high'
        });
      } else if (ratio < 0.5) {
        insights.push({
          type: 'positive',
          category: 'ratio',
          title: 'Excellent Savings Rate',
          description: `Strong financial position with ${((1 - ratio) * 100).toFixed(1)}% savings rate`,
          confidence: 85,
          actionable: false,
          priority: 'low'
        });
      }
    }

    // Sort by priority and confidence
    return insights
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, 5); // Limit to top 5 insights
  }, [data, selectedMetrics, statistics]);
};

/**
 * 💡 Insight Card
 */
const InsightCard = ({ 
  insight, 
  onDismiss,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-5 h-5" />;
      case 'negative': return <TrendingDown className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'negative': return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return { text: t('insights.priority.high'), variant: 'destructive' };
      case 'medium': return { text: t('insights.priority.medium'), variant: 'warning' };
      case 'low': return { text: t('insights.priority.low'), variant: 'secondary' };
      default: return { text: t('insights.priority.info'), variant: 'outline' };
    }
  };

  const priorityBadge = getPriorityBadge(insight.priority);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "border rounded-lg p-4 transition-all hover:shadow-sm",
        getInsightColor(insight.type),
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={cn("mt-0.5", getIconColor(insight.type))}>
            {getInsightIcon(insight.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {insight.title}
              </h4>
              <Badge variant={priorityBadge.variant} size="xs">
                {priorityBadge.text}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {insight.description}
            </p>
            
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {t('insights.confidence')}: {insight.confidence.toFixed(0)}%
              </span>
              {insight.metric && (
                <span>
                  {t('insights.metric')}: {insight.metric}
                </span>
              )}
              {insight.actionable && (
                <Badge variant="outline" size="xs">
                  {t('insights.actionable')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={() => onDismiss(insight)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 🔍 Data Legend
 */
const DataLegend = ({ 
  selectedMetrics, 
  colors, 
  showPredictions = false,
  dataPoints = 0,
  predictionPoints = 0,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          {selectedMetrics.map(metric => (
            <div key={metric} className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[metric] }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {t(`metrics.${metric}`)}
              </span>
            </div>
          ))}

          {showPredictions && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
              <span className="text-gray-600 dark:text-gray-400">
                {t('charts.insights.predicted')}
              </span>
            </div>
          )}
        </div>

        <div className="text-gray-500 dark:text-gray-400">
          {t('charts.dataPoints', { count: dataPoints })}
          {showPredictions && predictionPoints > 0 && 
            ` + ${predictionPoints} ${t('charts.predictions')}`
          }
        </div>
      </div>
    </Card>
  );
};

/**
 * 🧠 AI Insights Panel
 */
const AIInsightsPanel = ({ 
  data, 
  selectedMetrics, 
  statistics,
  showAIInsights = true,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');
  const insights = useAIInsights(data, selectedMetrics, statistics);

  if (!showAIInsights || !insights.length) {
    return null;
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('insights.title')}
        </h3>
        <Badge variant="outline" size="sm">
          {t('insights.aiPowered')}
        </Badge>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <InsightCard
            key={index}
            insight={insight}
          />
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-8">
          <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('insights.noInsights')}
          </p>
        </div>
      )}
    </Card>
  );
};

export default AIInsightsPanel;
export { InsightCard, DataLegend, useAIInsights }; 