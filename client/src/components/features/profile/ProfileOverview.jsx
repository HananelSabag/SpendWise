/**
 * 📊 PROFILE OVERVIEW - Activity Dashboard Component
 * Extracted from Profile.jsx for better performance and maintainability
 * Features: Recent activity feed, Quick actions grid, Achievement showcase, Mobile-first
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, Calendar, Award, Star, Gift,
  Download, Settings, Edit3, Share, Bell, Target,
  CreditCard, PieChart, BarChart3, Clock, Users,
  Zap, Heart, Coffee, Book, Smartphone
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useCurrency
} from '../../../stores';

import { Button, Card, Badge, Avatar, Tooltip } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

/**
 * 📈 Activity Item Component
 */
const ActivityItem = ({ activity, className = '' }) => {
  const { formatCurrency } = useCurrency();

  const ActivityIcon = activity.icon;
  const isPositive = activity.type === 'income' || activity.type === 'achievement';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg",
        "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700",
        "transition-colors cursor-pointer",
        className
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
        isPositive 
          ? "bg-green-100 dark:bg-green-900/20" 
          : activity.type === 'expense'
            ? "bg-red-100 dark:bg-red-900/20"
            : "bg-blue-100 dark:bg-blue-900/20"
      )}>
        <ActivityIcon className={cn(
          "w-5 h-5",
          isPositive 
            ? "text-green-600 dark:text-green-400" 
            : activity.type === 'expense'
              ? "text-red-600 dark:text-red-400"
              : "text-blue-600 dark:text-blue-400"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {activity.title}
          </div>
          
          {activity.amount && (
            <div className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {isPositive ? '+' : '-'}{formatCurrency(Math.abs(activity.amount))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 truncate">
            {activity.description}
          </div>
          
          <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
            {dateHelpers.formatDistance(activity.timestamp)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🏆 Achievement Card Component
 */
const AchievementCard = ({ achievement, className = '' }) => {
  const { t } = useTranslation('profile');

  const AchievementIcon = achievement.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 1 }}
      className={cn(
        "relative p-4 rounded-xl text-center",
        "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
        "border border-yellow-200 dark:border-yellow-700",
        className
      )}
    >
      {/* Sparkle effect */}
      <div className="absolute top-2 right-2">
        <Star className="w-4 h-4 text-yellow-500" />
      </div>

      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
        <AchievementIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
      </div>
      
      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
        {achievement.title}
      </div>
      
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {achievement.description}
      </div>

      {achievement.progress && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {achievement.progress}%
          </div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * ⚡ Quick Action Button Component
 */
const QuickActionButton = ({ action, onClick, className = '' }) => {
  const ActionIcon = action.icon;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick?.(action)}
      className={cn(
        "p-4 rounded-xl border border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
        "flex flex-col items-center space-y-2 transition-colors",
        action.primary && "ring-2 ring-blue-500/20 border-blue-200 dark:border-blue-700",
        className
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center",
        action.color ? action.bgColor : "bg-blue-100 dark:bg-blue-900/20"
      )}>
        <ActionIcon className={cn(
          "w-6 h-6",
          action.color || "text-blue-600 dark:text-blue-400"
        )} />
      </div>
      
      <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
        {action.title}
      </div>
      
      {action.badge && (
        <Badge variant={action.badge.variant} size="xs">
          {action.badge.text}
        </Badge>
      )}
    </motion.button>
  );
};

/**
 * 📊 Profile Overview Main Component
 */
const ProfileOverview = ({ 
  recentActivity = [],
  achievements = [],
  onQuickAction,
  className = ''
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('profile');

  // Mock recent activity if none provided
  const activityData = useMemo(() => {
    if (recentActivity.length > 0) return recentActivity;

    return [
      {
        id: 1,
        type: 'expense',
        title: t('overview.activity.expense'),
        description: t('overview.activity.expenseDesc'),
        amount: 24.50,
        icon: CreditCard,
        timestamp: new Date(Date.now() - 1 * 3600000)
      },
      {
        id: 2,
        type: 'income',
        title: t('overview.activity.income'),
        description: t('overview.activity.incomeDesc'),
        amount: 1200.00,
        icon: TrendingUp,
        timestamp: new Date(Date.now() - 6 * 3600000)
      },
      {
        id: 3,
        type: 'achievement',
        title: t('overview.activity.achievement'),
        description: t('overview.activity.achievementDesc'),
        icon: Award,
        timestamp: new Date(Date.now() - 12 * 3600000)
      },
      {
        id: 4,
        type: 'setting',
        title: t('overview.activity.setting'),
        description: t('overview.activity.settingDesc'),
        icon: Settings,
        timestamp: new Date(Date.now() - 24 * 3600000)
      }
    ];
  }, [recentActivity, t]);

  // Mock achievements if none provided
  const achievementData = useMemo(() => {
    if (achievements.length > 0) return achievements;

    return [
      {
        id: 1,
        title: t('overview.achievements.saver'),
        description: t('overview.achievements.saverDesc'),
        icon: Target,
        progress: 85
      },
      {
        id: 2,
        title: t('overview.achievements.streak'),
        description: t('overview.achievements.streakDesc'),
        icon: Calendar,
        progress: 100
      },
      {
        id: 3,
        title: t('overview.achievements.categories'),
        description: t('overview.achievements.categoriesDesc'),
        icon: PieChart,
        progress: 65
      },
      {
        id: 4,
        title: t('overview.achievements.budgeter'),
        description: t('overview.achievements.budgeterDesc'),
        icon: BarChart3,
        progress: 40
      }
    ];
  }, [achievements, t]);

  // Quick actions configuration
  const quickActions = [
    {
      id: 'export',
      title: t('overview.quickActions.export'),
      icon: Download,
      primary: true,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      id: 'preferences',
      title: t('overview.quickActions.preferences'),
      icon: Settings,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-700'
    },
    {
      id: 'security',
      title: t('overview.quickActions.security'),
      icon: Bell,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      id: 'share',
      title: t('overview.quickActions.share'),
      icon: Share,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'smart',
      title: t('overview.quickActions.smart'),
      icon: Zap,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      badge: user?.isPremium ? null : { variant: 'warning', text: 'Premium' }
    },
    {
      id: 'help',
      title: t('overview.quickActions.help'),
      icon: Book,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
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
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('overview.recentActivity')}
              </h3>
              
              <Badge variant="outline" size="sm">
                {activityData.length} {t('overview.items')}
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activityData.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <ActivityItem activity={activity} />
                </motion.div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" size="sm" className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                {t('overview.viewAll')}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('overview.quickActions.title')}
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <QuickActionButton
                    action={action}
                    onClick={onQuickAction}
                  />
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('overview.achievements.title')}
            </h3>
            
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {achievementData.filter(a => a.progress === 100).length} / {achievementData.length}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievementData.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
              >
                <AchievementCard achievement={achievement} />
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ProfileOverview;
export { ActivityItem, AchievementCard, QuickActionButton }; 