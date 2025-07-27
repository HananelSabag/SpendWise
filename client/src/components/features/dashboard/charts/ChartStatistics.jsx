/**
 * 📈 CHART STATISTICS - Statistics Calculation & Display
 * Extracted from StatsChart.jsx for better performance and maintainability
 * Features: Statistics calculations, Trends analysis, Performance metrics
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Calculator, Target, 
  Award, Activity, DollarSign, Percent 
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useCurrency } from '../../../../stores';

import { Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 📊 Statistics Calculator
 */
const useStatistics = (data, selectedMetrics) => {
  return useMemo(() => {
    if (!data.length || !selectedMetrics.length) {
      return {
        totals: {},
        averages: {},
        trends: {},
        growth: {},
        performance: {}
      };
    }

    const actualData = data.filter(item => !item.isPrediction);
    
    // Calculate totals
    const totals = actualData.reduce((acc, item) => {
      selectedMetrics.forEach(metric => {
        acc[metric] = (acc[metric] || 0) + (item[metric] || 0);
      });
      return acc;
    }, {});

    // Calculate averages
    const averages = {};
    selectedMetrics.forEach(metric => {
      averages[metric] = totals[metric] / actualData.length;
    });

    // Calculate trends (percentage change from first to last)
    const trends = {};
    selectedMetrics.forEach(metric => {
      if (actualData.length > 1) {
        const first = actualData[0][metric] || 0;
        const last = actualData[actualData.length - 1][metric] || 0;
        trends[metric] = first !== 0 ? ((last - first) / first) * 100 : 0;
      } else {
        trends[metric] = 0;
      }
    });

    // Calculate growth rates (month-over-month)
    const growth = {};
    selectedMetrics.forEach(metric => {
      if (actualData.length >= 2) {
        const recent = actualData.slice(-2);
        const previous = recent[0][metric] || 0;
        const current = recent[1][metric] || 0;
        growth[metric] = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
      } else {
        growth[metric] = 0;
      }
    });

    // Calculate performance metrics
    const performance = {
      volatility: {},
      consistency: {},
      efficiency: {}
    };

    selectedMetrics.forEach(metric => {
      const values = actualData.map(item => item[metric] || 0);
      const mean = averages[metric];
      
      // Volatility (standard deviation)
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      performance.volatility[metric] = Math.sqrt(variance);
      
      // Consistency (coefficient of variation)
      performance.consistency[metric] = mean !== 0 ? (performance.volatility[metric] / mean) * 100 : 0;
      
      // Efficiency (how often positive vs negative)
      const positiveCount = values.filter(val => val > 0).length;
      performance.efficiency[metric] = (positiveCount / values.length) * 100;
    });

    return {
      totals,
      averages,
      trends,
      growth,
      performance
    };
  }, [data, selectedMetrics]);
};

/**
 * 📈 Statistics Card
 */
const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  format = 'currency',
  className = '' 
}) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation('dashboard');

  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return val.toLocaleString();
      default:
        return val;
    }
  };

  const getTrendColor = (change) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getTrendIcon = (change) => {
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  const TrendIcon = getTrendIcon(change);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("", className)}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              color === 'blue' && "bg-blue-100 dark:bg-blue-900/30",
              color === 'green' && "bg-green-100 dark:bg-green-900/30",
              color === 'red' && "bg-red-100 dark:bg-red-900/30",
              color === 'purple' && "bg-purple-100 dark:bg-purple-900/30"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                color === 'blue' && "text-blue-600 dark:text-blue-400",
                color === 'green' && "text-green-600 dark:text-green-400",
                color === 'red' && "text-red-600 dark:text-red-400",
                color === 'purple' && "text-purple-600 dark:text-purple-400"
              )} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {title}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatValue(value)}
              </p>
            </div>
          </div>
          
          {typeof change === 'number' && (
            <div className={cn("flex items-center space-x-1", getTrendColor(change))}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * 📊 Statistics Grid
 */
const StatisticsGrid = ({ 
  data, 
  selectedMetrics, 
  showPerformance = true,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');
  const statistics = useStatistics(data, selectedMetrics);

  const statCards = useMemo(() => {
    const cards = [];

    // Total values
    selectedMetrics.forEach(metric => {
      cards.push({
        id: `total-${metric}`,
        title: t(`statistics.total.${metric}`),
        value: statistics.totals[metric] || 0,
        change: statistics.trends[metric],
        icon: DollarSign,
        color: metric === 'income' ? 'green' : metric === 'expenses' ? 'red' : 'blue',
        format: 'currency'
      });
    });

    // Average values
    selectedMetrics.forEach(metric => {
      cards.push({
        id: `avg-${metric}`,
        title: t(`statistics.average.${metric}`),
        value: statistics.averages[metric] || 0,
        change: statistics.growth[metric],
        icon: Calculator,
        color: 'purple',
        format: 'currency'
      });
    });

    // Performance metrics (if enabled)
    if (showPerformance && selectedMetrics.length > 0) {
      const mainMetric = selectedMetrics[0];
      
      cards.push({
        id: 'volatility',
        title: t('statistics.volatility'),
        value: statistics.performance.volatility[mainMetric] || 0,
        icon: Activity,
        color: 'blue',
        format: 'currency'
      });

      cards.push({
        id: 'consistency',
        title: t('statistics.consistency'),
        value: statistics.performance.consistency[mainMetric] || 0,
        icon: Target,
        color: 'green',
        format: 'percentage'
      });

      cards.push({
        id: 'efficiency',
        title: t('statistics.efficiency'),
        value: statistics.performance.efficiency[mainMetric] || 0,
        icon: Award,
        color: 'purple',
        format: 'percentage'
      });
    }

    return cards;
  }, [statistics, selectedMetrics, showPerformance, t]);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
      {statCards.map((card) => (
        <StatCard
          key={card.id}
          title={card.title}
          value={card.value}
          change={card.change}
          icon={card.icon}
          color={card.color}
          format={card.format}
        />
      ))}
    </div>
  );
};

/**
 * 📈 Performance Summary
 */
const PerformanceSummary = ({ 
  data, 
  selectedMetrics, 
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');
  const statistics = useStatistics(data, selectedMetrics);

  const getPerformanceScore = () => {
    if (!selectedMetrics.length) return 0;
    
    const scores = selectedMetrics.map(metric => {
      const trend = statistics.trends[metric] || 0;
      const efficiency = statistics.performance.efficiency[metric] || 0;
      const consistency = 100 - (statistics.performance.consistency[metric] || 0);
      
      // Weight the factors
      return (trend * 0.4) + (efficiency * 0.4) + (consistency * 0.2);
    });

    return scores.reduce((acc, score) => acc + score, 0) / scores.length;
  };

  const performanceScore = getPerformanceScore();
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 70) return { text: t('performance.excellent'), variant: 'success' };
    if (score >= 40) return { text: t('performance.good'), variant: 'warning' };
    return { text: t('performance.needsImprovement'), variant: 'destructive' };
  };

  const badge = getScoreBadge(performanceScore);

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('statistics.performanceScore')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('statistics.performanceDesc')}
          </p>
        </div>
        
        <div className="text-right">
          <div className={cn("text-3xl font-bold", getScoreColor(performanceScore))}>
            {performanceScore.toFixed(0)}
          </div>
          <Badge variant={badge.variant} size="sm">
            {badge.text}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default StatisticsGrid;
export { StatCard, PerformanceSummary, useStatistics }; 