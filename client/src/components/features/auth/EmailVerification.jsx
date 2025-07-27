/**
 * ✉️ EMAIL VERIFICATION - Mobile-First Verification Component
 * Extracted from VerifyEmail.jsx for better maintainability and performance
 * Features: Token verification, Resend logic, Mobile UX
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, Clock, Mail,
  Shield, Sparkles, Star
} from 'lucide-react';

// ✅ Import Zustand stores and components
import { useTranslation, useNotifications } from '../../../stores';
import { Button, Card, LoadingSpinner } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * ✅ Verification Success Component
 */
const VerificationSuccess = ({ 
  onContinue,
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');

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
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          
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
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('emailVerified')}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t('emailVerificationSuccess')}
      </p>

      <Button
        onClick={onContinue}
        className="w-full min-h-[48px]"
        size="lg"
      >
        {t('continueToDashboard')}
      </Button>
    </div>
  );
};

/**
 * ❌ Verification Error Component
 */
const VerificationError = ({ 
  onResend,
  isResending = false,
  resendCooldown = 0,
  error = '',
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center", className)}>
      {/* Error Animation */}
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
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('verificationFailed')}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {error || t('verificationFailedMessage')}
      </p>

      <Button
        onClick={onResend}
        disabled={isResending || resendCooldown > 0}
        className="w-full min-h-[48px]"
        size="lg"
      >
        {isResending ? (
          <>
            <LoadingSpinner size="sm" className={cn("mr-2", isRTL && "ml-2 mr-0")} />
            {t('resending')}
          </>
        ) : resendCooldown > 0 ? (
          <>
            <Clock className={cn("w-5 h-5 mr-2", isRTL && "ml-2 mr-0")} />
            {t('resendIn', { seconds: resendCooldown })}
          </>
        ) : (
          <>
            <RefreshCw className={cn("w-5 h-5 mr-2", isRTL && "ml-2 mr-0")} />
            {t('resendVerification')}
          </>
        )}
      </Button>
    </div>
  );
};

/**
 * ⏳ Verification In Progress Component
 */
const VerificationInProgress = ({ 
  className = '' 
}) => {
  const { t } = useTranslation('auth');

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center", className)}>
      {/* Loading Animation */}
      <motion.div
        className="mb-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto"
        >
          <Mail className="w-10 h-10 text-white" />
        </motion.div>
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('verifyingEmail')}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t('pleaseWaitVerifying')}
      </p>

      <div className="flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
};

/**
 * 📧 Email Verification Instructions
 */
const VerificationInstructions = ({ 
  email,
  onResend,
  isResending = false,
  resendCooldown = 0,
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center", className)}>
      {/* Mail Icon */}
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
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('checkYourEmail')}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t('verificationEmailSent', { email })}
      </p>

      <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <div className="text-left">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">
              {t('securityTip')}
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {t('checkSpamFolder')}
            </p>
          </div>
        </div>
      </Card>

      <Button
        onClick={onResend}
        disabled={isResending || resendCooldown > 0}
        variant="outline"
        className="w-full min-h-[48px]"
      >
        {isResending ? (
          <>
            <LoadingSpinner size="sm" className={cn("mr-2", isRTL && "ml-2 mr-0")} />
            {t('resending')}
          </>
        ) : resendCooldown > 0 ? (
          <>
            <Clock className={cn("w-5 h-5 mr-2", isRTL && "ml-2 mr-0")} />
            {t('resendIn', { seconds: resendCooldown })}
          </>
        ) : (
          <>
            <RefreshCw className={cn("w-5 h-5 mr-2", isRTL && "ml-2 mr-0")} />
            {t('resendEmail')}
          </>
        )}
      </Button>
    </div>
  );
};

export { VerificationSuccess, VerificationError, VerificationInProgress, VerificationInstructions }; 