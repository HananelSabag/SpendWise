import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, Server, X } from 'lucide-react';
import { useTranslation } from '../../stores';

const ConnectionStatusOverlay = () => {
  const { t } = useTranslation('status');
  const { t: tc } = useTranslation('common');
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [serverWaking, setServerWaking] = useState(typeof window !== 'undefined' ? !!window.__SERVER_WAKING__ : false);
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  // Don't show connection-issue banner during the first 6s — server may still be waking
  const mountedAt = useRef(Date.now());
  const [pastStartupDelay, setPastStartupDelay] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setPastStartupDelay(true), 6000);
    return () => clearTimeout(id);
  }, []);

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
    
    // PERF: poll less aggressively. The previous 2s/1s intervals added up to
    // ~90 unnecessary state updates per minute on a Render-free-tier client
    // already constrained to 0.1 vCPU + mobile battery. 5s is plenty for a
    // banner — humans can't notice the difference.
    const interval = setInterval(() => {
      setServerWaking(!!window.__SERVER_WAKING__);
    }, 5000);

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

    // PERF: 1s → 5s. Recovery state changes once every several seconds at most.
    const interval = setInterval(checkRetryState, 5000);
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

  // Note: this used to be labelled "Use offline mode" but it never actually
  // enabled anything offline — it just hid the banner. Renamed to "Dismiss"
  // in the JSX below so the user isn't lied to about what the button does.
  // True offline mode would need TanStack Query persistence to be wired up
  // for serving stale cache without firing requests; that's a bigger refactor.
  const handleUseOfflineMode = useCallback(() => {
    setDismissed(true);
  }, []);

  // Show offline immediately; server-waking and connection-issues only after startup delay + ≥2 failures
  const visible = useMemo(() => {
    if (dismissed) return false;
    if (isOffline) return true;
    if (!pastStartupDelay) return false;
    if (serverWaking) return true;
    if (retryCount >= 2) return true;
    return false;
  }, [dismissed, isOffline, serverWaking, retryCount, pastStartupDelay]);
  
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
                {t('offlineTitle')}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                {t('offlineDesc')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRetryNow}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium transition-colors shadow-sm"
                aria-label={tc('retryConnection')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-orange-200/50 dark:hover:bg-orange-800/50 text-orange-700 dark:text-orange-300 transition-colors"
                aria-label={tc('dismiss')}
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
                {t('wakingTitle')}
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                {t('wakingDesc')}
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
                {t('connectionIssuesTitle')}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                {t('retryAttempt', { count: retryCount })}{' '}
                {countdown > 0 ? t('retryCountdown', { countdown }) : t('reconnecting')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRetryNow}
                className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
                aria-label={tc('retryNow')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{tc('retry')}</span>
              </button>

              <button
                onClick={handleUseOfflineMode}
                className="px-3 py-1.5 rounded-lg bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-800/50 dark:hover:bg-yellow-700/50 text-yellow-900 dark:text-yellow-100 text-xs font-medium transition-colors"
                aria-label={tc('dismiss')}
                title={tc('continueWithoutReconnect') || 'Continue without reconnecting'}
              >
                {tc('continueAnyway') || 'Continue'}
              </button>

              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50 text-yellow-700 dark:text-yellow-300 transition-colors"
                aria-label={tc('dismiss')}
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
