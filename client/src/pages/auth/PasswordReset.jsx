/**
 * 🔑 PASSWORD RESET PAGE - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Step management, Email/Reset flow, Mobile UX
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, ArrowLeft, Mail, Shield
} from 'lucide-react';

// ✅ Import Zustand stores and enhanced API
import { 
  useAuth, 
  useTranslation, 
  useTheme,
  useNotifications 
} from '../../stores';

// ✅ Import components
import { PasswordResetRequestForm, NewPasswordForm } from '../../components/features/auth/PasswordResetForm';
import ResetSuccess from '../../components/features/auth/ResetSuccess';
import GuestSettings from '../../components/common/GuestSettings';

import { api } from '../../api';
import { Button } from '../../components/ui';
import { cn } from '../../utils/helpers';

const PasswordReset = () => {
  // ✅ Zustand stores
  const { actions: authActions } = useAuth();
  const { t, currentLanguage, setLanguage, isRTL } = useTranslation('auth');
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  const { token } = useParams();
  const navigate = useNavigate();

  // ✅ Reset flow state
  const [step, setStep] = useState(token ? 'reset' : 'request'); // request, reset, success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [resetEmail, setResetEmail] = useState('');

  // ✅ Validate reset token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const result = await api.client.get(`/users/password-reset/validate/${token}`).then(r => ({ success: true, email: r.data?.email })).catch(err => ({ success: false, error: api.client.normalizeError ? api.client.normalizeError(err) : err }));
          
          if (result.success) {
            if (result.email) {
              setResetEmail(result.email);
            }
          } else {
            setErrors({ 
              general: result.error?.message || t('tokenValidationFailed')
            });
            
            if (result.error?.code === 'TOKEN_EXPIRED') {
              addNotification({
                type: 'warning',
                message: t('tokenExpiredPleaseRequestNew')
              });
              setStep('request');
            }
          }
        } catch (error) {
          setErrors({ 
            general: t('tokenValidationError')
          });
          setStep('request');
        }
      }
    };

    validateToken();
  }, [token, api, addNotification, t]);

  // ✅ Handle password reset request
  const handleResetRequest = useCallback(async (formData) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await api.auth.requestPasswordReset(formData.email);
      
      if (result.success) {
        setResetEmail(formData.email);
        
        addNotification({
          type: 'success',
          message: t('resetLinkSent', { email: formData.email })
        });
        
        // For demo purposes, we'll show success
        // In production, you might stay on request step
        setStep('success');
      } else {
        setErrors({ 
          general: result.error?.message || t('resetRequestFailed')
        });
      }
    } catch (error) {
      setErrors({ 
        general: t('resetRequestError')
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [api, addNotification, t]);

  // ✅ Handle new password submission
  const handleNewPassword = useCallback(async (formData) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await api.auth.resetPassword({ token, password: formData.password, passwordStrength: formData.passwordAnalysis });
      
      if (result.success) {
        setStep('success');
        
        addNotification({
          type: 'success',
          message: t('passwordResetSuccessful')
        });
      } else {
        setErrors({ 
          general: result.error?.message || t('passwordResetFailed')
        });
      }
    } catch (error) {
      setErrors({ 
        general: t('passwordResetError')
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [token, api, addNotification, t]);

  // ✅ Handle step back
  const handleStepBack = useCallback(() => {
    if (step === 'reset') {
      setStep('request');
      navigate('/auth/password-reset');
    }
  }, [step, navigate]);

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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
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
          className="w-96 h-96 bg-gradient-to-br from-red-400 to-orange-600 rounded-full absolute -top-48 -right-48 opacity-20"
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
          className="w-80 h-80 bg-gradient-to-br from-pink-400 to-red-600 rounded-full absolute -bottom-40 -left-40 opacity-20"
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
            className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Key className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'request' ? t('forgotPassword') :
             step === 'reset' ? t('resetPassword') :
             t('passwordResetComplete')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'request' ? t('enterEmailForReset') :
             step === 'reset' ? t('enterNewPassword') :
             t('passwordSuccessfullyReset')}
          </p>
        </motion.div>

        {/* Reset Steps */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            {step === 'request' && (
              <motion.div
                key="request"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PasswordResetRequestForm
                  onSubmit={handleResetRequest}
                  isSubmitting={isSubmitting}
                  errors={errors}
                />
              </motion.div>
            )}
            
            {step === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <NewPasswordForm
                  onSubmit={handleNewPassword}
                  isSubmitting={isSubmitting}
                  errors={errors}
                  email={resetEmail}
                />
              </motion.div>
            )}
            
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ResetSuccess
                  onContinue={() => navigate('/auth/login')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        {step === 'reset' && (
          <motion.div variants={itemVariants} className="mt-6">
            <Button
              variant="ghost"
              onClick={handleStepBack}
              className="w-full"
            >
              <ArrowLeft className={cn("w-4 h-4 mr-2", isRTL && "ml-2 mr-0 rotate-180")} />
              {t('backToEmailRequest')}
            </Button>
          </motion.div>
        )}

        {/* Login link */}
        {step === 'request' && (
          <motion.div variants={itemVariants} className="text-center mt-6">
            <p className="text-gray-600 dark:text-gray-400">
              {t('rememberPassword')}{' '}
              <Link
                to="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                {t('signIn')}
              </Link>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PasswordReset;
