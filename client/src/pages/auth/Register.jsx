/**
 * 📝 REGISTER PAGE - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Step management, Component orchestration, Mobile UX
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, ChevronLeft, ChevronRight
} from 'lucide-react';

// ✅ Import Zustand stores and enhanced API
import { 
  useAuth, 
  useTranslation, 
  useTheme,
  useNotifications 
} from '../../stores';
import { useAuthToasts } from '../../hooks/useAuthToasts';

// ✅ Import extracted components
import RegistrationForm from '../../components/features/auth/RegistrationForm';
import SecuritySetup from '../../components/features/auth/SecuritySetup';
import RegistrationComplete from '../../components/features/auth/RegistrationComplete';
import GoogleProfileCompletion from '../../components/features/auth/GoogleProfileCompletion';
import GuestSettings from '../../components/common/GuestSettings';

import { api } from '../../api';
import { Button } from '../../components/ui';
import { cn } from '../../utils/helpers';

const Register = () => {
  // ✅ Zustand stores
  const { register, isAuthenticated, googleLogin } = useAuth();
  const { t, currentLanguage, setLanguage, isRTL } = useTranslation('auth');
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  const authToasts = useAuthToasts(); // ✅ Enhanced auth toasts

  const navigate = useNavigate();
  
  // ✅ Registration flow state
  const [registrationStep, setRegistrationStep] = useState('form'); // form, security, googleProfile, complete
  const [userData, setUserData] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // ✅ Form validation
  const validateForm = useCallback((formData) => {
    const newErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = t('firstNameRequired');
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = t('lastNameRequired');
    }

    // ✅ ADD: Username validation
    if (!formData.username?.trim()) {
      newErrors.username = t('usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('usernameTooShort');
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = t('usernameInvalidCharacters');
    }

    if (!formData.email) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else if (formData.passwordAnalysis?.strength === 'weak') {
      newErrors.password = t('passwordTooWeak');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch');
    }

    if (!formData.acceptedTerms) {
      newErrors.terms = t('acceptTermsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [t]);

  // ✅ Handle registration form submission
  const handleRegistrationSubmit = useCallback(async (formData) => {
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(), // ✅ ADD: Include username
        email: formData.email.trim(),
        password: formData.password,
        passwordStrength: formData.passwordAnalysis
      };

      const result = await register(registrationData);
      
      if (result.success) {
        setUserData({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          fullName: `${formData.firstName} ${formData.lastName}`
        });
        
        // Move to security setup
        setRegistrationStep('security');
        
        authToasts.registrationSuccess();
      } else {
        authToasts.registrationFailed(result.error);
        setErrors({ 
          general: result.error?.message || t('registrationFailed')
        });
      }
    } catch (error) {
      authToasts.registrationFailed(error);
      setErrors({ 
        general: t('registrationError')
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, register, authToasts, t]);

  // ✅ Handle Google registration - ENHANCED with profile completion
  const handleGoogleRegister = useCallback(async () => {
    setIsGoogleLoading(true);
    
    try {
      // Use the correct Google OAuth API
      const result = await googleLogin();
      
      if (result.success) {
        // ✅ FIXED: Check if user needs profile completion (must have username)
        const needsProfileCompletion = !result.user.username || 
                                       result.user.username === result.user.email?.split('@')[0] || // Generated username from email
                                       !result.user.onboarding_completed;
        
        setUserData({
          id: result.user.id,
          firstName: result.user.firstName || result.user.name?.split(' ')[0] || 'User',
          lastName: result.user.lastName || result.user.name?.split(' ').slice(1).join(' ') || '',
          email: result.user.email,
          name: result.user.name,
          picture: result.user.avatar || result.user.picture,
          username: result.user.username,
          fullName: result.user.name || `${result.user.firstName} ${result.user.lastName}`,
          onboarding_completed: result.user.onboarding_completed
        });
        
        setIsGoogleUser(true);
        setSecurityData({ securityScore: 85 }); // Google OAuth gives good security score
        
        if (needsProfileCompletion) {
          // Go to Google profile completion step
          setRegistrationStep('googleProfile');
          // Info message for profile completion (keep as notification for now)
          addNotification({
            type: 'info',
            message: t('completeProfileToGetStarted')
          });
        } else {
          // User already has complete profile, go to final step
          setRegistrationStep('complete');
          authToasts.googleRegistrationSuccess(result.user);
        }
      } else {
        authToasts.googleLoginFailed();
        setErrors({ 
          general: result.error?.message || 'Google registration failed'
        });
      }
    } catch (error) {
      authToasts.googleLoginFailed();
      setErrors({ 
        general: 'Google registration error'
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }, [googleLogin, authToasts, t]);

  // ✅ Handle security setup completion
  const handleSecurityComplete = useCallback((securitySetup) => {
    setSecurityData(securitySetup);
    setRegistrationStep('complete');
    
    addNotification({
      type: 'success',
      message: t('securitySetupComplete')
    });
  }, [addNotification, t]);

  // ✅ Handle security setup skip
  const handleSecuritySkip = useCallback(() => {
    setSecurityData({ securityScore: 50 });
    setRegistrationStep('complete');
  }, []);

  // ✅ Handle Google profile completion
  const handleGoogleProfileComplete = useCallback((completedUser) => {
    setUserData(prev => ({ ...prev, ...completedUser }));
    setRegistrationStep('complete');
    
    addNotification({
      type: 'success',
      message: t('profileSetupComplete')
    });
  }, [addNotification, t]);

  // ✅ Handle Google profile completion skip
  const handleGoogleProfileSkip = useCallback(() => {
    setRegistrationStep('complete');
    
    addNotification({
      type: 'info',
      message: t('profileCanBeCompletedLater')
    });
  }, [addNotification, t]);

  // ✅ Handle registration completion
  const handleRegistrationComplete = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // ✅ Handle step navigation
  const handleStepBack = useCallback(() => {
    if (registrationStep === 'security') {
      setRegistrationStep('form');
    } else if (registrationStep === 'googleProfile') {
      // For Google users, we can't go back to form, so skip profile completion
      handleGoogleProfileSkip();
    }
  }, [registrationStep, handleGoogleProfileSkip]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
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
          className="w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full absolute -top-48 -right-48 opacity-20"
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
          <div
            className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-white font-bold text-3xl">S</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {registrationStep === 'form' ? t('createAccount') :
             registrationStep === 'security' ? t('secureAccount') :
             registrationStep === 'googleProfile' ? t('completeYourProfile') :
             t('welcomeAboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {registrationStep === 'form' ? t('joinSpendWise') :
             registrationStep === 'security' ? t('almostDone') :
             registrationStep === 'googleProfile' ? t('addDetailsToPersonalizeExperience') :
             t('readyToStart')}
          </p>
        </motion.div>

        {/* Progress Indicator */}
        {registrationStep !== 'complete' && (
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-center space-x-2">
              <div className={cn(
                "w-3 h-3 rounded-full transition-colors",
                registrationStep === 'form' ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              )} />
              <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />
              <div className={cn(
                "w-3 h-3 rounded-full transition-colors",
                (registrationStep === 'security' || (isGoogleUser && registrationStep === 'googleProfile')) ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              )} />
              {isGoogleUser && (
                <>
                  <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    registrationStep === 'googleProfile' ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  )} />
                </>
              )}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
              <span>{t('account')}</span>
              <span>{isGoogleUser ? t('profile') : t('security')}</span>
              {isGoogleUser && <span>{t('complete')}</span>}
            </div>
          </motion.div>
        )}

        {/* Registration Steps */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            {registrationStep === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RegistrationForm
                  onSubmit={handleRegistrationSubmit}
                  onGoogleRegister={handleGoogleRegister}
                  isSubmitting={isSubmitting}
                  isGoogleLoading={isGoogleLoading}
                  errors={errors}
                />
              </motion.div>
            )}
            
            {registrationStep === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SecuritySetup
                  onComplete={handleSecurityComplete}
                  onSkip={handleSecuritySkip}
                  userEmail={userData?.email}
                  userName={userData?.fullName}
                />
              </motion.div>
            )}

            {registrationStep === 'googleProfile' && (
              <motion.div
                key="googleProfile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <GoogleProfileCompletion
                  onComplete={handleGoogleProfileComplete}
                  onSkip={handleGoogleProfileSkip}
                  initialUserData={userData}
                />
              </motion.div>
            )}
            
            {registrationStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <RegistrationComplete
                  userName={userData?.firstName}
                  userEmail={userData?.email}
                  securityScore={securityData?.securityScore || 50}
                  onContinue={handleRegistrationComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        {(registrationStep === 'security' || registrationStep === 'googleProfile') && (
          <motion.div variants={itemVariants} className="mt-6">
            <Button
              variant="ghost"
              onClick={handleStepBack}
              className="w-full"
            >
              <ChevronLeft className={cn("w-4 h-4 mr-2", isRTL && "ml-2 mr-0 rotate-180")} />
              {registrationStep === 'security' ? t('backToForm') : t('skipProfile')}
            </Button>
          </motion.div>
        )}

        {/* Login link */}
        {registrationStep === 'form' && (
          <motion.div variants={itemVariants} className="text-center mt-6">
            <p className="text-gray-600 dark:text-gray-400">
              {t('alreadyHaveAccount')}{' '}
              <Link
                to="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                {t('signIn')}
              </Link>
            </p>
          </motion.div>
        )}

        {/* Language selector */}
        {registrationStep === 'form' && (
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
        )}
      </motion.div>
    </div>
  );
};

export default Register;