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
            {/* Mobile Compact Balance */}
            <motion.div variants={itemVariants}>
              <MobileCompactBalance dashboardData={dashboardData} t={t} />
            </motion.div>

            {/* Mobile Quick Actions - FIXED */}
            <motion.div variants={itemVariants}>
              <FixedMobileQuickActions setShowAddTransactions={setShowAddTransactions} t={t} />
            </motion.div>

            {/* Mobile Transactions */}
            <motion.div variants={itemVariants}>
              <div className="h-[300px]">
                <MemoizedRecentTransactions limit={6} />
              </div>
            </motion.div>

            {/* Mobile Stats */}
            <motion.div variants={itemVariants}>
              <div className="h-[250px]">
                <MemoizedStatsChart />
              </div>
            </motion.div>
          </div>

          {/* 💻 DESKTOP: COMPACT 2-Column Layout */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              
              {/* LEFT COLUMN: Balance & Actions */}
              <div className="space-y-3">
                
                {/* Balance Panel - Compact size */}
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

                {/* Quick Actions - Compact */}
                <motion.div variants={itemVariants}>
                  <MemoizedQuickActionsBar />
                </motion.div>
              </div>

              {/* RIGHT COLUMN: Transactions & Stats Chart */}
              <div className="space-y-3">
                
                {/* Recent Transactions - Optimized height */}
                <motion.div variants={itemVariants}>
                  <MemoizedRecentTransactions />
                </motion.div>

                {/* Stats Chart */}
                <motion.div variants={itemVariants}>
                  <MemoizedStatsChart />
                </motion.div>
              </div>
            </div>

            {/* Enhanced Tips Section - Compact */}
            <motion.div variants={itemVariants} className="mt-3">
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
    <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 border-0 text-white p-4 shadow-lg"> {/* Reduced padding */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -right-4 w-20 h-20 lg:w-32 lg:h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 lg:w-32 lg:h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden ring-2 ring-white/30">
                {user?.preferences?.profilePicture ? (
                  <img 
                    src={user.preferences.profilePicture} 
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base lg:text-lg font-bold text-white">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            
            <div>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold mb-1 flex items-center gap-2">
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

// 📱 MOBILE: Compact balance (same as before)
const MobileCompactBalance = React.memo(({ dashboardData, t }) => {
  const { formatAmount } = useCurrency();
  
  const balanceData = dashboardData?.balances?.daily || { income: 0, expenses: 0, balance: 0 };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.balance.title')}</span>
        </div>
        <Badge variant="secondary" className="text-xs px-2 py-1">
          {t('dashboard.balance.periods.daily')}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {/* Income Box */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-2xl p-3 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-1 right-1 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
          <div className="relative z-10 text-white text-center">
            <div className="flex items-center justify-center mb-1">
              <ArrowUpRight className="w-3 h-3" />
            </div>
            <div className="text-xs text-emerald-100 mb-1 uppercase tracking-wide">
              {t('dashboard.balance.income')}
            </div>
            <div className="text-lg font-bold">
              {formatAmount(balanceData.income)}
            </div>
          </div>
        </motion.div>

        {/* Expenses Box */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-rose-400 via-red-500 to-pink-600 rounded-2xl p-3 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-1 right-1 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
          <div className="relative z-10 text-white text-center">
            <div className="flex items-center justify-center mb-1">
              <ArrowDownRight className="w-3 h-3" />
            </div>
            <div className="text-xs text-rose-100 mb-1 uppercase tracking-wide">
              {t('dashboard.balance.expenses')}
            </div>
            <div className="text-lg font-bold">
              {formatAmount(balanceData.expenses)}
            </div>
          </div>
        </motion.div>

        {/* Balance Box */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`rounded-2xl p-3 shadow-lg relative overflow-hidden ${
            balanceData.balance >= 0
              ? 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600'
              : 'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-600'
          }`}
        >
          <div className="absolute top-1 right-1 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-500"></div>
          <div className="relative z-10 text-white text-center">
            <div className="flex items-center justify-center mb-1">
              {balanceData.balance >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
            </div>
            <div className={`text-xs mb-1 uppercase tracking-wide ${
              balanceData.balance >= 0 ? 'text-blue-100' : 'text-orange-100'
            }`}>
              {t('dashboard.balance.total')}
            </div>
            <div className="text-lg font-bold">
              {formatAmount(balanceData.balance)}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

// 📱 FIXED: Mobile Quick Actions - הבאג תוקן!
const FixedMobileQuickActions = React.memo(({ setShowAddTransactions, t }) => {
  const [activeType, setActiveType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { formatAmount, currency } = useCurrency();
  const { selectedDate, getDateForServer } = useDate();
  
  // ✅ FIX: Use the same hook as desktop
  const { createTransaction, isCreating } = useTransactionActions();
  const inputRef = useRef(null);
  
  const quickAmounts = [10, 20, 50, 100, 200];
  
  const handleQuickAmount = useCallback((value) => {
    setAmount(value.toString());
    setError('');
    inputRef.current?.focus();
  }, []);
  
  const handleAmountChange = useCallback((e) => {
    // ✅ FIX: Better amount validation like desktop
    const value = e.target.value.replace(/[^\d.-]/g, '');
    setAmount(value);
    setError('');
  }, []);
  
  // ✅ FIX: Same logic as desktop QuickActionsBar
  const handleSubmit = useCallback(async () => {
    const numericAmount = parseFloat(amount);
    
    if (!amount || numericAmount <= 0) {
      setError(t('actions.errors.amountRequired') || 'נא להזין סכום');
      inputRef.current?.focus();
      return;
    }
    
    try {
      setError('');
      
      // ✅ FIX: Use exact same parameters as desktop
      await createTransaction(activeType, {
        amount: numericAmount,
        description: t('dashboard.quickActions.defaultDescription') || `Quick ${activeType}`,
        category_id: 8, // Same default category as desktop
        date: getDateForServer(selectedDate),
        is_recurring: false
      });
      
      setSuccess(true);
      setAmount('');
      
      // Reset success state
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      console.error('Mobile QuickActions Error:', err);
      setError(err.message || t('actions.errors.addingTransaction') || 'שגיאה בהוספת העסקה');
    }
  }, [amount, activeType, selectedDate, createTransaction, t, getDateForServer]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isCreating) {
      handleSubmit();
    }
  }, [handleSubmit, isCreating]);

  return (
    <Card className="p-3">
      <div className="space-y-3">
        {/* Header with success indicator */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            {t('dashboard.quickActions.title') || 'Quick Add'}
          </h3>
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs"
              >
                <Check className="w-3 h-3" />
                ✓
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Type Switch */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <motion.button
            onClick={() => setActiveType('expense')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-all relative ${
              activeType === 'expense'
                ? 'text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {activeType === 'expense' && (
              <motion.div
                layoutId="mobileActiveType"
                className="absolute inset-0 bg-red-500 rounded-md"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <TrendingDown className="w-3 h-3 relative z-10" />
            <span className="relative z-10">{t('transactions.expense')}</span>
          </motion.button>
          
          <motion.button
            onClick={() => setActiveType('income')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-all relative ${
              activeType === 'income'
                ? 'text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {activeType === 'income' && (
              <motion.div
                layoutId="mobileActiveType"
                className="absolute inset-0 bg-green-500 rounded-md"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <TrendingUp className="w-3 h-3 relative z-10" />
            <span className="relative z-10">{t('transactions.income')}</span>
          </motion.button>
        </div>
        
        {/* Amount Input Field */}
        <div className="space-y-2">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={amount}
              onChange={handleAmountChange}
              onKeyPress={handleKeyPress}
              placeholder="0.00"
              className="w-full p-3 text-center text-lg font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
              {currency?.symbol || '₪'}
            </div>
          </div>
          
          {/* Quick amount buttons */}
          <div className="grid grid-cols-5 gap-1">
            {quickAmounts.map((quickAmount) => (
              <motion.button
                key={quickAmount}
                onClick={() => handleQuickAmount(quickAmount)}
                className="py-2 px-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {formatAmount(quickAmount)}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800 text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Submit Button */}
        <motion.button
          onClick={handleSubmit}
          disabled={isCreating || !amount || parseFloat(amount) <= 0}
          className={`w-full py-3 text-sm font-medium rounded-lg transition-all ${
            activeType === 'expense'
              ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
              : 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
          } text-white disabled:text-gray-500 disabled:cursor-not-allowed`}
          whileHover={{ scale: isCreating ? 1 : 1.02 }}
          whileTap={{ scale: isCreating ? 1 : 0.98 }}
        >
          <AnimatePresence mode="wait">
            {isCreating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                {t('actions.adding') || 'מוסיף...'}
              </motion.div>
            ) : (
              <motion.div
                key="submit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {t('actions.add') || 'הכנס'} {activeType === 'expense' ? t('transactions.expense') : t('transactions.income')}
                  {amount && ` • ${formatAmount(parseFloat(amount))}`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </Card>
  );
});

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