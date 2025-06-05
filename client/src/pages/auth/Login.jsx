// pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  Languages,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle, // NEW: For success states
  XCircle, // NEW: For error states
  RefreshCw, // NEW: For resend button
  LogIn, // FIXED: Correct import name
  Shield, // NEW: For feature showcase
  Zap, // NEW: For feature showcase
  Sparkles // NEW: For feature showcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import FloatingMenu from '../../components/common/FloatingMenu';
import Footer from '../../components/layout/Footer'; // NEW: Import Footer
import { cn } from '../../utils/helpers';
import api from '../../utils/api'; // NEW: For resend verification
import toast from 'react-hot-toast'; // NEW: For notifications

// NEW: Resend Verification Email Component
const ResendVerificationModal = ({ email, onClose }) => {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    setSending(true);
    setError('');

    try {
      const response = await api.post('/users/resend-verification', { email });
      setSent(true);
      toast.success(t('auth.verificationEmailResent'));
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || t('errors.generic');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
            <Mail className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('auth.resendVerificationEmail')}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('auth.resendVerificationDescription')} <strong>{email}</strong>
          </p>

          {error && (
            <Alert type="error" className="mb-4">
              {error}
            </Alert>
          )}

          {sent ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-sm text-green-800 dark:text-green-200">
                {t('auth.verificationEmailSent')}
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
                disabled={sending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleResend}
                loading={sending}
                disabled={sending}
              >
                {sending ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('auth.resendEmail')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // NEW: Email verification state
  const [showResendModal, setShowResendModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // NEW: Show message from registration redirect
  const message = location.state?.message;
  const emailFromRegistration = location.state?.email;

  // NEW: Auto-populate email from registration
  useEffect(() => {
    if (emailFromRegistration) {
      setFormData(prev => ({ ...prev, email: emailFromRegistration }));
    }
  }, [emailFromRegistration]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle form submission - UPDATED: Better error handling for email verification
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
      console.error('Login error:', error);
      
      // Check if it's an email verification error
      if (error.response?.data?.error?.code === 'EMAIL_NOT_VERIFIED') {
        console.log('📧 [LOGIN] Email verification required for:', formData.email);
        setUnverifiedEmail(formData.email);
        setErrors({
          general: t('auth.emailNotVerifiedLogin')
        });
      } else {
        const errorMessage = error.response?.data?.error?.message || error.response?.data?.message;
        setErrors({
          general: errorMessage || t('auth.invalidCredentials')
        });
      }
    }
  };

  // NEW: Animated background shapes
  const shapes = [
    { size: 400, duration: 25, delay: 0 },
    { size: 300, duration: 20, delay: 5 },
    { size: 200, duration: 30, delay: 10 }
  ];

  // NEW: Features list for showcase
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
        <FloatingMenu buttons={menuButtons} />
        
        {/* Form Side - UPDATED: Now takes half width on large screens */}
        <motion.div 
          className={cn(
            'w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900',
            isRTL ? 'lg:order-2' : 'lg:order-1'
          )}
          initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/" className="inline-flex items-center justify-center mb-8">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl text-white font-bold">S</span>
                </motion.div>
              </Link>
            </motion.div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('auth.welcomeBack')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('auth.loginSubtitle')}
              </p>
            </div>

            {/* NEW: Success message from registration */}
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input - UPDATED: Auto-focus logic */}
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

                {/* Password Input - UPDATED: Auto-focus when email prefilled */}
                <Input
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  icon={Lock}
                  error={errors.password}
                  required
                  autoFocus={!!emailFromRegistration}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                />

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

                {/* Error Alert - UPDATED: Now includes resend verification option */}
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
                            {/* NEW: Show resend link for unverified emails */}
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

      {/* NEW: Resend Verification Modal */}
      <AnimatePresence>
        {showResendModal && (
          <ResendVerificationModal
            email={unverifiedEmail}
            onClose={() => {
              setShowResendModal(false);
              setUnverifiedEmail('');
            }}
          />
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
};

export default Login;