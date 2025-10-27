/**
 * 🚀 UNIFIED SPENDWISE API CLIENT - COMPLETE POWERHOUSE
 * Replaces both utils/api.js (820 lines) + services/apiService.js (121 lines)
 * Features: Admin, Analytics, OAuth, Performance, Security, Caching
 * @version 2.0.0
 */

import axios from 'axios';
import { toast } from 'react-hot-toast';
import getAuthRecoveryManager from '../utils/authRecoveryManager';

// ✅ API Configuration
const rawApiUrl = import.meta.env.VITE_API_URL || 'https://spendwise-dx8g.onrender.com/api/v1';
const normalizedApiUrl = (() => {
  try {
    const trimmed = (rawApiUrl || '').replace(/\/$/, '');
    return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
  } catch (_) {
    return 'https://spendwise-dx8g.onrender.com/api/v1';
  }
})();

const config = {
  API_URL: normalizedApiUrl,
  API_VERSION: 'v1',
  TIMEOUT: 45000, // Increased timeout for better cold start handling
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  DEBUG: false // Debug completed - token extraction working
};

// silent config dump

// ✅ Server State Management
class ServerStateManager {
  constructor() {
    this.isWarm = false;
    this.lastRequest = Date.now();
    this.consecutiveFailures = 0;
    this.wakingUp = false;
    // Retry gating to avoid immediate re-hits; 2s is enough to classify cold starts
    this.COLD_START_THRESHOLD = 2000;
  }

  updateSuccess() {
    this.isWarm = true;
    this.lastRequest = Date.now();
    this.consecutiveFailures = 0;
    this.wakingUp = false;
  }

  updateFailure() {
    this.consecutiveFailures++;
    this.lastRequest = Date.now();
  }

  shouldRetryForColdStart(error) {
    const isTimeoutError = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    const isServerError = error.response?.status >= 500;
    const timeSinceLastRequest = Date.now() - this.lastRequest;
    
    return !this.isWarm &&
           (isTimeoutError || isServerError) &&
           timeSinceLastRequest > this.COLD_START_THRESHOLD &&
           this.consecutiveFailures < 3;
  }
}

// ✅ Enhanced Cache Manager
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(pattern) {
    if (pattern) {
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ✅ Request Deduplication
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  async deduplicate(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// ✅ Main API Client Class
class SpendWiseAPIClient {
  constructor() {
    this.serverState = new ServerStateManager();
    this.cache = new CacheManager();
    this.deduplicator = new RequestDeduplicator();
    this.authRecovery = getAuthRecoveryManager();
    
    // Create axios instance
    this.client = axios.create({
      baseURL: config.API_URL, // VITE_API_URL already includes /api/v1
      timeout: config.TIMEOUT,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  // ✅ Setup Request/Response Interceptors
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token (support both legacy and new key)
        const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request metadata
        config.metadata = {
          startTime: Date.now(),
          retryCount: config.retryCount || 0
        };

        // silent request log

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Update server state on success
        this.serverState.updateSuccess();
        // If we were in waking mode, announce recovery and clear flag
        try {
          if (typeof window !== 'undefined' && window.__SERVER_WAKING__) {
            window.__SERVER_WAKING__ = false;
            window.dispatchEvent(new CustomEvent('server-woke'));
          }
        } catch (_) {}
        
        // Notify auth recovery manager of success
        this.authRecovery.handleApiSuccess();

        // silent perf log

        return response;
      },
      async (error) => {
        return this.handleResponseError(error);
      }
    );
  }

  // ✅ Enhanced Error Handling with Cold Start Retry + Auth Recovery
  async handleResponseError(error) {
    const { config: requestConfig } = error;
    
    // Update server state
    this.serverState.updateFailure();
    
    // Notify auth recovery manager of the error
    const errorType = this.authRecovery.handleApiError(error, requestConfig);

    // Handle specific error types
    if (error.response?.status === 401) {
      // Prevent duplicate logout flows from parallel requests
      if (typeof window !== 'undefined' && window.__AUTH_LOGOUT_IN_PROGRESS__) {
        return Promise.reject(error);
      }
      // Let auth recovery manager handle this, but still do legacy handling
      this.handleAuthError();
      return Promise.reject(error);
    }

    // Blocked user handling (403 USER_BLOCKED)
    if (error.response?.status === 403) {
      const err = error.response?.data?.error || {};
      if (err.code === 'USER_BLOCKED') {
        const state = { reason: err.reason, expires_at: err.expires_at };
        try {
          // Mark session as blocked to prevent auth-recovery auto-logout
          try { localStorage.setItem('blockedSession', '1'); } catch (_) {}
          if (typeof window !== 'undefined') {
            window.__SPENDWISE_BLOCKED__ = true;
          }
          // Clear any lingering auth-recovery toast to avoid confusion
          try { if (window.authToasts?.dismiss) window.authToasts.dismiss('connection-recovering'); } catch (_) {}
          if (window.spendWiseNavigate) {
            window.spendWiseNavigate('/blocked', { replace: true, state });
          } else {
            // Fallback: basic redirect without state
            window.location.replace('/blocked');
          }
        } catch (_) {}
        return Promise.reject(this.normalizeError(error));
      }
    }

    // Maintenance handling (503 MAINTENANCE_MODE)
    if (error.response?.status === 503) {
      const err = error.response?.data?.error || {};
      if (err.code === 'MAINTENANCE_MODE') {
        try {
          // Remember where user was to support "Go back"
          if (typeof window !== 'undefined') {
            try {
              const currentPath = window.location.pathname + (window.location.search || '');
              sessionStorage.setItem('maintenanceReturnTo', currentPath);
            } catch (_) {}
          }
          if (window.spendWiseNavigate) {
            window.spendWiseNavigate('/maintenance', { replace: true });
          } else {
            window.location.replace('/maintenance');
          }
        } catch (_) {}
      }
    }

    // ✅ FIX: Don't treat authentication errors as cold start
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    
    // Detect likely Render cold-start: timeout or 5xx when server not warm (after maintenance routing)
    const isTimeoutError = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
    const isServerError = !!error?.response && error.response.status >= 500;
    const isLikelyColdStart = !this.serverState.isWarm && (isTimeoutError || isServerError) && !isAuthError;

    if (isLikelyColdStart) {
      try {
        if (typeof window !== 'undefined' && !window.__SERVER_WAKING__) {
          window.__SERVER_WAKING__ = true;
          try {
            const currentPath = window.location.pathname + (window.location.search || '');
            sessionStorage.setItem('serverWakingReturnTo', currentPath);
          } catch (_) {}
          if (window.spendWiseNavigate) {
            window.spendWiseNavigate('/server-waking', { replace: true });
          } else {
            window.location.replace('/server-waking');
          }
        }
      } catch (_) {}
      return Promise.reject(this.normalizeError(error));
    }

    // Avoid request storms while server may be down; no auto-retry here if waking page is active
    if (typeof window !== 'undefined' && window.__SERVER_WAKING__) {
      return Promise.reject(this.normalizeError(error));
    }

    // Log error in debug mode
    if (config.DEBUG) {
      console.error('❌ API Error:', error.response?.status, error.message, {
        errorType,
        recoveryState: this.authRecovery.getHealthStatus()
      });
    }

    return Promise.reject(this.normalizeError(error));
  }

  // ✅ Cold Start Retry Logic
  async retryColdStartRequest(requestConfig) {
    const retryCount = (requestConfig.retryCount || 0) + 1;
    
    if (retryCount > config.RETRY_ATTEMPTS) {
      // ✅ FIX: Dismiss cold start toast on failure
      try { toast.dismiss('cold-start'); } catch (_) {}
      throw new Error('Server is taking too long to respond. Please try again in a moment.');
    }

    // Show cold start toast on first retry (with auto-timeout)
    if (retryCount === 1 && !this.serverState.wakingUp) {
      this.serverState.wakingUp = true;
      toast.loading('Waking up server...', { 
        id: 'cold-start',
        duration: 15000,
        maxDuration: 30000 // Auto-dismiss after 30s
      });
    }

    // Calculate retry delay (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry the request
    requestConfig.retryCount = retryCount;
    return this.client.request(requestConfig);
  }

  // ✅ Handle Authentication Errors
  handleAuthError() {
    // Clear auth data
    localStorage.removeItem('accessToken');
    this.cache.clear();
    
    // User feedback on expiry
    try {
      // Only show session expired if there was a token
      const hadToken = !!localStorage.getItem('accessToken');
      if (hadToken && window.authToasts?.sessionExpired) {
        window.authToasts.sessionExpired();
      }
    } catch (_) {}

    // Debounce redirect + toast to avoid multiple toasts from parallel 401s
    if (typeof window !== 'undefined') {
      if (window.__AUTH_LOGOUT_IN_PROGRESS__) {
        return;
      }
      window.__AUTH_LOGOUT_IN_PROGRESS__ = true;
      // reset the flag after a short while
      setTimeout(() => { try { delete window.__AUTH_LOGOUT_IN_PROGRESS__; } catch (_) {} }, 2000);
    }

    // Only redirect if not already on auth pages
    const isOnAuthPage = ['/login', '/register', '/auth/login', '/auth/register', '/auth/verify-email', '/auth/password-reset'].includes(window.location.pathname);
    const isBlockedSession = (typeof window !== 'undefined' && window.location?.pathname === '/blocked') ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('blockedSession') === '1');
    
    // If user is blocked, do NOT navigate away from blocked page
    if (isBlockedSession) {
      return;
    }

    if (!isOnAuthPage) {
      // Try to use React Router if available
      if (window.spendWiseNavigate) {
        window.spendWiseNavigate('/login', { replace: true });
      } else {
        window.location.replace('/login');
      }
    } else {
      // Already on auth page, just clear the auth state
      if (window.spendWiseAuthStore) {
        window.spendWiseAuthStore.getState().actions.reset();
      }
    }
  }

  // ✅ Normalize API Errors
  normalizeError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        status: error.response.status,
        message: error.response.data?.error?.message || error.response.data?.message || 'Server error occurred',
        code: error.response.data?.error?.code || 'SERVER_ERROR',
        details: error.response.data?.error?.details
      };
    }
    
    if (error.request) {
      // Request made but no response
      return {
        status: 0,
        message: 'Unable to connect to server. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      };
    }
    
    // Something else happened
    return {
      status: 0,
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    };
  }

  // ✅ Cached Request Method
  async cachedRequest(endpoint, options = {}, cacheKey = null, ttl = null) {
    const key = cacheKey || `${endpoint}-${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return { data: cached };
    }

    // Make request with deduplication
    const response = await this.deduplicator.deduplicate(key, () => 
      this.client.request({ url: endpoint, ...options })
    );

    // Cache successful responses
    if (response.data) {
      this.cache.set(key, response.data, ttl);
    }

    return response;
  }

  // ✅ Performance Monitoring
  getPerformanceStats() {
    return {
      serverState: {
        isWarm: this.serverState.isWarm,
        consecutiveFailures: this.serverState.consecutiveFailures,
        lastRequest: new Date(this.serverState.lastRequest).toISOString()
      },
      cache: this.cache.getStats(),
      pendingRequests: this.deduplicator.pendingRequests.size
    };
  }

  // ✅ Manual Cache Management
  clearCache(pattern) {
    this.cache.clear(pattern);
    // ✅ FIX: Dismiss all loading-related toasts when clearing cache
    try { 
      toast.dismiss('cold-start');
      toast.dismiss('connection-recovering');
    } catch (_) {}
  }

  // ✅ HTTP Methods - Delegate to axios client
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  // ✅ Health Check
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return { healthy: true, data: response.data };
    } catch (error) {
      return { healthy: false, error: this.normalizeError(error) };
    }
  }
}

// ✅ Create and export singleton instance
export const api = new SpendWiseAPIClient();

// ✅ Export utilities
export { config as apiConfig };
export default api; 