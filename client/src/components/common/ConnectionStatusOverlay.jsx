import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, Server, X } from 'lucide-react';

const ConnectionStatusOverlay = () => {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [serverWaking, setServerWaking] = useState(typeof window !== 'undefined' ? !!window.__SERVER_WAKING__ : false);
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when connection is restored
  useEffect(() => {
    if (!isOffline && !serverWaking) {
      setDismissed(false);
      setRetryCount(0);
    }
  }, [isOffline, serverWaking]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setRetryCount(0);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const interval = setInterval(() => {
      setServerWaking(!!window.__SERVER_WAKING__);
    }, 500);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Track retry attempts from auth recovery manager
  useEffect(() => {
    const checkRetryState = () => {
      if (typeof window !== 'undefined' && window.authRecoveryManager) {
        const health = window.authRecoveryManager.getHealthStatus();
        // Don't show banner for authentication errors (4xx), only connection issues
        const failures = health.consecutiveFailures || 0;
        setRetryCount(health.authFailureCount > 0 ? 0 : failures);
      }
    };

    const interval = setInterval(checkRetryState, 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for auto-retry
  useEffect(() => {
    if (retryCount > 0 && !isOffline) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [retryCount, isOffline]);

  const handleRetryNow = useCallback(() => {
    // Dismiss all loading toasts
    if (typeof window !== 'undefined' && window.authToasts?.dismissAll) {
      window.authToasts.dismissAll();
    }
    
    // Trigger page refresh to retry
    window.location.reload();
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const handleUseOfflineMode = useCallback(() => {
    setDismissed(true);
    // Show toast about offline mode
    if (typeof window !== 'undefined' && window.authToasts?.info) {
      window.authToasts.info('Using cached data. Some features may be limited.');
    }
  }, []);

  const visible = useMemo(() => !dismissed && (isOffline || serverWaking || retryCount > 0), [dismissed, isOffline, serverWaking, retryCount]);
  
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Offline Banner */}
      {isOffline && (
        <div className="absolute top-0 left-0 right-0 mx-auto mt-4 max-w-md px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-100 via-orange-50 to-orange-100 dark:from-orange-900/30 dark:via-orange-800/20 dark:to-orange-900/30 border border-orange-200 dark:border-orange-700/50 shadow-lg backdrop-blur-sm pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-orange-200 dark:bg-orange-800/50">
              <WifiOff className="w-5 h-5 text-orange-700 dark:text-orange-300" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                You're offline
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                Check your internet connection. We'll retry automatically.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRetryNow}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium transition-colors shadow-sm"
                aria-label="Retry connection"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-orange-200/50 dark:hover:bg-orange-800/50 text-orange-700 dark:text-orange-300 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Waking Banner */}
      {serverWaking && !isOffline && (
        <div className="absolute top-0 left-0 right-0 mx-auto mt-4 max-w-md px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-100 via-purple-50 to-purple-100 dark:from-purple-900/30 dark:via-purple-800/20 dark:to-purple-900/30 border border-purple-200 dark:border-purple-700/50 shadow-lg backdrop-blur-sm pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-purple-200 dark:bg-purple-800/50">
              <Server className="w-5 h-5 text-purple-700 dark:text-purple-300 animate-pulse" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                Waking server...
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                First request takes ~15-30 seconds. Please wait.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-200/50 dark:bg-purple-800/30">
                <RefreshCw className="w-3 h-3 text-purple-600 dark:text-purple-400 animate-spin" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  {countdown > 0 ? `${countdown}s` : '...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Issues Banner (not offline, but having trouble) */}
      {!isOffline && !serverWaking && retryCount > 0 && (
        <div className="absolute top-0 left-0 right-0 mx-auto mt-4 max-w-md px-4 py-3 rounded-2xl bg-gradient-to-r from-yellow-100 via-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:via-yellow-800/20 dark:to-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 shadow-lg backdrop-blur-sm pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-yellow-200 dark:bg-yellow-800/50">
              <Wifi className="w-5 h-5 text-yellow-700 dark:text-yellow-300" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                Connection issues
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                Retry attempt {retryCount}/3. {countdown > 0 ? `Next retry in ${countdown}s` : 'Retrying...'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRetryNow}
                className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
                aria-label="Retry now"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              
              <button
                onClick={handleUseOfflineMode}
                className="px-3 py-1.5 rounded-lg bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-800/50 dark:hover:bg-yellow-700/50 text-yellow-900 dark:text-yellow-100 text-xs font-medium transition-colors"
                aria-label="Use offline mode"
              >
                Use Offline
              </button>
              
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50 text-yellow-700 dark:text-yellow-300 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusOverlay;
