// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDate } from '../context/DateContext';
import { TransactionProvider } from '../context/TransactionContext';
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
  MoreHorizontal
} from 'lucide-react';

// Features
import BalancePanel from '../components/features/dashboard/BalancePanel';
import ActionsPanel from '../components/features/dashboard/ActionsPanel';
import QuickActionsBar from '../components/features/dashboard/QuickActionsBar';
import RecentTransactions from '../components/features/dashboard/RecentTransactions';

// UI Components
import { Card, Badge, LoadingSpinner, Button } from '../components/ui';
import AccessibilityMenu from '../components/common/AccessibilityMenu';

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { selectedDate, formatDate } = useDate();
  const [loading, setLoading] = useState(true);
  // Remove auto-hiding welcome banner
  // const [showWelcome, setShowWelcome] = useState(true);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  
  const isRTL = language === 'he';

  // Get personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.username || '';
    
    if (hour < 12) return `${t('home.greeting.morning')}, ${name}! ☀️`;
    if (hour < 17) return `${t('home.greeting.afternoon')}, ${name}! 🌤️`;
    if (hour < 21) return `${t('home.greeting.evening')}, ${name}! 🌆`;
    return `${t('home.greeting.night')}, ${name}! 🌙`;
  };

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Remove auto-hiding welcome timer
  /*
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  */

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

  const toggleFloatingMenu = () => {
    setShowFloatingMenu(!showFloatingMenu);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </div>
    );
  }

  return (
    <TransactionProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                  {/* Add more subtle animated shapes */}
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
                        {formatDate(selectedDate, language === 'he' ? 'PPP' : 'PPPP')}
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
                        {new Date().toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {month: 'short'})}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column - Balance & Actions */}
              <div className="xl:col-span-2 space-y-6">
                {/* Balance Panel */}
                <motion.div variants={itemVariants}>
                  <BalancePanel />
                </motion.div>

                {/* Quick Expense Bar - Mobile */}
                <motion.div variants={itemVariants} className="xl:hidden">
                  <QuickActionsBar />
                </motion.div>

                {/* Actions Panel */}
                <motion.div variants={itemVariants}>
                  <ActionsPanel />
                </motion.div>
              </div>

              {/* Right Column - Recent Transactions & Quick Expense */}
              <div className="space-y-6">
                {/* Quick Expense Bar - Desktop */}
                <motion.div variants={itemVariants} className="hidden xl:block">
                  <QuickActionsBar />
                </motion.div>

                {/* Recent Transactions */}
                <motion.div variants={itemVariants}>
                  <RecentTransactions />
                </motion.div>
                
                {/* New Colorful Tips Card */}
                <motion.div variants={itemVariants}>
                  <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 border-0 shadow-lg">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      {t('dashboard.tips.title') || "Finance Tip"}
                    </h3>
                    <p className="text-sm text-white/90">
                      {t('dashboard.tips.content') || "Track your daily expenses to identify spending patterns and potential savings opportunities."}
                    </p>
                  </Card>
                </motion.div>
              </div>
            </div>

            {/* Bottom Stats Cards */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
            >
              {/* Daily Average Card */}
              <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('dashboard.stats.dailyAverage')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₪245
                    </p>
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
                      {t('dashboard.stats.monthlyGoal')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      68%
                    </p>
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
                      {t('dashboard.stats.recurringActive')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      12
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>

              {/* This Month Saved Card */}
              <Card className="p-4 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900 border-green-100 dark:border-green-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('dashboard.stats.savedThisMonth')}
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₪1,240
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Floating Action Button */}
      <div className={`fixed ${isRTL ? 'left-6' : 'right-6'} bottom-6 z-40`}>
        <div className="flex flex-col items-end space-y-3">
          {/* Floating Menu */}
          <AnimatePresence>
            {showFloatingMenu && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
              >
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="ghost" 
                    size="small" 
                    className="justify-start"
                    icon={TrendingUp}
                  >
                    {t('actions.addIncome')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="small" 
                    className="justify-start"
                    icon={TrendingDown}
                  >
                    {t('actions.addExpense')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="small" 
                    className="justify-start"
                    icon={Clock}
                  >
                    {t('actions.recurring')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main Floating Button */}
          <Button
            variant="primary"
            className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center"
            onClick={toggleFloatingMenu}
            aria-label={t('actions.quickAdd')}
          >
            {showFloatingMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Plus className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Accessibility Menu */}
      <AccessibilityMenu />
    </TransactionProvider>
  );
};

export default Dashboard;