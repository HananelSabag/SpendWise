// pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Sparkles,
  Shield,
  Zap,
  Check,
  Languages
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import FloatingMenu from '../../components/common/FloatingMenu';
import { userSchemas, validate } from "../../utils/validationSchemas";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const isRTL = language === 'he';

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Get redirect path
  const from = location.state?.from?.pathname || '/dashboard';

  // Animated background shapes
  const shapes = [
    { size: 400, duration: 25, delay: 0 },
    { size: 300, duration: 20, delay: 5 },
    { size: 200, duration: 30, delay: 10 }
  ];

  // Features list for showcase
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

  // Handle input change with validation
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Real-time email validation
    if (field === 'email' && value) {
      const emailError = validateEmail(value);
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({});
  setLoading(true);

  // Validate form data
  const { success, errors: zodErrors } = validate(userSchemas.login, formData);

  if (!success) {
    setErrors(zodErrors);
    setLoading(false);
    return;
  }

  // Clear previous general error
  const result = await login(formData);
  if (!result.success) {
    setErrors({ general: result.error.message });
  }
  setLoading(false);
};


  // Quick login for development (remove in production)
  const quickLogin = () => {
    setFormData({
      email: 'demo@spendwise.com',
      password: 'demo123'
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900"
        initial={{ opacity: 0, x: -50 }}
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
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('auth.welcomeBack')}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t('auth.loginSubtitle')}
            </p>
          </motion.div>

          {/* Form */}
          <motion.form 
            onSubmit={handleSubmit}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('auth.emailPlaceholder')}
                  icon={Mail}
                  error={errors.email}
                  className="pl-10"
                />
                <AnimatePresence>
                  {formData.email && !errors.email && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-3 top-3"
                    >
                      <Check className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.password')}
                </label>
                <Link 
                  to="/auth/forgot-password" 
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder={t('auth.passwordPlaceholder')}
                icon={Lock}
                error={errors.password}
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {t('auth.rememberMe')}
                </span>
              </label>
              
              {/* Dev Quick Login */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  type="button"
                  onClick={quickLogin}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Quick Login
                </button>
              )}
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert type="error" dismissible onDismiss={() => setErrors({})}>
                    {errors.submit}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={isLoggingIn}
              className="relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center">
                {t('auth.signIn')}
                <ArrowRight className={`w-5 h-5 ml-2 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180' : ''}`} />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                  {t('auth.orContinueWith')}
                </span>
              </div>
            </div>

            {/* Social Login (Future) */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="default" disabled>
                <img src="/google.svg" alt="Google" className="w-5 h-5 mr-2" />
                Google
              </Button>
              <Button variant="outline" size="default" disabled>
                <img src="/microsoft.svg" alt="Microsoft" className="w-5 h-5 mr-2" />
                Microsoft
              </Button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {t('auth.noAccount')}{' '}
              <Link 
                to="/auth/register" 
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {t('auth.signUpNow')}
              </Link>
            </p>
          </motion.form>
        </div>
      </motion.div>

      {/* Right Side - Feature Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 relative overflow-hidden">
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
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-white/80">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Menu */}
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          }
        ]}
      />
    </div>
  );
};

export default Login;