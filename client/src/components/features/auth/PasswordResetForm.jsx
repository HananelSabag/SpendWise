/**
 * 🔑 PASSWORD RESET FORM - Mobile-First Reset Component
 * Extracted from PasswordReset.jsx for better maintainability and performance
 * Features: Email request, Password validation, Mobile UX
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle
} from 'lucide-react';

// ✅ Import Zustand stores and components
import { useTranslation, useNotifications } from '../../../stores';
import { Button, Input, LoadingSpinner } from '../../ui';
import PasswordStrength from './PasswordStrength';
import { cn } from '../../../utils/helpers';

/**
 * 🔑 Password Reset Request Form
 */
const PasswordResetRequestForm = ({ 
  onSubmit,
  isSubmitting = false,
  errors = {},
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();

  const [email, setEmail] = useState('');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!email) {
      addNotification({
        type: 'error',
        message: t('emailRequired')
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      addNotification({
        type: 'error',
        message: t('emailInvalid')
      });
      return;
    }

    onSubmit?.({ email });
  }, [email, onSubmit, addNotification, t]);

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
          </motion.div>
        )}

        {/* Instructions */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('passwordResetInstructions')}
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('email')}
          </label>
          <div className="relative">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full min-h-[48px]"
          disabled={isSubmitting || !email}
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" className={cn("mr-2", isRTL && "ml-2 mr-0")} />
          ) : (
            <ArrowRight className={cn("w-5 h-5 mr-2", isRTL && "ml-2 mr-0 rotate-180")} />
          )}
          {isSubmitting ? t('sendingReset') : t('sendResetLink')}
        </Button>
      </form>
    </div>
  );
};

/**
 * 🔒 New Password Form
 */
const NewPasswordForm = ({ 
  onSubmit,
  isSubmitting = false,
  errors = {},
  className = '',
  email = ''
}) => {
  const { t, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordAnalysis, setPasswordAnalysis] = useState(null);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handlePasswordAnalysis = useCallback((analysis) => {
    setPasswordAnalysis(analysis);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!formData.password) {
      addNotification({
        type: 'error',
        message: t('passwordRequired')
      });
      return;
    }

    if (passwordAnalysis?.strength === 'weak') {
      addNotification({
        type: 'error',
        message: t('passwordTooWeak')
      });
      return;
    }

    if (!formData.confirmPassword) {
      addNotification({
        type: 'error',
        message: t('confirmPasswordRequired')
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addNotification({
        type: 'error',
        message: t('passwordMismatch')
      });
      return;
    }

    onSubmit?.({
      ...formData,
      passwordAnalysis
    });
  }, [formData, passwordAnalysis, onSubmit, addNotification, t]);

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
          </motion.div>
        )}

        {/* Email Display */}
        {email && (
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {t('resettingPasswordFor')}: <strong>{email}</strong>
            </p>
          </div>
        )}

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('newPassword')}
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t('newPasswordPlaceholder')}
              className={cn(
                "pl-12 pr-12",
                errors.password && "border-red-300 focus:border-red-500"
              )}
              disabled={isSubmitting}
              autoComplete="new-password"
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
          
          {/* Password Strength */}
          {formData.password && (
            <div className="mt-3">
              <PasswordStrength 
                password={formData.password}
                onAnalysisChange={handlePasswordAnalysis}
                compact={true}
              />
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('confirmPassword')}
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder={t('confirmPasswordPlaceholder')}
              className={cn(
                "pl-12 pr-12",
                errors.confirmPassword && "border-red-300 focus:border-red-500"
              )}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
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
          {isSubmitting ? t('resettingPassword') : t('resetPassword')}
        </Button>
      </form>
    </div>
  );
};

export { PasswordResetRequestForm, NewPasswordForm }; 