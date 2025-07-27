/**
 * 🔒 SECURITY SETTINGS - User Security Management Component
 * Extracted from Profile.jsx for better performance and maintainability
 * Features: 2FA, Biometric auth, Session management, Password change, Mobile-first
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Smartphone, Fingerprint, Key, 
  Eye, EyeOff, AlertCircle, CheckCircle, X,
  Clock, Settings, LogOut, Scan, Wifi
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useNotifications
} from '../../../stores';

import { Button, Input, Card, Badge, Switch, Tooltip } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * 🔐 Security Feature Card
 */
const SecurityFeatureCard = ({ 
  feature, 
  onToggle, 
  className = '' 
}) => {
  const { t } = useTranslation('security');

  const FeatureIcon = feature.icon;

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      className={cn(
        "p-4 rounded-xl border border-gray-200 dark:border-gray-700",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        feature.enabled && "ring-2 ring-green-500/20 border-green-200 dark:border-green-700",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            feature.enabled 
              ? "bg-green-100 dark:bg-green-900/20" 
              : "bg-gray-100 dark:bg-gray-700"
          )}>
            <FeatureIcon className={cn(
              "w-5 h-5",
              feature.enabled 
                ? "text-green-600 dark:text-green-400" 
                : "text-gray-600 dark:text-gray-400"
            )} />
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
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {feature.description}
            </p>

            <div className="flex items-center space-x-3">
              <Badge 
                variant={feature.enabled ? "success" : "secondary"}
                size="sm"
              >
                {feature.enabled ? t('enabled') : t('disabled')}
              </Badge>
              
              <Button
                variant={feature.enabled ? "destructive" : "primary"}
                size="sm"
                onClick={() => onToggle(feature.id, !feature.enabled)}
                disabled={feature.premium && !feature.available}
              >
                {feature.enabled ? t('disable') : t('enable')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🔑 Password Change Form
 */
const PasswordChangeForm = ({ 
  onPasswordChange, 
  className = '' 
}) => {
  const { t } = useTranslation('security');
  const { addNotification } = useNotifications();

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChanging, setIsChanging] = useState(false);

  const handlePasswordChange = useCallback(async (e) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      addNotification({
        type: 'error',
        message: t('password.confirmMismatch'),
        duration: 3000
      });
      return;
    }

    if (passwords.new.length < 8) {
      addNotification({
        type: 'error',
        message: t('password.tooShort'),
        duration: 3000
      });
      return;
    }

    setIsChanging(true);
    
    try {
      await onPasswordChange?.(passwords.current, passwords.new);
      
      setPasswords({ current: '', new: '', confirm: '' });
      addNotification({
        type: 'success',
        message: t('password.changeSuccess'),
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('password.changeFailed'),
        duration: 3000
      });
    } finally {
      setIsChanging(false);
    }
  }, [passwords, onPasswordChange, addNotification, t]);

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Card className={cn("p-6", className)}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {t('password.changeTitle')}
      </h3>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('password.current')}
          </label>
          <div className="relative">
            <Input
              type={showPasswords.current ? "text" : "password"}
              value={passwords.current}
              onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
              placeholder={t('password.currentPlaceholder')}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('password.new')}
          </label>
          <div className="relative">
            <Input
              type={showPasswords.new ? "text" : "password"}
              value={passwords.new}
              onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
              placeholder={t('password.newPlaceholder')}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('password.confirm')}
          </label>
          <div className="relative">
            <Input
              type={showPasswords.confirm ? "text" : "password"}
              value={passwords.confirm}
              onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
              placeholder={t('password.confirmPlaceholder')}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isChanging || !passwords.current || !passwords.new || !passwords.confirm}
          className="w-full"
        >
          {isChanging ? t('password.changing') : t('password.change')}
        </Button>
      </form>
    </Card>
  );
};

/**
 * 🔒 Security Settings Main Component
 */
const SecuritySettings = ({
  onPasswordChange,
  onSecurityFeatureToggle,
  onSessionTimeoutChange,
  sessionTimeout = 30,
  className = ''
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('security');
  const { addNotification } = useNotifications();

  const [securityFeatures, setSecurityFeatures] = useState({
    twoFactor: false,
    biometric: false,
    loginNotifications: true,
    sessionSecurity: true,
    deviceTracking: false,
    apiAccess: false
  });

  // Security features configuration
  const securityFeaturesConfig = [
    {
      id: 'twoFactor',
      title: t('twoFactor.title'),
      description: t('twoFactor.description'),
      icon: Smartphone,
      enabled: securityFeatures.twoFactor,
      premium: false,
      available: true
    },
    {
      id: 'biometric',
      title: t('biometric.title'),
      description: t('biometric.description'),
      icon: Fingerprint,
      enabled: securityFeatures.biometric,
      premium: false,
      available: 'credentials' in navigator
    },
    {
      id: 'loginNotifications',
      title: t('loginNotifications.title'),
      description: t('loginNotifications.description'),
      icon: AlertCircle,
      enabled: securityFeatures.loginNotifications,
      premium: false,
      available: true
    },
    {
      id: 'sessionSecurity',
      title: t('sessionSecurity.title'),
      description: t('sessionSecurity.description'),
      icon: Shield,
      enabled: securityFeatures.sessionSecurity,
      premium: false,
      available: true
    },
    {
      id: 'deviceTracking',
      title: t('deviceTracking.title'),
      description: t('deviceTracking.description'),
      icon: Wifi,
      enabled: securityFeatures.deviceTracking,
      premium: true,
      available: user?.isPremium
    },
    {
      id: 'apiAccess',
      title: t('apiAccess.title'),
      description: t('apiAccess.description'),
      icon: Key,
      enabled: securityFeatures.apiAccess,
      premium: true,
      available: user?.isPremium
    }
  ];

  // Handle security feature toggle
  const handleFeatureToggle = useCallback(async (featureId, enabled) => {
    setSecurityFeatures(prev => ({
      ...prev,
      [featureId]: enabled
    }));

    try {
      await onSecurityFeatureToggle?.(featureId, enabled);
      
      addNotification({
        type: 'success',
        message: t('featureUpdated', { 
          feature: t(`${featureId}.title`),
          status: enabled ? t('enabled') : t('disabled')
        }),
        duration: 3000
      });
    } catch (error) {
      // Revert on error
      setSecurityFeatures(prev => ({
        ...prev,
        [featureId]: !enabled
      }));
      
      addNotification({
        type: 'error',
        message: t('featureUpdateFailed'),
        duration: 3000
      });
    }
  }, [onSecurityFeatureToggle, addNotification, t]);

  // Handle session timeout change
  const handleSessionTimeoutChange = useCallback((timeout) => {
    onSessionTimeoutChange?.(timeout);
    addNotification({
      type: 'success',
      message: t('session.timeoutUpdated'),
      duration: 2000
    });
  }, [onSessionTimeoutChange, addNotification, t]);

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
      {/* Password Change */}
      <motion.div variants={itemVariants}>
        <PasswordChangeForm onPasswordChange={onPasswordChange} />
      </motion.div>

      {/* Security Features */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('features.title')}
            </h3>
            <Badge variant="outline" size="sm">
              {securityFeaturesConfig.filter(f => f.enabled).length} {t('features.active')}
            </Badge>
          </div>

          <div className="space-y-4">
            {securityFeaturesConfig.map((feature, index) => (
              <motion.div
                key={feature.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
              >
                <SecurityFeatureCard
                  feature={feature}
                  onToggle={handleFeatureToggle}
                />
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Session Settings */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('session.title')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('session.timeout')}
              </label>
              <select
                value={sessionTimeout}
                onChange={(e) => handleSessionTimeoutChange(Number(e.target.value))}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={15}>15 {t('session.minutes')}</option>
                <option value={30}>30 {t('session.minutes')}</option>
                <option value={60}>1 {t('session.hour')}</option>
                <option value={240}>4 {t('session.hours')}</option>
                <option value={0}>{t('session.never')}</option>
              </select>
            </div>
            
            <Button variant="outline" size="sm" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              {t('session.terminateAll')}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default SecuritySettings;
export { SecurityFeatureCard, PasswordChangeForm }; 