/**
 * Mobile-Optimized Dashboard
 * 
 * 📱 MOBILE-FIRST: Compact design for phones
 * 💻 DESKTOP: Full beauty preserved
 * ✅ SMART BREAKPOINTS: Different layouts per screen size
 * ✅ NO VERTICAL SCROLLING: Everything fits on screen
 * ✅ RESPONSIVE TYPOGRAPHY: Text scales properly
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

// 📱 MOBILE-OPTIMIZED: Memoized components
const MemoizedBalancePanel = React.memo(BalancePanel);
MemoizedBalancePanel.displayName = 'MemoizedBalancePanel';

const MemoizedRecentTransactions = React.memo(RecentTransactions);
MemoizedRecentTransactions.displayName = 'MemoizedRecentTransactions';

const MemoizedStatsChart = React.memo(StatsChart);
MemoizedStatsChart.displayName = 'MemoizedStatsChart';

const MemoizedQuickActionsBar = React.memo(QuickActionsBar);
MemoizedQuickActionsBar.displayName = 'MemoizedQuickActionsBar';

// 📱 MOBILE-RESPONSIVE: Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20
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
      height: { duration: 0.4, ease: "easeOut" }
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
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
        console.log('📱 [MOBILE-DASHBOARD] Responsive Layout:', {
          hasData: !!data,
          isLoading: loading,
          isFetching,
          timestamp: new Date().toISOString(),
          layout: 'Mobile-optimized with smart breakpoints'
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
  const dashboardId = useRef(`mobile-dashboard-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // 📱 MOBILE-OPTIMIZED: Fast loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);
  
  // 📱 MOBILE-OPTIMIZED: Banner timing
  useEffect(() => {
    if (!loading && !isDashboardLoading && !isFetching) {
      const timer = setTimeout(() => {
        setShowWelcomeBanner(false);
      }, 1000);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-component="MobileDashboard">
      {/* 📱 MOBILE-FIRST: Responsive container */}
      <div className="w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6 max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2 sm:space-y-4 md:space-y-6"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* 📱 MOBILE-COMPACT: Welcome Section */}
          <AnimatePresence mode="wait">
            {showWelcomeBanner ? (
              <MobileWelcomeBanner 
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
              <MobileMiniWelcome 
                key="compact-welcome"
                user={user}
                greeting={greeting}
                language={language}
                variants={compactWelcomeVariants}
                t={t}
              />
            )}
          </AnimatePresence>

          {/* 📱 MOBILE-SMART: Responsive layout with mobile stacking */}
          <div className="space-y-2 sm:space-y-4 md:space-y-6">
            
            {/* 📱 MOBILE-BALANCE: Compact Balance Panel */}
            <motion.div variants={itemVariants}>
              <div className="sm:hidden">
                {/* 📱 MOBILE: Ultra compact balance */}
                <MobileCompactBalance dashboardData={dashboardData} t={t} />
              </div>
              <div className="hidden sm:block">
                {/* 💻 DESKTOP: Full balance panel */}
                <div className="min-h-[300px] lg:min-h-[400px]">
                  <MemoizedBalancePanel />
                </div>
              </div>
            </motion.div>

            {/* 📱 MOBILE-ACTIONS: Quick Actions Row */}
            <motion.div variants={itemVariants}>
              <div className="sm:hidden">
                {/* 📱 MOBILE: Compact quick actions */}
                <MobileQuickActions setShowAddTransactions={setShowAddTransactions} t={t} />
              </div>
              <div className="hidden sm:block">
                {/* 💻 DESKTOP: Full quick actions */}
                <div className="min-h-[250px] lg:min-h-[350px]">
                  <MemoizedQuickActionsBar />
                </div>
              </div>
            </motion.div>

            {/* 📱 MOBILE-CONTENT: Transactions & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 md:gap-6">
              
              {/* 📱 MOBILE-TRANSACTIONS: Compact transactions */}
              <motion.div variants={itemVariants}>
                <div className="min-h-[200px] sm:min-h-[400px] lg:min-h-[500px]">
                  <MemoizedRecentTransactions limit={6} />
                </div>
              </motion.div>

              {/* 📱 MOBILE-STATS: Compact stats */}
              <motion.div variants={itemVariants}>
                <div className="min-h-[200px] sm:min-h-[400px] lg:min-h-[500px]">
                  <MemoizedStatsChart />
                </div>
              </motion.div>
            </div>

            {/* 📱 MOBILE-CTA: Compact call-to-action */}
            <motion.div variants={itemVariants} className="hidden sm:block">
              <MobileActionCallToAction t={t} setShowAddTransactions={setShowAddTransactions} />
            </motion.div>
          </div>
        </motion.div>

        {/* 📱 MOBILE-FAB: Responsive floating button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="fixed right-3 bottom-3 sm:right-6 sm:bottom-6 z-50"
        >
          <motion.button
            onClick={() => setShowAddTransactions(true)}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={t('actions.quickAdd')}
          >
            <motion.div
              animate={{ rotate: [0, 0, 90, 90, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-60"></div>
          </motion.button>
        </motion.div>

        {/* 📱 MOBILE-MODAL: Responsive modal */}
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
                context="mobile-dashboard"
              />
            </Modal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 📱 MOBILE-COMPACT: Beautiful colored boxes like desktop but compact
const MobileCompactBalance = React.memo(({ dashboardData, t }) => {
  const { formatAmount } = useCurrency();
  
  const balanceData = dashboardData?.balances?.daily || { income: 0, expenses: 0, balance: 0 };
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.balance.title')}</span>
        </div>
        <Badge variant="secondary" className="text-xs px-2 py-1">
          {t('dashboard.balance.periods.daily')}
        </Badge>
      </div>
      
      {/* Colored boxes like desktop */}
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

// 📱 MOBILE-ACTIONS: Complete quick actions with input field (FIXED)
const MobileQuickActions = React.memo(({ setShowAddTransactions, t }) => {
  const [activeType, setActiveType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { formatAmount } = useCurrency();
  const { selectedDate, getDateForServer } = useDate();
  
  // ✅ FIX: Use same hook as original QuickActionsBar
  const { createTransaction, isCreating } = useTransactionActions();
  const inputRef = useRef(null);
  
  // Quick amounts for mobile
  const quickAmounts = [10, 20, 50, 100, 200];
  
  const handleQuickAmount = useCallback((value) => {
    setAmount(value.toString());
    setError('');
    inputRef.current?.focus();
  }, []);
  
  const handleAmountChange = useCallback((e) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setAmount(value);
    setError('');
  }, []);
  
  // ✅ FIX: Use same structure as original QuickActionsBar
  const handleSubmit = useCallback(async () => {
    const numericAmount = parseFloat(amount);
    
    if (!amount || numericAmount <= 0) {
      setError(t('actions.errors.amountRequired') || 'נא להזין סכום');
      inputRef.current?.focus();
      return;
    }
    
    try {
      setError('');
      
      // ✅ FIX: Use same method signature as original
      await createTransaction(activeType, {
        amount: numericAmount,
        description: t('dashboard.quickActions.defaultDescription') || `Quick ${activeType}`,
        category_id: activeType === 'expense' ? 8 : 8, // Default category like original
        date: getDateForServer(selectedDate),
        is_recurring: false
      });
      
      setSuccess(true);
      setAmount('');
      
      // Reset success state
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
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
              placeholder={t('actions.enterAmount') || 'הזן סכום...'}
              className="w-full p-3 text-center text-lg font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
              ₪
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

// 📱 MOBILE-WELCOME: Compact welcome banner
const MobileWelcomeBanner = React.memo(({ user, greeting, selectedDate, language, variants, t }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="relative overflow-hidden mb-2 sm:mb-4"
  >
    <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 border-0 text-white p-3 sm:p-6 shadow-lg">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -right-4 w-16 h-16 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 sm:w-14 sm:h-14 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden ring-1 sm:ring-2 ring-white/30">
                {user?.preferences?.profilePicture ? (
                  <img 
                    src={user.preferences.profilePicture} 
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm sm:text-xl font-bold text-white">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2 h-2 sm:w-4 sm:h-4 bg-green-400 rounded-full border border-white animate-pulse"></div>
            </div>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-xl md:text-2xl font-bold mb-0 sm:mb-1 flex items-center gap-1 sm:gap-2">
                <span dir="ltr" className="hidden sm:inline">SpendWise</span>
                <span dir="ltr" className="sm:hidden">SW</span>
                <span className="hidden sm:inline">-</span>
                <span className="truncate text-xs sm:text-base">{greeting}</span>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 flex-shrink-0" />
                </motion.div>
              </h1>
              <p className="text-white/90 flex items-center gap-1 text-xs sm:text-sm">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
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
          
          <Badge variant="default" className="bg-white/20 text-white border-white/30 px-2 py-1 text-xs flex-shrink-0">
            <Activity className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Active</span>
            <span className="sm:hidden">ON</span>
          </Badge>
        </div>
      </div>
    </Card>
  </motion.div>
));

// 📱 MOBILE-MINI: Mini welcome
const MobileMiniWelcome = React.memo(({ user, greeting, language, variants, t }) => (
  <motion.div
    variants={variants}
    initial="initial"
    animate="animate"
    className="mb-2 sm:mb-4"
  >
    <div className="flex items-center justify-between p-2 sm:p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="relative flex-shrink-0">
          <div className="w-6 h-6 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md sm:rounded-lg flex items-center justify-center overflow-hidden">
            {user?.preferences?.profilePicture ? (
              <img 
                src={user.preferences.profilePicture} 
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs sm:text-sm font-bold text-white">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border border-white dark:border-gray-800"></div>
        </div>
        
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-base truncate">
            <span dir="ltr" className="text-primary-600 dark:text-primary-400 hidden sm:inline">SpendWise</span>
            <span dir="ltr" className="text-primary-600 dark:text-primary-400 sm:hidden">SW</span>
            <span className="hidden sm:inline"> - </span>
            <span className="sm:hidden"> </span>
            <span className="truncate">{greeting}</span>
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
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
      
      <Badge variant="default" className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-2 py-1 text-xs flex-shrink-0">
        <Activity className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">Active</span>
        <span className="sm:hidden">ON</span>
      </Badge>
    </div>
  </motion.div>
));

// 📱 MOBILE-CTA: Call to action
const MobileActionCallToAction = React.memo(({ t, setShowAddTransactions }) => (
  <Card className="p-3 sm:p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-lg">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-4 text-center sm:text-left">
        <motion.div 
          className="p-2 sm:p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg sm:rounded-xl flex-shrink-0"
          whileHover={{ scale: 1.1, rotate: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
        </motion.div>
        <div>
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
            Ready to manage finances?
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Track spending & manage budget
          </p>
        </div>
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto">
        <Link to="/transactions" className="flex-1 sm:flex-none">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
            <Button variant="outline" className="w-full sm:w-auto px-3 sm:px-6 text-xs sm:text-sm py-2">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              View All
            </Button>
          </motion.div>
        </Link>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 sm:flex-none">
          <Button 
            onClick={() => setShowAddTransactions(true)}
            className="w-full sm:w-auto px-3 sm:px-6 text-xs sm:text-sm py-2 bg-primary-500 hover:bg-primary-600"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Add
          </Button>
        </motion.div>
      </div>
    </div>
  </Card>
));

export default Dashboard;