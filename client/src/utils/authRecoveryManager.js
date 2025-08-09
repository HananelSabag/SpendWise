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
    
    console.log('🔄 Auth Recovery Manager initialized');
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
        console.warn('🚨 Auth failure detected:', {
          count: this.healthState.authFailureCount,
          status: error.response?.status,
          message: error.message
        });
        break;
        
      case 'NETWORK_ERROR':
        this.healthState.networkFailureCount++;
        this.healthState.serverResponding = false;
        console.warn('🌐 Network failure detected:', {
          count: this.healthState.networkFailureCount,
          message: error.message
        });
        break;
        
      case 'TIMEOUT_ERROR':
        this.healthState.timeoutCount++;
        console.warn('⏱️ Timeout failure detected:', {
          count: this.healthState.timeoutCount,
          timeout: requestConfig.timeout
        });
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
      console.log('✅ Auth Recovery: Connection restored successfully');
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
    console.warn('🚨 Stuck state detected - initiating recovery');
    
    this.showRecoveryNotification('warning');
    
    // Try to validate current token first
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const authAPI = await getAuthAPI();
        const validation = await authAPI.validateToken(token);
        if (validation.success) {
          console.log('✅ Token validation successful - recovering from stuck state');
          this.handleApiSuccess();
          return;
        }
      } catch (error) {
        console.warn('❌ Token validation failed during recovery');
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

    console.log(`🔄 Triggering recovery for: ${errorType}`);
    
    try {
      switch (errorType) {
        case 'AUTH_ERROR':
          await this.recoverFromAuthError();
          break;
          
        case 'NETWORK_ERROR':
        case 'TIMEOUT_ERROR':
          await this.recoverFromNetworkError();
          break;
          
        default:
          await this.genericRecovery();
      }
    } catch (error) {
      console.error('❌ Recovery failed:', error);
      this.forceLogoutAndRecovery('recovery_failed');
    }
  }

  /**
   * Recover from authentication errors
   */
  async recoverFromAuthError() {
    console.log('🔑 Attempting auth recovery...');
    
    this.showRecoveryNotification('info');

    // Try token refresh first
    try {
      const authAPI = await getAuthAPI();
      const refreshResult = await authAPI.refreshToken();
      if (refreshResult.success) {
        console.log('✅ Token refresh successful');
        this.handleApiSuccess();
        return;
      }
    } catch (error) {
      console.warn('❌ Token refresh failed');
    }

    // If refresh fails, force logout
    this.forceLogoutAndRecovery('auth_failure');
  }

  /**
   * Recover from network errors
   */
  async recoverFromNetworkError() {
    console.log('🌐 Attempting network recovery...');
    
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
        console.log('✅ Server health check successful');
        this.healthState.serverResponding = true;
        this.handleApiSuccess();
        return;
      }
    } catch (error) {
      console.warn('❌ Server health check failed:', error.message);
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
    console.log('🔧 Attempting generic recovery...');
    
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
      console.warn('❌ Generic recovery failed');
    }

    this.forceLogoutAndRecovery('generic_failure');
  }

  /**
   * Force logout and show recovery options
   */
  async forceLogoutAndRecovery(reason) {
    console.log(`🚪 Force logout due to: ${reason}`);
    
    const authStore = getAuthStore()?.getState?.();
    
    try {
      // Show user-friendly message and trigger auto logout
      if (window.authToasts) {
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
      console.error('❌ Force logout failed:', error);
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
    console.log(`🔔 Recovery notification [${type}]: ${message}`);
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

    console.log('❤️ Health monitoring started');
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
      console.log('🏥 Performing health check - too long since last success');

      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const authAPI = await getAuthAPI();
          await authAPI.validateToken(token);
          // If successful, handleApiSuccess will be called by the interceptor
        }
      } catch (error) {
        // If failed, handleApiError will be called by the interceptor
        console.warn('❌ Health check failed:', error.message);
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
    console.log('🛑 Health monitoring stopped');
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
    console.log('🔄 Health state reset');
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