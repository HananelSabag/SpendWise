/**
 * 🔄 AUTH RECOVERY PROVIDER
 * Initializes the authentication recovery manager and makes it globally available
 * @version 1.0.0
 */

import { useEffect } from 'react';
import getAuthRecoveryManager from '../../utils/authRecoveryManager';
import AuthRecoveryTestUtils from '../../utils/authRecoveryTestUtils';

const AuthRecoveryProvider = ({ children }) => {
  useEffect(() => {
    // Initialize auth recovery manager
    const recoveryManager = getAuthRecoveryManager();
    
    // Make it globally available for debugging
    window.authRecoveryManager = recoveryManager;
    window.AuthRecoveryTestUtils = AuthRecoveryTestUtils;
    
    console.log('🔄 Auth Recovery Manager initialized and globally available');
    console.log('🧪 Test utilities available via: window.AuthRecoveryTestUtils');

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