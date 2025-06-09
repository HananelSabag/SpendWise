// client/src/pages/Dashboard.jsx - COMPACT VERSION
/**
 * COMPACT Dashboard - Smaller components, better organization
 * ✅ Reduced component sizes
 * ✅ Better space utilization  
 * ✅ More content visible at once
 * ✅ Same beautiful design, just compact
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDate } from '../context/DateContext';
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

// Components
import BalancePanel from '../components/features/dashboard/BalancePanel';
import RecentTransactions from '../components/features/dashboard/RecentTransactions';
import AddTransactions from '../components/features/transactions/AddTransactions';
import StatsChart from '../components/features/dashboard/StatsChart';
import QuickActionsBar from '../components/features/dashboard/QuickActionsBar';
import { Card, Badge, LoadingSpinner, Button, Modal } from '../components/ui';
import { Link } from 'react-router-dom';

// ✅ COMPACT: Memoized components with reduced sizes
const MemoizedBalancePanel = React.memo(BalancePanel);
MemoizedBalancePanel.displayName = 'MemoizedBalancePanel';

const MemoizedRecentTransactions = React.memo(RecentTransactions);
MemoizedRecentTransactions.displayName = 'MemoizedRecentTransactions';

const MemoizedStatsChart = React.memo(StatsChart);
MemoizedStatsChart.displayName = 'MemoizedStatsChart';

const MemoizedQuickActionsBar = React.memo(QuickActionsBar);
MemoizedQuickActionsBar.displayName = 'MemoizedQuickActionsBar';

// ✅ COMPACT: Animation variants with faster timings
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Faster
      delayChildren: 0.1 // Reduced delay
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 }, // Reduced movement
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 150, // Snappier
      damping: 20
    }
  }
};

// ✅ COMPACT: Smaller welcome banner variants
const welcomeVariants = {
  initial: { opacity: 0, scale: 0.97, height: 0 },
  animate: { 
    opacity: 1, 
    scale: 1,
    height: "auto",
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 25,
      height: { duration: 0.4, ease: "easeOut" }
    }
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.3, ease: "easeInOut" }
  }
};

const compactWelcomeVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30
    }
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { selectedDate } = useDate();
  
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError,
    refresh: refreshDashboard,
    isFetching
  } = useDashboard();
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugQueries = isDevelopment && localStorage.getItem('debug_queries') === 'true';
  
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
  
  // ✅ COMPACT: Faster initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200); // Reduced from 300ms
    return () => clearTimeout(timer);
  }, []);
  
  // ✅ COMPACT: Faster banner timing
  useEffect(() => {
    if (!loading && !isDashboardLoading && !isFetching) {
      const timer = setTimeout(() => {
        setShowWelcomeBanner(false);
      }, 1000); // Reduced from 1500ms
      return () => clearTimeout(timer);
    }
  }, [loading, isDashboardLoading, isFetching]);
  
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

  const handleRetry = useCallback(() => {
    if (refreshDashboard) {
      refreshDashboard();
    } else {
      window.location.reload();
    }
  }, [refreshDashboard]);
  
  if (loading || isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </div>
    );
  }
  
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
      {/* ✅ COMPACT: Reduced container padding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3" // Reduced from space-y-6
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* ✅ COMPACT: Welcome Banner */}
          <AnimatePresence mode="wait">
            {showWelcomeBanner ? (
              <CompactWelcomeBanner 
                key="full-welcome"
                user={user}
                greeting={greeting}
                selectedDate={selectedDate}
                language={language}
                isRTL={isRTL}
                variants={welcomeVariants}
              />
            ) : (
              <MiniWelcome 
                key="compact-welcome"
                user={user}
                greeting={greeting}
                language={language}
                variants={compactWelcomeVariants}
              />
            )}
          </AnimatePresence>

          {/* ✅ COMPACT: Main Content Grid - Better Organization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
            
            {/* ✅ COMPACT: Left Column - Balance & Actions */}
            <div className="lg:col-span-2 space-y-3">
              
              {/* ✅ COMPACT: Balance Panel - Reduced size */}
              <motion.div variants={itemVariants} className="relative">
                {!showWelcomeBanner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute -inset-2 bg-gradient-to-r from-primary-500/5 to-purple-500/5 rounded-xl blur-lg"
                  />
                )}
                <div className="relative">
                  <MemoizedBalancePanel />
                </div>
              </motion.div>

              {/* ✅ COMPACT: Quick Actions - Smaller */}
              <motion.div variants={itemVariants}>
                <MemoizedQuickActionsBar />
              </motion.div>

              {/* ✅ COMPACT: Stats Chart - Better sized */}
              <motion.div variants={itemVariants}>
                <MemoizedStatsChart />
              </motion.div>
            </div>

            {/* ✅ COMPACT: Right Column - Recent Transactions & Stats */}
            <div className="space-y-3">
              
              {/* ✅ COMPACT: Recent Transactions - Optimized height */}
              <motion.div variants={itemVariants}>
                <MemoizedRecentTransactions />
              </motion.div>

              {/* ✅ COMPACT: Mini Stats Cards */}
              <motion.div variants={itemVariants}>
                <CompactStatsCards stats={dashboardStats} t={t} />
              </motion.div>
            </div>
          </div>

          {/* ✅ COMPACT: Enhanced Tips Section - Smaller */}
          <motion.div variants={itemVariants}>
            <CompactTipsSection t={t} />
          </motion.div>
        </motion.div>

        {/* ✅ COMPACT: Floating Action Button - Smaller */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="fixed left-4 bottom-4 z-50" // Reduced positioning
        >
          <motion.button
            onClick={() => setShowAddTransactions(true)}
            className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={t('actions.quickAdd')}
          >
            <motion.div
              className="relative z-10"
              animate={{ rotate: [0, 0, 90, 90, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-60"></div>
          </motion.button>
        </motion.div>

        {/* Add Transactions Modal */}
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

// ✅ COMPACT: Compact Welcome Banner
const CompactWelcomeBanner = React.memo(({ user, greeting, selectedDate, language, variants }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="relative overflow-hidden mb-3"
  >
    <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 border-0 text-white p-4 shadow-lg"> {/* Reduced padding */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-white/30">
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
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            
            <div>
              <h1 className="text-lg sm:text-xl font-bold mb-1 flex items-center gap-2">
                <span dir="ltr">SpendWise</span> - {greeting}
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </h1>
              <p className="text-white/90 flex items-center gap-2 text-sm">
                <Calendar className="w-3 h-3" />
                {(() => {
                  const date = selectedDate || new Date();
                  const formatOptions = language === 'he' 
                    ? { weekday: 'short', month: 'short', day: 'numeric' }
                    : { weekday: 'short', month: 'short', day: 'numeric' };
                  return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', formatOptions);
                })()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-white/20 text-white border-white/30 px-3 py-1 text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  </motion.div>
));

// ✅ COMPACT: Mini Welcome
const MiniWelcome = React.memo(({ user, greeting, language, variants }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    className="mb-3"
  >
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-500/10 to-primary-600/10 dark:from-primary-600/20 dark:to-primary-700/20 rounded-lg border border-primary-200 dark:border-primary-800">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center overflow-hidden">
            {user?.preferences?.profilePicture ? (
              <img 
                src={user.preferences.profilePicture} 
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-white">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white dark:border-gray-800"></div>
        </div>
        
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
            <span dir="ltr" className="text-primary-600 dark:text-primary-400">SpendWise</span> - {greeting}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {(() => {
              const today = new Date();
              return today.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              });
            })()}
          </p>
        </div>
      </div>
      
      <Badge variant="default" className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-2 py-1 text-xs">
        <Activity className="w-3 h-3 mr-1" />
        Active
      </Badge>
    </div>
  </motion.div>
));

// ✅ COMPACT: Tips Section
const CompactTipsSection = React.memo(({ t }) => (
  <Card className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 text-white p-4 border-0 shadow-lg relative overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full blur-lg animate-pulse delay-1000"></div>
    </div>
    
    <div className="relative z-10 flex items-center gap-3">
      <div className="p-2 bg-white/20 rounded-lg">
        <Sparkles className="w-4 h-4" />
      </div>
      <div>
        <h3 className="font-bold text-base mb-1">{t('dashboard.tips.title')}</h3>
        <p className="text-white/90 text-sm">{t('dashboard.tips.content')}</p>
      </div>
    </div>
  </Card>
));

// ✅ COMPACT: Stats Cards
const CompactStatsCards = React.memo(({ stats, t }) => (
  <div className="grid grid-cols-1 gap-3">
    
    {/* Daily Average Card */}
    <Card className="p-3 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border-blue-100 dark:border-blue-900/30">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('dashboard.stats.dailyAverage') || 'Daily Average'}
          </p>
          {stats.loading ? (
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ₪{stats.dailyAverage}
            </p>
          )}
        </div>
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </Card>

    {/* Monthly Goal Card */}
    <Card className="p-3 bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900 border-green-100 dark:border-green-900/30">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('dashboard.stats.savingsRate') || 'Savings Rate'}
          </p>
          {stats.loading ? (
            <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.monthlyGoal}%
            </p>
          )}
        </div>
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
      </div>
    </Card>

    {/* Recurring Count Card */}
    <Card className="p-3 bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 border-purple-100 dark:border-purple-900/30">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('dashboard.stats.recurringActive') || 'Active Recurring'}
          </p>
          {stats.loading ? (
            <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.recurringActive}
            </p>
          )}
        </div>
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
    </Card>

    {/* Monthly Balance Card */}
    <Card className="p-3 bg-gradient-to-br from-emerald-50 to-white dark:from-gray-800 dark:to-gray-900 border-emerald-100 dark:border-emerald-900/30">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('dashboard.stats.monthlyBalance') || 'Monthly Balance'}
          </p>
          {stats.loading ? (
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
          ) : (
            <p className={`text-lg font-bold ${
              stats.savedThisMonth >= 0 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              ₪{Math.abs(stats.savedThisMonth)}
            </p>
          )}
        </div>
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          {stats.savedThisMonth >= 0 ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>
    </Card>
  </div>
));

export default Dashboard;