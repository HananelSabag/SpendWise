/**
 * User Login Page
 * Secure authentication with email verification support
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  Languages,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogIn,
  Shield,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Footer from '../../components/layout/Footer';
import GuestPreferences from '../../components/common/GuestPreferences';
import AccessibilityMenu from '../../components/common/AccessibilityMenu';
import { cn } from '../../utils/helpers';

/**
 * Resend verification email modal - Enhanced version
 */
const ResendVerificationModal = ({ email, onClose }) => {
  const { t } = useLanguage();
  const { resendVerificationEmail, isResendingVerification } = useAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  console.log('📧 [MODAL] ResendVerificationModal rendered for email:', email);

  const handleResend = async () => {
    setError('');

    try {
      await resendVerificationEmail(email);
      setSent(true);
      
      setTimeout(() => {
        onClose();
      }, 4000);
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || t('errors.generic');
      setError(errorMessage);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl adaptive-card max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('auth.emailNotVerifiedModalTitle') || 'Email Not Verified'}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('auth.emailNotVerifiedModalMessage') || 'You haven\'t verified your email address yet.'}
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  {t('auth.checkEmailSpamMessage') || 'Please check your inbox and spam folder. Sometimes verification emails end up there.'}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  <strong>{email}</strong>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <Alert type="error" className="mb-4 text-left">
              {error}
            </Alert>
          )}

          {!sent ? (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('auth.stillNoEmailMessage') || 'Still don\'t see the email?'}
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={onClose}
                  disabled={isResendingVerification}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleResend}
                  loading={isResendingVerification}
                  disabled={isResendingVerification}
                  className="relative"
                >
                  {isResendingVerification ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('auth.clickToResendMessage') || 'Click here to resend'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6"
              >
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                  {t('auth.resendVerificationSuccess') || 'Verification email sent successfully!'}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t('auth.checkEmailAgainMessage') || 'Please check your inbox again (including spam folder)'}
                </p>
              </motion.div>
              
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
              >
                {t('common.close')}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * User Login Component
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const isRTL = language === 'he';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  
  // Email verification state
  const [showResendModal, setShowResendModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // Debug logging
  console.log('🔍 [LOGIN] Modal state:', { showResendModal, unverifiedEmail });

  // Registration redirect message
  const message = location.state?.message;
  const emailFromRegistration = location.state?.email;

  // Auto-populate email from registration
  useEffect(() => {
    if (emailFromRegistration) {
      setFormData(prev => ({ ...prev, email: emailFromRegistration }));
    }
  }, [emailFromRegistration]);

  /**
   * Handle form input changes
   */
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Handle login form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await login(formData);
      
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      console.log('🔐 [LOGIN] Full error object:', error);
      console.log('🔐 [LOGIN] Error response:', error.response?.data);
      
      // ✅ Check for EMAIL_NOT_VERIFIED in multiple possible locations
      const errorCode = error.response?.data?.error?.code || error.response?.data?.code;
      console.log('🔐 [LOGIN] Error code found:', errorCode);
      
      if (errorCode === 'EMAIL_NOT_VERIFIED') {
        console.log('🔐 [LOGIN] Email not verified error caught, showing modal for:', formData.email);
        console.log('🔐 [LOGIN] Setting modal state - unverifiedEmail:', formData.email, 'showResendModal: true');
        setUnverifiedEmail(formData.email);
        setShowResendModal(true);
        // Still show a brief error message for accessibility
        setErrors({
          general: t('auth.emailNotVerifiedLogin')
        });
      } else {
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message;
        console.log('🔐 [LOGIN] Other error:', errorMessage);
        setErrors({
          general: errorMessage || t('auth.invalidCredentials')
        });
      }
    }
  };

  // Animated background shapes
  const shapes = [
    { size: 400, duration: 25, delay: 0 },
    { size: 300, duration: 20, delay: 5 },
    { size: 200, duration: 30, delay: 10 }
  ];

  // Application features for showcase
  const features = [
    {
      icon: Shield,
      title: t('auth.features.secure'),
      description: t('auth.features.secureDesc')
    },
    {
      icon: Zap,
      title: t('auth.features.fast'),
      description: t('auth.features.fastDesc')
    },
    {
      icon: Sparkles,
      title: t('auth.features.smart'),
      description: t('auth.features.smartDesc')
    }
  ];

  const menuButtons = [
    {
      icon: Languages,
      label: language === 'he' ? 'English' : 'עברית',
      onClick: toggleLanguage
    }
  ];

  return (
    <>
      <div className="min-h-screen flex relative" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Guest Preferences & Accessibility - Top Right */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          <AccessibilityMenu />
          <GuestPreferences />
        </div>
        
        {/* Login Form Side */}
        <motion.div 
          className={cn(
            'w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-6 bg-white dark:bg-gray-900',
            isRTL ? 'lg:order-2' : 'lg:order-1'
          )}
          initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full max-w-sm space-y-6">
            {/* Logo */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/" className="inline-flex items-center justify-center mb-4">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl text-white font-bold">S</span>
                </motion.div>
              </Link>
            </motion.div>

            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {t('auth.welcomeBack')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('auth.loginSubtitle')}
              </p>
            </div>

            {/* Success message from registration */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                  <Alert type="success">
                    {message}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={t('auth.email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  icon={Mail}
                  error={errors.email}
                  required
                  autoFocus={!emailFromRegistration}
                />

                <Input
                  label={t('auth.password')}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  icon={Lock}
                  error={errors.password}
                  required
                />

                {/* Resend verification email link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.email) {
                        setUnverifiedEmail(formData.email);
                        setShowResendModal(true);
                      }
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  >
                    {t('auth.resendVerificationEmail')}
                  </button>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      {t('auth.rememberMe')}
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link
                      to="/forgot-password"
                      className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                </div>

                {/* Error Alert */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert 
                        type="error" 
                        dismissible 
                        onDismiss={() => setErrors({})}
                      >
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p>{errors.general}</p>
                            {unverifiedEmail && (
                              <button
                                type="button"
                                onClick={() => setShowResendModal(true)}
                                className="text-sm underline mt-1 hover:text-red-700 dark:hover:text-red-300"
                              >
                                {t('auth.resendVerificationLink')}
                              </button>
                            )}
                          </div>
                        </div>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  loading={isLoggingIn}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  {isLoggingIn ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <>
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <LogIn className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                      </span>
                      {t('auth.signIn')}
                    </>
                  )}
                </Button>

                {/* DEBUG: Test Modal Button */}
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      console.log('🧪 [DEBUG] Testing modal');
                      setUnverifiedEmail('test@example.com');
                      setShowResendModal(true);
                    }}
                    className="mt-2"
                  >
                    🧪 Test Modal (Dev Only)
                  </Button>
                )}

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.noAccount')}{' '}
                    <Link
                      to="/register"
                      className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {t('auth.signUpNow')}
                    </Link>
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>

        {/* NEW: Feature Showcase Side */}
        <div className={cn(
          'hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 relative overflow-hidden',
          isRTL ? 'lg:order-1' : 'lg:order-2'
        )}>
          {/* Animated Background Shapes */}
          {shapes.map((shape, index) => (
            <motion.div
              key={index}
              className="absolute rounded-full bg-white/10"
              style={{
                width: shape.size,
                height: shape.size,
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: shape.duration,
                delay: shape.delay,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 flex items-center justify-center w-full p-12">
            <div className="max-w-lg text-white">
              <motion.h2 
                className="text-4xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {t('auth.features.title')}
              </motion.h2>
              
              <motion.p 
                className="text-xl mb-12 text-white/90"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {t('auth.features.subtitle')}
              </motion.p>

              {/* Features */}
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <div className={cn(
                      'flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center',
                      isRTL ? 'ml-4' : 'mr-4'
                    )}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                      <p className="text-white/80">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* NEW: Stats Section */}
              <motion.div 
                className="mt-12 grid grid-cols-3 gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-sm text-white/80">{t('auth.activeUsers')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">$2M+</div>
                  <div className="text-sm text-white/80">{t('auth.savedMoney')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">4.9</div>
                  <div className="text-sm text-white/80">{t('auth.rating')}</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Resend Verification Modal */}
      <AnimatePresence>
        {showResendModal && (
          <ResendVerificationModal
            email={unverifiedEmail}
            onClose={() => {
              console.log('📧 [MODAL] Closing modal');
              setShowResendModal(false);
              setUnverifiedEmail('');
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 text-xs rounded z-[10000]">
          Modal State: {showResendModal ? 'OPEN' : 'CLOSED'} | Email: {unverifiedEmail}
        </div>
      )}

      <Footer />
    </>
  );
};

export default Login;