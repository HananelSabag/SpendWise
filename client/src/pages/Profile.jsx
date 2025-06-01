// pages/Profile.jsx
import React, { useState, useEffect } from 'react';
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
  Sparkles
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
    const joinDate = new Date(user.created_at);
    const now = new Date();
    const diffInDays = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
    
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
    },
    { 
      id: 'security', 
      label: t('profile.tabs.security'), 
      icon: Shield,
      color: 'text-green-600 dark:text-green-400'
    },
    { 
      id: 'billing', 
      label: t('profile.tabs.billing'), 
      icon: CreditCard,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  // Stats data
  const stats = [
    {
      label: t('profile.stats.totalTransactions'),
      value: dashboardData?.stats?.totalTransactions || 0,
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      label: t('profile.stats.thisMonth'),
      value: formatAmount(dashboardData?.balances?.monthly?.balance || 0),
      icon: TrendingUp,
      color: dashboardData?.balances?.monthly?.balance >= 0 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-400',
      bgColor: dashboardData?.balances?.monthly?.balance >= 0
        ? 'bg-green-100 dark:bg-green-900/30'
        : 'bg-red-100 dark:bg-red-900/30'
    },
    {
      label: t('profile.stats.activeDays'),
      value: memberDuration ? `${memberDuration.value}` : '0',
      unit: memberDuration ? t(`profile.stats.${memberDuration.unit}`) : '',
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      label: t('profile.stats.successRate'),
      value: '92%',
      icon: Award,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
    }
  ];

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
                  src={user?.profilePicture}
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
                    {t('profile.memberSince')} {dateHelpers.format(user?.created_at, 'MMM yyyy', language)}
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

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className={cn('text-2xl font-bold mt-1', stat.color)}>
                      {stat.value}
                      {stat.unit && (
                        <span className="text-sm font-normal ml-1">{stat.unit}</span>
                      )}
                    </p>
                  </div>
                  <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                    <stat.icon className={cn('w-6 h-6', stat.color)} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
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

              {/* Quick Actions */}
              <div className="mt-6 p-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('profile.quickActions')}
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="small"
                    fullWidth
                    className="justify-start"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {t('profile.exportData')}
                  </Button>
                  <Button
                    variant="outline"
                    size="small"
                    fullWidth
                    className="justify-start"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    {t('profile.notifications')}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Content Area */}
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
              
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                      {t('profile.securitySettings')}
                    </h2>
                    {/* Security content will go here */}
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('profile.comingSoon')}
                    </p>
                  </Card>
                </motion.div>
              )}
              
              {activeTab === 'billing' && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                      {t('profile.billingSettings')}
                    </h2>
                    {/* Billing content will go here */}
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('profile.comingSoon')}
                    </p>
                  </Card>
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