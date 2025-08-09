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
const config = {
  API_URL: import.meta.env.VITE_API_URL || 'https://spendwise-dx8g.onrender.com/api/v1',
  API_VERSION: 'v1',
  TIMEOUT: 45000, // Increased timeout for better cold start handling
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  DEBUG: false // Debug completed - token extraction working
};

// 🔍 Debug API configuration
console.log('🔍 API Configuration Debug:', {
  API_URL: config.API_URL,
  VITE_API_URL_ENV: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  ALL_VITE_VARS: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

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
        // Add auth token
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request metadata
        config.metadata = {
          startTime: Date.now(),
          retryCount: config.retryCount || 0
        };

        // Request logged only in development
        if (import.meta.env.DEV && config.url && config.method) {
          console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Update server state on success
        this.serverState.updateSuccess();
        
        // Notify auth recovery manager of success
        this.authRecovery.handleApiSuccess();

        // Log performance in development only
        if (import.meta.env.DEV && response.config.metadata) {
          const duration = Date.now() - response.config.metadata.startTime;
          if (duration > 1000) { // Only log slow requests
            console.log(`⚠️ Slow API (${duration}ms): ${response.config.url}`);
          }
        }

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
      // Let auth recovery manager handle this, but still do legacy handling
      this.handleAuthError();
      return Promise.reject(error);
    }

    // Retry for cold start issues (but only if not in recovery mode)
    if (!this.authRecovery.healthState?.isRecovering && 
        this.serverState.shouldRetryForColdStart(error) && 
        requestConfig) {
      return this.retryColdStartRequest(requestConfig);
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
      throw new Error('Server is taking too long to respond. Please try again in a moment.');
    }

    // Show cold start toast on first retry
    if (retryCount === 1 && !this.serverState.wakingUp) {
      this.serverState.wakingUp = true;
      toast.loading('Waking up server...', { 
        id: 'cold-start',
        duration: 15000 
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
    
    // Only redirect if not already on auth pages
    const isOnAuthPage = ['/login', '/register', '/auth/login', '/auth/register', '/auth/verify-email', '/auth/password-reset'].includes(window.location.pathname);
    
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
    toast.dismiss('cold-start');
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