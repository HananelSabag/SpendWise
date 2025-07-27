/**
 * 🚀 APP INITIALIZER - MOBILE-FIRST
 * Enhanced application initialization with better loading states
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader, CheckCircle, AlertCircle, RefreshCw, Wifi, 
  WifiOff, Shield, Database, Zap, Sparkles 
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import { useTranslation, useTheme, useAuth } from '../../stores';

import { Button } from '../ui';
import { cn } from '../../utils/helpers';

// Loading step component
const LoadingStep = ({ title, description, status, delay = 0 }) => {
  // ✅ NEW: Use Zustand stores
  const { t } = useTranslation('common');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex-shrink-0">
        {status === 'loading' && (
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-5 h-5 text-green-600" />
        )}
        {status === 'error' && (
          <AlertCircle className="w-5 h-5 text-red-600" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
          {title}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

// Error component
const ErrorDisplay = ({ error, onRetry }) => {
  // ✅ NEW: Use Zustand stores
  const { t } = useTranslation('common');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4"
    >
      <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('initialization.error.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {error || t('initialization.error.generic')}
        </p>
      </div>

      <Button onClick={onRetry} variant="primary">
        <RefreshCw className="w-4 h-4 mr-2" />
        {t('actions.retry')}
      </Button>
    </motion.div>
  );
};

// Success component
const SuccessDisplay = ({ onContinue }) => {
  // ✅ NEW: Use Zustand stores
  const { t } = useTranslation('common');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
      >
        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      </motion.div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('initialization.success.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t('initialization.success.description')}
        </p>
      </div>

      <Button onClick={onContinue} variant="primary">
        <Sparkles className="w-4 h-4 mr-2" />
        {t('initialization.success.continue')}
      </Button>
    </motion.div>
  );
};

// Offline component
const OfflineDisplay = ({ onRetry }) => {
  // ✅ NEW: Use Zustand stores
  const { t } = useTranslation('common');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4"
    >
      <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-gray-500" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('initialization.offline.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t('initialization.offline.description')}
        </p>
      </div>

      <Button onClick={onRetry} variant="outline">
        <Wifi className="w-4 h-4 mr-2" />
        {t('initialization.offline.reconnect')}
      </Button>
    </motion.div>
  );
};

// Main component
const AppInitializer = ({ 
  isInitializing, 
  onComplete, 
  className = '',
  children
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('common');
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Define initialization steps
  const initSteps = [
    {
      id: 'config',
      title: t('initialization.steps.config.title'),
      description: t('initialization.steps.config.description'),
      icon: Database
    },
    {
      id: 'auth',
      title: t('initialization.steps.auth.title'),
      description: t('initialization.steps.auth.description'),
      icon: Shield
    },
    {
      id: 'data',
      title: t('initialization.steps.data.title'),
      description: t('initialization.steps.data.description'),
      icon: Database
    },
    {
      id: 'complete',
      title: t('initialization.steps.complete.title'),
      description: t('initialization.steps.complete.description'),
      icon: Zap
    }
  ];

  // Initialize steps
  useEffect(() => {
    setSteps(initSteps.map(step => ({ ...step, status: 'pending' })));
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simulate initialization process
  useEffect(() => {
    if (!isInitializing || !isOnline) return;

    const runInitialization = async () => {
      setError(null);
      
      try {
        for (let i = 0; i < initSteps.length; i++) {
          // Update current step to loading
          setSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index === i ? 'loading' : index < i ? 'success' : 'pending'
          })));
          
          setCurrentStep(i);
          
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
          
          // Simulate potential failure
          if (Math.random() < 0.1 && i === 1) { // 10% chance of auth failure
            throw new Error(t('initialization.errors.authFailed'));
          }
          
          // Mark step as complete
          setSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index <= i ? 'success' : 'pending'
          })));
        }
        
        // Complete initialization
        setTimeout(() => {
          onComplete?.();
        }, 500);
        
      } catch (error) {
        setError(error.message);
        setSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index < currentStep ? 'success' : index === currentStep ? 'error' : 'pending'
        })));
      }
    };

    runInitialization();
  }, [isInitializing, isOnline, currentStep, onComplete, t]);

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setCurrentStep(0);
    setSteps(initSteps.map(step => ({ ...step, status: 'pending' })));
  };

  // If not initializing, render children
  if (!isInitializing) {
    return children;
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center p-4",
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {!isOnline ? (
            <OfflineDisplay key="offline" onRetry={handleRetry} />
          ) : error ? (
            <ErrorDisplay key="error" error={error} onRetry={handleRetry} />
          ) : steps.every(step => step.status === 'success') ? (
            <SuccessDisplay key="success" onContinue={onComplete} />
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('initialization.title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('initialization.subtitle')}
                  </p>
                </div>
              </div>

              {/* Progress steps */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <LoadingStep
                    key={step.id}
                    title={step.title}
                    description={step.description}
                    status={step.status}
                    delay={index * 0.1}
                  />
                ))}
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t('initialization.progress')}</span>
                  <span>
                    {Math.round((steps.filter(s => s.status === 'success').length / steps.length) * 100)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(steps.filter(s => s.status === 'success').length / steps.length) * 100}%` 
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  💡 {t('initialization.tip')}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppInitializer; 