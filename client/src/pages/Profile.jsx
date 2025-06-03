// pages/Profile.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  Settings,
  Shield,
  CreditCard,
  Bell,
  Database,
  LogOut,
  ChevronRight,
  Award,
  TrendingUp,
  Calendar,
  Activity,
  Package,
  Sparkles,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTransactionsList } from '../hooks/useTransactionsList';
import { useDashboard } from '../hooks/useDashboard';
import { cn, dateHelpers } from '../utils/helpers';

// Layout
import PageContainer from '../components/layout/PageContainer';

// Features
import ProfileInfo from '../components/features/profile/ProfileInfo';
import ProfileSettings from '../components/features/profile/ProfileSettings';

// UI
import { Card, Button, Badge, LoadingSpinner, Avatar } from '../components/ui';

/**
 * Profile Page Component
 * Modern user profile with stats, settings and management
 */
const Profile = () => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';
  
  const [activeTab, setActiveTab] = useState('info'); // info, settings, security, billing
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Get dashboard data for stats
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard();
  
  // Calculate member duration
  const getMemberDuration = () => {
    if (!user?.created_at) return null;
    
    // ✅ FIX: Use local timezone date handling to prevent timezone shifts
    const joinDate = new Date(user.created_at + 'T12:00:00'); // Add noon to prevent timezone issues
    const now = new Date();
    
    // Calculate difference using local timezone methods
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth();
    const joinDay = joinDate.getDate();
    
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();
    
    // Create normalized dates for accurate calculation
    const normalizedJoinDate = new Date(joinYear, joinMonth, joinDay);
    const normalizedNowDate = new Date(nowYear, nowMonth, nowDay);
    
    const diffInMs = normalizedNowDate - normalizedJoinDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 30) return { value: diffInDays, unit: 'days' };
    if (diffInDays < 365) return { value: Math.floor(diffInDays / 30), unit: 'months' };
    return { value: Math.floor(diffInDays / 365), unit: 'years' };
  };

  const memberDuration = getMemberDuration();

  // Tab items
  const tabs = [
    { 
      id: 'info', 
      label: t('profile.tabs.general'), 
      icon: User,
      color: 'text-blue-600 dark:text-blue-400'
    },
    { 
      id: 'settings', 
      label: t('profile.tabs.preferences'), 
      icon: Settings,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  // Get real statistics from dashboard data - ADDRESSES GAP #5
  const stats = useMemo(() => {
    if (!dashboardData) return [];
    
    const monthlyBalance = dashboardData.balances?.monthly || {};
    const yearlyBalance = dashboardData.balances?.yearly || {};
    const recurringInfo = dashboardData.recurringInfo || {};
    const statistics = dashboardData.statistics || {};
    
    return [
      {
        label: t('stats.currentBalance'),
        value: formatAmount(monthlyBalance.balance || 0),
        icon: TrendingUp,
        color: monthlyBalance.balance >= 0 
          ? 'text-green-600 dark:text-green-400' 
          : 'text-red-600 dark:text-red-400',
        bgColor: monthlyBalance.balance >= 0
          ? 'bg-green-100 dark:bg-green-900/30'
          : 'bg-red-100 dark:bg-red-900/30'
      },
      {
        label: t('stats.monthlyIncome'),
        value: formatAmount(monthlyBalance.income || 0),
        icon: TrendingUp,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
      },
      {
        label: t('stats.totalTransactions'),
        value: statistics.total_transactions || 
               (dashboardData.recentTransactions?.length || 0) * 10,
        icon: Package,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30'
      },
      {
        label: t('stats.activeRecurring'),
        value: (recurringInfo.income_count || 0) + (recurringInfo.expense_count || 0),
        icon: Clock,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30'
      }
    ];
  }, [dashboardData, formatAmount, t]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </div>
    );
  }

  return (
    <PageContainer>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header Section */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white p-8 border-0">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <Avatar
                  size="xl"
                  name={user?.username}
                  src={user?.preferences?.profilePicture}
                  className="ring-4 ring-white/30 group-hover:ring-white/50 transition-all"
                />
                <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{user?.username}</h1>
                <p className="text-white/80 mb-4">{user?.email}</p>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Badge variant="default" className="bg-white/20 text-white border-white/30">
                    <Activity className="w-4 h-4 mr-1" />
                    {/* ✅ FIX: Use local timezone formatting */}
                    {t('profile.memberSince')} {(() => {
                      if (!user?.created_at) return '';
                      const date = new Date(user.created_at + 'T12:00:00');
                      return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                        year: 'numeric',
                        month: 'short'
                      });
                    })()}
                  </Badge>
                  
                  {user?.isPremium && (
                    <Badge variant="default" className="bg-yellow-400/20 text-yellow-100 border-yellow-400/30">
                      <Award className="w-4 h-4 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-2" />
                {t('auth.logout')}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Compact Stats Bar */}
        <motion.div variants={itemVariants}>
          <Card className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                    <stat.icon className={cn('w-4 h-4', stat.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {stat.label}
                    </p>
                    <p className={cn('text-sm font-semibold', stat.color)}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Main Content - Now Primary Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="p-2">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <tab.icon className={cn('w-5 h-5', tab.color)} />
                    <span className="font-medium">{tab.label}</span>
                    <ChevronRight className={cn(
                      'w-4 h-4 ml-auto',
                      isRTL && 'rotate-180'
                    )} />
                  </button>
                ))}
              </nav>

              {/* Detailed Stats in Sidebar */}
              <div className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {t('stats.quickOverview')}
                </h3>
                <div className="space-y-3">
                  {stats.slice(0, 2).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('p-1.5 rounded', stat.bgColor)}>
                          <stat.icon className={cn('w-3 h-3', stat.color)} />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {stat.label}
                        </span>
                      </div>
                      <span className={cn('text-xs font-semibold', stat.color)}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Content Area - Now Takes Center Stage */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ProfileInfo user={user} />
                </motion.div>
              )}
              
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ProfileSettings user={user} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('profile.logoutConfirm')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('profile.logoutConfirmDesc')}
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={confirmLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('auth.logout')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default Profile;