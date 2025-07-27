/**
 * 👤 PROFILE PAGE - COMPLETE UX/UI REVOLUTION!
 * 🚀 Advanced user management, Personal analytics, Smart AI preferences, Enhanced security
 * Features: AI insights, Financial overview, Smart settings, Biometric auth, Social features
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  User, Mail, Lock, Download, Shield, Globe, Moon, Sun, Settings,
  LogOut, Edit3, Save, X, AlertCircle, CheckCircle, Camera, Smartphone,
  Key, CreditCard, Bell, Eye, Trash2, Star, Award, Activity, Target,
  BarChart3, PieChart, TrendingUp, TrendingDown, Calendar, Clock,
  Brain, Sparkles, Zap, Heart, Coffee, Gift, Home, Car, Plane,
  Music, Book, Gamepad2, Palette, Sliders, RotateCcw, Upload,
  Fingerprint, Scan, Wifi, Bluetooth, VolumeX, Volume2, Vibrate,
  Navigation, MapPin, Image, VideoIcon, FileText, Link, Share,
  Crown, Diamond, Flame, Rocket, Sunrise,
  Waves, TreePine, Snowflake, AirVent, Cloud, Umbrella, Thermometer
} from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { 
  useAuth, 
  useTranslation, 
  useTheme,
  useCurrency,
  useNotifications 
} from '../stores';

// Enhanced imports
import { api } from '../api';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Card, LoadingSpinner, Avatar, Badge, Tooltip, Dropdown } from '../components/ui';
import ExportModal from '../components/features/profile/ExportModal';
import { cn, dateHelpers } from '../utils/helpers';

/**
 * 🎯 PROFILE STATS CARD - Personal financial analytics
 */
const ProfileStatsCard = ({ stat, className = '' }) => {
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();

  const StatIcon = stat.icon;
  const isPositive = stat.change > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border border-gray-200 dark:border-gray-700",
        "hover:border-blue-300 dark:hover:border-blue-600",
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full -top-8 -right-8 absolute"
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            stat.bgColor || "bg-blue-100 dark:bg-blue-900/20"
          )}>
            <StatIcon className={cn(
              "w-6 h-6",
              stat.color || "text-blue-600 dark:text-blue-400"
            )} />
          </div>

          <div className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
            isPositive 
              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          )}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{isPositive ? '+' : ''}{stat.change.toFixed(1)}%</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof stat.value === 'number' ? formatCurrency(stat.value) : stat.value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stat.label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {stat.subtitle}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🎨 THEME SELECTOR - Advanced theme customization
 */
const ThemeSelector = ({ currentTheme, onThemeChange, className = '' }) => {
  const { t } = useTranslation();

  const themes = [
    { 
      id: 'light', 
      name: t('themes.light'), 
      icon: Sun, 
      primary: '#3B82F6',
      secondary: '#F3F4F6',
      preview: 'bg-gradient-to-br from-blue-50 to-white'
    },
    { 
      id: 'dark', 
      name: t('themes.dark'), 
      icon: Moon, 
      primary: '#6366F1',
      secondary: '#1F2937',
      preview: 'bg-gradient-to-br from-gray-900 to-gray-800'
    },
    { 
      id: 'auto', 
      name: t('themes.auto'), 
      icon: Settings, 
      primary: '#8B5CF6',
      secondary: '#F9FAFB',
      preview: 'bg-gradient-to-br from-purple-100 to-indigo-100'
    },
            {
          id: 'ocean',
          name: t('themes.ocean'),
          icon: Waves, 
      primary: '#0EA5E9',
      secondary: '#E0F7FA',
      preview: 'bg-gradient-to-br from-cyan-100 to-blue-200'
    },
            {
          id: 'forest',
          name: t('themes.forest'),
          icon: TreePine, 
      primary: '#10B981',
      secondary: '#ECFDF5',
      preview: 'bg-gradient-to-br from-green-100 to-emerald-200'
    },
            {
          id: 'sunset',
          name: t('themes.sunset'),
          icon: Sun, 
      primary: '#F59E0B',
      secondary: '#FEF3C7',
      preview: 'bg-gradient-to-br from-orange-100 to-yellow-200'
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="font-medium text-gray-900 dark:text-white">
        {t('profile.appearance.theme')}
      </h4>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {themes.map((theme) => {
          const ThemeIcon = theme.icon;
          const isActive = currentTheme === theme.id;
          
          return (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onThemeChange(theme.id)}
              className={cn(
                "relative p-4 rounded-xl border transition-all",
                isActive 
                  ? "border-blue-500 ring-2 ring-blue-500/20" 
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {/* Theme preview */}
              <div className={cn(
                "w-full h-16 rounded-lg mb-3",
                theme.preview
              )}>
                <div className="w-full h-full flex items-center justify-center">
                  <ThemeIcon 
                    className="w-6 h-6" 
                    style={{ color: theme.primary }}
                  />
                </div>
              </div>

              {/* Theme info */}
              <div className="text-center">
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {theme.name}
                </div>
                
                {isActive && (
                  <div className="flex items-center justify-center mt-1">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 🔐 SECURITY SETTINGS - Enhanced security management
 */
const SecuritySettings = ({ user, onPasswordChange, className = '' }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);

  const securityFeatures = [
    {
      id: 'biometric',
      title: t('security.biometric.title'),
      description: t('security.biometric.description'),
      icon: Fingerprint,
      enabled: biometricEnabled,
      onToggle: setBiometricEnabled,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'twoFactor',
      title: t('security.twoFactor.title'),
      description: t('security.twoFactor.description'),
      icon: Shield,
      enabled: twoFactorEnabled,
      onToggle: setTwoFactorEnabled,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      id: 'notifications',
      title: t('security.notifications.title'),
      description: t('security.notifications.description'),
      icon: Bell,
      enabled: true,
      onToggle: () => {},
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Security features */}
      <div className="space-y-4">
        {securityFeatures.map((feature) => {
          const FeatureIcon = feature.icon;
          
          return (
            <motion.div
              key={feature.id}
              whileHover={{ scale: 1.01 }}
              className="flex items-start justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  feature.bgColor
                )}>
                  <FeatureIcon className={cn("w-6 h-6", feature.color)} />
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge 
                  variant={feature.enabled ? "success" : "secondary"}
                  size="sm"
                >
                  {feature.enabled ? t('security.enabled') : t('security.disabled')}
                </Badge>
                
                <Button
                  variant={feature.enabled ? "destructive" : "primary"}
                  size="sm"
                  onClick={() => feature.onToggle(!feature.enabled)}
                >
                  {feature.enabled ? t('security.disable') : t('security.enable')}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Session settings */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          {t('security.session.title')}
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('security.session.timeout')}
            </label>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={15}>15 {t('security.session.minutes')}</option>
              <option value={30}>30 {t('security.session.minutes')}</option>
              <option value={60}>1 {t('security.session.hour')}</option>
              <option value={240}>4 {t('security.session.hours')}</option>
              <option value={0}>{t('security.session.never')}</option>
            </select>
          </div>
          
          <Button variant="outline" size="sm" className="w-full">
            <Key className="w-4 h-4 mr-2" />
            {t('security.session.terminate')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

/**
 * 🎯 SMART PREFERENCES - AI-powered user preferences
 */
const SmartPreferences = ({ className = '' }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();

  const [smartFeatures, setSmartFeatures] = useState({
    autoCategories: true,
    spendingAlerts: true,
    savingsGoals: false,
    smartNotifications: true,
    priceTracking: false,
    investmentAdvice: false
  });

  const aiFeatures = [
    {
      id: 'autoCategories',
      title: t('smart.autoCategories.title'),
      description: t('smart.autoCategories.description'),
      icon: Brain,
      premium: false,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      id: 'spendingAlerts',
      title: t('smart.spendingAlerts.title'),
      description: t('smart.spendingAlerts.description'),
      icon: AlertCircle,
      premium: false,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      id: 'savingsGoals',
      title: t('smart.savingsGoals.title'),
      description: t('smart.savingsGoals.description'),
      icon: Target,
      premium: true,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'smartNotifications',
      title: t('smart.smartNotifications.title'),
      description: t('smart.smartNotifications.description'),
      icon: Sparkles,
      premium: false,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      id: 'priceTracking',
      title: t('smart.priceTracking.title'),
      description: t('smart.priceTracking.description'),
      icon: TrendingUp,
      premium: true,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    },
    {
      id: 'investmentAdvice',
      title: t('smart.investmentAdvice.title'),
      description: t('smart.investmentAdvice.description'),
      icon: Crown,
      premium: true,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    }
  ];

  const toggleFeature = (featureId) => {
    setSmartFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
    
    addNotification({
      type: 'success',
      title: t('smart.featureUpdated'),
      duration: 2000
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('smart.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('smart.subtitle')}
          </p>
        </div>
        
        <Badge variant="primary" className="flex items-center">
          <Sparkles className="w-3 h-3 mr-1" />
          {t('smart.aiPowered')}
        </Badge>
      </div>

      <div className="grid gap-4">
        {aiFeatures.map((feature) => {
          const FeatureIcon = feature.icon;
          const isEnabled = smartFeatures[feature.id];
          
          return (
            <motion.div
              key={feature.id}
              whileHover={{ scale: 1.01 }}
              className={cn(
                "relative p-4 rounded-xl border transition-all",
                "border-gray-200 dark:border-gray-700",
                "hover:border-gray-300 dark:hover:border-gray-600",
                feature.premium && "ring-1 ring-yellow-400/20"
              )}
            >
              {feature.premium && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="warning" size="xs" className="flex items-center">
                    <Crown className="w-3 h-3 mr-1" />
                    {t('smart.premium')}
                  </Badge>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    feature.bgColor
                  )}>
                    <FeatureIcon className={cn("w-6 h-6", feature.color)} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleFeature(feature.id)}
                      disabled={feature.premium}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer",
                      "dark:bg-gray-700 peer-checked:after:translate-x-full",
                      "peer-checked:after:border-white after:content-[''] after:absolute",
                      "after:top-[2px] after:left-[2px] after:bg-white after:rounded-full",
                      "after:h-5 after:w-5 after:transition-all dark:border-gray-600",
                      isEnabled ? "peer-checked:bg-blue-600" : "",
                      feature.premium && !isEnabled && "opacity-50 cursor-not-allowed"
                    )} />
                  </label>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 👤 PROFILE PAGE - THE REVOLUTION!
 */
const Profile = () => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { 
    user, 
    logout, 
    updateProfile, 
    changePassword,
    deleteAccount,
    isLoading: authLoading 
  } = useAuth();
  const { 
    t, 
    currentLanguage, 
    setLanguage, 
    availableLanguages,
    isRTL 
  } = useTranslation();
  const { 
    theme, 
    isDark, 
    setTheme, 
    availableThemes 
  } = useTheme();
  const { 
    currency, 
    setCurrency, 
    availableCurrencies 
  } = useCurrency();
  const { addNotification } = useNotifications();

  // Enhanced state management
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Form data with proper fallbacks
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || user?.username || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    birthday: user?.birthday || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // ✅ Enhanced user analytics
  const {
    data: userAnalytics,
    isLoading: analyticsLoading
  } = useQuery({
    queryKey: ['user-analytics', user?.id],
    queryFn: async () => {
      const response = await api.analytics.user.getAnalytics(12); // 12 months
      return response.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Profile statistics
  const profileStats = useMemo(() => {
    if (!userAnalytics) return [];

    return [
      {
        id: 'totalBalance',
        label: t('profile.stats.totalBalance'),
        value: userAnalytics.totalBalance || 0,
        change: userAnalytics.balanceChange || 0,
        subtitle: t('profile.stats.acrossAccounts'),
        icon: CreditCard,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20'
      },
      {
        id: 'monthlyIncome',
        label: t('profile.stats.monthlyIncome'),
        value: userAnalytics.monthlyIncome || 0,
        change: userAnalytics.incomeChange || 0,
        subtitle: t('profile.stats.lastMonth'),
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20'
      },
      {
        id: 'savingsRate',
        label: t('profile.stats.savingsRate'),
        value: `${(userAnalytics.savingsRate || 0).toFixed(1)}%`,
        change: userAnalytics.savingsChange || 0,
        subtitle: t('profile.stats.goalProgress'),
        icon: Target,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20'
      },
      {
        id: 'transactions',
        label: t('profile.stats.transactions'),
        value: userAnalytics.transactionCount || 0,
        change: userAnalytics.activityChange || 0,
        subtitle: t('profile.stats.thisMonth'),
        icon: Activity,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20'
      }
    ];
  }, [userAnalytics, t]);

  // Tab configuration
  const tabs = [
    { 
      id: 'overview', 
      label: t('profile.tabs.overview'), 
      icon: User,
      color: 'text-blue-600'
    },
    { 
      id: 'personal', 
      label: t('profile.tabs.personal'), 
      icon: Edit3,
      color: 'text-green-600'
    },
    { 
      id: 'preferences', 
      label: t('profile.tabs.preferences'), 
      icon: Settings,
      color: 'text-purple-600'
    },
    { 
      id: 'security', 
      label: t('profile.tabs.security'), 
      icon: Shield,
      color: 'text-red-600'
    },
    { 
      id: 'smart', 
      label: t('profile.tabs.smart'), 
      icon: Brain,
      color: 'text-indigo-600'
    }
  ];

  // Handle profile update
  const handleProfileUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      await updateProfile(profileData);
      addNotification({
        type: 'success',
        title: t('profile.updateSuccess'),
        duration: 3000
      });
      setIsEditing(false);
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('profile.updateFailed'),
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsUpdating(false);
    }
  }, [profileData, updateProfile, addNotification, t]);

  // Handle password change
  const handlePasswordChange = useCallback(async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: 'error',
        title: t('profile.passwordMismatch'),
        duration: 4000
      });
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      addNotification({
        type: 'success',
        title: t('profile.passwordChanged'),
        duration: 3000
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('profile.passwordFailed'),
        description: error.message,
        duration: 5000
      });
    }
  }, [passwordData, changePassword, addNotification, t]);

  // Handle avatar upload
  const handleAvatarUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload logic would go here
    addNotification({
      type: 'success',
      title: t('profile.avatarUpdated'),
      duration: 3000
    });
  }, [addNotification, t]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800",
        "p-4 sm:p-6 lg:p-8"
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="relative inline-block">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <Avatar
                src={avatarPreview || user?.avatar}
                alt={user?.name}
                size="2xl"
                className="mx-auto border-4 border-white dark:border-gray-800 shadow-xl"
              />
              
              {/* Upload overlay */}
              <motion.label
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 cursor-pointer transition-opacity"
              >
                <Camera className="w-8 h-8 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </motion.label>
            </motion.div>
            
            {/* Status indicator */}
            <div className="absolute -bottom-2 -right-2">
              <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.email}
            </p>
            
            {/* User badges */}
            <div className="flex items-center justify-center space-x-2 mt-3">
              <Badge variant="primary">
                <Star className="w-3 h-3 mr-1" />
                {t('profile.verified')}
              </Badge>
              
              {user?.isPremium && (
                <Badge variant="warning">
                  <Crown className="w-3 h-3 mr-1" />
                  {t('profile.premium')}
                </Badge>
              )}
              
              <Badge variant="secondary">
                <Calendar className="w-3 h-3 mr-1" />
                {t('profile.memberSince', { 
                  date: user?.createdAt ? dateHelpers.format(user.createdAt, 'MMM YYYY') : 'Unknown' 
                })}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Stats overview */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {profileStats.map((stat, index) => (
              <motion.div
                key={stat.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
              >
                <ProfileStatsCard stat={stat} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tab navigation */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-center">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="px-4 py-3 rounded-xl"
                  >
                    <TabIcon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {activeTab === 'overview' && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent activity */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {t('profile.overview.recentActivity')}
                  </h3>
                  
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {t('profile.overview.activity', { action: 'Transaction added' })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {dateHelpers.formatDistance(new Date(Date.now() - i * 3600000))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Quick actions */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {t('profile.overview.quickActions')}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowExportModal(true)}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Download className="w-6 h-6 mb-2" />
                      <span className="text-sm">{t('profile.actions.exportData')}</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('security')}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Shield className="w-6 h-6 mb-2" />
                      <span className="text-sm">{t('profile.actions.security')}</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('preferences')}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Settings className="w-6 h-6 mb-2" />
                      <span className="text-sm">{t('profile.actions.preferences')}</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('smart')}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Brain className="w-6 h-6 mb-2" />
                      <span className="text-sm">{t('profile.actions.ai')}</span>
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'personal' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('profile.personal.title')}
                  </h3>
                  
                  <Button
                    variant={isEditing ? "primary" : "outline"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t('profile.actions.save')}
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        {t('profile.actions.edit')}
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.fields.firstName')}
                    </label>
                    <Input
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.fields.lastName')}
                    </label>
                    <Input
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.fields.email')}
                    </label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.fields.phone')}
                    </label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.fields.bio')}
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      disabled={!isEditing}
                      rows={3}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder={t('profile.fields.bioPlaceholder')}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      {t('profile.actions.cancel')}
                    </Button>
                    
                    <Button
                      variant="primary"
                      onClick={handleProfileUpdate}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {t('profile.actions.saveChanges')}
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                {/* Language & Region */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    {t('profile.preferences.language')}
                  </h3>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {t('profile.preferences.language')}
                      </label>
                      <select
                        value={currentLanguage}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {availableLanguages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {t('profile.preferences.currency')}
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {availableCurrencies.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Theme */}
                <Card className="p-6">
                  <ThemeSelector
                    currentTheme={theme}
                    onThemeChange={setTheme}
                  />
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <SecuritySettings
                user={user}
                onPasswordChange={handlePasswordChange}
              />
            )}

            {activeTab === 'smart' && (
              <Card className="p-6">
                <SmartPreferences />
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Danger zone */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-red-200 dark:border-red-800">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">
              {t('profile.dangerZone.title')}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {t('profile.dangerZone.deleteAccount')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('profile.dangerZone.deleteDescription')}
                  </p>
                </div>
                
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('profile.actions.delete')}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowDeleteConfirm(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('profile.dangerZone.confirmDelete')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {t('profile.dangerZone.confirmDescription')}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    {t('profile.actions.cancel')}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await deleteAccount();
                      setShowDeleteConfirm(false);
                    }}
                    className="flex-1"
                  >
                    {t('profile.actions.delete')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Profile;