/**
 * 🔔 NOTIFICATION SETTINGS - Notification Preferences Component
 * Extracted from massive PreferencesStep.jsx for better organization
 * Features: Toggle switches, Categories, Preview, Permission handling
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, BellOff, Mail, Smartphone, MessageSquare, 
  TrendingUp, Shield, Clock, Check, AlertCircle 
} from 'lucide-react';

// ✅ Import stores and components
import { useTranslation, useNotifications } from '../../../../../stores';
import { Card, Switch, Badge, Button } from '../../../../ui';
import { cn } from '../../../../../utils/helpers';
import { getIconComponent } from '../../../../../config/categoryIcons';

/**
 * 🔔 Notification Settings Component
 */
const NotificationSettings = ({
  settings = {},
  onSettingsChange,
  showPermissionRequest = true,
  layout = 'list', // list, grid
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');
  const { addNotification } = useNotifications();
  
  const [permissionStatus, setPermissionStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // ✅ Default notification settings
  const defaultSettings = {
    push: true,
    email: true,
    sms: false,
    budgetAlerts: true,
    transactionAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
    recurringReminders: true,
    securityAlerts: true,
    marketingEmails: false,
    ...settings
  };

  // ✅ Notification categories
  const notificationCategories = [
    {
      id: 'essential',
      title: t('preferences.notifications.categories.essential'),
      description: t('preferences.notifications.categories.essentialDesc'),
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      settings: [
        {
          key: 'securityAlerts',
          title: t('preferences.notifications.security.title'),
          description: t('preferences.notifications.security.description'),
          icon: Shield,
          recommended: true,
          channels: ['push', 'email']
        },
        {
          key: 'budgetAlerts',
          title: t('preferences.notifications.budget.title'),
          description: t('preferences.notifications.budget.description'),
          icon: TrendingUp,
          recommended: true,
          channels: ['push', 'email']
        }
      ]
    },
    {
      id: 'activity',
      title: t('preferences.notifications.categories.activity'),
      description: t('preferences.notifications.categories.activityDesc'),
      icon: Bell,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      settings: [
        {
          key: 'transactionAlerts',
          title: t('preferences.notifications.transactions.title'),
          description: t('preferences.notifications.transactions.description'),
          icon: Bell,
          recommended: true,
          channels: ['push']
        },
        {
          key: 'recurringReminders',
          title: t('preferences.notifications.recurring.title'),
          description: t('preferences.notifications.recurring.description'),
          icon: Clock,
          recommended: true,
          channels: ['push', 'email']
        }
      ]
    },
    {
      id: 'reports',
      title: t('preferences.notifications.categories.reports'),
      description: t('preferences.notifications.categories.reportsDesc'),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      settings: [
        {
          key: 'weeklyReports',
          title: t('preferences.notifications.weekly.title'),
          description: t('preferences.notifications.weekly.description'),
          icon: TrendingUp,
          recommended: false,
          channels: ['email']
        },
        {
          key: 'monthlyReports',
          title: t('preferences.notifications.monthly.title'),
          description: t('preferences.notifications.monthly.description'),
          icon: TrendingUp,
          recommended: false,
          channels: ['email']
        }
      ]
    },
    {
      id: 'marketing',
      title: t('preferences.notifications.categories.marketing'),
      description: t('preferences.notifications.categories.marketingDesc'),
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      settings: [
        {
          key: 'marketingEmails',
          title: t('preferences.notifications.marketing.title'),
          description: t('preferences.notifications.marketing.description'),
          icon: Mail,
          recommended: false,
          channels: ['email']
        }
      ]
    }
  ];

  // ✅ Channel options
  const channels = [
    {
      key: 'push',
      title: t('preferences.notifications.channels.push'),
      description: t('preferences.notifications.channels.pushDesc'),
      icon: Smartphone,
      requiresPermission: true
    },
    {
      key: 'email',
      title: t('preferences.notifications.channels.email'),
      description: t('preferences.notifications.channels.emailDesc'),
      icon: Mail,
      requiresPermission: false
    },
    {
      key: 'sms',
      title: t('preferences.notifications.channels.sms'),
      description: t('preferences.notifications.channels.smsDesc'),
      icon: MessageSquare,
      requiresPermission: false
    }
  ];

  // ✅ Request push notification permission
  const requestPushPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      addNotification({
        type: 'error',
        message: t('preferences.notifications.notSupported'),
        duration: 4000
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        addNotification({
          type: 'success',
          message: t('preferences.notifications.permissionGranted'),
          duration: 3000
        });
        
        // Enable push notifications
        onSettingsChange?.({ ...defaultSettings, push: true });
      } else {
        addNotification({
          type: 'warning',
          message: t('preferences.notifications.permissionDenied'),
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      addNotification({
        type: 'error',
        message: t('preferences.notifications.permissionError'),
        duration: 4000
      });
    }
  }, [defaultSettings, onSettingsChange, addNotification, t]);

  // ✅ Toggle setting
  const toggleSetting = useCallback((key, value) => {
    const newSettings = {
      ...defaultSettings,
      [key]: value
    };
    onSettingsChange?.(newSettings);
  }, [defaultSettings, onSettingsChange]);

  // ✅ Toggle channel
  const toggleChannel = useCallback((channelKey, value) => {
    if (channelKey === 'push' && value && permissionStatus !== 'granted') {
      requestPushPermission();
      return;
    }

    const newSettings = {
      ...defaultSettings,
      [channelKey]: value
    };
    onSettingsChange?.(newSettings);
  }, [defaultSettings, onSettingsChange, permissionStatus, requestPushPermission]);

  // ✅ Animation variants
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
      transition: { duration: 0.3 }
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
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('preferences.notifications.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('preferences.notifications.description')}
          </p>
        </div>
      </div>

      {/* Permission Request */}
      {showPermissionRequest && permissionStatus === 'default' && (
        <motion.div variants={itemVariants}>
          <Card className="p-4 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  {t('preferences.notifications.enablePush')}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {t('preferences.notifications.enablePushDesc')}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={requestPushPermission}
                  className="mt-3"
                >
                  {t('preferences.notifications.allowNotifications')}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Notification Channels */}
      <motion.div variants={itemVariants}>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('preferences.notifications.channels.title')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {channels.map((channel) => {
            const IconComponent = channel.icon;
            const isEnabled = defaultSettings[channel.key];
            const canEnable = !channel.requiresPermission || permissionStatus === 'granted';
            
            return (
              <Card
                key={channel.key}
                className={cn(
                  "p-3 transition-all",
                  isEnabled && canEnable 
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={cn(
                      "w-4 h-4",
                      isEnabled && canEnable ? "text-green-600" : "text-gray-500"
                    )} />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {channel.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {channel.description}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled && canEnable}
                    onCheckedChange={(value) => toggleChannel(channel.key, value)}
                    disabled={channel.requiresPermission && permissionStatus !== 'granted'}
                  />
                </div>
                
                {channel.requiresPermission && permissionStatus !== 'granted' && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{t('preferences.notifications.permissionRequired')}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Notification Categories */}
      <motion.div variants={itemVariants}>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('preferences.notifications.settings.title')}
        </h4>
        <div className="space-y-4">
          {notificationCategories.map((category) => {
            return (
              <Card key={category.id} className="p-4">
                {/* Category Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", category.bgColor)}>
                    {React.createElement(getIconComponent(category.icon), { className: cn("w-5 h-5", category.color) })}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {category.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Category Settings */}
                <div className="space-y-3">
                  {category.settings.map((setting) => {
                    const SettingIcon = setting.icon;
                    const isEnabled = defaultSettings[setting.key];
                    
                    return (
                      <div key={setting.key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <SettingIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {setting.title}
                              </span>
                              {setting.recommended && (
                                <Badge variant="success" size="sm">
                                  {t('preferences.notifications.recommended')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {setting.description}
                            </p>
                            {setting.channels && (
                              <div className="flex items-center space-x-1 mt-1">
                                {setting.channels.map(channel => (
                                  <Badge key={channel} variant="outline" size="xs">
                                    {t(`preferences.notifications.channels.${channel}`)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(value) => toggleSetting(setting.key, value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div variants={itemVariants}>
        <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('preferences.notifications.summary.title')}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {t('preferences.notifications.summary.enabled')}:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {Object.values(defaultSettings).filter(Boolean).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                {t('preferences.notifications.summary.channels')}:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {[defaultSettings.push, defaultSettings.email, defaultSettings.sms].filter(Boolean).length}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('preferences.notifications.help')}
      </div>
    </motion.div>
  );
};

export default NotificationSettings; 