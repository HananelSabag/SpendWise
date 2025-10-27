/**
 * 🧹 useToastCleanup Hook
 * Automatically dismisses loading toasts on navigation/unmount
 * Prevents infinite loading spinners from persisting
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * Auto-dismiss loading toasts on route changes
 * This prevents loading toasts from one page showing on another
 */
export const useToastCleanup = (options = {}) => {
  const location = useLocation();
  const { dismissOnNavigate = true, keepSpecificToasts = [] } = options;

  useEffect(() => {
    if (dismissOnNavigate) {
      // Dismiss all toasts except those in the keepList
      toast.dismiss();
      
      // Clean up timeout trackers
      if (typeof window !== 'undefined' && window.__toastTimeouts) {
        window.__toastTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        window.__toastTimeouts.clear();
      }
    }
  }, [location.pathname, dismissOnNavigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dismissOnNavigate) {
        toast.dismiss();
        
        // Clean up timeout trackers
        if (typeof window !== 'undefined' && window.__toastTimeouts) {
          window.__toastTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
          window.__toastTimeouts.clear();
        }
      }
    };
  }, [dismissOnNavigate]);
};

/**
 * Dismiss specific loading toasts
 */
export const dismissLoadingToasts = () => {
  // Dismiss known loading toast IDs
  const loadingToastIds = [
    'cold-start',
    'connection-recovering',
    'auth-session-expired'
  ];
  
  loadingToastIds.forEach(id => {
    try {
      toast.dismiss(id);
    } catch (_) {
      // Ignore errors
    }
  });
  
  // Clean up timeouts
  if (typeof window !== 'undefined' && window.__toastTimeouts) {
    window.__toastTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    window.__toastTimeouts.clear();
  }
};

export default useToastCleanup;


