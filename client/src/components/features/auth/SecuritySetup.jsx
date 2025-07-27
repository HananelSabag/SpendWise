/**
 * 🔐 SECURITY SETUP - Mobile-First Security Configuration
 * Extracted from Register.jsx for better maintainability and performance
 * Features: Biometric auth, Security scoring, Mobile UX
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Fingerprint, Smartphone, Award, Star, Zap,
  CheckCircle, ArrowRight, Lock, Eye, Bell, Key
} from 'lucide-react';

// ✅ Import Zustand stores and components
import { useTranslation, useNotifications } from '../../../stores';
import { Button, Card, Badge, Tooltip } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * 🔐 Security Setup Component
 */
const SecuritySetup = ({ 
  onComplete,
  onSkip,
  userEmail,
  userName,
  isLoading = false,
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();

  // ✅ Security setup state
  const [securitySetup, setSecuritySetup] = useState({
    biometricEnabled: false,
    twoFactorEnabled: false,
    deviceTrustEnabled: true,
    securityScore: 50
  });

  const [isSettingUpBiometric, setIsSettingUpBiometric] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);

  // ✅ Handle biometric setup
  const handleBiometricSetup = useCallback(async () => {
    setIsSettingUpBiometric(true);
    
    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        addNotification({
          type: 'error',
          message: t('biometricNotSupported')
        });
        return;
      }

      // Simulate biometric setup (replace with actual WebAuthn implementation)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSecuritySetup(prev => ({
        ...prev,
        biometricEnabled: true,
        securityScore: Math.min(prev.securityScore + 25, 100)
      }));
      
      addNotification({
        type: 'success',
        message: t('biometricSetupSuccess')
      });
      
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('biometricSetupFailed')
      });
    } finally {
      setIsSettingUpBiometric(false);
    }
  }, [addNotification, t]);

  // ✅ Handle 2FA setup
  const handle2FASetup = useCallback(async () => {
    setIsSettingUp2FA(true);
    
    try {
      // Simulate 2FA setup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSecuritySetup(prev => ({
        ...prev,
        twoFactorEnabled: true,
        securityScore: Math.min(prev.securityScore + 20, 100)
      }));
      
      addNotification({
        type: 'success',
        message: t('twoFactorSetupSuccess')
      });
      
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('twoFactorSetupFailed')
      });
    } finally {
      setIsSettingUp2FA(false);
    }
  }, [addNotification, t]);

  // ✅ Handle completion
  const handleComplete = useCallback(() => {
    onComplete?.({
      securitySetup,
      securityScore: securitySetup.securityScore
    });
  }, [onComplete, securitySetup]);

  // ✅ Get security score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'default';
    if (score >= 40) return 'warning';
    return 'destructive';
  };

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8", className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('secureYourAccount')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('enhanceAccountSecurity')}
        </p>
      </div>

      {/* Security Score */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('securityScore')}
          </h3>
          <Badge variant={getScoreBadgeVariant(securitySetup.securityScore)}>
            {securitySetup.securityScore}%
          </Badge>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${securitySetup.securityScore}%` }}
            transition={{ duration: 0.5 }}
            className={cn(
              "h-3 rounded-full",
              securitySetup.securityScore >= 80 ? "bg-green-500" :
              securitySetup.securityScore >= 60 ? "bg-blue-500" :
              securitySetup.securityScore >= 40 ? "bg-yellow-500" : "bg-red-500"
            )}
          />
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {securitySetup.securityScore >= 80 ? t('excellentSecurity') :
           securitySetup.securityScore >= 60 ? t('goodSecurity') :
           securitySetup.securityScore >= 40 ? t('fairSecurity') : t('weakSecurity')}
        </p>
      </Card>

      {/* Security Options */}
      <div className="space-y-4 mb-8">
        {/* Biometric Authentication */}
        <Card className={cn(
          "p-4 cursor-pointer transition-all duration-200",
          securitySetup.biometricEnabled 
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                securitySetup.biometricEnabled 
                  ? "bg-green-100 dark:bg-green-900/40"
                  : "bg-blue-100 dark:bg-blue-900/40"
              )}>
                <Fingerprint className={cn(
                  "w-5 h-5",
                  securitySetup.biometricEnabled ? "text-green-600" : "text-blue-600"
                )} />
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t('biometricAuth')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('biometricAuthDesc')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {securitySetup.biometricEnabled && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <Button
                variant={securitySetup.biometricEnabled ? "outline" : "default"}
                size="sm"
                onClick={handleBiometricSetup}
                disabled={isSettingUpBiometric || securitySetup.biometricEnabled}
              >
                {isSettingUpBiometric ? t('settingUp') : 
                 securitySetup.biometricEnabled ? t('enabled') : t('enable')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Two-Factor Authentication */}
        <Card className={cn(
          "p-4 cursor-pointer transition-all duration-200",
          securitySetup.twoFactorEnabled 
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                securitySetup.twoFactorEnabled 
                  ? "bg-green-100 dark:bg-green-900/40"
                  : "bg-purple-100 dark:bg-purple-900/40"
              )}>
                <Smartphone className={cn(
                  "w-5 h-5",
                  securitySetup.twoFactorEnabled ? "text-green-600" : "text-purple-600"
                )} />
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t('twoFactorAuth')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('twoFactorAuthDesc')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {securitySetup.twoFactorEnabled && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <Button
                variant={securitySetup.twoFactorEnabled ? "outline" : "default"}
                size="sm"
                onClick={handle2FASetup}
                disabled={isSettingUp2FA || securitySetup.twoFactorEnabled}
              >
                {isSettingUp2FA ? t('settingUp') : 
                 securitySetup.twoFactorEnabled ? t('enabled') : t('enable')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Device Trust */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t('deviceTrust')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('deviceTrustDesc')}
                </p>
              </div>
            </div>
            
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onSkip}
          disabled={isLoading}
        >
          {t('skipForNow')}
        </Button>
        
        <Button
          className="flex-1"
          onClick={handleComplete}
          disabled={isLoading}
        >
          {isLoading ? t('completing') : t('completeSetup')}
          <ArrowRight className={cn("w-4 h-4 ml-2", isRTL && "mr-2 ml-0 rotate-180")} />
        </Button>
      </div>
    </div>
  );
};

export default SecuritySetup; 