/**
 * 📝 REGISTER PAGE
 * Mobile-first, Component-based, Clean architecture
 * @version 2.1.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, ChevronLeft, Loader2 } from 'lucide-react';

import {
  useAuth,
  useTranslation,
  useTheme,
  useNotifications,
  useAuthStore
} from '../../stores';
import { useAuthToasts } from '../../hooks/useAuthToasts';

import RegistrationForm from '../../components/features/auth/RegistrationForm';
import RegistrationComplete from '../../components/features/auth/RegistrationComplete';
import GoogleProfileCompletion from '../../components/features/auth/GoogleProfileCompletion';
import GuestSettings from '../../components/common/GuestSettings';

import { api, authAPI } from '../../api';
import { Button } from '../../components/ui';
import { cn } from '../../utils/helpers';

const Register = () => {
  const { register, isAuthenticated, googleLogin } = useAuth();
  const { t, currentLanguage, setLanguage, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();
  const authToasts = useAuthToasts();

  const navigate = useNavigate();

  const [registrationStep, setRegistrationStep] = useState('form');
  const [userData, setUserData] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [errors, setErrors] = useState({});

  // Only redirect away if we're still on the form step — i.e. the user landed here
  // while already authenticated. Once Google registration completes, isAuthenticated
  // becomes true but we want to keep showing the "Welcome aboard!" complete step.
  useEffect(() => {
    if (isAuthenticated && registrationStep === 'form') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, registrationStep]);

  // ── Form validation ──────────────────────────────────────────────────────────
  const validateForm = useCallback((formData) => {
    const newErrors = {};

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

  // ── Email/password registration ───────────────────────────────────────────────
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
        // Use server's email_verified field to determine if verification is needed.
        // This respects the email_verification_required system setting.
        const serverEmailVerified = result.data?.user?.email_verified ?? false;
        setUserData({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          serverEmailVerified,
        });
        setRegistrationStep('complete');
      } else {
        const code = result.error?.code || '';
        let errorMessage = result.error?.message || t('registrationFailed');

        switch (code) {
          case 'EMAIL_ALREADY_EXISTS':
          case 'USER_EXISTS':
            errorMessage = t('emailAlreadyExists') || 'This email is already registered. Try signing in instead.'; break;
          case 'VALIDATION_ERROR':
            errorMessage = result.error?.details || t('registrationValidationFailed') || 'Please check all fields and try again.'; break;
          case 'RATE_LIMITED':
            errorMessage = t('rateLimited') || 'Too many attempts. Please wait and try again.'; break;
          case 'SERVER_ERROR':
          case 'SERVICE_UNAVAILABLE':
            errorMessage = t('serverError') || 'Server error. Please try again in a moment.'; break;
          default:
            break;
        }

        authToasts.registrationFailed(result.error);
        setErrors({ general: errorMessage, code });
      }
    } catch (error) {
      authToasts.registrationFailed(error);
      setErrors({ general: t('registrationError') });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, register, authToasts, t]);

  // ── Google registration ───────────────────────────────────────────────────────
  const handleGoogleRegister = useCallback(async (credential) => {
    setIsGoogleLoading(true);
    let succeeded = false;

    try {
      if (!credential) throw new Error('No Google credential provided');

      const result = await authAPI.processGoogleCredential(credential);

      if (result.success) {
        succeeded = true;

        const needsProfileCompletion =
          !result.user.username ||
          result.user.username === result.user.email?.split('@')[0] ||
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

        // Update auth store — isAuthenticated becomes true, but the useEffect above
        // is guarded by registrationStep so it won't navigate away prematurely.
        const store = useAuthStore.getState();
        store.actions.setUser(result.user);
        try { store.actions.startTokenRefreshTimer(); } catch (_) {}

        setIsGoogleUser(true);
        setSecurityData({ securityScore: 85 });

        if (needsProfileCompletion) {
          setRegistrationStep('googleProfile');
          addNotification({ type: 'info', message: t('completeProfileToGetStarted') });
        } else {
          setRegistrationStep('complete');
          authToasts.googleRegistrationSuccess(result.user);
        }
      } else {
        const code   = result.error?.code   || '';
        const status = result.error?.status || 0;
        let errorMessage = result.error?.message || t('googleSignInFailed') || 'Google sign-in failed';
        let showSupportContact = false;

        switch (code) {
          case 'USER_BLOCKED':
          case 'ACCOUNT_BLOCKED':
            if (window.spendWiseNavigate) window.spendWiseNavigate('/blocked', { replace: true });
            else window.location.replace('/blocked');
            return;
          case 'ACCOUNT_DEACTIVATED':
            errorMessage = t('accountDeactivated') || 'Your account has been deactivated. Contact support.';
            showSupportContact = true; break;
          case 'RATE_LIMITED':
            errorMessage = t('rateLimited') || 'Too many attempts. Please wait and try again.'; break;
          case 'EMAIL_ALREADY_EXISTS':
          case 'USER_EXISTS':
            errorMessage = t('emailAlreadyExists') || 'This email is already registered. Try signing in instead.'; break;
          default:
            if (status >= 500 || status === 0) {
              errorMessage = t('serverError') || 'Server error. Please try again in a moment.';
            }
        }

        authToasts.googleLoginFailed();
        setErrors({ general: errorMessage, showSupportContact });
      }
    } catch (error) {
      const message = error.message?.includes('network') || error.message?.includes('fetch')
        ? (t('networkError') || 'Connection error. Please check your internet connection.')
        : (t('googleSignInFailed') || 'Google sign-in failed. Please try again.');
      authToasts.googleLoginFailed();
      setErrors({ general: message });
    } finally {
      // Only clear loading on failure — on success we stay in loading state until
      // setRegistrationStep triggers re-render (which is fast and clean)
      if (!succeeded) setIsGoogleLoading(false);
      else setIsGoogleLoading(false); // Clear immediately; we're showing a new step
    }
  }, [authToasts, t, addNotification]);

  // ── Step handlers ─────────────────────────────────────────────────────────────
  const handleGoogleProfileComplete = useCallback((completedUser) => {
    setUserData(prev => ({ ...prev, ...completedUser }));
    setRegistrationStep('complete');
    addNotification({ type: 'success', message: t('profileSetupComplete') });
  }, [addNotification, t]);

  const handleGoogleProfileSkip = useCallback(() => {
    setRegistrationStep('complete');
    addNotification({ type: 'info', message: t('profileCanBeCompletedLater') });
  }, [addNotification, t]);

  // Called when the user explicitly presses the CTA on the complete screen.
  const handleRegistrationComplete = useCallback(() => {
    if (isGoogleUser || userData?.serverEmailVerified) {
      navigate('/', { replace: true });
    } else {
      navigate('/login', { state: { registrationSuccess: true }, replace: true });
    }
  }, [navigate, isGoogleUser, userData]);

  const handleStepBack = useCallback(() => {
    if (registrationStep === 'googleProfile') {
      handleGoogleProfileSkip();
    }
  }, [registrationStep, handleGoogleProfileSkip]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <GuestSettings />

      {/* Google auth loading overlay */}
      {isGoogleLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">S</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-900 dark:text-white font-semibold text-base">
                {t('signingUpWithGoogle') || t('signingInWithGoogle') || 'Signing up with Google…'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {t('pleaseWait') || 'Please wait a moment'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Static decorative blobs */}
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
            {registrationStep === 'form'          ? t('createAccount', 'Create account') :
             registrationStep === 'googleProfile' ? t('completeYourProfile', 'Complete your profile') :
             t('welcomeAboard', 'Welcome aboard!')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {registrationStep === 'form'          ? t('joinSpendWise', 'Join SpendWise today') :
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
                requiresVerification={!isGoogleUser && !userData?.serverEmailVerified}
                autoRedirect={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip for googleProfile step */}
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
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
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
