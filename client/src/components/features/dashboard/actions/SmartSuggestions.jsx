/**
 * 🎯 SMART SUGGESTIONS - AI-Powered Recommendations Component
 * Extracted from QuickActionsBar.jsx for better performance and maintainability
 * Features: AI suggestions, Accept/dismiss, Confidence scoring, Mobile-first
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Repeat, Target, Sparkles, Brain, X, 
  TrendingUp, AlertCircle, Lightbulb, Star,
  CheckCircle, Clock
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
 * 🎯 Smart Suggestion Card
 */
const SmartSuggestionCard = ({ 
  suggestion, 
  onAccept, 
  onDismiss,
  showConfidence = false,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();

  const suggestionTypes = {
    transaction: { 
      icon: Plus, 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700'
    },
    recurring: { 
      icon: Repeat, 
      color: 'text-purple-600 dark:text-purple-400', 
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-700'
    },
    budget: { 
      icon: Target, 
      color: 'text-green-600 dark:text-green-400', 
      bg: 'bg-green-100 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700'
    },
    savings: { 
      icon: Sparkles, 
      color: 'text-yellow-600 dark:text-yellow-400', 
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-700'
    },
    insight: { 
      icon: Lightbulb, 
      color: 'text-orange-600 dark:text-orange-400', 
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-700'
    }
  };

  const config = suggestionTypes[suggestion.type] || suggestionTypes.transaction;
  const SuggestionIcon = config.icon;

  // Confidence level styling
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.9) return t('confidence.high');
    if (confidence >= 0.7) return t('confidence.medium');
    return t('confidence.low');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 border-2 group",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        config.border,
        "hover:border-blue-300 dark:hover:border-blue-600",
        "cursor-pointer transition-all",
        className
      )}
      onClick={() => onAccept?.(suggestion)}
    >
      {/* AI sparkle animation */}
      <div className="absolute top-2 right-2">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <Brain className="w-4 h-4 text-blue-500 opacity-60" />
        </motion.div>
      </div>

      {/* Confidence badge */}
      {showConfidence && suggestion.confidence && (
        <div className="absolute top-2 left-2">
          <Tooltip content={t('confidence.explanation', { value: (suggestion.confidence * 100).toFixed(0) })}>
            <Badge 
              size="xs"
              className={cn(
                "text-xs",
                getConfidenceColor(suggestion.confidence)
              )}
            >
              {getConfidenceLabel(suggestion.confidence)}
            </Badge>
          </Tooltip>
        </div>
      )}

      <div className="flex items-start space-x-3 mt-2">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          config.bg
        )}>
          <SuggestionIcon className={cn("w-5 h-5", config.color)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {suggestion.title}
            </h4>
            <Badge variant="outline" size="xs">
              {t(`suggestions.types.${suggestion.type}`)}
            </Badge>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-3">
            {suggestion.description}
          </p>
          
          {/* Amount and actions */}
          {suggestion.amount && (
            <div className="flex items-center justify-between">
              <span className={cn("text-sm font-bold", config.color)}>
                {formatCurrency(suggestion.amount)}
              </span>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss?.(suggestion.id);
                  }}
                  className="p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </Button>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept?.(suggestion);
                  }}
                  className="px-3 py-1 text-xs"
                >
                  {t('suggestions.accept')}
                </Button>
              </div>
            </div>
          )}

          {/* Metadata */}
          {suggestion.category && (
            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{t('suggestions.category')}:</span>
              <Badge variant="outline" size="xs">{suggestion.category}</Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🎯 Smart Suggestions Main Component
 */
const SmartSuggestions = ({
  suggestions = [],
  onAccept,
  onDismiss,
  onGenerateNew,
  isGenerating = false,
  showConfidence = false,
  maxSuggestions = 3,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');

  // Default suggestions if none provided
  const defaultSuggestions = useMemo(() => [
    {
      id: 'coffee_expense',
      type: 'transaction',
      title: t('suggestions.morningCoffee'),
      description: t('suggestions.morningCoffeeDesc'),
      amount: 4.50,
      confidence: 0.92,
      category: t('categories.food')
    },
    {
      id: 'lunch_reminder',
      type: 'recurring',
      title: t('suggestions.lunchRecurring'),
      description: t('suggestions.lunchRecurringDesc'),
      amount: 12.00,
      confidence: 0.85,
      category: t('categories.food')
    },
    {
      id: 'savings_goal',
      type: 'savings',
      title: t('suggestions.emergencyFund'),
      description: t('suggestions.emergencyFundDesc'),
      amount: 100.00,
      confidence: 0.78,
      category: t('categories.savings')
    }
  ], [t]);

  const activeSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;
  const displaySuggestions = activeSuggestions.slice(0, maxSuggestions);

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

  if (displaySuggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-4", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('suggestions.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('suggestions.subtitle')}
            </p>
          </div>
        </div>

        {onGenerateNew && (
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateNew}
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            <Sparkles className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            <span>{t('suggestions.generateNew')}</span>
          </Button>
        )}
      </div>

      {/* Suggestions list */}
      <div className="space-y-3">
        <AnimatePresence>
          {displaySuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              variants={itemVariants}
              transition={{ delay: index * 0.1 }}
            >
              <SmartSuggestionCard
                suggestion={suggestion}
                onAccept={onAccept}
                onDismiss={onDismiss}
                showConfidence={showConfidence}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Stats footer */}
      {displaySuggestions.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
        >
          <span>
            {t('suggestions.showing', { 
              count: displaySuggestions.length,
              total: activeSuggestions.length 
            })}
          </span>
          
          {showConfidence && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-3 h-3" />
              <span>
                {t('suggestions.avgConfidence', { 
                  percent: Math.round(
                    displaySuggestions.reduce((acc, s) => acc + (s.confidence || 0), 0) / displaySuggestions.length * 100
                  )
                })}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default SmartSuggestions;
export { SmartSuggestionCard }; 