/**
 * Password Reset Page
 * Handles forgot password requests and password reset form
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Send,
  Key
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import GuestPreferences from '../../components/common/GuestPreferences';
import AccessibilityMenu from '../../components/common/AccessibilityMenu';
import { cn } from '../../utils/helpers';

/**
 * Password Reset Component
 */
const PasswordReset = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRTL = language === 'he';
  
  const { 
    forgotPassword, 
    resetPassword, 
    isSendingResetEmail, 
    isResettingPassword 
  } = useAuth();
  
  // Determine mode based on token presence
  const token = searchParams.get('token');
  const isResetMode = Boolean(token);
  
  // Component state
  const [step, setStep] = useState(isResetMode ? 'reset' : 'forgot');
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Validate token on mount
  useEffect(() => {
    if (isResetMode && !token) {
      setError('Invalid or missing reset token');
      setStep('forgot');
    }
  }, [token, isResetMode]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  /**
   * Handle forgot password form submission
   */
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email) {
      setError(t('validation.emailRequired'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('validation.emailInvalid'));
      return;
    }

    try {
      await forgotPassword(formData.email);
      setStep('email-sent');
    } catch (err) {
      setError(err.response?.data?.error?.message || t('errors.generic'));
    }
  };

  /**
   * Handle password reset form submission
   */
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.newPassword || !formData.confirmPassword) {
      setError(t('validation.required'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('validation.passwordsDontMatch'));
      return;
    }

    if (formData.newPassword.length < 6) {
      setError(t('validation.passwordTooShort'));
      return;
    }

    try {
      await resetPassword(token, formData.newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || t('errors.generic'));
    }
  };

  /**
   * Calculate password strength score
   */
  const getPasswordStrength = () => {
    const { newPassword } = formData;
    if (!newPassword) return 0;
    
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;
    
    return strength;
  };

  const strength = getPasswordStrength();
  const strengthText = ['', t('auth.weak'), t('auth.fair'), t('auth.good'), t('auth.strong'), t('auth.veryStrong')];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Guest Preferences & Accessibility - Top Right */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <AccessibilityMenu />
        <GuestPreferences />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-xl text-white font-bold">S</span>
              </div>
            </Link>
            
            <AnimatePresence mode="wait">
              {step === 'forgot' && (
                <motion.div
                  key="forgot-header"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('auth.forgotPasswordTitle')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('auth.forgotPasswordDesc')}
                  </p>
                </motion.div>
              )}
              
              {step === 'reset' && (
                <motion.div
                  key="reset-header"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('auth.resetPasswordTitle')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('auth.resetPasswordDesc')}
                  </p>
                </motion.div>
              )}
              
              {step === 'email-sent' && (
                <motion.div
                  key="email-sent-header"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('auth.checkYourEmail')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('auth.resetEmailSent')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {/* Forgot Password Form */}
            {step === 'forgot' && (
              <motion.form
                key="forgot-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleForgotSubmit}
                className="space-y-6"
              >
                <Input
                  label={t('auth.email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  icon={Mail}
                  error={error}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isSendingResetEmail}
                  disabled={!formData.email}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t('auth.sendResetLink')}
                </Button>
              </motion.form>
            )}

            {/* Email Sent Confirmation */}
            {step === 'email-sent' && (
              <motion.div
                key="email-sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('auth.resetLinkSent')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('auth.emailSentDesc')}
                </p>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setStep('forgot')}
                >
                  {t('auth.sendAnotherEmail')}
                </Button>
              </motion.div>
            )}

            {/* Reset Password Form */}
            {step === 'reset' && !success && (
              <motion.form
                key="reset-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetSubmit}
                className="space-y-6"
              >
                {/* New Password */}
                <div>
                  <Input
                    label={t('auth.newPassword')}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    icon={Lock}
                    required
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Password Strength Indicator */}
                  {formData.newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              level <= strength ? strengthColor[strength] : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${strength <= 2 ? 'text-red-500' : 'text-green-500'}`}>
                        {t('auth.passwordStrength')}: {strengthText[strength]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <Input
                  label={t('auth.confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  icon={Lock}
                  error={formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? t('validation.passwordsDontMatch') : ''}
                  required
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                {error && (
                  <Alert type="error" dismissible onDismiss={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isResettingPassword}
                  disabled={!formData.newPassword || !formData.confirmPassword}
                >
                  {t('auth.resetPassword')}
                </Button>
              </motion.form>
            )}

            {/* Success State */}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('auth.passwordResetSuccess')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('auth.redirectingToLogin')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to Login */}
          {!success && (
            <div className="mt-8 text-center">
              <Link 
                to="/login"
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <ArrowLeft className={cn('w-4 h-4', isRTL ? 'ml-1' : 'mr-1')} />
                {t('auth.backToLogin')}
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PasswordReset;
