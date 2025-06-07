// Temporary debug utilities
export const debugUtils = {
  clearAllCache: () => {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Clear all React Query cache
    if (window.queryClient) {
      window.queryClient.clear();
    }
    
    // Clear browser cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Force reload
    window.location.reload();
  },
  
  checkUserData: () => {
    console.log('Current user cache:', window.queryClient?.getQueryData(['profile']));
    console.log('Current token:', localStorage.getItem('accessToken'));
  }
};

// Make available in console
window.debugUtils = debugUtils;
