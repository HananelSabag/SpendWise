/**
 * 🚀 PERFORMANCE OPTIMIZER - Production Build Enhancements
 * Features: Bundle analysis, Code splitting, Cache optimization, Resource hints
 * @version 2.0.0
 */

// ✅ Performance Configuration
export const performanceConfig = {
  // Lazy loading thresholds
  lazyLoadThreshold: '100px',
  imageOptimization: true,
  prefetchRoutes: true,
  
  // Cache strategies
  cacheStrategies: {
    static: 'cache-first',
    api: 'network-first', 
    images: 'cache-first'
  },
  
  // Bundle optimization
  chunkStrategy: 'split-vendor',
  treeShaking: true,
  minification: true
};

// ✅ Resource Hints Manager
export class ResourceHintsManager {
  constructor() {
    this.prefetchedUrls = new Set();
    this.preloadedUrls = new Set();
  }

  // Prefetch critical routes
  prefetchRoute(path) {
    if (this.prefetchedUrls.has(path)) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
    
    this.prefetchedUrls.add(path);
  }

  // Preload critical resources
  preloadResource(url, type = 'script') {
    if (this.preloadedUrls.has(url)) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    document.head.appendChild(link);
    
    this.preloadedUrls.add(url);
  }

  // DNS prefetch for external domains
  prefetchDNS(domain) {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  }
}

// ✅ Image Optimization Manager
export class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.lazyImages = new Map();
  }

  // Initialize lazy loading
  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: performanceConfig.lazyLoadThreshold,
          threshold: 0.1
        }
      );
    }
  }

  // Handle image intersection
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.observer.unobserve(img);
      }
    });
  }

  // Load image with optimization
  loadImage(img) {
    const dataSrc = img.dataset.src;
    if (dataSrc) {
      img.src = dataSrc;
      img.classList.add('loaded');
    }
  }

  // Register image for lazy loading
  observeImage(img) {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }
}

// ✅ Bundle Analyzer (Development Only)
export const bundleAnalyzer = {
  analyzeChunks() {
    if (import.meta.env.MODE !== 'development') return;
    
    const chunks = performance.getEntriesByType('navigation');
    const loadTimes = chunks.map(chunk => ({
      name: chunk.name,
      loadTime: chunk.loadEventEnd - chunk.loadEventStart,
      domContentLoaded: chunk.domContentLoadedEventEnd - chunk.domContentLoadedEventStart
    }));
    
    console.group('📦 Bundle Analysis');
    console.table(loadTimes);
    console.groupEnd();
  },

  measureComponentLoad(componentName, loadTime) {
    if (import.meta.env.MODE !== 'development') return;
    
    console.log(`🧩 Component ${componentName} loaded in ${loadTime}ms`);
    
    if (loadTime > 100) {
      console.warn(`⚠️ Slow component detected: ${componentName} (${loadTime}ms)`);
    }
  }
};

// ✅ Cache Manager
export class CacheManager {
  constructor() {
    this.cacheVersion = 'v2.0.0';
    this.staticCache = `spendwise-static-${this.cacheVersion}`;
    this.apiCache = `spendwise-api-${this.cacheVersion}`;
  }

  // Cache critical resources
  async cacheResources(urls) {
    if ('caches' in window) {
      const cache = await caches.open(this.staticCache);
      await cache.addAll(urls);
    }
  }

  // Clear old caches
  async clearOldCaches() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith('spendwise-') && name !== this.staticCache && name !== this.apiCache
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
    }
  }

  // Get cached response
  async getCachedResponse(request) {
    if ('caches' in window) {
      const cache = await caches.open(this.staticCache);
      return await cache.match(request);
    }
    return null;
  }
}

// ✅ Performance Metrics Collector
export class PerformanceCollector {
  constructor() {
    this.metrics = new Map();
    this.startTime = performance.now();
  }

  // Mark performance milestone
  mark(name) {
    const time = performance.now() - this.startTime;
    this.metrics.set(name, time);
    
    if (import.meta.env.MODE === 'development') {
      console.log(`⏱️ ${name}: ${time.toFixed(2)}ms`);
    }
  }

  // Get Core Web Vitals
  getCoreWebVitals() {
    return new Promise((resolve) => {
      if ('web-vitals' in window) {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          const vitals = {};
          
          getCLS((metric) => vitals.cls = metric.value);
          getFID((metric) => vitals.fid = metric.value);
          getFCP((metric) => vitals.fcp = metric.value);
          getLCP((metric) => vitals.lcp = metric.value);
          getTTFB((metric) => vitals.ttfb = metric.value);
          
          resolve(vitals);
        });
      } else {
        resolve({});
      }
    });
  }

  // Generate performance report
  generateReport() {
    const report = {
      loadTime: performance.now() - this.startTime,
      metrics: Object.fromEntries(this.metrics),
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      timing: performance.timing
    };

    if (import.meta.env.MODE === 'development') {
      console.group('📊 Performance Report');
      console.table(report.metrics);
      if (report.memory) {
        console.log('💾 Memory Usage:', {
          used: `${(report.memory.used / 1024 / 1024).toFixed(2)} MB`,
          total: `${(report.memory.total / 1024 / 1024).toFixed(2)} MB`,
          usage: `${((report.memory.used / report.memory.total) * 100).toFixed(1)}%`
        });
      }
      console.groupEnd();
    }

    return report;
  }
}

// ✅ Initialize Performance Optimization
export const initPerformanceOptimization = () => {
  const resourceHints = new ResourceHintsManager();
  const imageOptimizer = new ImageOptimizer();
  const cacheManager = new CacheManager();
  const performanceCollector = new PerformanceCollector();

  // Mark initialization
  performanceCollector.mark('Performance Optimization Initialized');

  // Prefetch critical routes
  if (performanceConfig.prefetchRoutes) {
    resourceHints.prefetchRoute('/dashboard');
    resourceHints.prefetchRoute('/transactions');
    resourceHints.prefetchRoute('/profile');
  }

  // DNS prefetch for external services
  resourceHints.prefetchDNS('api.exchangerate-api.com');
  resourceHints.prefetchDNS('accounts.google.com');

  // Initialize lazy loading
  imageOptimizer.initLazyLoading();

  // Clear old caches
  cacheManager.clearOldCaches();

  // Return managers for app use
  return {
    resourceHints,
    imageOptimizer,
    cacheManager,
    performanceCollector,
    bundleAnalyzer
  };
};

// ✅ Production Build Optimizations
export const productionOptimizations = {
  // Remove development tools
  removeDevTools() {
    if (import.meta.env.MODE === 'production') {
      // Remove console statements
      if (window.console) {
        window.console.log = () => {};
        window.console.warn = () => {};
        window.console.group = () => {};
        window.console.groupEnd = () => {};
        window.console.table = () => {};
      }

      // Remove development APIs
      delete window.spendWiseAPI;
      delete window.stores;
      delete window.queryClient;
    }
  },

  // Enable compression headers
  enableCompression() {
    if ('serviceWorker' in navigator && import.meta.env.MODE === 'production') {
      navigator.serviceWorker.register('/sw.js');
    }
  },

  // Optimize fonts
  optimizeFonts() {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://fonts.googleapis.com';
    document.head.appendChild(link);

    const link2 = document.createElement('link');
    link2.rel = 'preconnect';
    link2.href = 'https://fonts.gstatic.com';
    link2.crossOrigin = 'anonymous';
    document.head.appendChild(link2);
  }
};

export default {
  performanceConfig,
  ResourceHintsManager,
  ImageOptimizer,
  bundleAnalyzer,
  CacheManager,
  PerformanceCollector,
  initPerformanceOptimization,
  productionOptimizations
}; 