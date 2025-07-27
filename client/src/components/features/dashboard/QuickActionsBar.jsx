/**
 * ⚡ QUICK ACTIONS BAR - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Component orchestration, Smart suggestions, Voice commands
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useNotifications
} from '../../../stores';

// ✅ Import extracted components
import QuickActionCard, { ActionGrid } from './actions/QuickActionCard';
import SmartSuggestions from './actions/SmartSuggestions';
import VoiceCommands from './actions/VoiceCommands';
import ActionCategories from './actions/ActionCategories';

import { cn } from '../../../utils/helpers';

/**
 * ⚡ Quick Actions Bar Main Component
 */
const QuickActionsBar = ({
  onAddTransaction,
  onViewAnalytics,
  onSetGoals,
  onSchedulePayment,
  className = ''
}) => {
  // ✅ Zustand stores
  const { t, isRTL } = useTranslation('dashboard');
  const { addNotification } = useNotifications();

  // ✅ State management
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [recentActions, setRecentActions] = useState(['add_transaction', 'view_analytics']);

  // ✅ Mock action data
  const quickActions = useMemo(() => ({
    transactions: [
      {
        id: 'add_transaction',
        title: t('actions.addTransaction'),
        description: t('actions.addTransactionDesc'),
        icon: () => React.createElement(require('lucide-react').Plus, { className: "w-6 h-6" }),
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        onClick: onAddTransaction,
        popular: true,
        usage: '2h ago'
      },
      {
        id: 'quick_expense',
        title: t('actions.quickExpense'),
        description: t('actions.quickExpenseDesc'),
        icon: () => React.createElement(require('lucide-react').Minus, { className: "w-6 h-6" }),
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        onClick: () => console.log('Quick expense'),
        usage: '1h ago'
      }
    ],
    analytics: [
      {
        id: 'view_analytics',
        title: t('actions.viewAnalytics'),
        description: t('actions.viewAnalyticsDesc'),
        icon: () => React.createElement(require('lucide-react').BarChart3, { className: "w-6 h-6" }),
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
        onClick: onViewAnalytics,
        popular: true
      },
      {
        id: 'spending_breakdown',
        title: t('actions.spendingBreakdown'),
        description: t('actions.spendingBreakdownDesc'),
        icon: () => React.createElement(require('lucide-react').PieChart, { className: "w-6 h-6" }),
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        onClick: () => console.log('Spending breakdown')
      }
    ],
    goals: [
      {
        id: 'set_goal',
        title: t('actions.setGoal'),
        description: t('actions.setGoalDesc'),
        icon: () => React.createElement(require('lucide-react').Target, { className: "w-6 h-6" }),
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
        onClick: onSetGoals,
        popular: true
      },
      {
        id: 'budget_planner',
        title: t('actions.budgetPlanner'),
        description: t('actions.budgetPlannerDesc'),
        icon: () => React.createElement(require('lucide-react').Calculator, { className: "w-6 h-6" }),
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
        icon: () => React.createElement(require('lucide-react').Globe, { className: "w-6 h-6" }),
        color: 'text-violet-600 dark:text-violet-400',
        bgColor: 'bg-violet-100 dark:bg-violet-900/20',
        onClick: () => console.log('Currency converter')
      },
      {
        id: 'schedule_payment',
        title: t('actions.schedulePayment'),
        description: t('actions.schedulePaymentDesc'),
        icon: () => React.createElement(require('lucide-react').Calendar, { className: "w-6 h-6" }),
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        onClick: onSchedulePayment
      }
    ]
  }), [t, onAddTransaction, onViewAnalytics, onSetGoals, onSchedulePayment]);

  // ✅ Get current actions based on category and filters
  const currentActions = useMemo(() => {
    let actions = [];
    
    if (selectedCategory === 'all') {
      const allActions = Object.values(quickActions).flat();
      actions = allActions.filter(action => 
        action.popular || recentActions.includes(action.id)
      ).slice(0, 6);
    } else {
      actions = quickActions[selectedCategory] || [];
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      actions = actions.filter(action =>
        action.title.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.popular) {
      actions = actions.filter(action => action.popular);
    }
    if (filters.recent) {
      actions = actions.filter(action => recentActions.includes(action.id));
    }

    return actions;
  }, [quickActions, selectedCategory, recentActions, searchQuery, filters]);

  // ✅ Categories with counts
  const categories = useMemo(() => [
    { id: 'all', label: t('categories.all'), icon: require('lucide-react').Grid },
    { id: 'transactions', label: t('categories.transactions'), icon: require('lucide-react').Plus },
    { id: 'analytics', label: t('categories.analytics'), icon: require('lucide-react').BarChart3 },
    { id: 'goals', label: t('categories.goals'), icon: require('lucide-react').Target },
    { id: 'tools', label: t('categories.tools'), icon: require('lucide-react').Globe }
  ], [t]);

  const actionCounts = useMemo(() => {
    const counts = {};
    Object.entries(quickActions).forEach(([key, actions]) => {
      counts[key] = actions.length;
    });
    counts.all = Object.values(quickActions).flat().length;
    return counts;
  }, [quickActions]);

  // ✅ Handle action click
  const handleActionClick = useCallback((action) => {
    // Track usage
    setRecentActions(prev => [action.id, ...prev.filter(id => id !== action.id)].slice(0, 5));
    
    // Execute action
    action.onClick?.();
    
    // Show feedback
    addNotification({
      type: 'success',
      message: t('actions.executed', { action: action.title }),
      duration: 2000
    });
  }, [addNotification, t]);

  // ✅ Handle voice command
  const handleVoiceCommand = useCallback((command) => {
    console.log('Voice command received:', command);
    
    // Process voice command
    switch (command.type) {
      case 'add_transaction':
        onAddTransaction?.();
        break;
      case 'view_analytics':
        onViewAnalytics?.();
        break;
      default:
        addNotification({
          type: 'info',
          message: t('voice.commandNotRecognized'),
          duration: 3000
        });
    }
  }, [onAddTransaction, onViewAnalytics, addNotification, t]);

  // ✅ Handle smart suggestions
  const handleSuggestionAccept = useCallback((suggestion) => {
    addNotification({
      type: 'success',
      message: t('suggestions.accepted', { title: suggestion.title }),
      duration: 3000
    });
    // TODO: Execute suggestion action
  }, [addNotification, t]);

  const handleSuggestionDismiss = useCallback((suggestionId) => {
    addNotification({
      type: 'info',
      message: t('suggestions.dismissed'),
      duration: 2000
    });
    // TODO: Remove suggestion
  }, [addNotification, t]);

  // ✅ Animation variants
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
      <motion.div variants={itemVariants} className="flex items-center justify-between">
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

        {/* Voice commands */}
        <VoiceCommands
          onCommand={handleVoiceCommand}
          isSupported={true}
        />
      </motion.div>

      {/* Smart suggestions */}
      <motion.div variants={itemVariants}>
        <SmartSuggestions
          onAccept={handleSuggestionAccept}
          onDismiss={handleSuggestionDismiss}
          showConfidence={true}
        />
      </motion.div>

      {/* Categories and search */}
      <motion.div variants={itemVariants}>
        <ActionCategories
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          actionCounts={actionCounts}
        />
      </motion.div>

      {/* Quick actions grid */}
      <motion.div variants={itemVariants}>
        <ActionGrid
          actions={currentActions}
          onActionClick={handleActionClick}
          popularActions={Object.values(quickActions).flat().filter(a => a.popular).map(a => a.id)}
          columns="auto"
        />
      </motion.div>

      {/* Recent actions */}
      {recentActions.length > 0 && (
        <motion.div variants={itemVariants}>
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
                    size="sm"
                    className="w-32"
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QuickActionsBar;