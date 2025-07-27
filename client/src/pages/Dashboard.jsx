/**
 * 📊 DASHBOARD PAGE - CLEAN & INTEGRATED VERSION!
 * 🚀 Mobile-first, Real data, Component integration, Performance optimized
 * Features: Our new dashboard components integrated, No mock data, Working modals
 * @version 2.0.0 - CLEAN REFACTOR
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, BarChart3, Target, Lightbulb, Grid, 
  RefreshCw, Settings, Bell, TrendingUp
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useAuth, 
  useTranslation, 
  useNotifications
} from '../stores';

// ✅ Import our new dashboard components
import BalancePanel from '../components/features/dashboard/BalancePanel';
import QuickActionsBar from '../components/features/dashboard/QuickActionsBar';
import RecentTransactions from '../components/features/dashboard/RecentTransactions';
import StatsChart from '../components/features/dashboard/StatsChart';

// ✅ Import modal components
import AddTransactions from '../components/features/transactions/AddTransactions';

// ✅ Import UI components
import { Button, Card, LoadingSpinner } from '../components/ui';
import { useDashboard } from '../hooks/useDashboard';
import { cn } from '../utils/helpers';

/**
 * 📊 Dashboard Main Component
 */
const Dashboard = () => {
  // ✅ Zustand stores
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('dashboard');
  const { addNotification } = useNotifications();

  // ✅ State management
  const [viewMode, setViewMode] = useState('overview'); // overview, analytics, goals, insights
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Fetch dashboard data using our hook
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useDashboard();

  // ✅ Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      addNotification({
        type: 'success',
        message: t('dashboard.refreshed'),
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('dashboard.refreshError'),
        duration: 4000
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, addNotification, t]);

  // ✅ Handle view mode navigation
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // ✅ Handle add transaction
  const handleAddTransaction = useCallback(() => {
    setShowAddTransaction(true);
  }, []);

  const handleCloseAddTransaction = useCallback(() => {
    setShowAddTransaction(false);
  }, []);

  const handleTransactionSuccess = useCallback(() => {
    setShowAddTransaction(false);
    handleRefresh();
    addNotification({
      type: 'success',
      message: t('transaction.addedSuccessfully'),
      duration: 3000
    });
  }, [handleRefresh, addNotification, t]);

  // ✅ View mode options
  const viewModeOptions = [
    { id: 'overview', label: t('dashboard.overview'), icon: Grid },
    { id: 'analytics', label: t('dashboard.analytics'), icon: BarChart3 },
    { id: 'goals', label: t('dashboard.goals'), icon: Target },
    { id: 'insights', label: t('dashboard.insights'), icon: Lightbulb }
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

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-auto">
          <div className="text-red-500 mb-4">
            <TrendingUp className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.loadError')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('dashboard.loadErrorDescription')}
          </p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            {t('dashboard.retry')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('dashboard.title')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.welcome', { name: user?.firstName || user?.email })}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* View mode tabs */}
              <div className="hidden md:flex space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {viewModeOptions.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Button
                      key={mode.id}
                      variant={viewMode === mode.id ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => handleViewModeChange(mode.id)}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{mode.label}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Actions */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddTransaction}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('dashboard.addTransaction')}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {viewMode === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Balance Panel */}
              <motion.div variants={itemVariants}>
                <BalancePanel data={dashboardData} />
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={itemVariants}>
                <QuickActionsBar
                  onAddTransaction={handleAddTransaction}
                  onViewAnalytics={() => handleViewModeChange('analytics')}
                  onSetGoals={() => handleViewModeChange('goals')}
                />
              </motion.div>

              {/* Stats & Transactions Grid */}
              <div className="grid gap-8 lg:grid-cols-2">
                <motion.div variants={itemVariants}>
                  <StatsChart 
                    data={dashboardData?.chartData || []}
                    onRefresh={handleRefresh}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <RecentTransactions
                    transactions={dashboardData?.transactions || []}
                    onRefresh={handleRefresh}
                    isLoading={isRefreshing}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {viewMode === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Full-width stats chart for analytics */}
              <motion.div variants={itemVariants}>
                <StatsChart 
                  data={dashboardData?.chartData || []}
                  onRefresh={handleRefresh}
                  showAdvanced={true}
                />
              </motion.div>

              {/* Analytics-focused balance panel */}
              <motion.div variants={itemVariants}>
                <BalancePanel 
                  data={dashboardData}
                  viewMode="insights"
                />
              </motion.div>
            </motion.div>
          )}

          {viewMode === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Goals-focused balance panel */}
              <motion.div variants={itemVariants}>
                <BalancePanel 
                  data={dashboardData}
                  viewMode="health"
                />
              </motion.div>

              {/* Quick actions for goals */}
              <motion.div variants={itemVariants}>
                <QuickActionsBar
                  onAddTransaction={handleAddTransaction}
                  onSetGoals={() => console.log('Set goals')}
                />
              </motion.div>
            </motion.div>
          )}

          {viewMode === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Insights-focused view */}
              <motion.div variants={itemVariants}>
                <BalancePanel 
                  data={dashboardData}
                  viewMode="insights"
                />
              </motion.div>

              {/* Insights chart */}
              <motion.div variants={itemVariants}>
                <StatsChart 
                  data={dashboardData?.chartData || []}
                  onRefresh={handleRefresh}
                  showInsights={true}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile view mode selector */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <Card className="p-2">
          <div className="grid grid-cols-4 gap-1">
            {viewModeOptions.map((mode) => {
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.id}
                  variant={viewMode === mode.id ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange(mode.id)}
                  className="flex flex-col items-center space-y-1 p-3"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{mode.label}</span>
                </Button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactions
        isOpen={showAddTransaction}
        onClose={handleCloseAddTransaction}
        onSuccess={handleTransactionSuccess}
      />
    </motion.div>
  );
};

export default Dashboard;