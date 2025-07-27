/**
 * 👤 PROFILE HEADER - User Info & Stats Component
 * Extracted from Profile.jsx for better performance and maintainability
 * Features: Avatar upload, User badges, Financial stats, Mobile-first
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Camera, CheckCircle, Star, Crown, Calendar, 
  CreditCard, TrendingUp, Target, Activity,
  Upload, User, Award, Shield
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useCurrency,
  useNotifications
} from '../../../stores';

import { Avatar, Badge, Card, Button, Tooltip } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

/**
 * 📊 Profile Stats Card
 */
const ProfileStatsCard = ({ stat, className = '' }) => {
  const { formatCurrency } = useCurrency();

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
            <TrendingUp className={cn(
              "w-3 h-3",
              !isPositive && "rotate-180"
            )} />
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
          
          {stat.subtitle && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {stat.subtitle}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 👤 Profile Header Main Component
 */
const ProfileHeader = ({
  userAnalytics = {},
  onAvatarUpload,
  className = ''
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('profile');
  const { addNotification } = useNotifications();

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Profile statistics
  const profileStats = useMemo(() => {
    return [
      {
        id: 'totalBalance',
        label: t('stats.totalBalance'),
        value: userAnalytics.totalBalance || 0,
        change: userAnalytics.balanceChange || 0,
        subtitle: t('stats.acrossAccounts'),
        icon: CreditCard,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20'
      },
      {
        id: 'monthlyIncome',
        label: t('stats.monthlyIncome'),
        value: userAnalytics.monthlyIncome || 0,
        change: userAnalytics.incomeChange || 0,
        subtitle: t('stats.lastMonth'),
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20'
      },
      {
        id: 'savingsRate',
        label: t('stats.savingsRate'),
        value: `${(userAnalytics.savingsRate || 0).toFixed(1)}%`,
        change: userAnalytics.savingsChange || 0,
        subtitle: t('stats.goalProgress'),
        icon: Target,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20'
      },
      {
        id: 'transactions',
        label: t('stats.transactions'),
        value: userAnalytics.transactionCount || 0,
        change: userAnalytics.activityChange || 0,
        subtitle: t('stats.thisMonth'),
        icon: Activity,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20'
      }
    ];
  }, [userAnalytics, t]);

  // Handle avatar upload
  const handleAvatarUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'error',
        message: t('avatar.invalidFileType'),
        duration: 3000
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      addNotification({
        type: 'error',
        message: t('avatar.fileTooLarge'),
        duration: 3000
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      // Upload file
      await onAvatarUpload?.(file);
      
      addNotification({
        type: 'success',
        message: t('avatar.uploadSuccess'),
        duration: 3000
      });
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setAvatarPreview(null);
      addNotification({
        type: 'error',
        message: t('avatar.uploadFailed'),
        duration: 3000
      });
    } finally {
      setIsUploading(false);
    }
  }, [onAvatarUpload, addNotification, t]);

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
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-8", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* User Profile Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <div className="relative inline-block">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <Avatar
              src={avatarPreview || user?.avatar}
              alt={user?.name || user?.email}
              size="2xl"
              className="mx-auto border-4 border-white dark:border-gray-800 shadow-xl"
            />
            
            {/* Upload overlay */}
            <motion.label
              whileHover={{ opacity: 1 }}
              className={cn(
                "absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 cursor-pointer transition-opacity",
                isUploading && "opacity-100"
              )}
            >
              {isUploading ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
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

        {/* User Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.name || user?.email?.split('@')[0] || 'User'
            }
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400">
            {user?.email}
          </p>
          
          {/* User badges */}
          <div className="flex items-center justify-center space-x-2 mt-3 flex-wrap gap-2">
            <Badge variant="primary">
              <Star className="w-3 h-3 mr-1" />
              {t('verified')}
            </Badge>
            
            {user?.isPremium && (
              <Badge variant="warning">
                <Crown className="w-3 h-3 mr-1" />
                {t('premium')}
              </Badge>
            )}
            
            <Badge variant="secondary">
              <Calendar className="w-3 h-3 mr-1" />
              {t('memberSince', { 
                date: user?.createdAt 
                  ? dateHelpers.format(user.createdAt, 'MMM yyyy') 
                  : 'Unknown' 
              })}
            </Badge>

            {user?.isVerified && (
              <Badge variant="success">
                <Shield className="w-3 h-3 mr-1" />
                {t('emailVerified')}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Quick Actions Bar */}
      <motion.div variants={itemVariants}>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {t('quickActions.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('quickActions.subtitle')}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Tooltip content={t('quickActions.uploadAvatar')}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </Tooltip>

              <Tooltip content={t('quickActions.editProfile')}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log('Edit profile')}
                >
                  <User className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ProfileHeader;
export { ProfileStatsCard }; 