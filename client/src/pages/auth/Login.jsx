/**
 * 🔐 LOGIN PAGE - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Form orchestration, Google OAuth, Mobile UX
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';

// ✅ Import Zustand stores and enhanced API
import { 
  useAuth, 
  useTranslation,
  useTheme,
  useNotifications,
  useAuthStore
} from '../../stores';
import { useAuthToasts } from '../../hooks/useAuthToasts';

// ✅ Import components
import LoginForm from '../../components/features/auth/LoginForm';
import GuestSettings from '../../components/common/GuestSettings';

import { api, authAPI } from '../../api';
import { Button } from '../../components/ui';
import { cn } from '../../utils/helpers';

const Login = () => {
  // ✅ Zustand stores
  const { login, isAuthenticated, googleLogin } = useAuth();
  const { t, currentLanguage, setLanguage, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();

  const navigate = useNavigate();
  const location = useLocation();
  const authToasts = useAuthToasts(); // ✅ Enhanced auth toasts with translations

  // ✅ Login state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // ✅ Form validation
  const validateForm = useCallback((formData) => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('passwordTooShort');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [t]);

  // ✅ Handle login form submission
  const handleLoginSubmit = useCallback(async (formData) => {
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        authToasts.loginSuccess(result.user);
        
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        // Handle unverified email with resend action
        if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
          setErrors({
            general: result.error?.message || t('emailNotVerified'),
            code: 'EMAIL_NOT_VERIFIED',
            isResending: false,
            onResendVerification: async () => {
              try {
                setErrors(prev => ({ ...prev, isResending: true }));
                const resend = await api.auth.resendVerificationEmail({ email: formData.email });
                if (resend.success) {
                  addNotification({ type: 'success', message: t('verificationEmailResent') });
                } else {
                  addNotification({ type: 'error', message: resend.error?.message || t('resendVerificationFailed') });
                }
              } catch (_) {
                addNotification({ type: 'error', message: t('resendVerificationError') });
              } finally {
                setErrors(prev => ({ ...prev, isResending: false }));
              }
            }
          });
        } else {
          // Enhanced error handling with specific messages
          let errorMessage = result.error?.message || t('loginFailed');
          const errorCode = result.error?.code;
          
          // Use translated messages for known error codes
          switch (errorCode) {
            case 'INVALID_CREDENTIALS':
              errorMessage = t('invalidCredentials');
              break;
            case 'USER_NOT_FOUND':
              errorMessage = t('userNotFound');
              break;
            case 'ACCOUNT_BLOCKED':
            case 'ACCOUNT_LOCKED':
              errorMessage = t('accountBlocked');
              break;
            case 'ACCOUNT_DEACTIVATED':
              errorMessage = t('accountDeactivated') || 'Your account has been deactivated. Please contact support.';
              break;
            case 'GOOGLE_ONLY_USER':
              errorMessage = t('googleOnlyUser') || 'This account uses Google sign-in. Please use the Google login button below.';
              break;
            case 'PASSWORD_NOT_SET':
              errorMessage = t('passwordNotSet') || 'No password set for this account. Please login with Google or reset your password.';
              break;
            case 'ACCESS_DENIED':
              errorMessage = t('accessDenied');
              break;
            case 'RATE_LIMITED':
              errorMessage = t('rateLimited');
              break;
            case 'SERVER_ERROR':
              errorMessage = t('serverError');
              break;
            case 'TIMEOUT_ERROR':
              errorMessage = t('timeoutError');
              break;
            case 'NETWORK_ERROR':
              errorMessage = t('networkError');
              break;
            default:
              // Keep original message if it's meaningful, otherwise use fallback
              if (errorMessage.toLowerCase().includes('internal server error')) {
                errorMessage = t('invalidCredentials'); // Default to credentials error for generic server errors
              }
              break;
          }
          
          authToasts.loginFailed({ ...result.error, message: errorMessage });
          setErrors({ 
            general: errorMessage,
            code: errorCode,
            showSupportContact: ['ACCOUNT_BLOCKED', 'ACCOUNT_DEACTIVATED', 'ACCESS_DENIED', 'SERVER_ERROR'].includes(errorCode),
            highlightGoogleButton: ['GOOGLE_ONLY_USER', 'PASSWORD_NOT_SET'].includes(errorCode)
          });
        }
      }
    } catch (error) {
      // Handle unexpected errors
      let errorMessage = t('authenticationFailed');
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = t('networkError');
      } else if (error.message?.includes('timeout')) {
        errorMessage = t('timeoutError');
      }
      
      authToasts.loginFailed({ message: errorMessage, code: 'UNEXPECTED_ERROR' });
      setErrors({ 
        general: errorMessage,
        showSupportContact: true
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, login, authToasts, t, location, navigate]);

  // ✅ Handle Google login with credential
  const handleGoogleLogin = useCallback(async (credential) => {
    // silent
    setIsGoogleLoading(true);
    
    try {
      let result;
      
      if (credential) {
        // Direct credential from SimpleGoogleButton
        // silent
        result = await authAPI.processGoogleCredential(credential);
      } else {
        // This shouldn't happen anymore with SimpleGoogleButton
        throw new Error('No Google credential provided');
      }
      
      // silent
      
      if (result.success) {
        // Keep UI success toasts only
        authToasts.googleLoginSuccess(result.user);
        
        // Update auth store with the user data
        if (credential) {
          // Update store directly and start token refresh timer (hybrid auth)
          const store = useAuthStore.getState();
          store.actions.setUser(result.user);
          try { store.actions.startTokenRefreshTimer(); } catch (_) {}
        }
        
        // Navigate to dashboard
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        // silent
        authToasts.googleLoginFailed();
        setErrors({ 
          general: result.error?.message || 'Google login failed'
        });
      }
    } catch (error) {
      // silent
      authToasts.googleLoginFailed();
      setErrors({ 
        general: error.message || 'Google login error'
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }, [googleLogin, authToasts, t, location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <GuestSettings />

      {/* Static decorative blobs — no infinite animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full absolute -top-48 -right-48 opacity-10" />
        <div className="w-80 h-80 bg-gradient-to-br from-indigo-400 to-cyan-500 rounded-full absolute -bottom-40 -left-40 opacity-10" />
      </div>

      <div className="relative z-10 w-full max-w-md" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {t('welcomeBack', 'Welcome back')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('signInToContinue', 'Sign in to continue to SpendWise')}
          </p>
        </div>

        <LoginForm
          onSubmit={handleLoginSubmit}
          onGoogleLogin={handleGoogleLogin}
          isSubmitting={isSubmitting}
          isGoogleLoading={isGoogleLoading}
          errors={errors}
        />

        <div className="text-center mt-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('dontHaveAccount', "Don't have an account?")}{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              {t('signUp', 'Sign up')}
            </Link>
          </p>
        </div>

        <div className="text-center mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(currentLanguage === 'en' ? 'he' : 'en')}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Globe className="w-3.5 h-3.5 mr-1.5" />
            {currentLanguage === 'en' ? 'עברית' : 'English'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;