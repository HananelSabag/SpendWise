/**
 * 📊 FINANCIAL INSIGHTS - AI-Powered Insights Component
 * Extracted from BalancePanel.jsx for better performance and maintainability
 * Features: Spending insights, AI recommendations, Smart analysis, Mobile-first
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, TrendingUp, TrendingDown, Info, Sparkles,
  Target, Clock, Zap, Brain, Star, ArrowRight, Plus,
  Lightbulb, Flag, Award, Shield
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useCurrency,
  useTheme
} from '../../../../stores';

import { Button, Card, Badge, Tooltip } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 📊 Spending Insight Card
 */
const SpendingInsightCard = ({ 
  insight, 
  onAction,
  onDismiss,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();

  const insightTypes = {
    warning: { 
      icon: AlertCircle, 
      color: 'text-orange-600 dark:text-orange-400', 
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-700'
    },
    positive: { 
      icon: TrendingUp, 
      color: 'text-green-600 dark:text-green-400', 
      bg: 'bg-green-100 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700'
    },
    neutral: { 
      icon: Info, 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700'
    },
    success: { 
      icon: Star, 
      color: 'text-purple-600 dark:text-purple-400', 
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-700'
    }
  };

  const config = insightTypes[insight.type] || insightTypes.neutral;
  const InsightIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-4 rounded-xl border",
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          config.bg
        )}>
          <InsightIcon className={cn("w-4 h-4", config.color)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                {insight.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                {insight.description}
              </p>
            </div>

            {/* Dismiss button */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(insight.id)}
                className="p-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="text-xs">×</span>
              </Button>
            )}
          </div>
          
          {/* Amount */}
          {insight.amount && (
            <div className="mt-2">
              <span className={cn("text-sm font-bold", config.color)}>
                {formatCurrency(insight.amount)}
              </span>
            </div>
          )}

          {/* Action button */}
          {insight.action && onAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(insight)}
              className="mt-3 text-xs"
            >
              {insight.action}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🎯 AI Recommendation Card
 */
const AIRecommendationCard = ({ 
  recommendation, 
  onAccept,
  onDecline,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();

  const priorityColors = {
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-green-600 dark:text-green-400'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20",
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {recommendation.title}
            </h4>
            
            <Badge 
              variant="outline" 
              size="xs"
              className={priorityColors[recommendation.priority]}
            >
              {t(`priority.${recommendation.priority}`)}
            </Badge>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-3">
            {recommendation.description}
          </p>

          {/* Potential savings */}
          {recommendation.potentialSavings && (
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {t('ai.potentialSavings')}: {formatCurrency(recommendation.potentialSavings)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAccept?.(recommendation)}
              className="text-xs"
            >
              {t('ai.implement')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDecline?.(recommendation)}
              className="text-xs"
            >
              {t('ai.notNow')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 📊 Financial Insights Main Component
 */
const FinancialInsights = ({
  insights = [],
  recommendations = [],
  onInsightAction,
  onInsightDismiss,
  onRecommendationAccept,
  onRecommendationDecline,
  onGenerateInsights,
  isGenerating = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');

  // Generate mock insights if none provided
  const enhancedInsights = useMemo(() => {
    if (insights.length > 0) return insights;
    
    return [
      {
        id: 'savings-growth',
        type: 'positive',
        title: t('insights.savingsGrowth'),
        description: t('insights.savingsGrowthDesc'),
        amount: 150,
        action: t('insights.viewDetails')
      },
      {
        id: 'spending-up',
        type: 'warning',
        title: t('insights.spendingUp'),
        description: t('insights.spendingUpDesc'),
        amount: 89,
        action: t('insights.analyze')
      },
      {
        id: 'goal-progress',
        type: 'success',
        title: t('insights.goalProgress'),
        description: t('insights.goalProgressDesc'),
        action: t('insights.viewGoals')
      }
    ];
  }, [insights, t]);

  // Generate mock recommendations if none provided
  const enhancedRecommendations = useMemo(() => {
    if (recommendations.length > 0) return recommendations;
    
    return [
      {
        id: 'subscription-optimization',
        title: t('ai.subscriptionOptimization'),
        description: t('ai.subscriptionOptimizationDesc'),
        priority: 'high',
        potentialSavings: 45
      },
      {
        id: 'investment-opportunity',
        title: t('ai.investmentOpportunity'),
        description: t('ai.investmentOpportunityDesc'),
        priority: 'medium',
        potentialSavings: 120
      }
    ];
  }, [recommendations, t]);

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
            {t('insights.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('insights.subtitle')}
          </p>
        </div>

        {onGenerateInsights && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateInsights}
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            <Sparkles className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            <span>{t('insights.generateNew')}</span>
          </Button>
        )}
      </div>

      {/* Insights */}
      {enhancedInsights.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            {t('insights.currentInsights')}
          </h4>
          
          <div className="space-y-3">
            <AnimatePresence>
              {enhancedInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <SpendingInsightCard
                    insight={insight}
                    onAction={onInsightAction}
                    onDismiss={onInsightDismiss}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* AI Recommendations */}
      {enhancedRecommendations.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-500" />
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              {t('ai.recommendations')}
            </h4>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {enhancedRecommendations.map((recommendation, index) => (
                <motion.div
                  key={recommendation.id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <AIRecommendationCard
                    recommendation={recommendation}
                    onAccept={onRecommendationAccept}
                    onDecline={onRecommendationDecline}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {enhancedInsights.length === 0 && enhancedRecommendations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-4">
            <Lightbulb className="w-8 h-8 text-blue-500" />
          </div>
          
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('insights.noInsights')}
          </h4>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('insights.noInsightsDescription')}
          </p>
          
          {onGenerateInsights && (
            <Button onClick={onGenerateInsights} disabled={isGenerating}>
              <Sparkles className="w-4 h-4 mr-2" />
              {t('insights.generateFirst')}
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default FinancialInsights;
export { SpendingInsightCard, AIRecommendationCard }; 