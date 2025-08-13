/**
 * 🔐 LOGIN FORM - Mobile-First Login Component
 * Extracted from Login.jsx for better maintainability and performance
 * Features: Form validation, Google auth, Mobile UX, Remember me
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, Globe, AlertCircle
} from 'lucide-react';

// ✅ Import Zustand stores and components
import { useTranslation, useNotifications } from '../../../stores';
import { Button, Input, LoadingSpinner } from '../../ui';
import { api } from '../../../api';
import { cn } from '../../../utils/helpers';
import SimpleGoogleButton from './SimpleGoogleButton';

/**
 * 🔐 Login Form Component
 */
const LoginForm = ({ 
  onSubmit,
  onGoogleLogin,
  isSubmitting = false,
  isGoogleLoading = false,
  errors = {},
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();

  // ✅ Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ✅ Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // ✅ Form validation
  const validateForm = useCallback(() => {
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

    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // ✅ Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addNotification({
        type: 'error',
        message: t('formValidationFailed')
      });
      return;
    }

    onSubmit?.({
      ...formData,
      rememberMe
    });
  }, [formData, rememberMe, validateForm, onSubmit, addNotification, t]);

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.general}
              </p>
            </div>
            {errors.code === 'EMAIL_NOT_VERIFIED' && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('emailNotVerified')}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={errors.onResendVerification}
                  disabled={errors.isResending}
                >
                  {errors.isResending ? t('sending') : t('resendVerification')}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('email')}
          </label>
          <div className="relative">
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('emailPlaceholder')}
              className={cn(
                "pl-12",
                errors.email && "border-red-300 focus:border-red-500"
              )}
              disabled={isSubmitting}
              autoComplete="email"
            />
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('password')}
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t('passwordPlaceholder')}
              className={cn(
                "pl-12 pr-12",
                errors.password && "border-red-300 focus:border-red-500"
              )}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {t('rememberMe')}
            </span>
          </label>
          
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 underline"
          >
            {t('forgotPassword')}
          </Link>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          className="w-full min-h-[48px]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" className={cn("mr-2", isRTL && "ml-2 mr-0")} />
          ) : (
            <ArrowRight className={cn("w-5 h-5 mr-2", isRTL && "ml-2 mr-0 rotate-180")} />
          )}
          {isSubmitting ? t('signingIn') : t('signIn')}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
              {t('orContinueWith')}
            </span>
          </div>
        </div>

        {/* Google Login */}
        {window.__SW_GOOGLE_OAUTH_ENABLED__ !== false && (
          <SimpleGoogleButton
            onSuccess={onGoogleLogin}
            onError={(error) => {
              addNotification({
                type: 'error',
                message: error.message || t('googleSignInFailed')
              });
            }}
            disabled={isSubmitting}
          />
        )}
      </form>
    </div>
  );
};

export default LoginForm; 