/**
 * ✉️ EMAIL VERIFICATION PAGE - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Token verification, Resend logic, Mobile UX
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, ArrowLeft, Globe
} from 'lucide-react';

// ✅ Import Zustand stores and enhanced API
import { 
  useAuth, 
  useTranslation, 
  useTheme,
  useNotifications 
} from '../../stores';

// ✅ Import components
import { 
  VerificationSuccess, 
  VerificationError, 
  VerificationInProgress, 
  VerificationInstructions 
} from '../../components/features/auth/EmailVerification';
import GuestSettings from '../../components/common/GuestSettings';

import { api } from '../../api';
import { Button } from '../../components/ui';
import { cn } from '../../utils/helpers';

const VerifyEmail = () => {
  // ✅ Zustand stores
  const { actions: authActions } = useAuth();
  const { t, currentLanguage, setLanguage, isRTL } = useTranslation('auth');
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  
  const { token } = useParams();
  const navigate = useNavigate();
  
  // ✅ Verification state
  const [verificationState, setVerificationState] = useState('verifying'); // verifying, success, error, instructions
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ✅ Handle verification on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerificationState('instructions');
        return;
      }

      try {
        setVerificationState('verifying');
        
        const result = await api.auth.verifyEmail({ token });
        
        if (result.success) {
          setVerificationState('success');
          
          addNotification({
            type: 'success',
            message: t('emailVerificationSuccess')
          });
          
          // Auto redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          setErrorMessage(result.error?.message || t('verificationFailed'));
          setVerificationState('error');
          
          if (result.error?.code === 'TOKEN_EXPIRED') {
            addNotification({
              type: 'warning',
              message: t('verificationTokenExpired')
            });
          }
        }
      } catch (error) {
        setErrorMessage(t('verificationError'));
        setVerificationState('error');
      }
    };

    verifyToken();
  }, [token, api, addNotification, t, navigate]);

  // ✅ Handle resend verification email
  const handleResendVerification = useCallback(async () => {
    if (isResending || resendCooldown > 0) return;

    setIsResending(true);

    try {
      const result = await api.auth.resendVerificationEmail({
        email: userEmail
      });
      
      if (result.success) {
        addNotification({
          type: 'success',
          message: t('verificationEmailResent')
        });
        
        // Start cooldown
        setResendCooldown(60);
        const cooldownInterval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        addNotification({
          type: 'error',
          message: result.error?.message || t('resendVerificationFailed')
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('resendVerificationError')
      });
    } finally {
      setIsResending(false);
    }
  }, [isResending, resendCooldown, userEmail, api, addNotification, t]);

  // ✅ Handle continue from success
  const handleContinueFromSuccess = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Guest Settings */}
      <GuestSettings />

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-96 h-96 bg-gradient-to-br from-green-400 to-blue-600 rounded-full absolute -top-48 -right-48 opacity-20"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -8, 0]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full absolute -bottom-40 -left-40 opacity-20"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {verificationState === 'verifying' ? t('verifyingEmail') :
             verificationState === 'success' ? t('emailVerified') :
             verificationState === 'error' ? t('verificationFailed') :
             t('checkYourEmail')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {verificationState === 'verifying' ? t('pleaseWaitVerifying') :
             verificationState === 'success' ? t('emailVerificationComplete') :
             verificationState === 'error' ? t('verificationFailedMessage') :
             t('clickVerificationLink')}
          </p>
        </motion.div>

        {/* Verification Content */}
        <motion.div variants={itemVariants}>
          {verificationState === 'verifying' && (
            <VerificationInProgress />
          )}
          
          {verificationState === 'success' && (
            <VerificationSuccess 
              onContinue={handleContinueFromSuccess}
            />
          )}
          
          {verificationState === 'error' && (
            <VerificationError 
              onResend={handleResendVerification}
              isResending={isResending}
              resendCooldown={resendCooldown}
              error={errorMessage}
            />
          )}
          
          {verificationState === 'instructions' && (
            <VerificationInstructions 
              email={userEmail}
              onResend={handleResendVerification}
              isResending={isResending}
              resendCooldown={resendCooldown}
            />
          )}
        </motion.div>

        {/* Navigation */}
        <motion.div variants={itemVariants} className="text-center mt-6">
          <Link
            to="/auth/login"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className={cn("w-4 h-4 mr-2", isRTL && "ml-2 mr-0 rotate-180")} />
            {t('backToLogin')}
          </Link>
        </motion.div>

        {/* Language selector */}
        <motion.div variants={itemVariants} className="text-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(currentLanguage === 'en' ? 'he' : 'en')}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Globe className="w-4 h-4 mr-2" />
            {currentLanguage === 'en' ? 'עברית' : 'English'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;