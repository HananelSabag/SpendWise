/**
 * 📱 MOBILE UTILITIES - Touch, Viewport & UX Helpers
 * Comprehensive mobile optimization utilities for SpendWise
 * @version 2.0.0
 */

// ✅ Device Detection
export const deviceDetection = {
  // Check if device supports touch
  isTouchDevice: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  // Check if device is mobile
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // Check if device is tablet
  isTablet: () => {
    return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
  },
  
  // Check if device is iOS
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },
  
  // Check if device is Android
  isAndroid: () => {
    return /Android/.test(navigator.userAgent);
  },
  
  // Get device pixel ratio
  getPixelRatio: () => {
    return window.devicePixelRatio || 1;
  },
  
  // Check if device supports hover
  supportsHover: () => {
    return window.matchMedia('(hover: hover)').matches;
  }
};

// ✅ Viewport Utilities
export const viewport = {
  // Get viewport dimensions
  getDimensions: () => ({
    width: window.innerWidth,
    height: window.innerHeight,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight
  }),
  
  // Check if viewport is in portrait mode
  isPortrait: () => {
    return window.innerHeight > window.innerWidth;
  },
  
  // Check if viewport is in landscape mode
  isLandscape: () => {
    return window.innerWidth > window.innerHeight;
  },
  
  // Get safe area insets (for iPhone notch, etc.)
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
      right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
      bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
      left: style.getPropertyValue('env(safe-area-inset-left)') || '0px'
    };
  },
  
  // Check if viewport is small (mobile-sized)
  isSmall: () => {
    return window.innerWidth < 640;
  },
  
  // Check if viewport is medium (tablet-sized)
  isMedium: () => {
    return window.innerWidth >= 640 && window.innerWidth < 1024;
  },
  
  // Check if viewport is large (desktop-sized)
  isLarge: () => {
    return window.innerWidth >= 1024;
  },
  
  // Listen for orientation changes
  onOrientationChange: (callback) => {
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(() => {
        callback({
          orientation: viewport.isPortrait() ? 'portrait' : 'landscape',
          dimensions: viewport.getDimensions()
        });
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }
};

// ✅ Touch Utilities
export const touch = {
  // Minimum touch target size (44px per Apple guidelines)
  MIN_TOUCH_SIZE: 44,
  
  // Check if element meets minimum touch target size
  meetsMinimumSize: (element) => {
    const rect = element.getBoundingClientRect();
    return rect.width >= touch.MIN_TOUCH_SIZE && rect.height >= touch.MIN_TOUCH_SIZE;
  },
  
  // Add touch-friendly CSS to element
  makeTouchFriendly: (element) => {
    element.style.minHeight = `${touch.MIN_TOUCH_SIZE}px`;
    element.style.minWidth = `${touch.MIN_TOUCH_SIZE}px`;
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.cursor = 'pointer';
    element.style.userSelect = 'none';
    element.style.touchAction = 'manipulation';
  },
  
  // Debounced touch handler to prevent double-taps
  createTouchHandler: (callback, delay = 300) => {
    let lastTouchTime = 0;
    
    return (event) => {
      const now = Date.now();
      if (now - lastTouchTime > delay) {
        lastTouchTime = now;
        callback(event);
      }
    };
  },
  
  // Prevent iOS zoom on double-tap
  preventZoom: (element) => {
    let lastTouchEnd = 0;
    
    element.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  },
  
  // Add haptic feedback (if supported)
  vibrate: (pattern = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
};

// ✅ Mobile UX Utilities
export const mobileUX = {
  // Scroll to element with mobile-friendly behavior
  scrollToElement: (element, options = {}) => {
    const defaultOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
      // Add padding for mobile keyboards
      extraPadding: deviceDetection.isMobile() ? 100 : 0
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    if (finalOptions.extraPadding) {
      const rect = element.getBoundingClientRect();
      const targetY = window.pageYOffset + rect.top - finalOptions.extraPadding;
      
      window.scrollTo({
        top: targetY,
        behavior: finalOptions.behavior
      });
    } else {
      element.scrollIntoView(finalOptions);
    }
  },
  
  // Hide/show mobile browser UI by scrolling
  hideMobileBrowserUI: () => {
    if (deviceDetection.isMobile()) {
      window.scrollTo(0, 1);
    }
  },
  
  // Check if mobile keyboard is open
  isMobileKeyboardOpen: () => {
    if (!deviceDetection.isMobile()) return false;
    
    const initialHeight = window.screen.height;
    const currentHeight = window.innerHeight;
    const threshold = initialHeight * 0.75; // 75% of initial height
    
    return currentHeight < threshold;
  },
  
  // Handle mobile keyboard events
  onKeyboardToggle: (callback) => {
    if (!deviceDetection.isMobile()) return () => {};
    
    let initialHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      const isKeyboardOpen = heightDiff > 150; // Threshold for keyboard
      
      callback({
        isOpen: isKeyboardOpen,
        heightDiff,
        currentHeight,
        initialHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  },
  
  // Prevent overscroll/bounce on iOS
  preventOverscroll: (element) => {
    if (deviceDetection.isIOS()) {
      element.style.webkitOverflowScrolling = 'touch';
      element.style.overscrollBehavior = 'contain';
    }
  },
  
  // Set up pull-to-refresh behavior
  setupPullToRefresh: (callback, threshold = 100) => {
    if (!deviceDetection.isMobile()) return () => {};
    
    let startY = 0;
    let isRefreshing = false;
    
    const handleTouchStart = (e) => {
      if (window.pageYOffset === 0) {
        startY = e.touches[0].pageY;
      }
    };
    
    const handleTouchMove = (e) => {
      if (window.pageYOffset === 0 && !isRefreshing) {
        const currentY = e.touches[0].pageY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > threshold) {
          isRefreshing = true;
          callback();
          
          // Reset after callback
          setTimeout(() => {
            isRefreshing = false;
          }, 2000);
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }
};

// ✅ Performance Utilities for Mobile
export const mobilePerformance = {
  // Optimize images for mobile
  optimizeImage: (src, options = {}) => {
    const { 
      maxWidth = viewport.getDimensions().width,
      quality = 0.8,
      format = 'webp'
    } = options;
    
    // If URL supports responsive images
    if (src.includes('unsplash.com') || src.includes('cloudinary.com')) {
      return `${src}?w=${maxWidth}&q=${Math.round(quality * 100)}&f=${format}`;
    }
    
    return src;
  },
  
  // Lazy load with intersection observer
  createLazyLoader: (callback, options = {}) => {
    const defaultOptions = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    if ('IntersectionObserver' in window) {
      return new IntersectionObserver(callback, defaultOptions);
    } else {
      // Fallback for older browsers
      return {
        observe: (element) => callback([{ target: element, isIntersecting: true }]),
        disconnect: () => {}
      };
    }
  },
  
  // Reduce motion if user prefers it
  respectsReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Optimize for low-end devices
  isLowEndDevice: () => {
    // Check memory, CPU cores, and connection
    const navigator = window.navigator;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
    const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    const slowConnection = connection && ['slow-2g', '2g', '3g'].includes(connection.effectiveType);
    
    return lowMemory || lowCores || slowConnection;
  }
};

// ✅ Accessibility Utilities for Mobile
export const mobileA11y = {
  // Announce to screen readers
  announce: (message, priority = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    
    document.body.appendChild(announcer);
    announcer.textContent = message;
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },
  
  // Focus management for mobile
  trapFocus: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    element.addEventListener('keydown', handleKeyDown);
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  },
  
  // Check if element is properly labeled
  isProperlyLabeled: (element) => {
    return element.hasAttribute('aria-label') || 
           element.hasAttribute('aria-labelledby') || 
           element.hasAttribute('title') ||
           (element.tagName === 'INPUT' && element.labels && element.labels.length > 0);
  }
};

// ✅ Network Utilities
export const network = {
  // Get connection information
  getConnectionInfo: () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return null;
  },
  
  // Check if user prefers reduced data
  prefersReducedData: () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection && connection.saveData;
  },
  
  // Monitor online/offline status
  onConnectionChange: (callback) => {
    const handleOnline = () => callback({ online: true });
    const handleOffline = () => callback({ online: false });
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
  
  // Check if device is online
  isOnline: () => navigator.onLine
};

// ✅ Default export
export default {
  deviceDetection,
  viewport,
  touch,
  mobileUX,
  mobilePerformance,
  mobileA11y,
  network
}; 