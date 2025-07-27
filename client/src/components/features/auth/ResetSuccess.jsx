/**
 * ✅ RESET SUCCESS - Password Reset Completion Component
 * Extracted from PasswordReset.jsx for better maintainability and performance
 * Features: Success animation, Login redirect, Mobile UX
 * @version 2.0.0
 */

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, ArrowRight, Shield, Sparkles, Star
} from 'lucide-react';

// ✅ Import Zustand stores and components
import { useTranslation } from '../../../stores';
import { Button, Card } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * ✅ Reset Success Component
 */
const ResetSuccess = ({ 
  onContinue,
  autoRedirect = true,
  redirectDelay = 3000,
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');
  const navigate = useNavigate();

  // ✅ Auto redirect to login
  useEffect(() => {
    if (autoRedirect) {
      const timer = setTimeout(() => {
        navigate('/auth/login');
      }, redirectDelay);

      return () => clearTimeout(timer);
    }
  }, [autoRedirect, redirectDelay, navigate]);

  // ✅ Handle manual continue
  const handleContinue = useCallback(() => {
    if (onContinue) {
      onContinue();
    } else {
      navigate('/auth/login');
    }
  }, [onContinue, navigate]);

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

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('passwordResetSuccess')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('passwordResetCompleteMessage')}
        </p>
      </motion.div>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-center space-x-3">
            <Shield className="w-6 h-6 text-green-600" />
            <div className="text-center">
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                {t('accountSecured')}
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                {t('accountSecuredMessage')}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        <Button
          onClick={handleContinue}
          className="w-full min-h-[48px]"
          size="lg"
        >
          {t('continueToLogin')}
          <ArrowRight className={cn("w-5 h-5 ml-2", isRTL && "mr-2 ml-0 rotate-180")} />
        </Button>
        
        {autoRedirect && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('autoRedirectMessage', { seconds: Math.round(redirectDelay / 1000) })}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default ResetSuccess; 