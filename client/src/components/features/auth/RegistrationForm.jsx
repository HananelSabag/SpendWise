/**
 * 📝 REGISTRATION FORM - Mobile-First Registration Component
 * Extracted from Register.jsx for better maintainability and performance
 * Features: Form validation, Google auth, Password strength, Mobile UX
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Lock, Eye, EyeOff, ArrowRight, Globe, Check, X
} from 'lucide-react';

// ✅ Import Zustand stores and components
import { useTranslation, useNotifications } from '../../../stores';
import { Button, Input, LoadingSpinner, Badge } from '../../ui';
import PasswordStrength from './PasswordStrength';
import { api } from '../../../api';
import { cn } from '../../../utils/helpers';

/**
 * 📝 Registration Form Component
 */
const RegistrationForm = ({ 
  onSubmit,
  onGoogleRegister,
  isSubmitting = false,
  isGoogleLoading = false,
  errors = {},
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');
  const { addNotification } = useNotifications();

  // ✅ Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordAnalysis, setPasswordAnalysis] = useState(null);

  // ✅ Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // ✅ Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      addNotification({
        type: 'error',
        message: t('acceptTermsRequired')
      });
      return;
    }

    onSubmit?.({
      ...formData,
      passwordAnalysis,
      acceptedTerms
    });
  }, [formData, acceptedTerms, passwordAnalysis, onSubmit, addNotification, t]);

  // ✅ Handle password analysis callback
  const handlePasswordAnalysis = useCallback((analysis) => {
    setPasswordAnalysis(analysis);
  }, []);

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
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.general}
            </p>
          </motion.div>
        )}

        {/* Name Fields Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('firstName')}
            </label>
            <div className="relative">
              <Input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder={t('firstNamePlaceholder')}
                className={cn(
                  "pl-12",
                  errors.firstName && "border-red-300 focus:border-red-500"
                )}
                disabled={isSubmitting}
                autoComplete="given-name"
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.firstName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('lastName')}
            </label>
            <div className="relative">
              <Input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder={t('lastNamePlaceholder')}
                className={cn(
                  "pl-12",
                  errors.lastName && "border-red-300 focus:border-red-500"
                )}
                disabled={isSubmitting}
                autoComplete="family-name"
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.lastName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

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
          
          {/* Password Strength Component */}
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

        {/* Terms Acceptance */}
        <div>
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 flex-shrink-0"
            />
            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
              {t('acceptTerms')}{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-500 underline">
                {t('termsOfService')}
              </Link>
              {' '}{t('and')}{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                {t('privacyPolicy')}
              </Link>
            </span>
          </label>
          {errors.terms && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.terms}
            </p>
          )}
        </div>

        {/* Register Button */}
        <Button
          type="submit"
          className="w-full min-h-[48px]"
          disabled={isSubmitting || !acceptedTerms}
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" className={cn("mr-2", isRTL && "ml-2 mr-0")} />
          ) : (
            <ArrowRight className={cn("w-5 h-5 mr-2", isRTL && "ml-2 mr-0 rotate-180")} />
          )}
          {isSubmitting ? t('creatingAccount') : t('createAccount')}
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

        {/* Google Register */}
        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[48px]"
          onClick={onGoogleRegister}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <LoadingSpinner size="sm" className={cn("mr-2", isRTL && "ml-2 mr-0")} />
          ) : (
            <Globe className={cn("w-5 h-5 mr-2", isRTL && "ml-2 mr-0")} />
          )}
          {isGoogleLoading ? t('connecting') : t('continueWithGoogle')}
        </Button>
      </form>
    </div>
  );
};

export default RegistrationForm; 