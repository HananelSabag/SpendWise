// pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import cn from 'classnames';
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
  AlertCircle,
  Languages
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { userSchemas, validate } from "../../utils/validationSchemas";
import FloatingMenu from '../../components/common/FloatingMenu';
import AccessibilityMenu from '../../components/common/AccessibilityMenu';
import AccessibilityStatement from '../../components/common/AccessibilityStatement';
import AuthFooter from '../../components/auth/AuthFooter';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn, error: authError } = useAuth();
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
  const [showAccessibility, setShowAccessibility] = useState(false);

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

  // Clear auth error on unmount
  useEffect(() => {
    return () => {
      setErrors({});
    };
  }, []);

  // Handle input change with validation
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const { success, errors: validationErrors } = validate(userSchemas.login, formData);

    if (!success) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Attempt login
      const result = await login(formData);
      
      if (result.success) {
        // Save remember me preference
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        // Navigate to dashboard or previous location
        navigate(from, { replace: true });
      } else {
        // Handle login error
        setErrors({ 
          general: result.error?.message || t('auth.invalidCredentials') 
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ 
        general: t('errors.generic') 
      });
    }
  };

  // Quick login for development
  const quickLogin = () => {
    if (process.env.NODE_ENV === 'development') {
      setFormData({
        email: 'demo@spendwise.com',
        password: 'Demo123!'
      });
    }
  };

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
        <AccessibilityMenu />
        
        {/* Form Side */}
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
                <Input
                  type="email"
                  label={t('auth.email')}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('auth.emailPlaceholder')}
                  icon={Mail}
                  error={errors.email}
                  required
                />
                <AnimatePresence>
                  {formData.email && !errors.email && focusedField !== 'email' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={cn(
                        'absolute top-3',
                        isRTL ? 'left-3' : 'right-3'
                      )}
                    >
                      <Check className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={t('auth.passwordPlaceholder')}
                  icon={Lock}
                  error={errors.password}
                  required
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className={cn(
                    'text-sm text-gray-600 dark:text-gray-400',
                    isRTL ? 'mr-2' : 'ml-2'
                  )}>
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
                {(errors.general || authError) && (
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
                      {errors.general || authError}
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
                  <ArrowRight className={cn(
                    'w-5 h-5 transition-transform group-hover:translate-x-1',
                    isRTL ? 'mr-2 rotate-180' : 'ml-2'
                  )} />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Button>

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

        {/* Feature Showcase Side */}
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
            </div>
          </div>
        </div>
      </div>
      <AuthFooter />
    </>
  );
};

export default Login;