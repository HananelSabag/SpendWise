/**
 * ✅ REGISTRATION COMPLETE - Success & Welcome Component
 * Extracted from Register.jsx for better maintainability and performance
 * Features: Success animation, Welcome message, Next steps
 * @version 2.0.0
 */

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Star, Sparkles, ArrowRight, Trophy,
  Zap, Heart, Target, Gift, Crown
} from 'lucide-react';

// ✅ Import Zustand stores and components
import { useTranslation, useNotifications } from '../../../stores';
import { Button, Card, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * ✅ Registration Complete Component
 */
const RegistrationComplete = ({ 
  userName,
  userEmail,
  securityScore = 50,
  onContinue,
  autoRedirect = true,
  redirectDelay = 3000,
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  // ✅ Auto redirect to dashboard
  useEffect(() => {
    if (autoRedirect) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, redirectDelay);

      return () => clearTimeout(timer);
    }
  }, [autoRedirect, redirectDelay, navigate]);

  // ✅ Handle manual continue
  const handleContinue = useCallback(() => {
    if (onContinue) {
      onContinue();
    } else {
      navigate('/dashboard');
    }
  }, [onContinue, navigate]);

  // ✅ Get security badge variant
  const getSecurityBadge = (score) => {
    if (score >= 80) return { variant: 'success', text: t('excellentSecurity') };
    if (score >= 60) return { variant: 'default', text: t('goodSecurity') };
    if (score >= 40) return { variant: 'warning', text: t('fairSecurity') };
    return { variant: 'destructive', text: t('needsImprovement') };
  };

  const securityBadge = getSecurityBadge(securityScore);

  // ✅ Success features list
  const features = [
    {
      icon: Zap,
      title: t('features.smartTracking'),
      description: t('features.smartTrackingDesc')
    },
    {
      icon: Target,
      title: t('features.goalSetting'),
      description: t('features.goalSettingDesc')
    },
    {
      icon: Heart,
      title: t('features.insights'),
      description: t('features.insightsDesc')
    },
    {
      icon: Gift,
      title: t('features.rewards'),
      description: t('features.rewardsDesc')
    }
  ];

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center", className)}>
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.2
        }}
        className="mb-6"
      >
        <div className="relative inline-flex">
          {/* Main success icon */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          
          {/* Floating sparkles */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </motion.div>
          
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
            className="absolute -bottom-1 -left-2"
          >
            <Star className="w-5 h-5 text-blue-500" />
          </motion.div>
        </div>
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('welcomeToSpendWise', { name: userName })}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('registrationCompleteMessage')}
        </p>
      </motion.div>

      {/* Account Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {userName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userEmail}
              </p>
            </div>
            
            <div className="text-right">
              <Badge variant={securityBadge.variant} className="mb-1">
                <Trophy className="w-3 h-3 mr-1" />
                {securityScore}%
              </Badge>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {securityBadge.text}
              </p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${securityScore}%` }}
              transition={{ duration: 1, delay: 0.8 }}
              className={cn(
                "h-2 rounded-full",
                securityScore >= 80 ? "bg-green-500" :
                securityScore >= 60 ? "bg-blue-500" :
                securityScore >= 40 ? "bg-yellow-500" : "bg-red-500"
              )}
            />
          </div>
        </Card>
      </motion.div>

      {/* Features Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('whatYouCanDoNext')}
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <IconComponent className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="space-y-4"
      >
        <Button
          onClick={handleContinue}
          className="w-full min-h-[48px]"
          size="lg"
        >
          {t('continueToDashboard')}
          <ArrowRight className={cn("w-5 h-5 ml-2", isRTL && "mr-2 ml-0 rotate-180")} />
        </Button>
        
        {autoRedirect && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('autoRedirectMessage', { seconds: Math.round(redirectDelay / 1000) })}
          </p>
        )}
      </motion.div>

      {/* Celebration Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              scale: 0,
              x: Math.random() * 400,
              y: Math.random() * 400
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -100],
              rotate: [0, 360]
            }}
            transition={{
              duration: 2,
              delay: 1.5 + i * 0.2,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <Crown className="w-4 h-4 text-yellow-500" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default RegistrationComplete; 