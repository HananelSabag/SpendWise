/**
 * ❤️ FINANCIAL HEALTH - Health Scoring Component
 * Extracted from BalancePanel.jsx for better performance and maintainability
 * Features: Health scoring, Metrics dashboard, Progress tracking, Mobile-first
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Shield, Target, Activity, TrendingUp, TrendingDown,
  Award, AlertTriangle, CheckCircle, Clock, Zap, Star,
  BarChart3, PieChart, Calendar, DollarSign
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useCurrency,
  useTheme
} from '../../../../stores';

import { Card, Badge, Tooltip, Button } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🎯 Health Score Circle
 */
const HealthScoreCircle = ({ 
  score, 
  size = 'lg',
  showLabel = true,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');
  
  const radius = size === 'lg' ? 45 : size === 'md' ? 35 : 25;
  const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreText = (score) => {
    if (score >= 80) return t('health.excellent');
    if (score >= 60) return t('health.good');
    if (score >= 40) return t('health.fair');
    return t('health.poor');
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress circle */}
          <motion.circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={getScoreColor(score)}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "font-bold",
            size === 'lg' ? "text-2xl" : size === 'md' ? "text-lg" : "text-sm",
            getScoreColor(score)
          )}>
            {score}
          </span>
          {size === 'lg' && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              / 100
            </span>
          )}
        </div>
      </div>
      
      {showLabel && size === 'lg' && (
        <div className="mt-2 text-center">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {getScoreText(score)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('health.overall')}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 📊 Health Metric Card
 */
const HealthMetricCard = ({ 
  metric,
  value,
  target,
  icon: Icon,
  trend,
  color = 'blue',
  className = ''
}) => {
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();

  const percentage = target ? (value / target) * 100 : 0;
  const isGood = percentage >= 80;
  const isFair = percentage >= 60;

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "p-4 rounded-lg border",
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5" />
          <h4 className="font-medium text-sm">{metric}</h4>
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center text-xs",
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
          )}>
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">
            {typeof value === 'number' && value > 1000 ? formatCurrency(value) : value}
          </span>
          
          {target && (
            <Badge 
              variant={isGood ? "success" : isFair ? "warning" : "destructive"}
              size="xs"
            >
              {percentage.toFixed(0)}%
            </Badge>
          )}
        </div>

        {target && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className={cn(
                "h-2 rounded-full",
                isGood ? "bg-green-500" : isFair ? "bg-yellow-500" : "bg-red-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        )}

        {target && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {t('health.target')}: {typeof target === 'number' && target > 1000 ? formatCurrency(target) : target}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * ❤️ Financial Health Main Component
 */
const FinancialHealth = ({
  overallScore = 85,
  metrics = {},
  showDetails = true,
  onViewReport,
  onImproveScore,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();

  // Enhanced metrics with default values
  const enhancedMetrics = useMemo(() => {
    return {
      emergencyFund: {
        value: metrics.emergencyFund || 5500,
        target: 6000,
        percentage: 92,
        icon: Shield,
        color: 'green',
        trend: 5
      },
      debtToIncome: {
        value: metrics.debtToIncome || 28,
        target: 30,
        percentage: 93,
        icon: Activity,
        color: 'blue',
        trend: -2
      },
      savingsRate: {
        value: metrics.savingsRate || 78,
        target: 80,
        percentage: 98,
        icon: Target,
        color: 'purple',
        trend: 12
      },
      investmentGrowth: {
        value: metrics.investmentGrowth || 15.4,
        target: 18,
        percentage: 86,
        icon: TrendingUp,
        color: 'green',
        trend: 8
      },
      creditScore: {
        value: metrics.creditScore || 742,
        target: 800,
        percentage: 93,
        icon: Award,
        color: 'yellow',
        trend: 3
      },
      cashFlow: {
        value: metrics.cashFlow || 1250,
        target: 1500,
        percentage: 83,
        icon: DollarSign,
        color: 'blue',
        trend: 15
      }
    };
  }, [metrics]);

  // Calculate recommendations based on scores
  const recommendations = useMemo(() => {
    const recs = [];
    
    if (enhancedMetrics.emergencyFund.percentage < 90) {
      recs.push({
        id: 'emergency',
        title: t('health.improveEmergency'),
        priority: 'high',
        icon: Shield
      });
    }
    
    if (enhancedMetrics.savingsRate.percentage < 85) {
      recs.push({
        id: 'savings',
        title: t('health.increaseSavings'),
        priority: 'medium',
        icon: Target
      });
    }
    
    return recs;
  }, [enhancedMetrics, t]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('health.financialHealth')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('health.subtitle')}
          </p>
        </div>

        {onViewReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewReport}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t('health.viewReport')}</span>
          </Button>
        )}
      </div>

      {/* Overall score */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Score circle */}
              <div className="flex justify-center md:justify-start">
                <HealthScoreCircle score={overallScore} size="lg" />
              </div>

              {/* Score breakdown */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('health.scoreBreakdown')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('health.scoreDescription')}
                  </p>
                </div>

                {/* Quick metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Heart className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <div className="font-bold text-green-600 dark:text-green-400">{overallScore}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.score')}</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                    <div className="font-bold text-yellow-600 dark:text-yellow-400">A+</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('health.grade')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed metrics */}
      {showDetails && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {Object.entries(enhancedMetrics).map(([key, metric], index) => (
            <motion.div
              key={key}
              variants={itemVariants}
              transition={{ delay: index * 0.1 }}
            >
              <HealthMetricCard
                metric={t(`health.metrics.${key}`)}
                value={metric.value}
                target={metric.target}
                icon={metric.icon}
                trend={metric.trend}
                color={metric.color}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('health.recommendations')}
            </h4>
            
            {onImproveScore && (
              <Button
                variant="primary"
                size="sm"
                onClick={onImproveScore}
                className="flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>{t('health.improveScore')}</span>
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, index) => {
              const Icon = rec.icon;
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <Icon className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {rec.title}
                    </span>
                  </div>
                  <Badge 
                    variant={rec.priority === 'high' ? 'destructive' : 'warning'}
                    size="xs"
                  >
                    {t(`priority.${rec.priority}`)}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default FinancialHealth;
export { HealthScoreCircle, HealthMetricCard }; 