/**
 * 🍞 AUTH TOAST PROVIDER
 * Makes authentication toasts globally available throughout the app
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { useAuthToasts } from '../../hooks/useAuthToasts';

const AuthToastProvider = ({ children }) => {
  const authToasts = useAuthToasts();

  useEffect(() => {
    // Make auth toasts globally available for the auth store
    window.authToasts = authToasts;

    // Cleanup on unmount
    return () => {
      delete window.authToasts;
    };
  }, [authToasts]);

  return children;
};

export default AuthToastProvider; 