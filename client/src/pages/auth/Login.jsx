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
  Languages,
  LogIn  // ✅ Added missing LogIn import
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner'; // ✅ Added missing LoadingSpinner import
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { userSchemas, validate } from "../../utils/validationSchemas";
import FloatingMenu from '../../components/common/FloatingMenu';
import AccessibilityMenu from '../../components/common/AccessibilityMenu';
import AccessibilityStatement from '../../components/common/AccessibilityStatement';
import Footer from '../../components/layout/Footer';

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
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
        
        // Check to ensure the path exists and is valid
        // ✅ Navigation path fix - use dashboard instead of home
        const targetPath = from === '/dashboard' ? '/dashboard' : from;
        
        console.log("[DEBUG] Navigating to:", targetPath);
        
        // Navigate to dashboard or previous location
        navigate(targetPath, { replace: true });
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
            </motion.div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('auth.welcomeBack')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('auth.loginSubtitle')}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange} // ✅ Fixed handleChange
                  placeholder={t('auth.emailPlaceholder')}
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 transition-colors`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange} // ✅ Fixed handleChange
                    placeholder={t('auth.passwordPlaceholder')}
                    className={`appearance-none relative block w-full px-3 py-3 ${isRTL ? 'pl-10 pr-3' : 'pr-10 pl-3'} border ${
                      errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 transition-colors`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <button
                    type="button"
                    className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
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

              {/* Error Message */}
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg"
                  >
                    {t('auth.invalidCredentials')}
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
      <Footer />
    </>
  );
};

export default Login;