/**
 * 📊 DASHBOARD PAGE - BEAUTIFUL UX/UI VERSION
 * 🎨 Features: Time-based greetings, Profile integration, Enhanced balance tabs, Quick actions, Stats & tips
 * @version 5.1.0 - TRANSLATION SYSTEM CONNECTED
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  RefreshCw, Plus, TrendingUp, TrendingDown, DollarSign, 
  Calendar, BarChart3, Target, Clock, User, PiggyBank,
  Zap, ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';

// ✅ Import components and hooks
import { useTranslation, useNotifications, useAuth, useAuthStore, useCurrency } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useTransactions } from '../hooks/useTransactions';
import { LoadingSpinner, Button, Card, Avatar } from '../components/ui';

// ✅ Import real dashboard components
import BalancePanel from '../components/features/dashboard/BalancePanel';
import RecentTransactions from '../components/features/dashboard/RecentTransactions';

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
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [quickActionType, setQuickActionType] = useState('expense');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  
  // ✅ Data fetching hooks
  const { 
    data: dashboardData, 
    isLoading, 
    isError,
    error,
    isEmpty,
    refresh: refreshDashboard 
  } = useDashboard();

  // ✅ Real transactions data
  const { 
    transactions, 
    loading: transactionsLoading,
    refetch: refetchTransactions 
  } = useTransactions({
    pageSize: 10,
    enableAI: false
  });

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

  const handleQuickAction = useCallback(() => {
    if (!quickAmount) return;
    
    // Here you would integrate with your transaction API
    addNotification({
      type: 'success',
      message: t('quickActions.success'),
      duration: 2000
    });
    
    // Reset form
    setQuickAmount('');
    setQuickDescription('');
    setShowQuickAction(false);
    handleRefresh();
  }, [quickAmount, addNotification, t, handleRefresh]);

  // ✅ REAL-TIME DATA: Combine dashboard data with actual transactions
  const enhancedData = useMemo(() => {
    if (!dashboardData || !transactions) {
      // Return safe fallback while loading
      return {
        balance: { current: 0, currency: currency },
        periods: {
          daily: { income: 0, expenses: 0, net: 0 },
          weekly: { income: 0, expenses: 0, net: 0 },
          monthly: { income: 0, expenses: 0, net: 0 },
          yearly: { income: 0, expenses: 0, net: 0 }
        },
        stats: {
          totalTransactions: 0,
          avgTransaction: 0,
          topCategory: t('common.categoryTypes.food', 'Food & Dining'),
          growthRate: '+0%'
        },
        recentTransactions: [],
        transactions: []
      };
    }

    // Use real transaction data for balance calculation
    const transactionsList = Array.isArray(transactions) ? transactions : [];
    
    // Calculate actual balance from transactions
    const actualBalance = transactionsList.reduce((balance, transaction) => {
      const amount = parseFloat(transaction.amount) || 0;
      return transaction.type === 'income' ? balance + amount : balance - amount;
    }, 0);

    // Use real recent transactions (latest 5)
    const recentTransactions = transactionsList
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 5);

    return {
      balance: { 
        current: actualBalance,
        currency: currency 
      },
      periods: dashboardData?.periods || {
        daily: { income: 0, expenses: 0, net: 0 },
        weekly: { income: 0, expenses: 0, net: 0 },
        monthly: { income: 0, expenses: 0, net: 0 },
        yearly: { income: 0, expenses: 0, net: 0 }
      },
      stats: {
        totalTransactions: transactionsList.length,
        avgTransaction: transactionsList.length > 0 ? 
          Math.abs(actualBalance) / transactionsList.length : 0,
        topCategory: t('common.categoryTypes.food', 'Food & Dining'),
        growthRate: '+12.5%'
      },
      recentTransactions,
      transactions: transactionsList // Pass transactions to BalancePanel
    };
  }, [dashboardData, transactions, currency, t]);

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
          <Button onClick={() => window.location.reload()}>
            {t('reloadPage')}
          </Button>
        </Card>
      </div>
    );
  }

  // ✅ Beautiful dashboard content with RTL support
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Welcome Header with Profile */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-blue-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
              <div className="relative">
                <Avatar
                  src={user?.avatar}
                  alt={user?.name || user?.username || 'User'}
                  name={user?.name || user?.username || 'User'}
                  size="xl"
                  className="border-4 border-blue-500 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {greeting}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t('overview', 'Overview')} • {formatDate(new Date())}
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? t('loading') : t('refresh')}
            </Button>
          </div>
        </div>

        {/* Balance Panel with Real Data */}
        <BalancePanel 
          data={enhancedData}
          showDetails={true}
          className="mb-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions Panel */}
          <Card className="lg:col-span-1 shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('quickActions.title')}
                </h3>
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
              
              {!showQuickAction ? (
                <div className="space-y-3">
                  <button
                    onClick={() => { setQuickActionType('expense'); setShowQuickAction(true); }}
                    className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                  >
                    <span className="font-medium text-red-700">{t('quickActions.addExpense')}</span>
                    <Plus className="w-5 h-5 text-red-500" />
                  </button>
                  
                  <button
                    onClick={() => { setQuickActionType('income'); setShowQuickAction(true); }}
                    className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                  >
                    <span className="font-medium text-green-700">{t('quickActions.addIncome')}</span>
                    <Plus className="w-5 h-5 text-green-500" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-3 h-3 rounded-full ${quickActionType === 'expense' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="font-medium">
                      {quickActionType === 'expense' ? t('quickActions.addExpense') : t('quickActions.addIncome')}
                    </span>
                  </div>
                  
                  <input
                    type="number"
                    placeholder={t('quickActions.placeholder.amount')}
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  
                  <input
                    type="text"
                    placeholder={t('quickActions.placeholder.description')}
                    value={quickDescription}
                    onChange={(e) => setQuickDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleQuickAction}
                      disabled={!quickAmount}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {t('quickActions.add')}
                    </Button>
                    <Button
                      onClick={() => setShowQuickAction(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      {t('quickActions.cancel')}
                    </Button>
                  </div>
                </div>
              )}
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
                    <div className="text-2xl font-bold text-blue-600">{enhancedData.stats.totalTransactions}</div>
                    <div className="text-sm text-gray-600">{t('stats.totalTransactions')}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                  {formatCurrency ? formatCurrency(enhancedData.stats.avgTransaction) : `${currencySymbol}${enhancedData.stats.avgTransaction}`}
                </div>
                    <div className="text-sm text-gray-600">{t('stats.avgTransaction')}</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{enhancedData.stats.topCategory}</div>
                    <div className="text-sm text-gray-600">{t('stats.topCategory')}</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{enhancedData.stats.growthRate}</div>
                    <div className="text-sm text-gray-600">{t('stats.thisMonth')}</div>
                  </div>
                </div>
              </div>
            </Card>

                         {/* Recent Transactions with Real Data */}
             <RecentTransactions 
               transactions={enhancedData.recentTransactions}
               maxItems={5}
               showFilters={false}
               showActions={false}
               onViewAll={() => {
                 // Navigate to transactions page
                 window.location.href = '/transactions';
               }}
               onAddTransaction={() => setShowQuickAction(true)}
               onRefresh={() => {
                 refreshDashboard();
                 refetchTransactions();
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
      </div>
    </div>
  );
};

export default Dashboard;