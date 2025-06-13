/**
 * PERFECT Dashboard - Compact Desktop Layout + Fixed Mobile
 * 
 * 💻 DESKTOP: Inspired by compact version - better organization
 * 📱 MOBILE: Fixed QuickActions bug + optimized UX
 * ✅ SMART 3-COLUMN LAYOUT: Balance+Actions left, Transactions+Stats right
 * ✅ COMPACT SIZING: No more grandiose spacing
 * ✅ PERFECT PROPORTIONS: Everything fits naturally
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDate } from '../context/DateContext';
import { useCurrency } from '../context/CurrencyContext';
import { useDashboard } from '../hooks/useDashboard';
import { useTransactionActions } from '../hooks/useTransactionActions';
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
import OnboardingModal from '../components/features/onboarding/OnboardingModal';
import { Card, Badge, LoadingSpinner, Button, Modal } from '../components/ui';
import { Link } from 'react-router-dom';

// Memoized components for performance
const MemoizedBalancePanel = React.memo(BalancePanel);
MemoizedBalancePanel.displayName = 'MemoizedBalancePanel';

const MemoizedRecentTransactions = React.memo(RecentTransactions);
MemoizedRecentTransactions.displayName = 'MemoizedRecentTransactions';

const MemoizedStatsChart = React.memo(StatsChart);
MemoizedStatsChart.displayName = 'MemoizedStatsChart';

const MemoizedQuickActionsBar = React.memo(QuickActionsBar);
MemoizedQuickActionsBar.displayName = 'MemoizedQuickActionsBar';

// COMPACT: Animation variants with faster timings
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
  hidden: { opacity: 0, y: 15 }, // Reduced movement
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200, // Snappier
      damping: 25
    }
  }
};

// COMPACT: Smaller welcome banner variants
const welcomeVariants = {
  initial: { opacity: 0, scale: 0.98, height: 0 },
  animate: { 
    opacity: 1, 
    scale: 1,
    height: "auto",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      height: { duration: 0.3, ease: "easeOut" }
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.2, ease: "easeInOut" }
  }
};

const compactWelcomeVariants = {
  initial: { opacity: 0, y: -8 },
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
        console.log('🎯 [DASHBOARD] Compact Layout:', {
          hasData: !!data,
          isLoading: loading,
          isFetching,
          timestamp: new Date().toISOString(),
          layout: 'Compact 3-column desktop + optimized mobile'
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const isRTL = language === 'he';
  const dashboardId = useRef(`dashboard-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // COMPACT: Faster initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 150); // Reduced from 300ms
    return () => clearTimeout(timer);
  }, []);
  
  // COMPACT: Faster banner timing
  useEffect(() => {
    if (!loading && !isDashboardLoading && !isFetching) {
      const timer = setTimeout(() => {
        setShowWelcomeBanner(false);
      }, 800); // Reduced from 1500ms
      return () => clearTimeout(timer);
    }
  }, [loading, isDashboardLoading, isFetching]);

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !loading && !isDashboardLoading) {
      // Show onboarding if user hasn't completed it
      if (!user.onboarding_completed) {
        setShowOnboarding(true);
      }
    }
  }, [user, loading, isDashboardLoading]);
  
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

  // COMPACT: Dashboard stats calculation
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </div>
    );
  }
  
  if (dashboardError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
      {/* COMPACT: Reduced container padding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3" // Reduced from space-y-6
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* COMPACT: Welcome Banner */}
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
                t={t}
              />
            ) : (
              <MiniWelcome 
                key="compact-welcome"
                user={user}
                greeting={greeting}
                language={language}
                variants={compactWelcomeVariants}
                t={t}
              />
            )}
          </AnimatePresence>

          {/* 📱 MOBILE: Stack everything vertically */}
          <div className="lg:hidden space-y-3">
            {/* Mobile Balance Panel - Now handled internally */}
            <motion.div variants={itemVariants}>
              <MemoizedBalancePanel />
            </motion.div>

            {/* Mobile Quick Actions */}
            <motion.div variants={itemVariants}>
              <MemoizedQuickActionsBar />
            </motion.div>

            {/* Mobile Transactions - COMPACT HEIGHT */}
            <motion.div variants={itemVariants}>
              <div className="h-[280px]">
                <MemoizedRecentTransactions limit={4} />
              </div>
            </motion.div>

            {/* Mobile Stats */}
            <motion.div variants={itemVariants}>
              <div className="h-[250px]">
                <MemoizedStatsChart />
              </div>
            </motion.div>
          </div>

          {/* 💻 DESKTOP: OPTIMIZED COMPACT LAYOUT */}
          <div className="hidden lg:block">
            
            {/* ROW 1: Balance Panel - Full Width */}
            <motion.div variants={itemVariants} className="mb-4">
              <div className="relative">
                {!showWelcomeBanner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute -inset-1 bg-gradient-to-r from-primary-500/5 to-purple-500/5 rounded-xl blur-sm"
                  />
                )}
                <div className="relative">
                  <MemoizedBalancePanel />
                </div>
              </div>
            </motion.div>

            {/* ROW 2: Quick Actions + Recent Transactions - COMPACT EQUAL HEIGHT */}
            <motion.div variants={itemVariants} className="mb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Quick Actions - Left side - COMPACT HEIGHT */}
                <div className="relative h-[320px]">
                  <MemoizedQuickActionsBar />
                </div>

                {/* Recent Transactions - Right side - SAME COMPACT HEIGHT */}
                <div className="relative h-[320px]">
                  <MemoizedRecentTransactions />
                </div>
              </div>
            </motion.div>

            {/* ROW 3: Stats Chart - Full Width */}
            <motion.div variants={itemVariants} className="mb-4">
              <div className="relative">
                <MemoizedStatsChart />
              </div>
            </motion.div>

            {/* ROW 4: Compact Tips Section */}
            <motion.div variants={itemVariants}>
              <CompactTipsSection t={t} />
            </motion.div>
          </div>
        </motion.div>

        {/* COMPACT: Floating Action Button - Left positioned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="fixed left-4 bottom-4 z-50" // Left positioned like compact version
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

        {/* Modal */}
        <AnimatePresence>
          {showAddTransactions && (
            <Modal
              isOpen={showAddTransactions}
              onClose={() => setShowAddTransactions(false)}
              size="large"
              className="max-w-4xl mx-2 sm:mx-4 lg:mx-auto"
              hideHeader={true}
            >
              <AddTransactions 
                onClose={() => setShowAddTransactions(false)}
                context="dashboard"
              />
            </Modal>
          )}
        </AnimatePresence>

        {/* Onboarding Modal */}
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            setShowOnboarding(false);
            // Refresh dashboard to get updated user data
            refreshDashboard();
          }}
        />
      </div>
    </div>
  );
};

// COMPACT: Compact Welcome Banner
const CompactWelcomeBanner = React.memo(({ user, greeting, selectedDate, language, variants, t }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="relative overflow-hidden mb-3"
  >
    <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 border-0 text-white p-3 sm:p-4 shadow-lg">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -right-4 w-20 h-20 lg:w-32 lg:h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 lg:w-32 lg:h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10">
        {/* Mobile-first responsive layout */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          
          {/* Main content - Avatar + Text */}
          <div className="flex items-start sm:items-center gap-3">
            {/* Avatar section */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-white/30">
                {user?.preferences?.profilePicture ? (
                  <img 
                    src={user.preferences.profilePicture} 
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm sm:text-base lg:text-lg font-bold text-white">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            
            {/* Text section - Mobile optimized */}
            <div className="flex-1 min-w-0">
              {/* Title - Mobile: Stack SpendWise and greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mb-1">
                <h1 className="text-sm sm:text-base lg:text-xl font-bold text-white">
                  <span dir="ltr" className="text-white">SpendWise</span>
                </h1>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base lg:text-xl font-bold text-white">
                    {greeting}
                  </span>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  </motion.div>
                </div>
              </div>
              
              {/* Date section */}
              <p className="text-white/90 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {(() => {
                    const date = selectedDate || new Date();
                    const formatOptions = language === 'he' 
                      ? { weekday: 'short', month: 'short', day: 'numeric' }
                      : { weekday: 'short', month: 'short', day: 'numeric' };
                    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', formatOptions);
                  })()}
                </span>
              </p>
            </div>
          </div>
          
          {/* Badge section - Mobile: Right aligned, smaller */}
          <div className="flex justify-end sm:justify-start">
            <Badge variant="default" className="bg-white/20 text-white border-white/30 px-2 sm:px-3 py-1 text-xs flex-shrink-0">
              <Activity className="w-3 h-3 mr-1" />
              <span>Active</span>
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  </motion.div>
));

// COMPACT: Mini Welcome
const MiniWelcome = React.memo(({ user, greeting, language, variants, t }) => (
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

// COMPACT: Tips Section
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

export default Dashboard;