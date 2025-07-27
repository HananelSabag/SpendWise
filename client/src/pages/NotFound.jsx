/**
 * 🔍 NOT FOUND PAGE - Mobile-First 404 Page
 * Features: Zustand stores, Mobile-responsive, Helpful navigation
 * @version 2.0.0
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation, useAuth } from '../stores';

import { Button } from '../components/ui';
import { cn } from '../utils/helpers';

const NotFound = () => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t, isRTL } = useTranslation();
  const { isAuthenticated } = useAuth();
  
  const navigate = useNavigate();

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center px-4 py-12',
      'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800',
      isRTL && 'rtl'
    )}>
      <div className="max-w-md w-full text-center space-y-8">
        {/* ✅ 404 Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="text-6xl sm:text-8xl font-bold text-primary-600 dark:text-primary-400">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('errors.pageNotFound', { fallback: 'Page Not Found' })}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('errors.pageNotFoundDesc', { 
              fallback: 'The page you\'re looking for doesn\'t exist or has been moved.' 
            })}
          </p>
        </motion.div>

        {/* ✅ Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {isAuthenticated ? (
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/')}
                size="lg"
                fullWidth
                icon={<Home />}
              >
                {t('nav.backToDashboard', { fallback: 'Back to Dashboard' })}
              </Button>
              
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                fullWidth
                icon={<ArrowLeft />}
              >
                {t('common.goBack', { fallback: 'Go Back' })}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/login')}
                size="lg"
                fullWidth
                icon={<Home />}
              >
                {t('auth.goToLogin', { fallback: 'Go to Login' })}
              </Button>
              
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                fullWidth
                icon={<ArrowLeft />}
              >
                {t('common.goBack', { fallback: 'Go Back' })}
              </Button>
            </div>
          )}
        </motion.div>

        {/* ✅ Help section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-8 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <HelpCircle className="w-4 h-4" />
            <span>{t('common.needHelp', { fallback: 'Need help?' })}</span>
            <Link 
              to="/help" 
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('nav.contactSupport', { fallback: 'Contact Support' })}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
