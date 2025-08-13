/**
 * 🧹 CLEAR STORAGE UTILITY
 * Clears cache, localStorage, sessionStorage when URL params detected
 */

/**
 * Clear browser storage based on URL parameters
 */
export const clearStorageFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const clearParam = urlParams.get('clear');
  
  if (!clearParam) return;
  
  const clearTypes = clearParam.split(',');
  let clearedItems = [];
  
  try {
    // Clear localStorage
    if (clearTypes.includes('storage') || clearTypes.includes('localStorage')) {
      localStorage.clear();
      clearedItems.push('localStorage');
      // silent
    }
    
    // Clear sessionStorage  
    if (clearTypes.includes('storage') || clearTypes.includes('sessionStorage')) {
      sessionStorage.clear();
      clearedItems.push('sessionStorage');
      // silent
    }
    
    // Clear cookies
    if (clearTypes.includes('cookies')) {
      // Clear all cookies for current domain
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      clearedItems.push('cookies');
      // silent
    }
    
    // Clear cache (using Cache API if available)
    if (clearTypes.includes('cache') && 'caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
        clearedItems.push('cache');
        // silent
      });
    }
    
    // Clear specific SpendWise stores
    if (clearTypes.includes('storage')) {
      // Clear Zustand persist storage
      const zustandKeys = ['spendwise-auth', 'spendwise-translations', 'spendwise-app'];
      zustandKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Clear React Query cache
      localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
      sessionStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
      
      // silent
    }
    
    if (clearedItems.length > 0) {
      // silent
      
      // Show notification to user
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(() => {
          const notification = document.createElement('div');
          notification.innerHTML = `
            <div style="
              position: fixed;
              top: 20px;
              right: 20px;
              background: #10b981;
              color: white;
              padding: 12px 20px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
              z-index: 10000;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 14px;
              font-weight: 500;
            ">
              🧹 Cleared: ${clearedItems.join(', ')}
              <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                margin-left: 10px;
                cursor: pointer;
                font-size: 16px;
              ">×</button>
            </div>
          `;
          document.body.appendChild(notification);
          
          // Auto-remove after 3 seconds
          setTimeout(() => {
            if (notification.parentElement) {
              notification.remove();
            }
          }, 3000);
        }, 1000);
      }
      
      // Clean URL (remove clear parameter)
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('clear');
      window.history.replaceState({}, '', newUrl.toString());
    }
    
  } catch (error) {
    // silent
  }
};

/**
 * Manual clear storage function for development
 */
export const clearAllStorage = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    
    // Clear cache
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // silent
    
    // Reload page
    window.location.reload();
    
  } catch (error) {
    // silent
  }
};

/**
 * 🌐 Clear translation cache
 * Useful for fixing translation loading issues
 */
export const clearTranslationCache = () => {
  try {
    // Clear any translation-related localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('translation') || key.includes('i18n') || key.includes('language'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // silent
    return { cleared: keysToRemove.length, keys: keysToRemove };
  } catch (error) {
    // silent
    return { error: error.message };
  }
};

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  window.clearSpendWiseStorage = clearAllStorage;
  if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  // silent hint
  }
} 

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.clearTranslationCache = clearTranslationCache;
} 