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
    
    // Make it globally available for debugging (only in development)
    if (import.meta.env.DEV) {
      window.authRecoveryManager = recoveryManager;
    }

    // Cleanup on unmount
    return () => {
      if (recoveryManager.stopHealthMonitoring) {
        recoveryManager.stopHealthMonitoring();
      }
      delete window.authRecoveryManager;
    };
  }, []);

  return children;
};

export default AuthRecoveryProvider;