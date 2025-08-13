/**
 * 🔄 AUTHENTICATION RECOVERY MANAGER
 * Handles automatic authentication recovery, connection health monitoring,
 * and prevents "stuck" authentication states during development and production
 * @version 1.1.0
 *
 * Changes:
 * - Removed static imports that created a circular dependency with the API client
 * - Lazy-loads `authAPI` and accesses auth store via window to avoid TDZ errors during HMR
 * - De-duplicates recovery toasts and ensures proper dismissal on resolve/error
 */

// IMPORTANT: Do NOT statically import the auth store or auth API here.
// They import the API client which imports this file, causing a circular import.
// We'll resolve them lazily when needed.

const getAuthStore = () => {
  // Prefer global accessor set by `client/src/stores/index.jsx`
  return typeof window !== 'undefined' ? window.spendWiseStores?.auth : undefined;
};

const getAuthAPI = async () => {
  const mod = await import('../api/auth');
  return mod.authAPI || mod.default;
};

class AuthRecoveryManager {
  constructor() {
    // Health monitoring state
    this.healthState = {
      consecutiveFailures: 0,
      lastSuccessTime: Date.now(),
      lastFailureTime: null,
      serverResponding: true,
      authFailureCount: 0,
      networkFailureCount: 0,
      timeoutCount: 0,
      isRecovering: false,
      lastRecoveryAttempt: null
    };

    // Configuration
    this.config = {
      maxConsecutiveFailures: 3,          // Max failures before auto-logout
      maxAuthFailures: 2,                 // Max auth failures before logout
      serverTimeoutThreshold: 10000,      // 10 seconds timeout
      recoveryAttemptInterval: 5000,      // 5 seconds between recovery attempts
      healthCheckInterval: 30000,         // 30 seconds health check
      maxRecoveryAttempts: 3,             // Max recovery attempts before giving up
      stuckStateTimeout: 15000            // 15 seconds to detect stuck state
    };

    // Toast tracking (to de-duplicate loading/info toasts)
    this.recoveryToastId = null;

    // Bind methods
    this.handleApiError = this.handleApiError.bind(this);
    this.handleApiSuccess = this.handleApiSuccess.bind(this);
    this.startHealthMonitoring = this.startHealthMonitoring.bind(this);
    
    // Start monitoring
    this.startHealthMonitoring();
    
    // silent
  }

  /**
   * Handle API errors and track failure patterns
   */
  handleApiError(error, requestConfig = {}) {
    const now = Date.now();
    const errorType = this.categorizeError(error);
    
    // Update health state
    this.healthState.consecutiveFailures++;
    this.healthState.lastFailureTime = now;
    
    // Track specific error types
    switch (errorType) {
      case 'AUTH_ERROR':
        this.healthState.authFailureCount++;
        // silent
        break;
        
      case 'NETWORK_ERROR':
        this.healthState.networkFailureCount++;
        this.healthState.serverResponding = false;
        // silent
        break;
        
      case 'TIMEOUT_ERROR':
        this.healthState.timeoutCount++;
        // silent
        break;
    }

    // Check if recovery is needed
    if (this.shouldTriggerRecovery()) {
      this.triggerRecovery(errorType);
    }

    // Check for stuck state
    if (this.isInStuckState()) {
      this.handleStuckState();
    }

    return errorType;
  }

  /**
   * Handle successful API responses
   */
  handleApiSuccess() {
    const wasRecovering = this.healthState.isRecovering;
    
    // Reset failure counters on success
    this.healthState = {
      ...this.healthState,
      consecutiveFailures: 0,
      lastSuccessTime: Date.now(),
      serverResponding: true,
      authFailureCount: 0,
      networkFailureCount: 0,
      timeoutCount: 0,
      isRecovering: false
    };

    // Dismiss loading toast and show recovery success message if we were recovering
    if (wasRecovering) {
      // Dismiss any ongoing recovery toast
      if (this.recoveryToastId && window.authToasts?.dismiss) {
        window.authToasts.dismiss(this.recoveryToastId);
        this.recoveryToastId = null;
      }
      this.showRecoveryNotification('success', 'החיבור לשרת התאושש בהצלחה! 🎉');
      // silent
    }
  }

  /**
   * Categorize error types for appropriate handling
   */
  categorizeError(error) {
    // Network/Connection errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return 'TIMEOUT_ERROR';
      }
      return 'NETWORK_ERROR';
    }

    // HTTP status code errors
    const status = error.response.status;
    if (status === 401 || status === 403) {
      return 'AUTH_ERROR';
    }
    
    if (status >= 500) {
      return 'SERVER_ERROR';
    }

    return 'CLIENT_ERROR';
  }

  /**
   * Determine if recovery should be triggered
   */
  shouldTriggerRecovery() {
    const { consecutiveFailures, authFailureCount, isRecovering } = this.healthState;
    
    // Don't trigger recovery if already recovering
    if (isRecovering) {
      return false;
    }

    // Trigger on multiple consecutive failures
    if (consecutiveFailures >= this.config.maxConsecutiveFailures) {
      return true;
    }

    // Trigger on multiple auth failures
    if (authFailureCount >= this.config.maxAuthFailures) {
      return true;
    }

    return false;
  }

  /**
   * Check if system is in a stuck state
   */
  isInStuckState() {
    const { lastSuccessTime, consecutiveFailures } = this.healthState;
    const timeSinceLastSuccess = Date.now() - lastSuccessTime;

    // User is authenticated but no successful API calls for a while with failures
    const authStore = getAuthStore()?.getState?.();
    const isAuthenticated = !!authStore?.isAuthenticated;
    return (
      isAuthenticated &&
      consecutiveFailures > 0 &&
      timeSinceLastSuccess > this.config.stuckStateTimeout
    );
  }

  /**
   * Handle stuck authentication state
   */
  async handleStuckState() {
    // silent
    
    this.showRecoveryNotification('warning');
    
    // Try to validate current token first
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const authAPI = await getAuthAPI();
        const validation = await authAPI.validateToken(token);
        if (validation.success) {
          // silent
          this.handleApiSuccess();
          return;
        }
      } catch (error) {
        // silent
      }
    }

    // If token validation fails, force logout and recovery
    this.forceLogoutAndRecovery('stuck_state');
  }

  /**
   * Trigger recovery based on error type
   */
  async triggerRecovery(errorType) {
    if (this.healthState.isRecovering) {
      return;
    }

    this.healthState.isRecovering = true;
    this.healthState.lastRecoveryAttempt = Date.now();

    // silent
    
    try {
      switch (errorType) {
        case 'AUTH_ERROR':
          await this.recoverFromAuthError();
          break;
          
        case 'NETWORK_ERROR':
        case 'TIMEOUT_ERROR':
          // Set lightweight UI hints; avoid aggressive re-tries (waking page now handles cold start)
          this.showRecoveryNotification('info');
          // If offline, show warning; waking page will take over if needed via api client
          if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            this.showRecoveryNotification('warning');
          }
          this.healthState.isRecovering = false;
          break;
          
        default:
          await this.genericRecovery();
      }
    } catch (error) {
      // silent
      this.forceLogoutAndRecovery('recovery_failed');
    }
  }

  /**
   * Recover from authentication errors
   */
  async recoverFromAuthError() {
    // silent
    
    this.showRecoveryNotification('info');

    // If user is on blocked page or session marked as blocked, do NOT force logout
    try {
      const onBlockedPage = typeof window !== 'undefined' && window.location?.pathname === '/blocked';
      const blockedFlag = typeof localStorage !== 'undefined' && localStorage.getItem('blockedSession') === '1';
      if (onBlockedPage || blockedFlag || window.__SPENDWISE_BLOCKED__) {
        // Keep recovery in a passive state and avoid destructive actions
        this.healthState.isRecovering = false;
        return;
      }
    } catch (_) {}

    // Try token refresh first
    try {
      const authAPI = await getAuthAPI();
      const refreshResult = await authAPI.refreshToken();
      if (refreshResult.success) {
        // silent
        this.handleApiSuccess();
        return;
      }
    } catch (error) {
      // silent
    }

    // If refresh fails, force logout
    this.forceLogoutAndRecovery('auth_failure');
  }

  /**
   * Recover from network errors
   */
  async recoverFromNetworkError() {
    // silent
    
    this.showRecoveryNotification('info');

    // Simple ping to check server health
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Build a safe health endpoint regardless of whether VITE_API_URL already includes /api/v1
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const baseRoot = base.endsWith('/api/v1') ? base.slice(0, -('/api/v1'.length)) : base;
      const healthUrl = `${baseRoot}/health`;

      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // silent
        this.healthState.serverResponding = true;
        this.handleApiSuccess();
        return;
      }
    } catch (error) {
      // silent
    }

    // If health check fails, show user-friendly message
    this.showRecoveryNotification('error');
    
    // Set a timer to retry
    setTimeout(() => {
      if (this.healthState.isRecovering) {
        this.recoverFromNetworkError();
      }
    }, this.config.recoveryAttemptInterval);
  }

  /**
   * Generic recovery for unknown issues
   */
  async genericRecovery() {
    // silent
    
    // Clear any cached data that might be causing issues
    if (window.spendWiseAPI?.cache) {
      window.spendWiseAPI.cache.clear();
    }

    // Try a simple authenticated request
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const authAPI = await getAuthAPI();
        const validation = await authAPI.validateToken(token);
        if (validation.success) {
          this.handleApiSuccess();
          return;
        }
      }
    } catch (error) {
      // silent
    }

    this.forceLogoutAndRecovery('generic_failure');
  }

  /**
   * Force logout and show recovery options
   */
  async forceLogoutAndRecovery(reason) {
    // silent
    
    const authStore = getAuthStore()?.getState?.();
    
    // Respect blocked session: do not auto-logout from blocked page
    try {
      const onBlockedPage = typeof window !== 'undefined' && window.location?.pathname === '/blocked';
      const blockedFlag = typeof localStorage !== 'undefined' && localStorage.getItem('blockedSession') === '1';
      if (onBlockedPage || blockedFlag || window.__SPENDWISE_BLOCKED__) {
        this.healthState.isRecovering = false;
        return;
      }
    } catch (_) {}

    try {
      // Show user-friendly message and trigger auto logout
      if (window.authToasts) {
        // Dismiss any active recovery/loading toasts to avoid stacking
        try {
          if (this.recoveryToastId && window.authToasts.dismiss) {
            window.authToasts.dismiss(this.recoveryToastId);
            this.recoveryToastId = null;
          }
          if (window.authToasts.dismiss) {
            window.authToasts.dismiss('connection-recovering');
          }
        } catch (_) {}
        window.authToasts.autoLogout(reason);
      }
      
      // Clear everything
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Reset auth store if available
      authStore?.actions?.reset?.();
      
      // Wait a moment for state to settle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to login
      if (window.spendWiseNavigate) {
        window.spendWiseNavigate('/login', { replace: true });
      } else {
        window.location.replace('/login');
      }
      
    } catch (error) {
      // silent
      // Last resort - full page reload
      window.location.reload();
    } finally {
      this.healthState.isRecovering = false;
    }
  }

  /**
   * Show recovery notifications to user
   */
  showRecoveryNotification(type, message, onClick = null) {
    // Try to use the app's notification system
    if (window.authToasts) {
      switch (type) {
        case 'success':
          if (this.recoveryToastId && window.authToasts.dismiss) {
            window.authToasts.dismiss(this.recoveryToastId);
            this.recoveryToastId = null;
          }
          window.authToasts.connectionRestored?.(message);
          break;
        case 'warning':
          window.authToasts.connectionIssue?.(message);
          break;
        case 'error':
          if (this.recoveryToastId && window.authToasts.dismiss) {
            window.authToasts.dismiss(this.recoveryToastId);
            this.recoveryToastId = null;
          }
          window.authToasts.connectionFailed?.(message);
          break;
        case 'info':
          // Avoid stacking multiple loading toasts
          if (!this.recoveryToastId) {
            // use a fixed id to prevent duplicates across components
            try { if (window.authToasts?.dismiss) window.authToasts.dismiss('connection-recovering'); } catch (_) {}
            this.recoveryToastId = window.authToasts.connectionRecovering?.(message);
          }
          break;
      }
    }

    // Fallback to browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SpendWise - Connection', {
        body: message,
        icon: '/favicon.ico'
      });
    }

    // Always log for debugging
    // silent
  }

  /**
   * Start health monitoring with periodic checks
   */
  startHealthMonitoring() {
    // Clear any existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // silent
  }

  /**
   * Perform periodic health check
   */
  async performHealthCheck() {
    const authStore = getAuthStore()?.getState?.();

    // Only perform health check if user is authenticated
    if (!authStore?.isAuthenticated) {
      return;
    }

    const timeSinceLastSuccess = Date.now() - this.healthState.lastSuccessTime;

    // If it's been too long since last success, trigger a check
    if (timeSinceLastSuccess > this.config.healthCheckInterval * 2) {
      // silent

      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const authAPI = await getAuthAPI();
          await authAPI.validateToken(token);
          // If successful, handleApiSuccess will be called by the interceptor
        }
      } catch (error) {
        // If failed, handleApiError will be called by the interceptor
        // silent
      }
    }
  }

  /**
   * Stop health monitoring (cleanup)
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    // silent
  }

  /**
   * Get current health status for debugging
   */
  getHealthStatus() {
    return {
      ...this.healthState,
      timeSinceLastSuccess: Date.now() - this.healthState.lastSuccessTime,
      config: this.config
    };
  }

  /**
   * Reset health state (for testing or manual recovery)
   */
  resetHealthState() {
    this.healthState = {
      consecutiveFailures: 0,
      lastSuccessTime: Date.now(),
      lastFailureTime: null,
      serverResponding: true,
      authFailureCount: 0,
      networkFailureCount: 0,
      timeoutCount: 0,
      isRecovering: false,
      lastRecoveryAttempt: null
    };
    // silent
  }
}

// Create singleton instance
let authRecoveryManager = null;

export const getAuthRecoveryManager = () => {
  if (!authRecoveryManager) {
    authRecoveryManager = new AuthRecoveryManager();
  }
  return authRecoveryManager;
};

// Export for easy access
export default getAuthRecoveryManager;

// Make available globally for debugging – lazily, to avoid early initialization
if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(window, 'authRecoveryManager', {
      configurable: true,
      get() {
        return getAuthRecoveryManager();
      }
    });
  } catch (_) {
    // Fallback: do nothing if defineProperty fails
  }
}