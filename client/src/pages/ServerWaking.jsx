import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Clock, Wifi, ExternalLink, ArrowLeft, RefreshCw } from 'lucide-react';
import { useTranslation } from '../stores';

const MAX_WAIT_MS = 50000; // 50s

const ServerWaking = () => {
  const { t, isRTL } = useTranslation('status');
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState(t('waitingForServer'));
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);
  const pollRef = useRef(null);

  const progress = useMemo(() => Math.min(100, Math.round((elapsed / MAX_WAIT_MS) * 100)), [elapsed]);

  useEffect(() => {
    // Mark waking state
    if (typeof window !== 'undefined') {
      window.__SERVER_WAKING__ = true;
    }

    // Progress timer
    timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 200);

    // Health polling with backoff (5s, 7s, 9s, ...)
    let attempt = 0;
    const poll = async () => {
      attempt += 1;
      try {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const baseRoot = base.endsWith('/api/v1') ? base.slice(0, -('/api/v1'.length)) : base;
        const res = await fetch(`${baseRoot}/health`, { cache: 'no-store' });
        if (res.ok) {
          // Clear flag and navigate back
          try {
            const returnTo = sessionStorage.getItem('serverWakingReturnTo') || '/';
            sessionStorage.removeItem('serverWakingReturnTo');
            window.__SERVER_WAKING__ = false;
            
            // ✅ FIX: Dismiss all connection-related toasts on successful wake
            try {
              if (window.authToasts?.dismiss) {
                window.authToasts.dismiss('cold-start');
                window.authToasts.dismiss('connection-recovering');
                window.authToasts.dismiss('auth-validating');
              }
              // Also reset auth recovery manager state
              if (window.authRecoveryManager?.resetHealthState) {
                window.authRecoveryManager.resetHealthState();
              }
            } catch (_) {}
            
            if (window.spendWiseNavigate) window.spendWiseNavigate(returnTo, { replace: true });
            else window.location.replace(returnTo);
          } catch (_) {}
          return;
        }
      } catch (_) {}
      const delay = Math.min(5000 + attempt * 2000, 12000);
      pollRef.current = setTimeout(poll, delay);
    };

    pollRef.current = setTimeout(poll, 5000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (elapsed > MAX_WAIT_MS / 2) setMessage(t('almostReady'));
    if (elapsed > MAX_WAIT_MS) setMessage(t('stillWaking'));
  }, [elapsed, t]);

  // Animation variants
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

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
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
          className="w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full absolute -top-48 -right-48 opacity-10"
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
          className="w-80 h-80 bg-gradient-to-br from-green-400 to-cyan-600 rounded-full absolute -bottom-40 -left-40 opacity-10"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg mx-4"
      >
        {/* Header with SpendWise Logo */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Server className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t('serverWaking')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            {t('serverWakingDesc')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
            {t('serverWakingLong')}
          </p>
        </motion.div>

        {/* Progress Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{message}</span>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-5 h-5 text-primary-500" />
              </motion.div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-primary-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {Math.round(elapsed / 1000)}s / 50s
              </span>
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                {progress}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 shadow-md hover:shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}
            onClick={() => {
              const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
              const baseRoot = base.endsWith('/api/v1') ? base.slice(0, -('/api/v1'.length)) : base;
              window.open(`${baseRoot}/health`, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4" />
            {t('checkServerHealth')}
          </button>
          
          <button
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}
            onClick={() => {
              try {
                const returnTo = sessionStorage.getItem('serverWakingReturnTo') || '/';
                if (window.spendWiseNavigate) window.spendWiseNavigate(returnTo, { replace: true });
                else window.location.replace(returnTo);
              } catch (_) {}
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('goBack')}
          </button>
        </motion.div>

        {/* Support Contact */}
        <motion.div variants={itemVariants} className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('needHelp', { fallback: 'Need help?' })}
          </p>
          <a
            href="mailto:spendwise.verification@gmail.com"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm transition-colors"
          >
            spendwise.verification@gmail.com
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ServerWaking;


