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
import { useTranslation, useNotifications, useAuth } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { LoadingSpinner, Button, Card } from '../components/ui';

/**
 * 📊 Beautiful Dashboard Component
 */
const Dashboard = () => {
  // ✅ ALL HOOKS AT TOP - NEVER CONDITIONAL
  const { t, currentLanguage, isRTL } = useTranslation('dashboard');
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  
  // ✅ Local state hooks
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [quickActionType, setQuickActionType] = useState('expense');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  
  // ✅ Data fetching hook
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
    const userName = user?.first_name || user?.username || user?.email?.split('@')[0] || t('common.user', 'User');
    
    if (hour < 12) return t('welcome.goodMorning', { name: userName });
    if (hour < 17) return t('welcome.goodAfternoon', { name: userName });
    if (hour < 21) return t('welcome.goodEvening', { name: userName });
    return t('welcome.general', { name: userName });
  }, [user, t]);

  // ✅ Profile picture placeholder
  const profilePicture = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.first_name || user?.username || 'User')}&background=3b82f6&color=ffffff&size=120`;

  // ✅ Date formatting based on current language
  const formatDate = useCallback((date) => {
    const dateObj = new Date(date);
    return currentLanguage === 'he' 
      ? dateObj.toLocaleDateString('he-IL')
      : dateObj.toLocaleDateString('en-US');
  }, [currentLanguage]);

  // ✅ Currency symbol based on language
  const currencySymbol = currentLanguage === 'he' ? '₪' : '$';

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

  // ✅ Enhanced data with translation support (replace with real data)
  const enhancedData = useMemo(() => ({
    balance: dashboardData?.balance?.current || 3870,
    periods: {
      daily: { income: 0, expenses: 120, net: -120 },
      weekly: { income: 500, expenses: 840, net: -340 },
      monthly: { income: 2200, expenses: 1650, net: 550 },
      yearly: { income: 26400, expenses: 19800, net: 6600 }
    },
    stats: {
      totalTransactions: 47,
      avgTransaction: 285,
      topCategory: t('common.categories.food', 'Food & Dining'),
      growthRate: '+12.5%'
    },
    recentTransactions: dashboardData?.recentTransactions || [
      { 
        id: 1, 
        description: t('common.transactions.groceries', 'Grocery Shopping'), 
        amount: -120, 
        category: t('common.categories.food', 'Food'), 
        date: '2025-01-27' 
      },
      { 
        id: 2, 
        description: t('common.transactions.salary', 'Salary'), 
        amount: 5000, 
        category: t('common.categories.income', 'Income'), 
        date: '2025-01-26' 
      },
      { 
        id: 3, 
        description: t('common.transactions.fuel', 'Car Fuel'), 
        amount: -200, 
        category: t('common.categories.transport', 'Transportation'), 
        date: '2025-01-25' 
      },
      { 
        id: 4, 
        description: t('common.transactions.coffee', 'Coffee'), 
        amount: -18, 
        category: t('common.categories.entertainment', 'Entertainment'), 
        date: '2025-01-25' 
      },
      { 
        id: 5, 
        description: t('common.transactions.electricity', 'Electricity Bill'), 
        amount: -350, 
        category: t('common.categories.bills', 'Bills'), 
        date: '2025-01-24' 
      }
    ]
  }), [dashboardData, t]);

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
                <img 
                  src={profilePicture}
                  alt={t('common.profilePicture', 'Profile Picture')}
                  className="w-16 h-16 rounded-full border-4 border-blue-500 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {greeting}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t('overview')} • {formatDate(new Date())}
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

        {/* Balance Panel with Tabs */}
        <Card className="mb-8 overflow-hidden shadow-2xl border-0">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('balance.title')}</h2>
              <PiggyBank className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold mb-2">
              {currencySymbol}{enhancedData.balance.toLocaleString()}
            </div>
            <div className="flex items-center text-blue-100">
              <TrendingUp className="w-4 h-4 mr-1" />
              {enhancedData.stats.growthRate} {t('stats.thisMonth')}
            </div>
          </div>
          
          {/* Period Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              {Object.keys(enhancedData.periods).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    selectedPeriod === period
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {t(`timePeriods.${period}`)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Period Data */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <ArrowUpRight className={`w-5 h-5 text-green-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('balance.income')}</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {currencySymbol}{enhancedData.periods[selectedPeriod].income.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <ArrowDownRight className={`w-5 h-5 text-red-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('balance.expenses')}</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {currencySymbol}{enhancedData.periods[selectedPeriod].expenses.toLocaleString()}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className={`w-5 h-5 text-blue-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('balance.net')}</span>
                </div>
                <div className={`text-2xl font-bold ${
                  enhancedData.periods[selectedPeriod].net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currencySymbol}{enhancedData.periods[selectedPeriod].net.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </Card>

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
                    <div className="text-2xl font-bold text-green-600">{currencySymbol}{enhancedData.stats.avgTransaction}</div>
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

            {/* Recent Transactions */}
            <Card className="shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('recentTransactions.title')}
                  </h3>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {t('recentTransactions.viewAll')}
                  </Button>
                </div>
                
                {enhancedData.recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {enhancedData.recentTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                          <div className={`w-3 h-3 rounded-full ${transaction.amount > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {transaction.description}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.category} • {formatDate(transaction.date)}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold text-lg ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{currencySymbol}{Math.abs(transaction.amount).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('recentTransactions.noTransactions')}</p>
                  </div>
                )}
              </div>
            </Card>

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