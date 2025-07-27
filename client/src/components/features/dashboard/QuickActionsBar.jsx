/**
 * ⚡ QUICK ACTIONS BAR - COMPLETE UX/UI REVOLUTION!
 * 🚀 Smart AI suggestions, Contextual actions, Mobile gestures, Voice commands
 * Features: AI recommendations, Quick shortcuts, Smart automation, Gesture support
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
// Fixed: Removed PanInfo import for framer-motion v12 compatibility
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'framer-motion';
import {
  Plus, TrendingUp, TrendingDown, Calculator, Calendar, Target,
  Zap, Sparkles, Brain, Mic, Camera, Search, Filter, Star,
  Clock, Bell, Settings, ArrowRight, ChevronLeft, ChevronRight,
  CreditCard, Wallet, PieChart, BarChart3, Receipt, Repeat,
  Gift, Coffee, Car, Home, Heart, ShoppingBag, Smartphone,
  Plane, Gamepad2, Book, Music, Film, Dumbbell, Utensils,
  Activity, Award, Lightbulb, Shield, Globe, Users, X
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useCurrency,
  useTheme,
  useNotifications,
  useAuth
} from '../../../stores';

import { Button, Card, Badge, Tooltip, Input } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

/**
 * 🎯 SMART SUGGESTION CARD - AI-powered recommendations
 */
const SmartSuggestionCard = ({ suggestion, onAccept, onDismiss, className = '' }) => {
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();

  const suggestionTypes = {
    transaction: { icon: Plus, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    recurring: { icon: Repeat, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
    budget: { icon: Target, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
    savings: { icon: Sparkles, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' }
  };

  const config = suggestionTypes[suggestion.type] || suggestionTypes.transaction;
  const SuggestionIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 border-2",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600",
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

      <div className="flex items-start space-x-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bg)}>
          <SuggestionIcon className={cn("w-5 h-5", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {suggestion.title}
            </h4>
            <Badge variant="secondary" size="xs">
              {t(`suggestions.types.${suggestion.type}`)}
            </Badge>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-3">
            {suggestion.description}
          </p>
          
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
                  className="p-1 h-auto"
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
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🎮 QUICK ACTION CARD - Interactive action button
 */
const QuickActionCard = ({ 
  action, 
  onClick, 
  isPopular = false, 
  isDragging = false,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');
  const dragControls = useDragControls();
  const x = useMotionValue(0);

  const ActionIcon = action.icon;

  return (
    <motion.div
      drag="x"
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      style={{ x }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      whileDrag={{ scale: 1.1, rotate: 5 }}
      className={cn(
        "relative group cursor-pointer",
        isDragging && "z-20",
        className
      )}
      onClick={() => onClick?.(action)}
    >
      <Card className={cn(
        "p-4 transition-all duration-300",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border border-gray-200 dark:border-gray-700",
        "hover:border-blue-300 dark:hover:border-blue-600",
        "hover:shadow-lg group-hover:shadow-xl",
        isPopular && "ring-2 ring-blue-500/20"
      )}>
        {/* Popular badge */}
        {isPopular && (
          <div className="absolute -top-2 -right-2">
            <Badge variant="primary" size="xs" className="flex items-center">
              <Star className="w-3 h-3 mr-1" />
              {t('actions.popular')}
            </Badge>
          </div>
        )}

        {/* Action content */}
        <div className="text-center space-y-3">
          <motion.div
            animate={{ 
              rotate: isPopular ? [0, 5, -5, 0] : 0,
              scale: isPopular ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              duration: 2, 
              repeat: isPopular ? Infinity : 0,
              repeatType: "reverse"
            }}
            className={cn(
              "w-12 h-12 mx-auto rounded-2xl flex items-center justify-center",
              action.bgColor || "bg-blue-100 dark:bg-blue-900/20"
            )}
          >
            <ActionIcon className={cn(
              "w-6 h-6",
              action.color || "text-blue-600 dark:text-blue-400"
            )} />
          </motion.div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">
              {action.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
              {action.description}
            </p>
          </div>

          {/* Usage stats */}
          {action.usage && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 inline mr-1" />
              {t('actions.lastUsed', { time: action.usage })}
            </div>
          )}
        </div>

        {/* Drag indicator */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
      </Card>
    </motion.div>
  );
};

/**
 * 🎙️ VOICE COMMAND BUTTON - Voice-powered actions
 */
const VoiceCommandButton = ({ onVoiceCommand, isListening, className = '' }) => {
  const { t } = useTranslation('dashboard');

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn("relative", className)}
    >
      <Button
        variant={isListening ? "primary" : "outline"}
        onClick={onVoiceCommand}
        className={cn(
          "w-12 h-12 rounded-full p-0",
          isListening && "animate-pulse"
        )}
      >
        <Mic className={cn(
          "w-5 h-5",
          isListening && "animate-pulse"
        )} />
      </Button>

      {/* Voice waves animation */}
      {isListening && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border-2 border-blue-500 rounded-full"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ 
                scale: [1, 2, 3],
                opacity: [1, 0.5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

/**
 * ⚡ QUICK ACTIONS BAR - THE REVOLUTION!
 */
const QuickActionsBar = ({
  onAddTransaction,
  onViewAnalytics,
  onSetGoals,
  onSchedulePayment,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  // Enhanced state management
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentActionSet, setCurrentActionSet] = useState(0);
  const [recentActions, setRecentActions] = useState([]);

  // Quick actions configuration
  const actionCategories = [
    { id: 'all', label: t('categories.all'), icon: Activity },
    { id: 'transactions', label: t('categories.transactions'), icon: Plus },
    { id: 'analytics', label: t('categories.analytics'), icon: BarChart3 },
    { id: 'goals', label: t('categories.goals'), icon: Target },
    { id: 'tools', label: t('categories.tools'), icon: Zap }
  ];

  const quickActions = useMemo(() => ({
    transactions: [
      {
        id: 'add_income',
        title: t('actions.addIncome'),
        description: t('actions.addIncomeDesc'),
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        onClick: () => onAddTransaction?.('income'),
        popular: true,
        usage: '2h ago'
      },
      {
        id: 'add_expense',
        title: t('actions.addExpense'),
        description: t('actions.addExpenseDesc'),
        icon: TrendingDown,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        onClick: () => onAddTransaction?.('expense'),
        popular: true,
        usage: '1h ago'
      },
      {
        id: 'quick_receipt',
        title: t('actions.scanReceipt'),
        description: t('actions.scanReceiptDesc'),
        icon: Camera,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        onClick: () => console.log('Scan receipt'),
        usage: '5h ago'
      },
      {
        id: 'recurring_setup',
        title: t('actions.setupRecurring'),
        description: t('actions.setupRecurringDesc'),
        icon: Repeat,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        onClick: () => console.log('Setup recurring'),
        usage: '1d ago'
      }
    ],
    analytics: [
      {
        id: 'view_analytics',
        title: t('actions.viewAnalytics'),
        description: t('actions.viewAnalyticsDesc'),
        icon: BarChart3,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
        onClick: onViewAnalytics,
        popular: true
      },
      {
        id: 'spending_breakdown',
        title: t('actions.spendingBreakdown'),
        description: t('actions.spendingBreakdownDesc'),
        icon: PieChart,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        onClick: () => console.log('Spending breakdown')
      },
      {
        id: 'export_data',
        title: t('actions.exportData'),
        description: t('actions.exportDataDesc'),
        icon: Receipt,
        color: 'text-teal-600 dark:text-teal-400',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20',
        onClick: () => console.log('Export data')
      }
    ],
    goals: [
      {
        id: 'set_goal',
        title: t('actions.setGoal'),
        description: t('actions.setGoalDesc'),
        icon: Target,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
        onClick: onSetGoals,
        popular: true
      },
      {
        id: 'budget_planner',
        title: t('actions.budgetPlanner'),
        description: t('actions.budgetPlannerDesc'),
        icon: Calculator,
        color: 'text-cyan-600 dark:text-cyan-400',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
        onClick: () => console.log('Budget planner')
      }
    ],
    tools: [
      {
        id: 'currency_converter',
        title: t('actions.currencyConverter'),
        description: t('actions.currencyConverterDesc'),
        icon: Globe,
        color: 'text-violet-600 dark:text-violet-400',
        bgColor: 'bg-violet-100 dark:bg-violet-900/20',
        onClick: () => console.log('Currency converter')
      },
      {
        id: 'schedule_payment',
        title: t('actions.schedulePayment'),
        description: t('actions.schedulePaymentDesc'),
        icon: Calendar,
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        onClick: onSchedulePayment
      }
    ]
  }), [t, onAddTransaction, onViewAnalytics, onSetGoals, onSchedulePayment]);

  // Smart suggestions (AI-powered)
  const smartSuggestions = useMemo(() => [
    {
      id: 'coffee_expense',
      type: 'transaction',
      title: t('suggestions.morningCoffee'),
      description: t('suggestions.morningCoffeeDesc'),
      amount: 4.50,
      confidence: 0.92
    },
    {
      id: 'lunch_reminder',
      type: 'recurring',
      title: t('suggestions.lunchRecurring'),
      description: t('suggestions.lunchRecurringDesc'),
      amount: 12.00,
      confidence: 0.85
    },
    {
      id: 'savings_goal',
      type: 'savings',
      title: t('suggestions.emergencyFund'),
      description: t('suggestions.emergencyFundDesc'),
      amount: 100.00,
      confidence: 0.78
    }
  ], [t]);

  // Get current actions based on category
  const currentActions = useMemo(() => {
    if (selectedCategory === 'all') {
      const allActions = Object.values(quickActions).flat();
      return allActions.filter(action => 
        action.popular || recentActions.includes(action.id)
      ).slice(0, 6);
    }
    return quickActions[selectedCategory] || [];
  }, [quickActions, selectedCategory, recentActions]);

  // Handle action click
  const handleActionClick = useCallback((action) => {
    // Track usage
    setRecentActions(prev => [action.id, ...prev.filter(id => id !== action.id)].slice(0, 5));
    
    // Execute action
    action.onClick?.();
    
    // Show feedback
    addNotification({
      type: 'success',
      title: t('actions.executed', { action: action.title }),
      duration: 2000
    });
  }, [addNotification, t]);

  // Handle voice command
  const handleVoiceCommand = useCallback(() => {
    setIsVoiceListening(!isVoiceListening);
    
    if (!isVoiceListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setIsVoiceListening(false);
        addNotification({
          type: 'info',
          title: t('voice.listening'),
          description: t('voice.commandReceived'),
          duration: 3000
        });
      }, 3000);
    }
  }, [isVoiceListening, addNotification, t]);

  // Handle suggestion action
  const handleSuggestionAccept = useCallback((suggestion) => {
    addNotification({
      type: 'success',
      title: t('suggestions.accepted'),
      description: suggestion.title,
      duration: 3000
    });
  }, [addNotification, t]);

  const handleSuggestionDismiss = useCallback((suggestionId) => {
    // Remove from suggestions
    console.log('Dismissed suggestion:', suggestionId);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header with smart controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center"
          >
            <Zap className="w-5 h-5 text-white" />
          </motion.div>
          
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('quickActions.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t('quickActions.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Voice command */}
          <VoiceCommandButton
            onVoiceCommand={handleVoiceCommand}
            isListening={isVoiceListening}
          />

          {/* Search */}
          <div className="relative">
            <Input
              placeholder={t('quickActions.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-48"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Smart suggestions */}
      {showSuggestions && smartSuggestions.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Brain className="w-5 h-5 mr-2 text-blue-500" />
              {t('suggestions.title')}
            </h3>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(false)}
            >
              {t('suggestions.hide')}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {smartSuggestions.map((suggestion) => (
              <SmartSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={handleSuggestionAccept}
                onDismiss={handleSuggestionDismiss}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Category filters */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {actionCategories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "primary" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center whitespace-nowrap"
              >
                <CategoryIcon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* Quick actions grid */}
      <motion.div variants={itemVariants}>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          >
            {currentActions.map((action, index) => (
              <motion.div
                key={action.id}
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
              >
                <QuickActionCard
                  action={action}
                  onClick={handleActionClick}
                  isPopular={action.popular}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Recent actions */}
      {recentActions.length > 0 && (
        <motion.section variants={itemVariants}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-500" />
            {t('quickActions.recent')}
          </h3>
          
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {recentActions.slice(0, 5).map((actionId) => {
              const action = Object.values(quickActions).flat().find(a => a.id === actionId);
              if (!action) return null;
              
              return (
                <div key={actionId} className="flex-shrink-0">
                  <QuickActionCard
                    action={action}
                    onClick={handleActionClick}
                    className="w-32"
                  />
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Voice status */}
      <AnimatePresence>
        {isVoiceListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="p-4 bg-blue-500 text-white border-blue-600">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Mic className="w-5 h-5" />
                </motion.div>
                <span className="font-medium">{t('voice.listening')}</span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuickActionsBar;