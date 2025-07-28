/**
 * 🔐 LOGIN PAGE - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Form orchestration, Google OAuth, Mobile UX
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Globe, User
} from 'lucide-react';

// ✅ Import Zustand stores and enhanced API
import { 
  useAuth, 
  useTranslation,
  useTheme,
  useNotifications
} from '../../stores';

// ✅ Import components
import LoginForm from '../../components/features/auth/LoginForm';
import GuestSettings from '../../components/common/GuestSettings';

import { api } from '../../api';
import { Button } from '../../components/ui';
import { cn } from '../../utils/helpers';

const Login = () => {
  // ✅ Zustand stores
  const { login, isAuthenticated, googleLogin } = useAuth();
  const { t, currentLanguage, setLanguage, isRTL } = useTranslation('auth');
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Login state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // ✅ Form validation
  const validateForm = useCallback((formData) => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [t]);

  // ✅ Handle login form submission
  const handleLoginSubmit = useCallback(async (formData) => {
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        addNotification({
          type: 'success',
          message: t('loginSuccess')
        });
        
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setErrors({ 
          general: result.error?.message || t('loginFailed')
        });
      }
    } catch (error) {
      setErrors({ 
        general: t('authenticationFailed')
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, login, addNotification, t, location, navigate]);

  // ✅ Handle Google login - FIXED
  const handleGoogleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    
    try {
      // ✅ Use auth store method instead of API directly
      const result = await googleLogin();
      
      if (result.success) {
        addNotification({
          type: 'success',
          message: t('googleLoginSuccess')
        });
        
        // ✅ FIXED: Navigate to dashboard with proper fallback
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setErrors({ 
          general: result.error?.message || t('googleLoginFailed')
        });
      }
    } catch (error) {
      setErrors({ 
        general: t('googleLoginError')
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }, [googleLogin, addNotification, t, location, navigate]);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Guest Settings */}
      <GuestSettings />

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full absolute -top-48 -right-48 opacity-20"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -8, 0]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-80 h-80 bg-gradient-to-br from-green-400 to-cyan-600 rounded-full absolute -bottom-40 -left-40 opacity-20"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('welcomeBack')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('signInToContinue')}
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div variants={itemVariants}>
          <LoginForm
            onSubmit={handleLoginSubmit}
            onGoogleLogin={handleGoogleLogin}
            isSubmitting={isSubmitting}
            isGoogleLoading={isGoogleLoading}
            errors={errors}
          />
        </motion.div>

        {/* Register link */}
        <motion.div variants={itemVariants} className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            {t('dontHaveAccount')}{' '}
            <Link
              to="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {t('signUp')}
            </Link>
          </p>
        </motion.div>

        {/* Language selector */}
        <motion.div variants={itemVariants} className="text-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(currentLanguage === 'en' ? 'he' : 'en')}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Globe className="w-4 h-4 mr-2" />
            {currentLanguage === 'en' ? 'עברית' : 'English'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;