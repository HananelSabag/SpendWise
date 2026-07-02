/**
 * 🚀 UNIFIED SPENDWISE API CLIENT - COMPLETE POWERHOUSE
 * Replaces both utils/api.js (820 lines) + services/apiService.js (121 lines)
 * Features: Admin, Analytics, OAuth, Performance, Security, Caching
 * @version 2.0.0
 */

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { getAccessToken } from '../auth/tokenStorage.js';
import { ensureFreshToken } from '../auth/refreshManager.js';
import { markWarm, isRecentlyWarm } from '../auth/serverHealth.js';

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
// isWarm survives soft reloads via sessionStorage (serverHealth.js) — a page
// refresh 30 seconds after a successful request no longer re-arms all the
// "is the server awake?" machinery.
class ServerStateManager {
  constructor() {
    this.isWarm = isRecentlyWarm();
    this.lastRequest = Date.now();
    this.consecutiveFailures = 0;
    this.wakingUp = false;
  }

  updateSuccess() {
    this.isWarm = true;
    this.lastRequest = Date.now();
    this.consecutiveFailures = 0;
    this.wakingUp = false;
    markWarm();
  }

  updateFailure() {
    this.consecutiveFailures++;
    this.lastRequest = Date.now();
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
        // Add auth token — tokenStorage is the single source of truth
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request metadata
        config.metadata = {
          startTime: Date.now(),
          retryCount: config.retryCount || 0
        };

        // 🟢 UX: "never more than a few seconds in silent loading."
        // If a request hasn't returned in 5 seconds AND server isn't already
        // marked warm, flip __SERVER_WAKING__ so ConnectionStatusOverlay
        // shows the purple "Server is waking up" banner. The user gets honest
        // feedback within 5s instead of staring at a spinner for the full
        // 30–60s cold-start window. We don't redirect to /server-waking yet —
        // the banner is non-blocking; if the request still succeeds the
        // banner just disappears.
        if (!this.serverState.isWarm && typeof window !== 'undefined') {
          config._wakingBannerTimer = setTimeout(() => {
            try {
              if (!window.__SERVER_WAKING__) {
                window.__SERVER_WAKING__ = true;
              }
            } catch (_) {}
          }, 5000);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Cancel the "server is waking" 5s timer if the request succeeded fast.
        try {
          if (response.config?._wakingBannerTimer) {
            clearTimeout(response.config._wakingBannerTimer);
            response.config._wakingBannerTimer = null;
          }
        } catch (_) {}

        // Update server state on success
        this.serverState.updateSuccess();
        // If we were in waking mode, announce recovery and clear flag
        try {
          if (typeof window !== 'undefined' && window.__SERVER_WAKING__) {
            window.__SERVER_WAKING__ = false;
            window.dispatchEvent(new CustomEvent('server-woke'));
          }
        } catch (_) {}

        // Any success dismisses lingering connection toasts (this replaced
        // the deleted authRecoveryManager's only useful job).
        try {
          toast.dismiss('cold-start');
          toast.dismiss('connection-recovering');
        } catch (_) {}

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

    // Always clear the 5s "waking banner" timer to avoid leaks.
    try {
      if (requestConfig?._wakingBannerTimer) {
        clearTimeout(requestConfig._wakingBannerTimer);
        requestConfig._wakingBannerTimer = null;
      }
    } catch (_) {}

    // Update server state
    this.serverState.updateFailure();

    // Handle specific error types
    if (error.response?.status === 401) {
      // Single-flight refresh via refreshManager. THE core fix: a refresh
      // that fails because the server is asleep (timeout / 5xx / network)
      // returns { transient:true } and KEEPS the tokens — the old code
      // wiped them and kicked the user to /login for no reason.
      if (requestConfig && !requestConfig._isRetryAfterRefresh) {
        const result = await ensureFreshToken();

        if (result.ok) {
          requestConfig.headers.Authorization = `Bearer ${result.token}`;
          requestConfig._isRetryAfterRefresh = true; // exactly one retry
          return this.client.request(requestConfig);
        }
        // fatal → refreshManager already cleared tokens and emitted
        // 'auth:logout' (the store listens and resets + navigates once).
        // transient → tokens kept, retry scheduled; fail this request softly.
      }
      return Promise.reject(this.normalizeError(error));
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
      // 🟢 NEW: try to actually wake the server with one or two background retries
      // BEFORE navigating to /server-waking. Render's free-tier cold start is
      // ~30–60s; a single transparent retry recovers most of the time without
      // ever yanking the user off their current screen.
      const canRetry = !!requestConfig
        && !requestConfig._coldStartRetried
        && (requestConfig.retryCount || 0) < config.RETRY_ATTEMPTS;

      if (canRetry) {
        try {
          requestConfig._coldStartRetried = true;
          return await this.retryColdStartRequest(requestConfig);
        } catch (retryErr) {
          // Fall through to the /server-waking redirect below.
        }
      }

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
      console.error('❌ API Error:', error.response?.status, error.message);
    }

    return Promise.reject(this.normalizeError(error));
  }

  // ✅ Cold Start Retry Logic
  async retryColdStartRequest(requestConfig) {
    const retryCount = (requestConfig.retryCount || 0) + 1;
    
    if (retryCount > config.RETRY_ATTEMPTS) {
      try { toast.dismiss('cold-start'); } catch (_) {}
      throw new Error('Server is taking too long to respond. Please try again in a moment.');
    }

    // No toast here — the non-blocking purple banner (ConnectionStatusOverlay
    // via __SERVER_WAKING__) is the single cold-start indicator. Stacking a
    // toast on top of it was one of the "too many messages" complaints.
    this.serverState.wakingUp = true;

    // Calculate retry delay (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry the request
    requestConfig.retryCount = retryCount;
    return this.client.request(requestConfig);
  }

  // ✅ Normalize API Errors
  normalizeError(error) {
    if (error.response) {
      // Server error responses use two shapes across the codebase:
      //   nested: { error: { code, message, details } }   (most routes)
      //   flat:   { error: "human message", code: "X" }   (some newer routes)
      // Handle both so `code` (used for toast/UI branching, e.g. SYNC_QUOTA,
      // SYNC_TOO_SOON) is never silently lost to the flat shape — previously
      // any flat-shape error fell through to a generic SERVER_ERROR/"Server
      // error occurred", which is why sync rate-limit rejections showed no
      // meaningful feedback.
      const data = error.response.data || {};
      const nested = (data.error && typeof data.error === 'object') ? data.error : null;
      const flatMessage = typeof data.error === 'string' ? data.error : null;

      return {
        status: error.response.status,
        message: nested?.message || flatMessage || data.message || 'Server error occurred',
        code: nested?.code || data.code || 'SERVER_ERROR',
        details: nested?.details || data.details
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

// Expose the singleton on window so authStore's clearAllCaches() can reach
// the axios-level cache without creating a circular import.
if (typeof window !== 'undefined') {
  window.__spendWiseAPI = api;
}

// ✅ Export utilities
export { config as apiConfig };
export default api;
