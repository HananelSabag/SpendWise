/**
 * 📝 REGISTER PAGE - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Step management, Component orchestration, Mobile UX
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, ChevronLeft } from 'lucide-react';

// ✅ Import Zustand stores and enhanced API
import { 
  useAuth, 
  useTranslation, 
  useTheme,
  useNotifications,
  useAuthStore 
} from '../../stores';
import { useAuthToasts } from '../../hooks/useAuthToasts';

// ✅ Import extracted components
import RegistrationForm from '../../components/features/auth/RegistrationForm';
import RegistrationComplete from '../../components/features/auth/RegistrationComplete';
import GoogleProfileCompletion from '../../components/features/auth/GoogleProfileCompletion';
import GuestSettings from '../../components/common/GuestSettings';

import { api, authAPI } from '../../api';
import { Button } from '../../components/ui';
import { cn } from '../../utils/helpers';

const Register = () => {
  // ✅ Zustand stores
  const { register, isAuthenticated, googleLogin } = useAuth();
  const { t, currentLanguage, setLanguage, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();
  const authToasts = useAuthToasts(); // ✅ Enhanced auth toasts

  const navigate = useNavigate();
  
  // ✅ Registration flow state
  const [registrationStep, setRegistrationStep] = useState('form'); // form only
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

    // Names required for DB; username not used
    if (!formData.firstName?.trim()) newErrors.firstName = t('firstNameRequired');
    if (!formData.lastName?.trim()) newErrors.lastName = t('lastNameRequired');

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
        email: formData.email.trim(),
        password: formData.password,
        passwordStrength: formData.passwordAnalysis
      };

      const result = await register(registrationData);
      
      if (result.success) {
        setUserData({ email: formData.email, firstName: formData.firstName, lastName: formData.lastName });
        addNotification({ type: 'success', message: t('registrationSuccess') });
        navigate('/auth/login', { replace: true });
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

  // ✅ Handle Google registration with credential
  const handleGoogleRegister = useCallback(async (credential) => {
    setIsGoogleLoading(true);
    
    try {
      let result;
      
      if (credential) {
        // Direct credential from SimpleGoogleButton
        if (import.meta.env.DEV) console.log('🔍 Processing Google credential for registration...');
        result = await authAPI.processGoogleCredential(credential);
      } else {
        // This shouldn't happen anymore with SimpleGoogleButton
        throw new Error('No Google credential provided');
      }
      
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
        
        // Update auth store with the user data
        if (credential) {
          const store = useAuthStore.getState();
          store.actions.setUser(result.user);
          try { store.actions.startTokenRefreshTimer(); } catch (_) {}
        }
        
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
    
    addNotification({ type: 'success', message: t('registrationSuccess') });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <GuestSettings />

      {/* Static decorative blobs — no infinite animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full absolute -top-48 -right-48 opacity-10" />
        <div className="w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full absolute -bottom-40 -left-40 opacity-10" />
      </div>

      <div className="relative z-10 w-full max-w-md" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {registrationStep === 'form'         ? t('createAccount', 'Create account') :
             registrationStep === 'googleProfile' ? t('completeYourProfile', 'Complete your profile') :
             t('welcomeAboard', 'Welcome aboard!')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {registrationStep === 'form'         ? t('joinSpendWise', 'Join SpendWise today') :
             registrationStep === 'googleProfile' ? t('addDetailsToPersonalizeExperience', 'A few details to personalise your experience') :
             t('readyToStart', "You're all set!")}
          </p>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {registrationStep === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <RegistrationForm
                onSubmit={handleRegistrationSubmit}
                onGoogleRegister={handleGoogleRegister}
                isSubmitting={isSubmitting}
                isGoogleLoading={isGoogleLoading}
                errors={errors}
              />
            </motion.div>
          )}
          {registrationStep === 'googleProfile' && (
            <motion.div key="googleProfile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <GoogleProfileCompletion
                onComplete={handleGoogleProfileComplete}
                onSkip={handleGoogleProfileSkip}
                initialUserData={userData}
              />
            </motion.div>
          )}
          {registrationStep === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <RegistrationComplete
                userName={userData?.firstName}
                userEmail={userData?.email}
                securityScore={securityData?.securityScore || 50}
                onContinue={handleRegistrationComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back / skip for googleProfile */}
        {registrationStep === 'googleProfile' && (
          <div className="mt-5">
            <Button variant="ghost" onClick={handleStepBack} className="w-full text-sm">
              <ChevronLeft className={cn('w-4 h-4 mr-1.5', isRTL && 'ml-1.5 mr-0 rotate-180')} />
              {t('skipProfile', 'Skip for now')}
            </Button>
          </div>
        )}

        {/* Login link */}
        {registrationStep === 'form' && (
          <div className="text-center mt-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('alreadyHaveAccount', 'Already have an account?')}{' '}
              <Link to="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                {t('signIn', 'Sign in')}
              </Link>
            </p>
          </div>
        )}

        {/* Language toggle */}
        {registrationStep === 'form' && (
          <div className="text-center mt-3">
            <Button
              variant="ghost" size="sm"
              onClick={() => setLanguage(currentLanguage === 'en' ? 'he' : 'en')}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              {currentLanguage === 'en' ? 'עברית' : 'English'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;