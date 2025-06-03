// pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDate } from '../context/DateContext';
import { TransactionProvider, useTransactions } from '../context/TransactionContext';
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

// Features
import BalancePanel from '../components/features/dashboard/BalancePanel';
import QuickActionsBar from '../components/features/dashboard/QuickActionsBar'; 
import RecentTransactions from '../components/features/dashboard/RecentTransactions';
import ActionsPanel from '../components/features/dashboard/ActionsPanel';
import StatsChart from '../components/features/dashboard/StatsChart';

// UI Components
import { Card, Badge, LoadingSpinner, Button, Modal } from '../components/ui';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { selectedDate, formatDate } = useDate();
  
  // ✅ Single call to dashboard hook in main component
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError 
  } = useDashboard();
  
  const [loading, setLoading] = useState(true);

  // ✅ REPLACE RANDOM STATS WITH REAL DATA
  const dashboardStats = React.useMemo(() => {
    if (!dashboardData) {
      return {
        dailyAverage: 0,
        monthlyGoal: 0,
        recurringActive: 0,
        savedThisMonth: 0,
        loading: isDashboardLoading
      };
    }

    const monthly = dashboardData.balances?.monthly || {};
    const daily = dashboardData.balances?.daily || {};
    const weekly = dashboardData.balances?.weekly || {};
    const yearly = dashboardData.balances?.yearly || {};
    const recurring = dashboardData.recurringInfo || {};
    const recentTransactions = dashboardData.recentTransactions || [];
    
    // Calculate real daily average from monthly expenses
    const realDailyAverage = monthly.expenses > 0 ? Math.round(monthly.expenses / 30) : 0;
    
    // Calculate savings percentage as monthly goal
    const totalMonthlyActivity = (monthly.income || 0) + (monthly.expenses || 0);
    const savingsPercentage = totalMonthlyActivity > 0 
      ? Math.round(((monthly.income || 0) / totalMonthlyActivity) * 100)
      : 0;
    
    // Real recurring transactions count
    const recurringCount = (recurring.income_count || 0) + (recurring.expense_count || 0);
    
    // Calculate actual savings this month (positive balance)
    const actualSavings = Math.max(0, monthly.balance || 0);
    
    return {
      dailyAverage: realDailyAverage,
      monthlyGoal: Math.min(100, savingsPercentage), // Cap at 100%
      recurringActive: recurringCount,
      savedThisMonth: actualSavings,
      loading: isDashboardLoading,
      // Add extra real data for richer display
      totalTransactions: recentTransactions.length,
      weeklyTrend: weekly.balance > daily.balance ? 'up' : 'down',
      monthlyIncome: monthly.income || 0,
      monthlyExpenses: monthly.expenses || 0
    };
  }, [dashboardData, isDashboardLoading]);

  const isRTL = language === 'he';
  const dashboardId = useRef(`dashboard-${Math.random().toString(36).substr(2, 9)}`).current;
  
  useEffect(() => {
    // Debug only in special development cases
    const debugMode = localStorage.getItem('debug_dashboard') === 'true' && process.env.NODE_ENV === 'development';
    
    if (debugMode) {
      console.log(`📊 [DASHBOARD] Dashboard component mounted`);
    }
  }, []);

  // Fix for the main loading mechanism
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Function to get a time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.username || '';
    
    if (hour < 12) return `${t('dashboard.greeting.morning')}, ${name}! ☀️`;
    if (hour < 17) return `${t('dashboard.greeting.afternoon')}, ${name}! 🌤️`;
    if (hour < 21) return `${t('dashboard.greeting.evening')}, ${name}! 🌆`;
    return `${t('dashboard.greeting.night')}, ${name}! 🌙`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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
        stiffness: 100,
        damping: 15
      }
    }
  };

  const welcomeVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  // ✅ Check if dashboard is still loading - fixed key name
  if (loading || isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </div>
    );
  }

  // ✅ Check errors - use correct key
  if (dashboardError) {
    const refreshData = () => {
      window.location.reload(); // Temporary solution until refresh function is available
    };
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('dashboard.balance.error')}</p>
          <Button onClick={refreshData} variant="outline">
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TransactionProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" data-component="Dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Welcome Banner - Always visible now */}
            <motion.div
              variants={welcomeVariants}
              initial="initial"
              animate="animate"
              className="relative overflow-hidden"
            >
              <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 border-0 text-white p-6 sm:p-8 shadow-lg">
                {/* Enhanced Animated Background Pattern */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 -right-4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
                  <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
                  <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
                        {getGreeting()}
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        >
                          <Sparkles className="w-6 h-6" />
                        </motion.div>
                      </h1>
                      <p className="text-white/90 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {/* ✅ FIX: Use local timezone date formatting */}
                        {(() => {
                          const date = selectedDate || new Date();
                          const formatOptions = language === 'he' 
                            ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                            : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                          return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', formatOptions);
                        })()}
                      </p>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-3">
                      <Badge 
                        variant="default" 
                        className="bg-white/20 text-white border-white/30 px-4 py-2"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        {t('common.active')}
                      </Badge>
                      
                      {/* Add more badges for visual richness */}
                      <Badge 
                        variant="default" 
                        className="bg-primary-700/50 text-white border-white/30 px-4 py-2"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {/* ✅ FIX: Use local timezone for month display */}
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

            {/* Main Grid Layout - REDESIGNED FOR BETTER UX */}
            <div className="space-y-6">
              {/* Top Section: Balance Panel - Full Width */}
              <motion.div variants={itemVariants}>
                <BalancePanel 
                  balanceData={dashboardData?.balances}
                  recurringInfo={dashboardData?.recurringInfo}
                />
              </motion.div>

              {/* Middle Section: Actions + Quick Actions */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Main Actions Panel - Prominent Position */}
                <motion.div variants={itemVariants} className="xl:col-span-2">
                  <ActionsCard />
                </motion.div>

                {/* Right: Enhanced Quick Actions */}
                <motion.div variants={itemVariants} className="xl:col-span-1">
                  <QuickActionsBar />
                </motion.div>
              </div>

              {/* NEW: Charts Section */}
              <motion.div variants={itemVariants}>
                <StatsChart 
                  dashboardData={dashboardData}
                  loading={isDashboardLoading}
                  className="lg:col-span-2" 
                />
              </motion.div>

              {/* Bottom Section: Recent Transactions - Full Width */}
              <motion.div variants={itemVariants}>
                <RecentTransactions 
                  transactions={dashboardData?.recentTransactions}
                  loading={isDashboardLoading}
                />
              </motion.div>

              {/* Enhanced Tips Section */}
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 text-white p-6 border-0 shadow-xl relative overflow-hidden">
                  {/* Animated background */}
                  <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">
                        {t('dashboard.tips.title')}
                      </h3>
                      <p className="text-white/90">
                        {t('dashboard.tips.content')}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Bottom Stats Cards - NOW WITH REAL DATA */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
            >
              {/* Daily Average Card - REAL DATA */}
              <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('dashboard.stats.dailyAverage') || 'Daily Average'}
                    </p>
                    {dashboardStats.loading ? (
                      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          ₪{dashboardStats.dailyAverage}
                        </p>
                        {dashboardStats.monthlyExpenses > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            מתוך ₪{dashboardStats.monthlyExpenses} חודשי
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

              {/* Monthly Goal Card - REAL SAVINGS PERCENTAGE */}
              <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900 border-green-100 dark:border-green-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('dashboard.stats.savingsRate') || 'Savings Rate'}
                    </p>
                    {dashboardStats.loading ? (
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dashboardStats.monthlyGoal}%
                        </p>
                        {dashboardStats.monthlyIncome > 0 && (
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

              {/* Recurring Count Card - REAL COUNT */}
              <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('dashboard.stats.recurringActive') || 'Active Recurring'}
                    </p>
                    {dashboardStats.loading ? (
                      <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dashboardStats.recurringActive}
                        </p>
                        {dashboardStats.recurringActive > 0 && (
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

              {/* This Month Saved Card - REAL BALANCE */}
              <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-white dark:from-gray-800 dark:to-gray-900 border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('dashboard.stats.monthlyBalance') || 'Monthly Balance'}
                    </p>
                    {dashboardStats.loading ? (
                      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                    ) : (
                      <div>
                        <p className={`text-2xl font-bold ${
                          dashboardStats.savedThisMonth >= 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          ₪{Math.abs(dashboardStats.savedThisMonth)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {dashboardStats.savedThisMonth >= 0 ? 'חיסכון' : 'גירעון'} החודש
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    {dashboardStats.savedThisMonth >= 0 ? (
                      <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </TransactionProvider>
  );
};

// Add ActionsCard component above the main Dashboard component
const ActionsCard = () => {
  const { t, language } = useLanguage();
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState(null); // NEW: Track which action was selected
  const isRTL = language === 'he';

  // Handle direct action selection - opens form immediately
  const handleDirectAction = (actionType) => {
    setSelectedActionType(actionType);
    setShowActionsPanel(true);
  };

  // Handle full panel open - shows type selection
  const handleFullPanel = () => {
    setSelectedActionType(null);
    setShowActionsPanel(true);
  };

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

          {/* Action Cards - NOW OPEN SPECIFIC FORMS */}
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
                
                {/* Direct action indicator */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Feature highlights - UPDATED FOR 4 CARDS */}
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

      {/* Actions Panel Modal - PASSES SELECTED ACTION TYPE */}
      <AnimatePresence>
        {showActionsPanel && (
          <Modal
            isOpen={showActionsPanel}
            onClose={() => {
              setShowActionsPanel(false);
              setSelectedActionType(null);
            }}
            size="large"
            className="max-w-4xl"
            hideHeader={true}
          >
            <ActionsPanel 
              onClose={() => {
                setShowActionsPanel(false);
                setSelectedActionType(null);
              }}
              initialActionType={selectedActionType} // NEW: Pass the selected action
            />
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
};

export default Dashboard;