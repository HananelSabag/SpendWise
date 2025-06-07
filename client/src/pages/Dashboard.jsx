/**
 * FINAL OPTIMIZED Dashboard Component
 * 
 * COMPLETED CONVERSION TO NEW HOOKS:
 * ✅ All components now use hooks directly instead of props
 * ✅ Single source of truth with proper cache invalidation
 * ✅ Removed unnecessary prop drilling
 * ✅ Optimized performance with memoization
 * ✅ Proper error handling and loading states
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDate } from '../context/DateContext';
// ✅ REMOVED: TransactionProvider - no longer needed with new hooks
import { useDashboard } from '../hooks/useDashboard';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Plus,
  MoreHorizontal,
  Check
} from 'lucide-react';
import { debounce, numbers } from '../utils/helpers';

// ✅ NEW: All components now use hooks directly - no props needed
import BalancePanel from '../components/features/dashboard/BalancePanel';
import RecentTransactions from '../components/features/dashboard/RecentTransactions';
import AddTransactions from '../components/features/transactions/AddTransactions';
import StatsChart from '../components/features/dashboard/StatsChart';
import QuickActionsBar from '../components/features/dashboard/QuickActionsBar';

// UI Components
import { Card, Badge, LoadingSpinner, Button, Modal } from '../components/ui';
import { Link } from 'react-router-dom';

// ✅ NEW: Memoized components with hooks - no props needed
const MemoizedBalancePanel = React.memo(BalancePanel);
MemoizedBalancePanel.displayName = 'MemoizedBalancePanel';

const MemoizedRecentTransactions = React.memo(RecentTransactions);
MemoizedRecentTransactions.displayName = 'MemoizedRecentTransactions';

const MemoizedStatsChart = React.memo(StatsChart);
MemoizedStatsChart.displayName = 'MemoizedStatsChart';

const MemoizedQuickActionsBar = React.memo(QuickActionsBar);
MemoizedQuickActionsBar.displayName = 'MemoizedQuickActionsBar';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const welcomeVariants = {
  initial: { opacity: 0, scale: 0.95, height: 0 },
  animate: { 
    opacity: 1, 
    scale: 1,
    height: "auto",
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      height: { duration: 0.6, ease: "easeOut" }
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.5, ease: "easeInOut" }
  }
};

const compactWelcomeVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { selectedDate } = useDate();
  
  // ✅ DASHBOARD HOOK: Single source of truth for dashboard data
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError,
    refresh: refreshDashboard,
    isFetching
  } = useDashboard();
  
  // ✅ DEBUG: Improved debugging with localStorage control
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugQueries = isDevelopment && localStorage.getItem('debug_queries') === 'true';
  
  // ✅ PERFORMANCE: Debounced debug logging
  const debouncedDebugLog = useMemo(
    () => debounce((data, loading) => {
      if (debugQueries) {
        console.log('📊 [DASHBOARD] Hook-based Data Update:', {
          hasData: !!data,
          isLoading: loading,
          isFetching,
          timestamp: new Date().toISOString(),
          components: ['BalancePanel', 'RecentTransactions', 'StatsChart', 'QuickActionsBar'],
          dataFlow: 'All components use hooks directly - no props'
        });
      }
    }, 1000),
    [debugQueries, isFetching]
  );
  
  useEffect(() => {
    debouncedDebugLog(dashboardData, isDashboardLoading);
  }, [dashboardData, isDashboardLoading, debouncedDebugLog]);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [showAddTransactions, setShowAddTransactions] = useState(false);
  
  const isRTL = language === 'he';
  const dashboardId = useRef(`dashboard-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // ✅ PERFORMANCE: Faster initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  // ✅ PERFORMANCE: More responsive banner timing
  useEffect(() => {
    if (!loading && !isDashboardLoading && !isFetching) {
      const timer = setTimeout(() => {
        setShowWelcomeBanner(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, isDashboardLoading, isFetching]);
  
  // ✅ MEMOIZATION: Enhanced greeting calculation
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user?.username || '';
    
    const greetings = {
      morning: `${t('dashboard.greeting.morning')}, ${name}! ☀️`,
      afternoon: `${t('dashboard.greeting.afternoon')}, ${name}! 🌤️`,
      evening: `${t('dashboard.greeting.evening')}, ${name}! 🌆`,
      night: `${t('dashboard.greeting.night')}, ${name}! 🌙`
    };
    
    if (hour < 12) return greetings.morning;
    if (hour < 17) return greetings.afternoon;
    if (hour < 21) return greetings.evening;
    return greetings.night;
  }, [user?.username, t]);
  
  // ✅ STATS: Optimized calculation using dashboard hook data
  const dashboardStats = useMemo(() => {
    if (!dashboardData || isDashboardLoading) {
      return {
        dailyAverage: 0,
        monthlyGoal: 0,
        recurringActive: 0,
        savedThisMonth: 0,
        loading: isDashboardLoading || isFetching,
        totalTransactions: 0,
        weeklyTrend: 'neutral',
        monthlyIncome: 0,
        monthlyExpenses: 0
      };
    }

    try {
      const monthly = dashboardData.balances?.monthly || {};
      const daily = dashboardData.balances?.daily || {};
      const weekly = dashboardData.balances?.weekly || {};
      const recurring = dashboardData.recurringInfo || {};
      const recentTransactions = dashboardData.recentTransactions || [];
      
      const monthlyExpenses = Math.abs(parseFloat(monthly.expenses) || 0);
      const monthlyIncome = Math.abs(parseFloat(monthly.income) || 0);
      const dailyBalance = parseFloat(daily.balance) || 0;
      const weeklyBalance = parseFloat(weekly.balance) || 0;
      
      const realDailyAverage = monthlyExpenses > 0 ? Math.round(monthlyExpenses / 30) : 0;
      const totalMonthlyActivity = monthlyIncome + monthlyExpenses;
      const savingsPercentage = totalMonthlyActivity > 0 
        ? Math.round((monthlyIncome / totalMonthlyActivity) * 100)
        : 0;
      const recurringCount = (parseInt(recurring.income_count) || 0) + (parseInt(recurring.expense_count) || 0);
      const actualSavings = Math.max(0, parseFloat(monthly.balance) || 0);
      
      return {
        dailyAverage: realDailyAverage,
        monthlyGoal: Math.min(100, savingsPercentage),
        recurringActive: recurringCount,
        savedThisMonth: actualSavings,
        loading: false,
        totalTransactions: recentTransactions.length,
        weeklyTrend: weeklyBalance > dailyBalance ? 'up' : weeklyBalance < dailyBalance ? 'down' : 'neutral',
        monthlyIncome,
        monthlyExpenses
      };
    } catch (error) {
      console.warn('Error calculating dashboard stats:', error);
      return {
        dailyAverage: 0,
        monthlyGoal: 0,
        recurringActive: 0,
        savedThisMonth: 0,
        loading: false,
        totalTransactions: 0,
        weeklyTrend: 'neutral',
        monthlyIncome: 0,
        monthlyExpenses: 0
      };
    }
  }, [dashboardData, isDashboardLoading, isFetching]);

  // Error handling
  const handleRetry = useCallback(() => {
    if (refreshDashboard) {
      refreshDashboard();
    } else {
      window.location.reload();
    }
  }, [refreshDashboard]);
  
  // Loading state
  if (loading || isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </div>
    );
  }
  
  // Error state
  if (dashboardError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('dashboard.balance.error')}</p>
          <Button onClick={handleRetry} variant="outline">
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-component="Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Welcome Banner */}
          <AnimatePresence mode="wait">
            {showWelcomeBanner ? (
              <WelcomeBanner 
                key="full-welcome"
                user={user}
                greeting={greeting}
                selectedDate={selectedDate}
                language={language}
                isRTL={isRTL}
                variants={welcomeVariants}
              />
            ) : (
              <CompactWelcome 
                key="compact-welcome"
                user={user}
                greeting={greeting}
                language={language}
                variants={compactWelcomeVariants}
              />
            )}
          </AnimatePresence>

          {/* Main Content - ALL COMPONENTS NOW USE HOOKS DIRECTLY */}
          <div className="space-y-6">
            {/* ✅ BALANCE PANEL: Uses useDashboard hook directly */}
            <motion.div variants={itemVariants} className="relative">
              {!showWelcomeBanner && (
                <motion.div
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute -inset-4 bg-gradient-to-r from-primary-500/5 to-purple-500/5 rounded-2xl blur-xl"
                />
              )}
              <div className="relative">
                <MemoizedBalancePanel />
              </div>
            </motion.div>

            {/* ✅ QUICK ACTIONS BAR: Uses useTransactions hook directly */}
            <motion.div variants={itemVariants}>
              <MemoizedQuickActionsBar />
            </motion.div>

            {/* ✅ STATS CHART: Uses useDashboard + useTransactions hooks directly */}
            <motion.div variants={itemVariants}>
              <MemoizedStatsChart className="lg:col-span-2" />
            </motion.div>

            {/* ✅ RECENT TRANSACTIONS: Uses useDashboard hook directly */}
            <motion.div variants={itemVariants}>
              <MemoizedRecentTransactions />
            </motion.div>

            {/* Enhanced Tips Section */}
            <motion.div variants={itemVariants}>
              <TipsSection t={t} />
            </motion.div>
          </div>

          {/* Stats Cards - Uses calculated stats from dashboard hook */}
          <motion.div variants={itemVariants}>
            <StatsCards stats={dashboardStats} t={t} />
          </motion.div>
        </motion.div>

        {/* ✅ FLOATING ACTION BUTTON: Opens AddTransactions (new component) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
          className="fixed left-6 bottom-6 z-50"
        >
          <motion.button
            onClick={() => setShowAddTransactions(true)}
            className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-3xl group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={t('actions.quickAdd')}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            
            {/* Plus Icon */}
            <motion.div
              className="relative z-10"
              animate={{ rotate: [0, 0, 180, 180, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Plus className="w-8 h-8" />
            </motion.div>
            
            {/* Ripple Effect */}
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75"></div>
            
            {/* Glow Effect */}
            <div className="absolute -inset-2 bg-primary-500/20 rounded-full blur-lg group-hover:bg-primary-400/30 transition-all duration-300"></div>
          </motion.button>
          
          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="absolute left-20 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            {t('actions.quickAdd')}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-full w-0 h-0 border-t-4 border-b-4 border-transparent border-r-4 border-r-gray-900"></div>
          </motion.div>
        </motion.div>

        {/* ✅ ADD TRANSACTIONS MODAL: Uses new AddTransactions component with hooks */}
        <AnimatePresence>
          {showAddTransactions && (
            <Modal
              isOpen={showAddTransactions}
              onClose={() => setShowAddTransactions(false)}
              size="large"
              className="max-w-4xl"
              hideHeader={true}
            >
              <AddTransactions 
                onClose={() => setShowAddTransactions(false)}
                context="dashboard"
              />
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Extracted Welcome Banner Component
const WelcomeBanner = React.memo(({ user, greeting, selectedDate, language, variants }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="relative overflow-hidden mb-6"
  >
    <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 border-0 text-white p-6 sm:p-8 shadow-xl">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -right-4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden ring-2 ring-white/30">
                {user?.preferences?.profilePicture ? (
                  <img 
                    src={user.preferences.profilePicture} 
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
                <span dir="ltr">SpendWise</span> - {greeting}
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
              </h1>
              <p className="text-white/90 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {(() => {
                  const date = selectedDate || new Date();
                  const formatOptions = language === 'he' 
                    ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                    : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                  return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', formatOptions);
                })()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Badge variant="default" className="bg-white/20 text-white border-white/30 px-4 py-2">
              <Activity className="w-4 h-4 mr-2" />
              Active
            </Badge>
            <Badge variant="default" className="bg-primary-700/50 text-white border-white/30 px-4 py-2">
              <Calendar className="w-4 h-4 mr-2" />
              {(() => {
                const today = new Date();
                return today.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short' });
              })()}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  </motion.div>
));

// Extracted Compact Welcome Component
const CompactWelcome = React.memo(({ user, greeting, language, variants }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    className="mb-6"
  >
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-500/10 to-primary-600/10 dark:from-primary-600/20 dark:to-primary-700/20 rounded-xl border border-primary-200 dark:border-primary-800">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center overflow-hidden">
            {user?.preferences?.profilePicture ? (
              <img 
                src={user.preferences.profilePicture} 
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-white">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>
        
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            <span dir="ltr" className="text-primary-600 dark:text-primary-400">SpendWise</span> - {greeting}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {(() => {
              const today = new Date();
              return today.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              });
            })()}
          </p>
        </div>
      </div>
      
      <Badge variant="default" className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-3 py-1">
        <Activity className="w-3 h-3 mr-1" />
        Active
      </Badge>
    </div>
  </motion.div>
));

// Extracted Tips Section Component
const TipsSection = React.memo(({ t }) => (
  <Card className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 text-white p-6 border-0 shadow-xl relative overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
    </div>
    
    <div className="relative z-10 flex items-center gap-4">
      <div className="p-3 bg-white/20 rounded-xl">
        <Sparkles className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">{t('dashboard.tips.title')}</h3>
        <p className="text-white/90">{t('dashboard.tips.content')}</p>
      </div>
    </div>
  </Card>
));

// Extracted Stats Cards Component
const StatsCards = React.memo(({ stats, t }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
    {/* Daily Average Card */}
    <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border-blue-100 dark:border-blue-900/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.stats.dailyAverage') || 'Daily Average'}
          </p>
          {stats.loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₪{stats.dailyAverage}
              </p>
              {stats.monthlyExpenses > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  מתוך ₪{stats.monthlyExpenses} חודשי
                </p>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </Card>

    {/* Monthly Goal Card */}
    <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900 border-green-100 dark:border-green-900/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.stats.savingsRate') || 'Savings Rate'}
          </p>
          {stats.loading ? (
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.monthlyGoal}%
              </p>
              {stats.monthlyIncome > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  הכנסה vs הוצאות
                </p>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </Card>

    {/* Recurring Count Card */}
    <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 border-purple-100 dark:border-purple-900/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.stats.recurringActive') || 'Active Recurring'}
          </p>
          {stats.loading ? (
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.recurringActive}
              </p>
              {stats.recurringActive > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  עסקאות אוטומטיות
                </p>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </Card>

    {/* Monthly Balance Card */}
    <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-white dark:from-gray-800 dark:to-gray-900 border-emerald-100 dark:border-emerald-900/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('dashboard.stats.monthlyBalance') || 'Monthly Balance'}
          </p>
          {stats.loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <div>
              <p className={`text-2xl font-bold ${
                stats.savedThisMonth >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ₪{Math.abs(stats.savedThisMonth)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.savedThisMonth >= 0 ? 'חיסכון' : 'גירעון'} החודש
              </p>
            </div>
          )}
        </div>
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          {stats.savedThisMonth >= 0 ? (
            <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>
    </Card>
  </div>
));

// Memoized Actions Card Component
const MemoizedActionsCard = React.memo(() => {
  const { t, language } = useLanguage();
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState(null);

  const handleDirectAction = useCallback((actionType) => {
    setSelectedActionType(actionType);
    setShowActionsPanel(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setShowActionsPanel(false);
    setSelectedActionType(null);
  }, []);

  const actionTypes = [
    {
      id: 'expense',
      title: t('actions.oneTimeExpense'),
      subtitle: t('actions.oneTimeExpenseDesc'),
      icon: ArrowDownRight,
      color: 'red',
      actionData: {
        id: 'expense',
        type: 'expense',
        isRecurring: false,
        icon: ArrowDownRight,
        title: t('actions.oneTimeExpense'),
        description: t('actions.oneTimeExpenseDesc'),
        gradient: 'from-red-500 to-red-600',
      }
    },
    {
      id: 'income', 
      title: t('actions.oneTimeIncome'),
      subtitle: t('actions.oneTimeIncomeDesc'),
      icon: ArrowUpRight,
      color: 'green',
      actionData: {
        id: 'income',
        type: 'income',
        isRecurring: false,
        icon: ArrowUpRight,
        title: t('actions.oneTimeIncome'),
        description: t('actions.oneTimeIncomeDesc'),
        gradient: 'from-green-500 to-green-600',
      }
    },
    {
      id: 'recurring-expense',
      title: t('actions.recurringExpense'),
      subtitle: t('actions.recurringExpenseDesc'),
      icon: Clock,
      color: 'blue',
      actionData: {
        id: 'recurring-expense',
        type: 'expense',
        isRecurring: true,
        icon: Clock,
        title: t('actions.recurringExpense'),
        description: t('actions.recurringExpenseDesc'),
        gradient: 'from-blue-500 to-blue-600',
      }
    },
    {
      id: 'recurring-income',
      title: t('actions.recurringIncome'),
      subtitle: t('actions.recurringIncomeDesc'),
      icon: TrendingUp,
      color: 'purple',
      actionData: {
        id: 'recurring-income',
        type: 'income',
        isRecurring: true,
        icon: TrendingUp,
        title: t('actions.recurringIncome'),
        description: t('actions.recurringIncomeDesc'),
        gradient: 'from-purple-500 to-purple-600',
      }
    }
  ];

  return (
    <>
      <Card className="p-8 bg-gradient-to-br from-white via-gray-50 to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-900 border-0 shadow-xl relative overflow-hidden">
        {/* Premium background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-xl animate-pulse"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                {t('actions.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('actions.chooseAction')}
              </p>
            </div>
            
            <Badge variant="primary" className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
              <Sparkles className="w-4 h-4 mr-2" />
              {t('actions.smart')}
            </Badge>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {actionTypes.map((action, index) => (
              <motion.button
                key={action.id}
                onClick={() => handleDirectAction(action.actionData)}
                className="group p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`inline-flex p-4 rounded-xl bg-${action.color}-100 dark:bg-${action.color}-900/30 mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400`} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {action.subtitle}
                </p>
                
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Feature highlights */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              {t('actions.directEntry')}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
              {t('actions.smartDefaults')}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-500"></div>
              {t('actions.fullCustomization')}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-700"></div>
              {t('actions.recurringOptions')}
            </div>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {showActionsPanel && (
          <Modal
            isOpen={showActionsPanel}
            onClose={handleClosePanel}
            size="large"
            className="max-w-4xl"
            hideHeader={true}
          >
            <ActionsPanel 
              onClose={handleClosePanel}
              initialActionType={selectedActionType}
            />
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
});

export default Dashboard;