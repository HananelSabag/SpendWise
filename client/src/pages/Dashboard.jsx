/**
 * Dashboard - Main Dashboard Page
 * 
 * Features:
 * - Balance overview with time range filters
 * - Recent transactions
 * - Quick actions
 * - Statistics charts
 * - Onboarding flow integration
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
import OnboardingPromptDialog from '../components/features/onboarding/OnboardingPromptDialog';
import { Card, Badge, LoadingSpinner, Button, Modal, DashboardSkeleton, ProgressiveLoader } from '../components/ui';
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25
    }
  }
};

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
        console.log('🎯 [DASHBOARD] New Optimized Layout:', {
          hasData: !!data,
          isLoading: loading,
          isFetching,
          timestamp: new Date().toISOString(),
          layout: 'Unified red-based design - Full width balance, 3-column stats, full width transactions'
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
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  
  const isRTL = language === 'he';
  const dashboardId = useRef(`dashboard-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // Initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);
  
  // Banner timing
  useEffect(() => {
    if (!loading && !isDashboardLoading && !isFetching) {
      const timer = setTimeout(() => {
        setShowWelcomeBanner(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, isDashboardLoading, isFetching]);

  // ✅ IMPROVED: Check if user needs onboarding with better logic
  useEffect(() => {
    if (user && !loading && !isDashboardLoading) {
      // Check if user hasn't completed onboarding
      if (!user.onboarding_completed) {
        // Check if user has started onboarding before
        const hasStartedOnboarding = localStorage.getItem('spendwise-onboarding-progress');
        const hasSkippedOnboarding = localStorage.getItem('spendwise-onboarding-skipped');
        
        if (hasSkippedOnboarding) {
          // User already chose to skip - don't show anything
          return;
        }
        
        if (hasStartedOnboarding) {
          // User started but didn't complete - show prompt dialog
          setShowOnboardingPrompt(true);
        } else {
          // First time user - show full onboarding
          setShowOnboarding(true);
        }
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

  // Dashboard stats calculation
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
  
  // 🚀 PHASE 16: Enhanced loading with progressive dashboard skeleton
  if (loading || isDashboardLoading) {
    return (
      <div className="min-h-screen adaptive-section">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20" />
        
        <div className="relative z-10 adaptive-section">
          <DashboardSkeleton />
        </div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Banner */}
        <AnimatePresence>
          {!loading && !isDashboardLoading && showWelcomeBanner && (
            <motion.div
              variants={welcomeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-6 overflow-hidden"
            >
              <Card 
                variant="gradient" 
                padding="large"
                className="text-center shadow-lg"
              >
                <motion.div variants={compactWelcomeVariants}>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Sparkles className="w-6 h-6" />
                    <h1 className="text-2xl font-bold">
                      {t('dashboard.welcome.title', { name: user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] })}
                    </h1>
                  </div>
                  <p className="text-lg opacity-90">
                    {t('dashboard.welcome.subtitle')}
                  </p>
                </motion.div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading || isDashboardLoading ? (
          <div className="space-y-6">
            <div className="w-full h-48 bg-white dark:bg-gray-800 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-64 bg-white dark:bg-gray-800 rounded-xl animate-pulse"></div>
              <div className="h-64 bg-white dark:bg-gray-800 rounded-xl animate-pulse"></div>
            </div>
            <div className="w-full h-64 bg-white dark:bg-gray-800 rounded-xl animate-pulse"></div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Row 1: Full-width Balance Panel - Most Important */}
            <motion.div variants={itemVariants} className="w-full">
              <MemoizedBalancePanel />
            </motion.div>
            
            {/* Row 2: 3-column layout for desktop, stack for mobile */}
            <motion.div 
              variants={itemVariants} 
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Stats Chart - 2 columns on desktop, show second on mobile */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <MemoizedStatsChart />
              </div>
              
              {/* Quick Actions - 1 column on desktop, show first on mobile */}
              <div className="lg:col-span-1 order-1 lg:order-2">
                <MemoizedQuickActionsBar />
              </div>
            </motion.div>
            
            {/* Row 3: Full-width Recent Transactions - Better space utilization */}
            <motion.div variants={itemVariants} className="w-full">
              <MemoizedRecentTransactions />
            </motion.div>
          </motion.div>
        )}

        {/* Onboarding Modals */}
        <AnimatePresence>
          {showOnboarding && (
            <OnboardingModal
              isOpen={showOnboarding}
              onClose={() => setShowOnboarding(false)}
              onComplete={() => {
                setShowOnboarding(false);
                refreshDashboard();
              }}
            />
          )}
          
          {showOnboardingPrompt && (
            <OnboardingPromptDialog
              isOpen={showOnboardingPrompt}
              onClose={() => setShowOnboardingPrompt(false)}
              onStart={() => {
                setShowOnboardingPrompt(false);
                setShowOnboarding(true);
              }}
              onSkip={() => {
                setShowOnboardingPrompt(false);
                localStorage.setItem('spendwise-onboarding-skipped', 'true');
              }}
            />
          )}
        </AnimatePresence>

        {/* Add Transaction Modal */}
        <AnimatePresence>
          {showAddTransactions && (
            <Modal
              isOpen={showAddTransactions}
              onClose={() => setShowAddTransactions(false)}
              title={t('transactions.add.title')}
              size="large"
            >
              <AddTransactions 
                onSuccess={() => {
                  setShowAddTransactions(false);
                  refreshDashboard();
                }}
                onCancel={() => setShowAddTransactions(false)}
              />
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Welcome Banner Components
const CompactWelcomeBanner = React.memo(({ user, greeting, selectedDate, language, variants, t }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="relative overflow-hidden mb-3"
  >
    <Card className="gradient-hero-primary border-0 text-white spacing-card-content shadow-interactive">
      <div className="absolute inset-0 overflow-hidden">
        <div className="floating-orb-secondary absolute top-0 -right-4 w-20 h-20 lg:w-32 lg:h-32" />
        <div className="floating-orb-accent absolute -bottom-4 -left-4 w-16 h-16 lg:w-32 lg:h-32" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col spacing-element sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-start sm:items-center spacing-element">
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
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mb-1">
                <h1 className="typo-title-large text-white">
                  <span dir="ltr" className="text-white">SpendWise</span>
                </h1>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="typo-title-large text-white">
                    {greeting}
                  </span>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="icon-adaptive-sm" />
                  </motion.div>
                </div>
              </div>
              
              <p className="text-white/90 flex items-center gap-1 sm:gap-2 typo-caption">
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

const MiniWelcome = React.memo(({ user, greeting, language, variants, t }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    className="mb-3"
  >
    <div className="flex items-center justify-between spacing-form surface-glass border border-primary-200 dark:border-primary-800 radius-soft shadow-subtle">
      <div className="flex items-center spacing-element-tight">
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

const CompactTipsSection = React.memo(({ t }) => (
  <Card variant="gradient" className="p-4 relative overflow-hidden">
    {/* 🎨 UNIFIED: Systematic floating orb pattern */}
    <div className="floating-orb-secondary floating-orb-top-right animate-float-gentle"></div>
    <div className="floating-orb-accent floating-orb-bottom-left animate-float-gentle"></div>
    
    {/* 💫 UNIFIED: Professional decoration */}
    <div className="modal-decoration-sparkles"></div>
    
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