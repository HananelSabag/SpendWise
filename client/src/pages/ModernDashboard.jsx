/**
 * 📊 MODERN DASHBOARD - Revolutionary UX/UI Design
 * Features: Advanced animations, Intelligent layout, Real-time updates,
 * Smart widgets, Beautiful micro-interactions, Mobile-first responsive
 * @version 4.0.0 - REVOLUTIONARY REDESIGN
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  RefreshCw, TrendingUp, BarChart3, Target, Clock, 
  User, Settings, Bell, Search, Plus, Sparkles,
  Calendar, Activity, Zap, Star, Crown, Heart,
  Eye, EyeOff, Filter, Grid, List, Maximize2
} from 'lucide-react';

// ✅ Import components and hooks
import { useTranslation, useNotifications, useAuth, useCurrency } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { useCategory } from '../hooks/useCategory';
import { LoadingSpinner, Button, Card, Avatar, Badge } from '../components/ui';
import { cn } from '../utils/helpers';

// ✅ Import modern components
import ModernBalancePanel from '../components/features/dashboard/ModernBalancePanel';
import ModernQuickActionsBar from '../components/features/dashboard/ModernQuickActionsBar';
import ModernRecentTransactionsWidget from '../components/features/dashboard/ModernRecentTransactionsWidget';

import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton.jsx';

// ✅ Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};



// ✅ Dynamic Tips Panel Component
const DynamicTipsPanel = () => {
  const { t } = useTranslation('dashboard');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // ✅ Expanded tips array with more variety
  const allTips = useMemo(() => [
    { icon: Target, text: t('tips.savingTip'), color: 'text-yellow-600' },
    { icon: BarChart3, text: t('tips.budgetTip'), color: 'text-orange-600' },
    { icon: Calendar, text: t('tips.categoryTip'), color: 'text-red-600' },
    { icon: Heart, text: t('tips.progressTip'), color: 'text-pink-600' },
    { icon: Clock, text: t('tips.recurringTip'), color: 'text-blue-600' },
    { icon: Eye, text: t('tips.reviewTip'), color: 'text-green-600' },
    { icon: TrendingUp, text: t('tips.trendTip'), color: 'text-purple-600' },
    { icon: Zap, text: t('tips.quickTip'), color: 'text-indigo-600' },
    { icon: Crown, text: t('tips.goalTip'), color: 'text-yellow-500' },
    { icon: Activity, text: t('tips.habitTip'), color: 'text-emerald-600' },
    { icon: Star, text: t('tips.rewardTip'), color: 'text-amber-600' },
    { icon: User, text: t('tips.personalTip'), color: 'text-cyan-600' }
  ], [t]);

  // ✅ Get 4 rotating tips based on current index
  const currentTips = useMemo(() => {
    const tips = [];
    for (let i = 0; i < 4; i++) {
      tips.push(allTips[(currentTipIndex + i) % allTips.length]);
    }
    return tips;
  }, [allTips, currentTipIndex]);

  // ✅ Auto-rotate tips every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 4) % allTips.length);
        setIsVisible(true);
      }, 300); // Brief pause for transition effect
    }, 45000); // Change every 45 seconds

    return () => clearInterval(interval);
  }, [allTips.length]);

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
      <Card className="overflow-hidden shadow-2xl bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 border-2 border-yellow-200 dark:border-yellow-800">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('tips.title')}
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                {t('tips.subtitle')}
              </p>
            </div>
            {/* Tips counter */}
            <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
              {Math.floor(currentTipIndex / 4) + 1} / {Math.ceil(allTips.length / 4)}
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTipIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="grid gap-4 md:grid-cols-2"
            >
              {currentTips.map((tip, index) => {
                const Icon = tip.icon;
                return (
                  <motion.div
                    key={`${currentTipIndex}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                    className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors duration-200"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 * index, type: "spring" }}
                    >
                      <Icon className={cn('w-5 h-5 mt-0.5', tip.color)} />
                    </motion.div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{tip.text}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

// ✅ Stats Panel Component
const StatsPanel = ({ dashboardData, formatCurrency, t }) => {
  const stats = useMemo(() => {
    // Extract real data from dashboardData using correct structure
    const totalTransactions = dashboardData?.monthlyStats?.transactionCount || dashboardData?.recentTransactions?.length || 0;
    const monthlyIncome = dashboardData?.monthlyStats?.income || 0;
    const monthlyExpenses = dashboardData?.monthlyStats?.expenses || 0;
    const netBalance = dashboardData?.monthlyStats?.net || (monthlyIncome - monthlyExpenses);
    const avgTransaction = totalTransactions > 0 ? (Math.abs(monthlyExpenses) + Math.abs(monthlyIncome)) / totalTransactions : 0;
    const topCategory = dashboardData?.topCategory?.name || t('common.categoryTypes.food', 'Food');
    
    return [
      {
        title: t('stats.totalTransactions'),
        value: totalTransactions,
        change: totalTransactions > 0 ? `${totalTransactions} this month` : t('common.noData', 'No data'),
        positive: totalTransactions > 0,
        icon: Activity,
        color: 'blue'
      },
      {
        title: t('stats.avgTransaction'),
        value: isNaN(avgTransaction) || avgTransaction === 0 ? t('common.noData', 'No data') : formatCurrency(avgTransaction),
        change: avgTransaction > 0 && !isNaN(avgTransaction) ? 'Per transaction' : t('common.noData', 'No data'),
        positive: avgTransaction > 0 && !isNaN(avgTransaction),
        icon: Target,
        color: 'green'
      },
      {
        title: t('stats.topCategory'),
        value: topCategory,
        change: dashboardData?.topCategory?.percentage ? `${dashboardData.topCategory.percentage}% of expenses` : 'Most used',
        positive: null,
        icon: Crown,
        color: 'purple'
      },
      {
        title: t('stats.monthlyBalance'),
        value: formatCurrency(Math.abs(netBalance)),
        change: netBalance >= 0 ? t('stats.positive', 'Positive') : t('stats.negative', 'Negative'),
        positive: netBalance >= 0,
        icon: TrendingUp,
        color: 'yellow'
      }
    ];
  }, [dashboardData, formatCurrency, t]);

  return (
    <motion.div
      variants={itemVariants}
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            whileHover={{ scale: 1.02, y: -4 }}
            className={cn(
              'relative overflow-hidden rounded-2xl p-3 sm:p-6 border-2 shadow-lg',
              'bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm',
              'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              'transition-all duration-300 cursor-pointer group'
            )}
          >
            {/* Background gradient */}
            <motion.div
              className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity',
                stat.color === 'blue' && 'bg-gradient-to-br from-blue-400 to-blue-600',
                stat.color === 'green' && 'bg-gradient-to-br from-green-400 to-green-600',
                stat.color === 'purple' && 'bg-gradient-to-br from-purple-400 to-purple-600',
                stat.color === 'yellow' && 'bg-gradient-to-br from-yellow-400 to-orange-500'
              )}
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className={cn(
                  'w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-md',
                  stat.color === 'blue' && 'bg-blue-100 text-blue-600',
                  stat.color === 'green' && 'bg-green-100 text-green-600',
                  stat.color === 'purple' && 'bg-purple-100 text-purple-600',
                  stat.color === 'yellow' && 'bg-yellow-100 text-yellow-600'
                )}>
                  <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                
                {stat.positive !== null && (
                  <Badge
                    className={cn(
                      'border-0 text-xs',
                      stat.positive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                  >
                    {stat.change}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

/**
 * 📊 Modern Dashboard Main Component
 */
const ModernDashboard = () => {
  // ✅ ALL HOOKS AT TOP
  const { t, currentLanguage, isRTL } = useTranslation('dashboard');
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { currency, formatCurrency } = useCurrency();
  const { createTransaction } = useTransactionActions('quickActions');
  const { categories, createCategory } = useCategory();
  
  // ✅ Local state hooks
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [compactMode, setCompactMode] = useState(false);
  
  // ✅ Refs
  const dashboardRef = useRef(null);
  
  // ✅ Data fetching hooks
  const { 
    data: dashboardData, 
    isLoading, 
    isError,
    error,
    isEmpty,
    refresh: refreshDashboard 
  } = useDashboard();

  // ✅ Enhanced greeting with animations
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let userName = '';
    
    if (user?.firstName && user?.lastName) {
      userName = `${user.firstName} ${user.lastName}`.trim();
    } else if (user?.first_name && user?.last_name) {
      userName = `${user.first_name} ${user.last_name}`.trim();
    } else if (user?.name) {
      userName = user.name;
    } else if (user?.firstName) {
      userName = user.firstName;
    } else if (user?.first_name) {
      userName = user.first_name;
    } else if (user?.username) {
      userName = user.username;
    } else if (user?.email) {
      userName = user.email.split('@')[0];
    }
    
    let greetingText = '';
    if (hour < 12) {
      greetingText = t('welcome.goodMorning');
    } else if (hour < 17) {
      greetingText = t('welcome.goodAfternoon');
    } else if (hour < 21) {
      greetingText = t('welcome.goodEvening');
    } else {
      greetingText = t('welcome.general');
    }
    
    return greetingText.includes('{{name}}') 
      ? greetingText.replace('{{name}}', userName)
      : `${greetingText} ${userName}!`;
  }, [user, t]);

  // ✅ Enhanced refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Haptic feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    try {
      await refreshDashboard();
      addNotification({
        type: 'success',
        message: t('refreshed'),
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error', 
        message: t('refreshError'),
        duration: 4000
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshDashboard, addNotification, t]);



  // ✅ Loading state with enhanced UX
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6"
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl font-medium text-gray-600 dark:text-gray-400"
          >
            {t('loadingDashboard')}
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '200px' }}
            transition={{ delay: 1, duration: 2 }}
            className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto"
          />
        </motion.div>
      </div>
    );
  }

  // ✅ Enhanced error state
  if (isError && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 text-center max-w-md border-red-200 bg-white/80 backdrop-blur-sm">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <RefreshCw className="w-8 h-8 text-red-600" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('dashboardError')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('dashboardErrorMessage')}
            </p>
            <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
              {t('reloadPage')}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ✅ Main dashboard render
  return (
    <div 
      ref={dashboardRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" 
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Welcome Section - Simple and Clean */}
      <motion.div 
        variants={headerVariants}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <BarChart3 className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                SpendWise
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {greeting}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        {/* Balance Panel - Full Width Hero */}
        <motion.div variants={itemVariants}>
          <ModernBalancePanel className="mb-8" />
        </motion.div>

        {/* Stats Panel */}
        <StatsPanel 
          dashboardData={dashboardData}
          formatCurrency={formatCurrency}
          t={t}
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Quick Actions - Sidebar */}
          <motion.div variants={itemVariants} className="xl:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card className="p-6 shadow-2xl border-2 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <ModernQuickActionsBar />
              </Card>

            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div variants={itemVariants} className="xl:col-span-2 space-y-8">
            {/* Recent Transactions */}
            <ModernRecentTransactionsWidget
              onViewAll={() => window.location.href = '/transactions'}
              onAddTransaction={() => setShowAddTransaction(true)}
              maxItems={6}
            />

            {/* Dynamic Tips Panel - Enhanced */}
            <DynamicTipsPanel />
          </motion.div>
        </div>
      </motion.div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSuccess={async () => {
          try {
            window.dispatchEvent(new CustomEvent('dashboard-refresh-requested'));
          } catch (_) {}
        }}
      />

      {/* Enhanced Floating Action Button */}
      <FloatingAddTransactionButton />
    </div>
  );
};

export default ModernDashboard;
