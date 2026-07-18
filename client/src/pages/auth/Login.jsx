/**
 * 🔐 LOGIN PAGE
 * Mobile-first, Component-based, Clean architecture
 * @version 2.1.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Globe, Loader2 } from 'lucide-react';

import {
  useAuth,
  useTranslation,
  useTheme,
  useNotifications
} from '../../stores';
import { useAuthToasts } from '../../hooks/useAuthToasts';

import LoginForm from '../../components/features/auth/LoginForm';
import GuestSettings from '../../components/common/GuestSettings';

import { api } from '../../api';
import apiClient from '../../api/client';
import cyclesApi from '../../api/cycles';
import { queryClient } from '../../config/queryClient';
import { takePendingGoogleCredential } from '../../services/simpleGoogleAuth';
import { Button } from '../../components/ui';
import { cn } from '../../utils/helpers';
import { resolveAuthReturnPath } from '../../utils/authReturnPath';

function warmFinancialHome(userId) {
  if (!userId) return;
  // Start the route chunk and the three independent dashboard sources as soon as
  // tokens exist. Navigation does not wait for them; React Query reuses the same
  // user-scoped promises/cache entries when the dashboard mounts.
  void import('../ModernDashboard.jsx');
  void Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['dashboard', userId],
      queryFn: async () => {
        const result = await api.transactions.getDashboardData();
        if (!result.success) throw new Error(result.error?.message || 'Failed to load dashboard');
        return result.data?.data ?? result.data;
      },
      staleTime: 5 * 60_000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['cycles', userId, 'current'],
      queryFn: () => cyclesApi.current(),
      staleTime: 30_000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['bankBalances', userId],
      queryFn: () => apiClient.get('/bank-sync/stats', { params: { periodOffset: 0 } })
        .then((response) => response.data.sources || []),
      staleTime: 5 * 60_000,
    }),
  ]);
}

const Login = () => {
  const { login, isAuthenticated, googleLogin } = useAuth();
  const { t, currentLanguage, setLanguage, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();

  const navigate = useNavigate();
  const location = useLocation();
  const authToasts = useAuthToasts();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Prevent the isAuthenticated effect from navigating twice when a handler
  // is already handling navigation.
  const navigatingRef = useRef(false);

  // Show success toast when arriving from registration
  useEffect(() => {
    if (location.state?.registrationSuccess) {
      addNotification({
        type: 'success',
        message: t('registrationSuccessCheckEmail') || 'Account created! Please verify your email to log in.',
        duration: 6000,
      });
      window.history.replaceState({}, '', location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if already authenticated (handles page-reload-while-logged-in case)
  useEffect(() => {
    if (isAuthenticated && !navigatingRef.current) {
      const from = resolveAuthReturnPath(location.state?.from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Resume a Google credential that arrived while no login page was mounted
  // (e.g. the user completed the Google flow mid-navigation). Without this,
  // that credential used to be silently dropped — Google sign-in "did nothing".
  useEffect(() => {
    const pending = takePendingGoogleCredential();
    if (pending) handleGoogleLogin(pending);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form validation ──────────────────────────────────────────────────────────
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

  // ── Email/password login ──────────────────────────────────────────────────────
  const handleLoginSubmit = useCallback(async (formData) => {
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        authToasts.loginSuccess(result.user);
        warmFinancialHome(result.user?.id);
        // Let the isAuthenticated effect handle navigation so the button spinner
        // stays visible until the component actually unmounts.
        navigatingRef.current = true;
        const from = resolveAuthReturnPath(location.state?.from);
        navigate(from, { replace: true });
      } else {
        setIsSubmitting(false);

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
          let errorMessage = result.error?.message || t('loginFailed');
          const errorCode = result.error?.code;

          switch (errorCode) {
            case 'INVALID_CREDENTIALS':
              errorMessage = t('invalidCredentials'); break;
            case 'USER_NOT_FOUND':
              errorMessage = t('userNotFound'); break;
            case 'ACCOUNT_BLOCKED':
            case 'ACCOUNT_LOCKED':
            case 'USER_BLOCKED':
              errorMessage = t('accountBlocked'); break;
            case 'ACCOUNT_DEACTIVATED':
              errorMessage = t('accountDeactivated') || 'Your account has been deactivated. Please contact support.'; break;
            case 'GOOGLE_ONLY_USER':
              errorMessage = t('googleOnlyUser') || 'This account uses Google sign-in. Please use the Google login button below.'; break;
            case 'PASSWORD_NOT_SET':
              errorMessage = t('passwordNotSet') || 'No password set for this account. Please login with Google or reset your password.'; break;
            case 'ACCESS_DENIED':
              errorMessage = t('accessDenied'); break;
            case 'RATE_LIMITED':
              errorMessage = t('rateLimited'); break;
            case 'SERVER_ERROR':
              errorMessage = t('serverError'); break;
            case 'TIMEOUT_ERROR':
              errorMessage = t('timeoutError'); break;
            case 'NETWORK_ERROR':
              errorMessage = t('networkError'); break;
            default:
              if (errorMessage.toLowerCase().includes('internal server error')) {
                errorMessage = t('invalidCredentials');
              }
          }

          authToasts.loginFailed({ ...result.error, message: errorMessage });
          setErrors({
            general: errorMessage,
            code: errorCode,
            showSupportContact: ['ACCOUNT_BLOCKED', 'ACCOUNT_DEACTIVATED', 'ACCESS_DENIED', 'USER_BLOCKED', 'SERVER_ERROR'].includes(errorCode),
            highlightGoogleButton: ['GOOGLE_ONLY_USER', 'PASSWORD_NOT_SET'].includes(errorCode)
          });
        }
      }
    } catch (error) {
      setIsSubmitting(false);
      let errorMessage = t('authenticationFailed');
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = t('networkError');
      } else if (error.message?.includes('timeout')) {
        errorMessage = t('timeoutError');
      }
      authToasts.loginFailed({ message: errorMessage, code: 'UNEXPECTED_ERROR' });
      setErrors({ general: errorMessage, showSupportContact: true });
    }
  }, [validateForm, login, authToasts, t, location, navigate, addNotification]);

  // ── Google login ──────────────────────────────────────────────────────────────
  const handleGoogleLogin = useCallback(async (credential) => {
    setIsGoogleLoading(true);
    let succeeded = false;

    try {
      if (!credential) throw new Error('No Google credential provided');

      const result = await googleLogin(credential);

      if (result.success) {
        succeeded = true;
        authToasts.googleLoginSuccess(result.user);

        // The shared auth action has already stored the session and cleared any
        // previous user's caches. Start the financial-home requests immediately.
        warmFinancialHome(result.user?.id);

        // Belt-and-suspenders: also navigate here in case the effect fired
        // before the shared store update reached this component.
        navigatingRef.current = true;
        const from = resolveAuthReturnPath(location.state?.from);
        navigate(from, { replace: true });
      } else {
        const code   = result.error?.code || '';
        const status = result.error?.status || 0;

        let errorMessage = result.error?.message || t('googleSignInFailed') || 'Google sign-in failed';
        let showSupportContact = false;

        switch (code) {
          case 'USER_BLOCKED':
          case 'ACCOUNT_BLOCKED':
            // Redirect to blocked page immediately
            if (window.spendWiseNavigate) window.spendWiseNavigate('/blocked', { replace: true });
            else window.location.replace('/blocked');
            return;
          case 'ACCOUNT_DEACTIVATED':
            errorMessage = t('accountDeactivated') || 'Your account has been deactivated. Contact support.';
            showSupportContact = true; break;
          case 'EMAIL_NOT_VERIFIED':
            errorMessage = t('emailNotVerified') || 'Please verify your email before signing in.'; break;
          case 'RATE_LIMITED':
            errorMessage = t('rateLimited') || 'Too many attempts. Please wait and try again.'; break;
          case 'NETWORK_ERROR':
          case 'TIMEOUT_ERROR':
            errorMessage = t('networkError') || 'Connection error. Please check your internet connection.'; break;
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
      // Only clear the overlay on failure — on success the component unmounts
      if (!succeeded) setIsGoogleLoading(false);
    }
  }, [googleLogin, authToasts, t, location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <GuestSettings />

      {/* Google auth loading overlay — stays visible until component unmounts */}
      {isGoogleLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">S</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-900 dark:text-white font-semibold text-base">
                {t('signingInWithGoogle') || 'Signing in with Google…'}
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
