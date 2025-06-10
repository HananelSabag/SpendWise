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
  TrendingDown,
  Clock,
  Download,
  FileText,
  FileJson,
  FilePlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useDashboard } from '../hooks/useDashboard';
import { useExport } from '../hooks/useExport';
import { cn, dateHelpers } from '../utils/helpers';

// Layout
import PageContainer from '../components/layout/PageContainer';

// Features
import ProfileInfo from '../components/features/profile/ProfileInfo';
import ProfileSettings from '../components/features/profile/ProfileSettings';
import ExportModal from '../components/features/profile/ExportModal';

// UI
import { Card, Button, Badge, LoadingSpinner, Avatar, Modal } from '../components/ui';

const Profile = () => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isRTL = language === 'he';
  
  const [activeTab, setActiveTab] = useState('info');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Get dashboard data for stats
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard();
  
  // Export hook for data export functionality
  const { isExporting } = useExport();
  
  // Calculate member duration
  const getMemberDuration = () => {
    if (!user?.created_at) return null;
    
    const joinDate = new Date(user.created_at + 'T12:00:00');
    const now = new Date();
    
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth();
    const joinDay = joinDate.getDate();
    
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();
    
    const normalizedJoinDate = new Date(joinYear, joinMonth, joinDay);
    const normalizedNowDate = new Date(nowYear, nowMonth, nowDay);
    
    const diffInMs = normalizedNowDate - normalizedJoinDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 30) {
      return `${diffInDays} ${t('profile.stats.days')}`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${t('profile.stats.months')}`;
    } else {
      const years = Math.floor(diffInDays / 365);
      const remainingMonths = Math.floor((diffInDays % 365) / 30);
      if (remainingMonths > 0) {
        return `${years} ${t('profile.stats.years')}, ${remainingMonths} ${t('profile.stats.months')}`;
      }
      return `${years} ${t('profile.stats.years')}`;
    }
  };
  
  const memberDuration = getMemberDuration();

  // Tabs configuration
  const tabs = [
    { id: 'info', label: t('profile.tabs.general'), icon: User, color: 'text-blue-600 dark:text-blue-400' },
    { id: 'settings', label: t('profile.tabs.preferences'), icon: Settings, color: 'text-purple-600 dark:text-purple-400' }
  ];

  // Calculate stats from dashboard data
  const stats = useMemo(() => {
    if (!dashboardData) return [];
    
    const balances = dashboardData.balances || {};
    const monthlyBalance = balances.monthly || {};
    const statistics = dashboardData.statistics || {};
    const recurringInfo = dashboardData.recurringInfo || {};

    return [
      {
        label: t('profile.stats.thisMonth'),
        value: formatAmount(monthlyBalance.balance || 0),
        icon: monthlyBalance.balance >= 0 ? TrendingUp : TrendingDown,
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
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="large" text={t('common.loading')} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="bg-gray-50 dark:bg-gray-900">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('nav.profile')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('profile.subtitle')}
            </p>
          </div>
          
          {/* Export button */}
          <Button
            variant="outline"
            onClick={() => setShowExportModal(true)}
            icon={Download}
            disabled={isExporting}
          >
            {isExporting ? t('common.exporting') : t('profile.exportData')}
          </Button>
        </motion.div>

        {/* User Card */}
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10"></div>
            
            <div className="relative p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar
                  size="xl"
                  name={user?.username}
                  src={user?.preferences?.profilePicture}
                  className="shadow-xl"
                />
                
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.username}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                    <Badge variant="success">
                      <Award className="w-3 h-3 mr-1" />
                      {t('profile.verified')}
                    </Badge>
                    
                    {memberDuration && (
                      <Badge variant="primary">
                        <Calendar className="w-3 h-3 mr-1" />
                        {memberDuration}
                      </Badge>
                    )}
                    
                    <Badge variant="secondary">
                      <Activity className="w-3 h-3 mr-1" />
                      {t('profile.active')}
                    </Badge>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title={t('auth.logout')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={cn(
                      'w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2',
                      stat.bgColor
                    )}>
                      <stat.icon className={cn('w-6 h-6', stat.color)} />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className={cn('text-lg font-bold mt-1', stat.color)}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Export Modal - Use dedicated component */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

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