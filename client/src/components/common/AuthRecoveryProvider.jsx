/**
 * 🔄 AUTH RECOVERY PROVIDER
 * Initializes the authentication recovery manager and makes it globally available
 * @version 1.0.0
 */

import { useEffect } from 'react';
import getAuthRecoveryManager from '../../utils/authRecoveryManager';

const AuthRecoveryProvider = ({ children }) => {
  useEffect(() => {
    // Initialize auth recovery manager
    const recoveryManager = getAuthRecoveryManager();

    // Expose simple connection state helpers for overlays/pages
    if (typeof window !== 'undefined') {
      window.connectionState = window.connectionState || {
        setServerWaking(flag) { window.__SERVER_WAKING__ = !!flag; },
        isServerWaking() { return !!window.__SERVER_WAKING__; }
      };
    }

    // Cleanup on unmount
    return () => {
      if (recoveryManager.stopHealthMonitoring) {
        recoveryManager.stopHealthMonitoring();
      }
    };
  }, []);

  return children;
};

export default AuthRecoveryProvider;