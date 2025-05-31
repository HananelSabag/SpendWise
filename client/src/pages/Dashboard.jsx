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
  Sparkles
} from 'lucide-react';

// Features
import BalancePanel from '../components/features/dashboard/BalancePanel';
import ActionsPanel from '../components/features/dashboard/ActionsPanel';
import QuickActionsBar from '../components/features/dashboard/QuickActionsBar';
import RecentTransactions from '../components/features/dashboard/RecentTransactions';

// UI Components
import { Card, Badge, LoadingSpinner } from '../components/ui';

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { selectedDate, formatDate } = useDate();
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  
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

  // Hide welcome after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, []);

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
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.3 }
    }
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
            {/* Welcome Banner */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  variants={welcomeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="relative overflow-hidden"
                >
                  <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 border-0 text-white p-6 sm:p-8">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full blur-2xl animate-pulse" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse delay-700" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
                            {getGreeting()}
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
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
                        <div className="flex gap-4">
                          <Badge 
                            variant="default" 
                            className="bg-white/20 text-white border-white/30 px-4 py-2"
                          >
                            <Activity className="w-4 h-4 mr-1" />
                            {t('common.active')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

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
              </div>
            </div>

            {/* Bottom Stats Cards */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
            >
              {/* Daily Average Card */}
              <Card className="p-4 hover:shadow-lg transition-shadow">
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
              <Card className="p-4 hover:shadow-lg transition-shadow">
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
              <Card className="p-4 hover:shadow-lg transition-shadow">
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
              <Card className="p-4 hover:shadow-lg transition-shadow">
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
    </TransactionProvider>
  );
};

export default Dashboard;