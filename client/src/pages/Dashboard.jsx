/**
 * 📊 DASHBOARD PAGE - BEAUTIFUL UX/UI VERSION
 * 🎨 Features: Time-based greetings, Profile integration, Enhanced balance tabs, Quick actions, Stats & tips
 * @version 5.1.0 - TRANSLATION SYSTEM CONNECTED
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, Plus, TrendingUp, TrendingDown, DollarSign, 
  Calendar, BarChart3, Target, Clock, User, PiggyBank,
  ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';

// ✅ Import components and hooks
import { useTranslation, useNotifications, useAuth, useCurrency } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { LoadingSpinner, Button, Card, Avatar } from '../components/ui';
import { cn } from '../utils/helpers';

// ✅ Import real dashboard components
import BalancePanel from '../components/features/dashboard/BalancePanel';
import RecentTransactionsWidget from '../components/features/dashboard/RecentTransactionsWidget';
import QuickActionsBar from '../components/features/dashboard/QuickActionsBar';
import AddTransactionModal from '../components/features/transactions/modals/AddTransactionModal';
import FloatingAddTransactionButton from '../components/common/FloatingAddTransactionButton.jsx';

/**
 * 📊 Beautiful Dashboard Component
 */
const Dashboard = () => {
  // ✅ ALL HOOKS AT TOP - NEVER CONDITIONAL
  const { t, currentLanguage, isRTL } = useTranslation('dashboard');
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { currency, formatCurrency } = useCurrency();
  
  // ✅ Local state hooks
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  // ✅ Data fetching hooks
  const { 
    data: dashboardData, 
    isLoading, 
    isError,
    error,
    isEmpty,
    refresh: refreshDashboard 
  } = useDashboard();

  // ✅ Time-based greeting with proper language support
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    
    // ✅ FIXED: Simple direct name extraction from server response
    
    // Server provides normalized fields - use them directly
    let userName = '';
    
    // Extract first and last name from server response
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
    } else {
      userName = user?.email?.split('@')[0] || '';  // Never show "User" fallback
    }
    
    // Get translation and replace {{name}} placeholder
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
    
    // Replace {{name}} if it exists, otherwise construct greeting manually
    if (greetingText.includes('{{name}}')) {
      greetingText = greetingText.replace('{{name}}', userName);
    } else {
      // If no {{name}} placeholder, construct greeting manually
      greetingText = `${greetingText} ${userName}!`;
    }
    
    return greetingText;
  }, [user, t]);

  // ✅ Profile picture with cache-busting for real-time updates - NO FALLBACK TO "User"
  const profilePicture = user?.avatar 
    ? `${user.avatar}?t=${Date.now()}` // Add cache-busting timestamp
    : null; // Never show generic user avatar

  // ✅ Date formatting based on current language
  const formatDate = useCallback((date) => {
    const dateObj = new Date(date);
    return currentLanguage === 'he' 
      ? dateObj.toLocaleDateString('he-IL')
      : dateObj.toLocaleDateString('en-US');
  }, [currentLanguage]);

  // ✅ Currency symbol based on language
  // Get currency symbol from user's preference (not language)
  const currencySymbol = {
    USD: '$', EUR: '€', ILS: '₪', GBP: '£', JPY: '¥',
    CAD: 'C$', AUD: 'A$', CHF: 'CHF'
  }[currency] || '$';

  // ✅ Event handlers - ALL useCallback at top level
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
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

  // ✅ CONDITIONAL RENDERING - AFTER ALL HOOKS
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (isError && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('dashboardError')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('dashboardErrorMessage')}
          </p>
          <Button onClick={handleRefresh}>
            {t('reloadPage')}
          </Button>
        </Card>
      </div>
    );
  }

  // ✅ Beautiful dashboard content with unified header design
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Beautiful Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Page Title */}
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <BarChart3 className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-gray-900 dark:text-white"
                >
                  Dashboard
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  {greeting}
                </motion.p>
              </div>
            </div>

            {/* Actions: Removed top-level refresh button per UX decision */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >

        {/* Balance Panel with New Dedicated Hook */}
        <BalancePanel 
          showDetails={true}
          className="mb-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions Panel - New Redesigned Component */}
          <Card className="lg:col-span-1 shadow-xl" data-quick-actions>
            <div className="p-6">
              <QuickActionsBar />
            </div>
          </Card>

          {/* Stats and Recent Transactions */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Panel */}
            <Card className="shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('stats.title')}
                  </h3>
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">{t('stats.totalTransactions')}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency ? formatCurrency(0) : `${currencySymbol}0`}
                    </div>
                    <div className="text-sm text-gray-600">{t('stats.avgTransaction')}</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{t('common.categoryTypes.food', 'Food')}</div>
                    <div className="text-sm text-gray-600">{t('stats.topCategory')}</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">+0%</div>
                    <div className="text-sm text-gray-600">{t('stats.thisMonth')}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Transactions Widget - New Simple Component */}
            <RecentTransactionsWidget 
              onViewAll={() => {
                // Navigate to transactions page
                window.location.href = '/transactions';
              }}
              onAddTransaction={() => {
                // Scroll to quick actions for better UX
                document.querySelector('[data-quick-actions]')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            />

            {/* Tips Panel */}
            <Card className="shadow-xl bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {t('tips.title')}
                </h3>
                <div className="space-y-3 text-gray-700">
                  <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm">{t('tips.savingTip')}</p>
                  </div>
                  <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <BarChart3 className="w-5 h-5 text-orange-600 mt-0.5" />
                    <p className="text-sm">{t('tips.budgetTip')}</p>
                  </div>
                  <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <Calendar className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm">{t('tips.categoryTip')}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSuccess={async () => {
          // Trigger dashboard refresh without full page reload
          try {
            // Dispatch a dashboard refresh event used by useDashboard
            window.dispatchEvent(new CustomEvent('dashboard-refresh-requested'));
          } catch (_) {}
        }}
      />

      {/* Floating FAB bottom-left */}
      <FloatingAddTransactionButton onClick={() => setShowAddTransaction(true)} />
    </div>
  );
};

export default Dashboard;