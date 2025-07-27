/**
 * 🏗️ BUILD OPTIMIZER - Production Deployment Enhancements
 * Features: Tree shaking, Code splitting, Asset optimization, Bundle analysis
 * @version 2.0.0
 */

// ✅ Production Build Configuration
export const buildOptimizations = {
  // Code splitting strategy
  codeSplitting: {
    // Vendor chunks
    vendor: {
      name: 'vendor',
      test: /[\\/]node_modules[\\/]/,
      priority: 10,
      reuseExistingChunk: true
    },
    
    // Common chunks
    common: {
      name: 'common',
      minChunks: 2,
      priority: 5,
      reuseExistingChunk: true
    },
    
    // Admin chunks (loaded only when needed)
    admin: {
      name: 'admin',
      test: /[\\/]pages[\\/]admin[\\/]/,
      priority: 8,
      chunks: 'async'
    },
    
    // Analytics chunks
    analytics: {
      name: 'analytics', 
      test: /[\\/]pages[\\/]analytics[\\/]/,
      priority: 8,
      chunks: 'async'
    }
  },

  // Tree shaking configuration
  treeShaking: {
    sideEffects: false,
    usedExports: true,
    providedExports: true
  },

  // Asset optimization
  assets: {
    // Image optimization
    images: {
      formats: ['webp', 'avif', 'jpeg'],
      sizes: [320, 640, 960, 1280, 1920],
      quality: 85
    },
    
    // Font optimization
    fonts: {
      preload: ['inter-var.woff2'],
      display: 'swap',
      subsetting: true
    }
  },

  // Performance budgets
  budgets: {
    maximumWarning: '500kb',
    maximumError: '1mb',
    minimumWarning: '100kb'
  }
};

// ✅ Bundle Analysis Utilities
export const bundleAnalyzer = {
  // Analyze chunk sizes
  analyzeChunks(stats) {
    const chunks = stats.chunks || [];
    const analysis = {
      totalSize: 0,
      chunkCount: chunks.length,
      largestChunk: null,
      duplicates: []
    };

    chunks.forEach(chunk => {
      analysis.totalSize += chunk.size;
      
      if (!analysis.largestChunk || chunk.size > analysis.largestChunk.size) {
        analysis.largestChunk = chunk;
      }
    });

    return analysis;
  },

  // Find duplicate modules
  findDuplicates(stats) {
    const modules = stats.modules || [];
    const moduleMap = new Map();
    const duplicates = [];

    modules.forEach(module => {
      const name = module.name || module.identifier;
      if (moduleMap.has(name)) {
        duplicates.push({
          name,
          size: module.size,
          chunks: module.chunks
        });
      } else {
        moduleMap.set(name, module);
      }
    });

    return duplicates;
  },

  // Generate optimization recommendations
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.totalSize > 1024 * 1024) { // 1MB
      recommendations.push({
        type: 'warning',
        message: 'Total bundle size exceeds 1MB. Consider code splitting.',
        action: 'Split large chunks into smaller ones'
      });
    }

    if (analysis.largestChunk && analysis.largestChunk.size > 500 * 1024) { // 500KB
      recommendations.push({
        type: 'warning', 
        message: `Largest chunk (${analysis.largestChunk.name}) is ${Math.round(analysis.largestChunk.size / 1024)}KB`,
        action: 'Split large chunk or lazy load components'
      });
    }

    if (analysis.duplicates.length > 0) {
      recommendations.push({
        type: 'error',
        message: `Found ${analysis.duplicates.length} duplicate modules`,
        action: 'Review imports and remove duplicates'
      });
    }

    return recommendations;
  }
};

// ✅ Asset Optimizer
export class AssetOptimizer {
  constructor() {
    this.optimizedAssets = new Map();
  }

  // Optimize images
  async optimizeImage(src, options = {}) {
    if (this.optimizedAssets.has(src)) {
      return this.optimizedAssets.get(src);
    }

    const {
      width = 800,
      height = 600, 
      format = 'webp',
      quality = 85
    } = options;

    // In a real implementation, this would use an image optimization service
    const optimizedSrc = `${src}?w=${width}&h=${height}&f=${format}&q=${quality}`;
    this.optimizedAssets.set(src, optimizedSrc);
    
    return optimizedSrc;
  }

  // Generate responsive image srcSet
  generateSrcSet(src, sizes = [320, 640, 960, 1280]) {
    return sizes.map(size => 
      `${this.optimizeImage(src, { width: size })} ${size}w`
    ).join(', ');
  }

  // Preload critical assets
  preloadCriticalAssets(assets) {
    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = asset.src;
      link.as = asset.type;
      
      if (asset.type === 'image') {
        link.imageSizes = asset.sizes || '100vw';
        link.imageSrcset = this.generateSrcSet(asset.src);
      }
      
      document.head.appendChild(link);
    });
  }
}

// ✅ Progressive Web App Optimizer
export class PWAOptimizer {
  constructor() {
    this.cacheStrategies = new Map();
  }

  // Configure caching strategies
  configureCaching() {
    this.cacheStrategies.set('static', {
      strategy: 'CacheFirst',
      cacheName: 'spendwise-static',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      }
    });

    this.cacheStrategies.set('api', {
      strategy: 'NetworkFirst',
      cacheName: 'spendwise-api',
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      }
    });

    this.cacheStrategies.set('images', {
      strategy: 'CacheFirst',
      cacheName: 'spendwise-images',
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      }
    });
  }

  // Generate service worker configuration
  generateSWConfig() {
    return {
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: Array.from(this.cacheStrategies.entries()).map(([key, config]) => ({
        urlPattern: this.getUrlPattern(key),
        handler: config.strategy,
        options: {
          cacheName: config.cacheName,
          expiration: config.expiration,
          networkTimeoutSeconds: config.networkTimeoutSeconds
        }
      }))
    };
  }

  // Get URL pattern for cache strategy
  getUrlPattern(type) {
    switch (type) {
      case 'static':
        return /\.(?:js|css|html|ico|png|jpg|jpeg|svg|woff2?)$/;
      case 'api':
        return /^https:\/\/api\./;
      case 'images':
        return /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/;
      default:
        return /./;
    }
  }
}

// ✅ Performance Budget Monitor
export class PerformanceBudgetMonitor {
  constructor(budgets) {
    this.budgets = budgets;
    this.violations = [];
  }

  // Check bundle against budgets
  checkBudgets(stats) {
    const totalSize = this.calculateTotalSize(stats);
    
    if (totalSize > this.parseSize(this.budgets.maximumError)) {
      this.violations.push({
        type: 'error',
        message: `Bundle size (${this.formatSize(totalSize)}) exceeds maximum error threshold (${this.budgets.maximumError})`
      });
    } else if (totalSize > this.parseSize(this.budgets.maximumWarning)) {
      this.violations.push({
        type: 'warning',
        message: `Bundle size (${this.formatSize(totalSize)}) exceeds warning threshold (${this.budgets.maximumWarning})`
      });
    }

    return this.violations;
  }

  // Calculate total bundle size
  calculateTotalSize(stats) {
    return (stats.assets || []).reduce((total, asset) => total + asset.size, 0);
  }

  // Parse size string to bytes
  parseSize(sizeStr) {
    const units = { kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)(kb|mb|gb)$/);
    
    if (!match) return 0;
    
    const [, size, unit] = match;
    return parseFloat(size) * (units[unit] || 1);
  }

  // Format size for display
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  }
}

// ✅ Production Deployment Utilities
export const deploymentUtils = {
  // Generate build report
  generateBuildReport(stats, analysis) {
    const report = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0',
      environment: 'production',
      stats: {
        totalSize: analysis.totalSize,
        chunkCount: analysis.chunkCount,
        assetCount: stats.assets?.length || 0,
        moduleCount: stats.modules?.length || 0
      },
      performance: {
        budgetViolations: analysis.budgetViolations || [],
        recommendations: analysis.recommendations || []
      },
      optimization: {
        treeShaking: true,
        codeSplitting: true,
        minification: true,
        compression: true
      }
    };

    // Log report in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🏗️ Build Report');
      console.table(report.stats);
      if (report.performance.recommendations.length > 0) {
        console.group('💡 Recommendations');
        report.performance.recommendations.forEach(rec => {
          console.log(`${rec.type}: ${rec.message} - ${rec.action}`);
        });
        console.groupEnd();
      }
      console.groupEnd();
    }

    return report;
  },

  // Validate production build
  validateBuild(stats) {
    const issues = [];

    // Check for development code
    if (stats.compilation?.includes('development')) {
      issues.push('Development code detected in production build');
    }

    // Check for source maps in production
    const hasSourceMaps = stats.assets?.some(asset => asset.name.endsWith('.map'));
    if (hasSourceMaps) {
      issues.push('Source maps found in production build');
    }

    // Check for large assets
    const largeAssets = stats.assets?.filter(asset => asset.size > 1024 * 1024);
    if (largeAssets?.length > 0) {
      issues.push(`Large assets detected: ${largeAssets.map(a => a.name).join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
};

export default {
  buildOptimizations,
  bundleAnalyzer,
  AssetOptimizer,
  PWAOptimizer,
  PerformanceBudgetMonitor,
  deploymentUtils
}; 