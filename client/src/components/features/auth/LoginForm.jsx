/**
 * Login Form — email/password + Google
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

import { useTranslation, useNotifications } from '../../../stores';
import { Button, LoadingSpinner } from '../../ui';
import { api } from '../../../api';
import { cn } from '../../../utils/helpers';
import SimpleGoogleButton from './SimpleGoogleButton';

const LoginForm = ({
  onSubmit,
  onGoogleLogin,
  isSubmitting = false,
  isGoogleLoading = false,
  errors = {},
  className = '',
}) => {
  const { t } = useTranslation('auth');
  const { addNotification } = useNotifications();

  const [formData, setFormData]       = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]   = useState(false);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return false;
    if (!formData.password || formData.password.length < 6) return false;
    return true;
  }, [formData]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!validateForm()) {
      addNotification({ type: 'error', message: t('formValidationFailed') });
      return;
    }
    onSubmit?.({ ...formData, rememberMe });
  }, [formData, rememberMe, validateForm, onSubmit, addNotification, t]);

  const handleGoogleError = useCallback((err) => {
    addNotification({
      type: 'error',
      message: err?.message || t('googleSignInFailed'),
    });
  }, [addNotification, t]);

  // ── shared field styles ────────────────────────────────────────────────────
  const fieldBase = cn(
    'block w-full h-12 rounded-xl border bg-white dark:bg-gray-700/60',
    'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
    'transition-all duration-200 text-sm',
  );

  return (
    <div className={cn('glass-card rounded-2xl p-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* General error */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3.5"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
              {errors.code === 'EMAIL_NOT_VERIFIED' && (
                <button
                  type="button"
                  onClick={errors.onResendVerification}
                  disabled={errors.isResending}
                  className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 underline disabled:opacity-50"
                >
                  {errors.isResending ? t('sending') : t('resendVerification')}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t('email')}
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('emailPlaceholder')}
              disabled={isSubmitting}
              autoComplete="email"
              className={cn(fieldBase, 'ps-11 pe-4', errors.email && 'border-red-400 focus:ring-red-400/30 focus:border-red-400', 'border-gray-300 dark:border-gray-600')}
            />
            <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {t('password')}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t('passwordPlaceholder')}
              disabled={isSubmitting}
              autoComplete="current-password"
              className={cn(fieldBase, 'ps-11 pe-11', errors.password && 'border-red-400 focus:ring-red-400/30 focus:border-red-400', 'border-gray-300 dark:border-gray-600')}
            />
            <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-blue-600 cursor-pointer"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('rememberMe')}</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 underline"
          >
            {t('forgotPassword')}
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full h-12 rounded-xl font-bold text-white text-sm',
            'bg-gradient-to-l from-blue-600 to-indigo-600',
            'shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30',
            'flex items-center justify-center gap-2 transition-all duration-200',
            isSubmitting && 'opacity-70 cursor-not-allowed',
          )}
        >
          {isSubmitting
            ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{t('signingIn')}</>
            : t('signIn')
          }
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white dark:bg-gray-800 text-xs text-gray-400 font-medium">
              {t('orContinueWith')}
            </span>
          </div>
        </div>

        {/* Google */}
        {window.__SW_GOOGLE_OAUTH_ENABLED__ !== false && (
          <motion.div
            animate={errors.highlightGoogleButton ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1.5, repeat: errors.highlightGoogleButton ? Infinity : 0 }}
            className={cn('rounded-xl', errors.highlightGoogleButton && 'ring-2 ring-blue-500/50')}
          >
            <SimpleGoogleButton
              onSuccess={onGoogleLogin}
              onError={handleGoogleError}
              disabled={isSubmitting || isGoogleLoading}
            />
          </motion.div>
        )}

      </form>
    </div>
  );
};

export default LoginForm;
