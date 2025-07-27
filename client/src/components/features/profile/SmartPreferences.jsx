/**
 * 🧠 SMART PREFERENCES - AI Features & Premium Settings Component
 * Extracted from Profile.jsx for better performance and maintainability
 * Features: AI auto-categorization, Smart notifications, Premium features, Mobile-first
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Sparkles, Target, AlertCircle, TrendingUp, Crown,
  Bell, Zap, Heart, Coffee, Gift, Settings, 
  Star, Award, Lightbulb, Shield, Lock
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useNotifications
} from '../../../stores';

import { Button, Card, Badge, Switch, Tooltip, Slider } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * 🎯 Smart Feature Card
 */
const SmartFeatureCard = ({ 
  feature, 
  onToggle, 
  className = '' 
}) => {
  const { user } = useAuth();
  const { t } = useTranslation('smart');

  const FeatureIcon = feature.icon;
  const isAvailable = !feature.premium || user?.isPremium;

  return (
    <motion.div
      layout
      whileHover={isAvailable ? { scale: 1.02 } : {}}
      className={cn(
        "p-4 rounded-xl border border-gray-200 dark:border-gray-700",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        feature.enabled && isAvailable && "ring-2 ring-blue-500/20 border-blue-200 dark:border-blue-700",
        !isAvailable && "opacity-60",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center relative",
            feature.bgColor || "bg-blue-100 dark:bg-blue-900/20"
          )}>
            <FeatureIcon className={cn(
              "w-6 h-6",
              feature.color || "text-blue-600 dark:text-blue-400"
            )} />
            
            {feature.premium && (
              <div className="absolute -top-1 -right-1">
                <Crown className="w-4 h-4 text-yellow-500" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {feature.title}
              </h4>
              
              {feature.premium && (
                <Badge variant="warning" size="xs">
                  {t('premium')}
                </Badge>
              )}

              {feature.beta && (
                <Badge variant="secondary" size="xs">
                  {t('beta')}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {feature.description}
            </p>

            {/* Feature metrics */}
            {feature.metrics && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {feature.metrics.map((metric, index) => (
                  <div key={index} className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {metric.value}
                    </div>
                    <div className="text-xs text-gray-500">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Badge 
                variant={feature.enabled && isAvailable ? "success" : "secondary"}
                size="sm"
              >
                {!isAvailable 
                  ? t('requiresPremium')
                  : feature.enabled 
                    ? t('enabled') 
                    : t('disabled')
                }
              </Badge>
              
              <Switch
                checked={feature.enabled && isAvailable}
                onCheckedChange={(checked) => onToggle(feature.id, checked)}
                disabled={!isAvailable}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🎛️ AI Sensitivity Settings
 */
const AISensitivitySettings = ({ 
  settings, 
  onSettingsChange, 
  className = '' 
}) => {
  const { t } = useTranslation('smart');

  const handleSliderChange = (setting, value) => {
    onSettingsChange?.({
      ...settings,
      [setting]: value
    });
  };

  return (
    <Card className={cn("p-6", className)}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {t('aiSettings.title')}
      </h3>

      <div className="space-y-6">
        {/* Category Detection Sensitivity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('aiSettings.categoryDetection')}
            </label>
            <span className="text-sm text-gray-500">
              {settings.categoryDetection || 70}%
            </span>
          </div>
          <Slider
            value={[settings.categoryDetection || 70]}
            onValueChange={([value]) => handleSliderChange('categoryDetection', value)}
            max={100}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t('aiSettings.conservative')}</span>
            <span>{t('aiSettings.aggressive')}</span>
          </div>
        </div>

        {/* Spending Alert Threshold */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('aiSettings.spendingAlerts')}
            </label>
            <span className="text-sm text-gray-500">
              {settings.spendingAlerts || 80}%
            </span>
          </div>
          <Slider
            value={[settings.spendingAlerts || 80]}
            onValueChange={([value]) => handleSliderChange('spendingAlerts', value)}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t('aiSettings.relaxed')}</span>
            <span>{t('aiSettings.strict')}</span>
          </div>
        </div>

        {/* Insights Frequency */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('aiSettings.insightsFrequency')}
            </label>
            <span className="text-sm text-gray-500">
              {['Daily', 'Weekly', 'Monthly'][Math.floor((settings.insightsFrequency || 1) / 33)] || 'Weekly'}
            </span>
          </div>
          <Slider
            value={[settings.insightsFrequency || 33]}
            onValueChange={([value]) => handleSliderChange('insightsFrequency', value)}
            max={100}
            step={33}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t('aiSettings.daily')}</span>
            <span>{t('aiSettings.weekly')}</span>
            <span>{t('aiSettings.monthly')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * 🧠 Smart Preferences Main Component
 */
const SmartPreferences = ({
  onFeatureToggle,
  onAISettingsChange,
  aiSettings = {},
  className = ''
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('smart');
  const { addNotification } = useNotifications();

  const [smartFeatures, setSmartFeatures] = useState({
    autoCategories: true,
    spendingAlerts: true,
    savingsGoals: false,
    smartNotifications: true,
    priceTracking: false,
    investmentAdvice: false,
    budgetOptimization: false,
    fraudDetection: true,
    personalization: true
  });

  // AI Features configuration
  const aiFeatures = [
    {
      id: 'autoCategories',
      title: t('autoCategories.title'),
      description: t('autoCategories.description'),
      icon: Brain,
      premium: false,
      beta: false,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      enabled: smartFeatures.autoCategories,
      metrics: [
        { label: t('accuracy'), value: '94%' },
        { label: t('saved'), value: '2.3h' }
      ]
    },
    {
      id: 'spendingAlerts',
      title: t('spendingAlerts.title'),
      description: t('spendingAlerts.description'),
      icon: AlertCircle,
      premium: false,
      beta: false,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      enabled: smartFeatures.spendingAlerts,
      metrics: [
        { label: t('alerts'), value: '12' },
        { label: t('prevented'), value: '$420' }
      ]
    },
    {
      id: 'savingsGoals',
      title: t('savingsGoals.title'),
      description: t('savingsGoals.description'),
      icon: Target,
      premium: true,
      beta: false,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      enabled: smartFeatures.savingsGoals,
      metrics: [
        { label: t('goalProgress'), value: '78%' },
        { label: t('projected'), value: '3 mo' }
      ]
    },
    {
      id: 'smartNotifications',
      title: t('smartNotifications.title'),
      description: t('smartNotifications.description'),
      icon: Sparkles,
      premium: false,
      beta: false,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      enabled: smartFeatures.smartNotifications
    },
    {
      id: 'priceTracking',
      title: t('priceTracking.title'),
      description: t('priceTracking.description'),
      icon: TrendingUp,
      premium: true,
      beta: false,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      enabled: smartFeatures.priceTracking
    },
    {
      id: 'investmentAdvice',
      title: t('investmentAdvice.title'),
      description: t('investmentAdvice.description'),
      icon: Crown,
      premium: true,
      beta: false,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      enabled: smartFeatures.investmentAdvice
    },
    {
      id: 'budgetOptimization',
      title: t('budgetOptimization.title'),
      description: t('budgetOptimization.description'),
      icon: Zap,
      premium: true,
      beta: true,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
      enabled: smartFeatures.budgetOptimization
    },
    {
      id: 'fraudDetection',
      title: t('fraudDetection.title'),
      description: t('fraudDetection.description'),
      icon: Shield,
      premium: false,
      beta: false,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      enabled: smartFeatures.fraudDetection
    },
    {
      id: 'personalization',
      title: t('personalization.title'),
      description: t('personalization.description'),
      icon: Heart,
      premium: false,
      beta: false,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-100 dark:bg-rose-900/20',
      enabled: smartFeatures.personalization
    }
  ];

  // Handle feature toggle
  const toggleFeature = useCallback(async (featureId, enabled) => {
    const feature = aiFeatures.find(f => f.id === featureId);
    
    // Check premium requirement
    if (feature?.premium && !user?.isPremium) {
      addNotification({
        type: 'warning',
        message: t('requiresPremiumMessage'),
        duration: 4000
      });
      return;
    }

    setSmartFeatures(prev => ({
      ...prev,
      [featureId]: enabled
    }));
    
    try {
      await onFeatureToggle?.(featureId, enabled);
      
      addNotification({
        type: 'success',
        message: t('featureUpdated', {
          feature: feature?.title,
          status: enabled ? t('enabled') : t('disabled')
        }),
        duration: 2000
      });
    } catch (error) {
      // Revert on error
      setSmartFeatures(prev => ({
        ...prev,
        [featureId]: !enabled
      }));
      
      addNotification({
        type: 'error',
        message: t('featureUpdateFailed'),
        duration: 3000
      });
    }
  }, [aiFeatures, user?.isPremium, onFeatureToggle, addNotification, t]);

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

  const enabledFeatures = aiFeatures.filter(f => f.enabled && (!f.premium || user?.isPremium));
  const premiumFeatures = aiFeatures.filter(f => f.premium);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="primary" size="sm">
              {enabledFeatures.length} {t('active')}
            </Badge>
            
            {!user?.isPremium && (
              <Tooltip content={t('upgradeToPremium')}>
                <Button variant="outline" size="sm">
                  <Crown className="w-4 h-4 mr-2" />
                  {t('upgrade')}
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </motion.div>

      {/* AI Sensitivity Settings */}
      <motion.div variants={itemVariants}>
        <AISensitivitySettings
          settings={aiSettings}
          onSettingsChange={onAISettingsChange}
        />
      </motion.div>

      {/* Smart Features Grid */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('features.title')}
          </h4>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
              >
                <SmartFeatureCard
                  feature={feature}
                  onToggle={toggleFeature}
                />
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Premium Features Showcase */}
      {!user?.isPremium && premiumFeatures.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-2 border-yellow-200 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <div className="flex items-center space-x-3 mb-4">
              <Crown className="w-6 h-6 text-yellow-600" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('premium.title')}
              </h4>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('premium.description')}
            </p>

            <div className="grid gap-2 md:grid-cols-2 mb-4">
              {premiumFeatures.slice(0, 4).map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2">
                  <feature.icon className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>

            <Button variant="warning" size="sm" className="w-full">
              <Crown className="w-4 h-4 mr-2" />
              {t('premium.upgrade')}
            </Button>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SmartPreferences;
export { SmartFeatureCard, AISensitivitySettings }; 