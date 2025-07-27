/**
 * 💰 BALANCE PANEL - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Component orchestration, View modes, Performance optimized
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, CreditCard, Sparkles, ChevronRight } from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useNotifications
} from '../../../stores';

// ✅ Import extracted components
import BalanceDisplay from './balance/BalanceDisplay';
import AccountsList from './balance/AccountsList';
import FinancialInsights from './balance/FinancialInsights';
import FinancialHealth from './balance/FinancialHealth';

import { Button, Card } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * 💰 Balance Panel Main Component
 */
const BalancePanel = ({
  data = {},
  showDetails = true,
  onToggleDetails,
  className = ''
}) => {
  // ✅ Zustand stores
  const { t, isRTL } = useTranslation('dashboard');
  const { addNotification } = useNotifications();

  // ✅ State management
  const [viewMode, setViewMode] = useState('overview'); // overview, accounts, insights, health
  const [showBalances, setShowBalances] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Mock data enhancement
  const enhancedData = useMemo(() => {
    const accounts = [
      {
        id: 'main',
        name: t('accounts.main'),
        type: 'checking',
        balance: data.totalBalance || 12450.75,
        change: 324.50,
        trend: [12100, 12200, 12150, 12300, 12450.75],
        isFavorite: true,
        lastTransaction: t('account.yesterday')
      },
      {
        id: 'savings',
        name: t('accounts.savings'),
        type: 'savings',
        balance: 8750.25,
        change: 150.00,
        trend: [8600, 8650, 8700, 8725, 8750.25],
        isFavorite: false,
        lastTransaction: t('account.lastWeek')
      },
      {
        id: 'investment',
        name: t('accounts.investment'),
        type: 'investment',
        balance: 15200.00,
        change: -245.80,
        trend: [15400, 15350, 15300, 15250, 15200],
        isFavorite: false,
        lastTransaction: t('account.today')
      }
    ];

    const summary = {
      totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0),
      totalChange: accounts.reduce((sum, acc) => sum + acc.change, 0),
      trendData: [36000, 36200, 36100, 36300, 36400.75],
      income: data.monthlyIncome || 4500,
      expenses: data.monthlyExpenses || 3200,
      savings: data.monthlySavings || 1300,
      savingsRate: ((data.monthlySavings || 1300) / (data.monthlyIncome || 4500)) * 100
    };

    return { accounts, summary };
  }, [data, t]);

  // ✅ Handle balance visibility toggle
  const handleToggleVisibility = useCallback(() => {
    setShowBalances(!showBalances);
    addNotification({
      type: 'info',
      message: showBalances ? t('balance.balancesHidden') : t('balance.balancesShown'),
      duration: 2000
    });
  }, [showBalances, addNotification, t]);

  // ✅ Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      addNotification({
        type: 'success',
        message: t('balance.refreshed'),
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('errors.refreshFailed'),
        duration: 4000
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [addNotification, t]);

  // ✅ Account management
  const handleAccountSelect = useCallback((account) => {
    setSelectedAccount(account);
  }, []);

  const handleAccountEdit = useCallback((account) => {
    addNotification({
      type: 'info',
      message: t('account.editStarted', { name: account.name })
    });
    // TODO: Open account edit modal
  }, [addNotification, t]);

  const handleToggleFavorite = useCallback((accountId) => {
    addNotification({
      type: 'success',
      message: t('account.favoriteToggled')
    });
    // TODO: Update account favorite status
  }, [addNotification, t]);

  const handleAddAccount = useCallback(() => {
    addNotification({
      type: 'info',
      message: t('account.addStarted')
    });
    // TODO: Open add account modal
  }, [addNotification, t]);

  // ✅ Insights management
  const handleInsightAction = useCallback((insight) => {
    addNotification({
      type: 'info',
      message: t('insights.actionStarted', { title: insight.title })
    });
    // TODO: Handle insight action
  }, [addNotification, t]);

  const handleInsightDismiss = useCallback((insightId) => {
    addNotification({
      type: 'success',
      message: t('insights.dismissed')
    });
    // TODO: Dismiss insight
  }, [addNotification, t]);

  const handleGenerateInsights = useCallback(() => {
    addNotification({
      type: 'info',
      message: t('insights.generating')
    });
    // TODO: Generate new insights
  }, [addNotification, t]);

  // ✅ AI recommendations
  const handleRecommendationAccept = useCallback((recommendation) => {
    addNotification({
      type: 'success',
      message: t('ai.recommendationAccepted', { title: recommendation.title })
    });
    // TODO: Implement recommendation
  }, [addNotification, t]);

  const handleRecommendationDecline = useCallback((recommendation) => {
    addNotification({
      type: 'info',
      message: t('ai.recommendationDeclined')
    });
    // TODO: Decline recommendation
  }, [addNotification, t]);

  // ✅ Health management
  const handleViewHealthReport = useCallback(() => {
    addNotification({
      type: 'info',
      message: t('health.reportOpening')
    });
    // TODO: Open health report
  }, [addNotification, t]);

  const handleImproveScore = useCallback(() => {
    addNotification({
      type: 'info',
      message: t('health.improvementStarted')
    });
    // TODO: Open improvement guide
  }, [addNotification, t]);

  // ✅ View mode options
  const viewModeOptions = [
    { id: 'overview', label: t('viewModes.overview'), icon: DollarSign },
    { id: 'accounts', label: t('viewModes.accounts'), icon: CreditCard },
    { id: 'insights', label: t('viewModes.insights'), icon: Sparkles },
    { id: 'health', label: t('viewModes.health'), icon: ChevronRight }
  ];

  // ✅ Animation variants
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header with view mode tabs */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('balance.title')}
            </h2>
            
            <div className="flex items-center space-x-2">
              {onToggleDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleDetails}
                  className="p-2"
                >
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    showDetails && "rotate-90"
                  )} />
                </Button>
              )}
            </div>
          </div>

          {/* View mode tabs */}
          <div className="flex flex-wrap gap-2">
            {viewModeOptions.map((mode) => {
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.id}
                  variant={viewMode === mode.id ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(mode.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </Button>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Main content based on view mode */}
      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <BalanceDisplay
              balance={enhancedData.summary.totalBalance}
              change={enhancedData.summary.totalChange}
              trendData={enhancedData.summary.trendData}
              showBalances={showBalances}
              onToggleVisibility={handleToggleVisibility}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />

            {/* Quick summary stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {showBalances ? `${enhancedData.summary.savingsRate.toFixed(1)}%` : '••%'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t('balance.savingsRate')}
                </div>
              </div>
              
              <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {enhancedData.accounts.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t('balance.accounts')}
                </div>
              </div>
              
              <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  85
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t('health.score')}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {viewMode === 'accounts' && (
          <motion.div
            key="accounts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AccountsList
              accounts={enhancedData.accounts}
              selectedAccount={selectedAccount}
              showBalances={showBalances}
              onAccountSelect={handleAccountSelect}
              onAccountEdit={handleAccountEdit}
              onToggleFavorite={handleToggleFavorite}
              onAddAccount={handleAddAccount}
            />
          </motion.div>
        )}

        {viewMode === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FinancialInsights
              onInsightAction={handleInsightAction}
              onInsightDismiss={handleInsightDismiss}
              onRecommendationAccept={handleRecommendationAccept}
              onRecommendationDecline={handleRecommendationDecline}
              onGenerateInsights={handleGenerateInsights}
            />
          </motion.div>
        )}

        {viewMode === 'health' && (
          <motion.div
            key="health"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FinancialHealth
              overallScore={85}
              showDetails={showDetails}
              onViewReport={handleViewHealthReport}
              onImproveScore={handleImproveScore}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BalancePanel;