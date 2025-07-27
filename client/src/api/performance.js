/**
 * ⚡ PERFORMANCE API MODULE - System Performance Monitoring
 * Features: Performance metrics, Cache stats, Database health, Security monitoring
 * @module api/performance
 */

import { api } from './client.js';

// ✅ Performance API Module
export const performanceAPI = {
  // ✅ Performance Dashboard
  async getDashboard() {
    try {
      const response = await api.client.get('/performance/dashboard');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Cache Statistics
  async getCacheStats() {
    try {
      const response = await api.client.get('/performance/cache-stats');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Database Health
  async getDbStats() {
    try {
      const response = await api.client.get('/performance/db-stats');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Security Statistics
  async getSecurityStats() {
    try {
      const response = await api.client.get('/performance/security-stats');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: api.normalizeError(error)
      };
    }
  },

  // ✅ Client-Side Performance Monitoring
  clientMetrics: {
    // Measure page load time
    measurePageLoad(pageName) {
      const startTime = performance.now();
      
      return {
        end: () => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Log performance if in debug mode
          if (import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.log(`📊 Page Load: ${pageName} took ${duration.toFixed(2)}ms`);
          }
          
          return {
            page: pageName,
            duration: Math.round(duration),
            timestamp: new Date().toISOString()
          };
        }
      };
    },

    // Get Web Vitals
    async getWebVitals() {
      try {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
        
        const vitals = {};
        
        return new Promise((resolve) => {
          let collected = 0;
          const totalMetrics = 5;
          
          const checkComplete = () => {
            collected++;
            if (collected === totalMetrics) {
              resolve({
                success: true,
                data: vitals
              });
            }
          };
          
          getCLS((metric) => {
            vitals.cls = metric;
            checkComplete();
          });
          
          getFID((metric) => {
            vitals.fid = metric;
            checkComplete();
          });
          
          getFCP((metric) => {
            vitals.fcp = metric;
            checkComplete();
          });
          
          getLCP((metric) => {
            vitals.lcp = metric;
            checkComplete();
          });
          
          getTTFB((metric) => {
            vitals.ttfb = metric;
            checkComplete();
          });
          
          // Timeout after 5 seconds
          setTimeout(() => {
            resolve({
              success: true,
              data: vitals
            });
          }, 5000);
        });
      } catch (error) {
        return {
          success: false,
          error: { message: 'Web Vitals not available', code: 'WEB_VITALS_ERROR' }
        };
      }
    },

    // Monitor API performance
    trackAPICall(endpoint, duration, success) {
      const metric = {
        endpoint,
        duration,
        success,
        timestamp: new Date().toISOString()
      };
      
      // Store in session storage for analysis
      const existing = JSON.parse(sessionStorage.getItem('api-metrics') || '[]');
      existing.push(metric);
      
      // Keep only last 100 metrics
      if (existing.length > 100) {
        existing.shift();
      }
      
      sessionStorage.setItem('api-metrics', JSON.stringify(existing));
      
      return metric;
    },

    // Get stored API metrics
    getAPIMetrics() {
      try {
        const metrics = JSON.parse(sessionStorage.getItem('api-metrics') || '[]');
        
        // Calculate statistics
        const total = metrics.length;
        const successful = metrics.filter(m => m.success).length;
        const failed = total - successful;
        const avgDuration = total > 0 ? 
          metrics.reduce((sum, m) => sum + m.duration, 0) / total : 0;
        
        // Group by endpoint
        const byEndpoint = metrics.reduce((acc, metric) => {
          if (!acc[metric.endpoint]) {
            acc[metric.endpoint] = {
              total: 0,
              successful: 0,
              avgDuration: 0,
              totalDuration: 0
            };
          }
          
          acc[metric.endpoint].total++;
          if (metric.success) acc[metric.endpoint].successful++;
          acc[metric.endpoint].totalDuration += metric.duration;
          acc[metric.endpoint].avgDuration = 
            acc[metric.endpoint].totalDuration / acc[metric.endpoint].total;
          
          return acc;
        }, {});
        
        return {
          success: true,
          data: {
            summary: {
              total,
              successful,
              failed,
              successRate: total > 0 ? (successful / total) * 100 : 0,
              avgDuration: Math.round(avgDuration)
            },
            byEndpoint,
            recent: metrics.slice(-10) // Last 10 calls
          }
        };
      } catch (error) {
        return {
          success: false,
          error: { message: 'Failed to get API metrics', code: 'METRICS_ERROR' }
        };
      }
    },

    // Clear stored metrics
    clearMetrics() {
      sessionStorage.removeItem('api-metrics');
      return { success: true };
    }
  },

  // ✅ Performance Utilities
  utils: {
    // Format bytes to human readable
    formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Format duration to human readable
    formatDuration(ms) {
      if (ms < 1000) return `${Math.round(ms)}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
      
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      return `${hours}h ${minutes}m`;
    },

    // Get performance grade
    getPerformanceGrade(metric, thresholds) {
      const { excellent = 100, good = 300, fair = 1000 } = thresholds;
      
      if (metric <= excellent) return { grade: 'A', color: 'green', label: 'Excellent' };
      if (metric <= good) return { grade: 'B', color: 'blue', label: 'Good' };
      if (metric <= fair) return { grade: 'C', color: 'yellow', label: 'Fair' };
      return { grade: 'D', color: 'red', label: 'Poor' };
    },

    // Calculate cache hit rate
    calculateCacheHitRate(hits, misses) {
      const total = hits + misses;
      if (total === 0) return 0;
      return Math.round((hits / total) * 100);
    },

    // Performance recommendations
    generateRecommendations(metrics) {
      const recommendations = [];
      
      // API performance
      if (metrics.api?.avgDuration > 1000) {
        recommendations.push({
          type: 'api_performance',
          priority: 'high',
          title: 'Slow API Responses',
          description: `Average API response time is ${metrics.api.avgDuration}ms`,
          action: 'Check server performance and network connectivity'
        });
      }
      
      // Cache performance
      if (metrics.cache?.hitRate < 70) {
        recommendations.push({
          type: 'cache_performance',
          priority: 'medium',
          title: 'Low Cache Hit Rate',
          description: `Cache hit rate is ${metrics.cache.hitRate}%`,
          action: 'Consider increasing cache TTL or reviewing cache strategy'
        });
      }
      
      // Web Vitals
      if (metrics.webVitals?.lcp?.value > 2500) {
        recommendations.push({
          type: 'web_vitals',
          priority: 'high',
          title: 'Poor Largest Contentful Paint',
          description: 'LCP is above 2.5 seconds',
          action: 'Optimize images, enable compression, use CDN'
        });
      }
      
      if (metrics.webVitals?.fid?.value > 100) {
        recommendations.push({
          type: 'web_vitals',
          priority: 'medium',
          title: 'Poor First Input Delay',
          description: 'FID is above 100ms',
          action: 'Reduce JavaScript execution time, split code bundles'
        });
      }
      
      return recommendations;
    }
  }
};

export default performanceAPI; 