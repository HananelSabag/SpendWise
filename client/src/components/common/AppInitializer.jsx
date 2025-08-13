/**
 * 🚀 APP INITIALIZER - RACE CONDITION FIX
 * Ensures proper initialization order to prevent auth/store race conditions
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores';
import TopProgressBar from './TopProgressBar.jsx';
import { api } from '../../api';
import { useAppStore } from '../../stores/appStore';

const AppInitializer = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const authActions = useAuthStore((state) => state.actions);
  const getAuthState = useAuthStore.getState;
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize auth store synchronously
        authActions.initialize();

        // If already authenticated (token in storage), fetch fresh profile and sync preferences immediately
        try {
          const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
          if (token && typeof authActions.getProfile === 'function') {
            await authActions.getProfile();
          }
        } catch (_) {}
        
        // Load admin system settings ONLY for authenticated admins
        try {
          const { isAuthenticated, user } = getAuthState();
          const role = user?.role;
          const isAdmin = role === 'admin' || role === 'super_admin' || user?.isAdmin || user?.isSuperAdmin;
          if (isAuthenticated && isAdmin) {
            const result = await api.admin.settings.get();
            const settings = Array.isArray(result.data) ? result.data : [];
            const siteName = settings.find(s => s.key === 'site_name')?.value || 'SpendWise';
            const googleEnabled = settings.find(s => s.key === 'google_oauth_enabled')?.value !== false;
            const supportEmail = settings.find(s => s.key === 'support_email')?.value || 'spendwise.verifiction@gmail.com';

            document.title = `${siteName}`;
            useAppStore.setState((state) => { state.pageTitle = siteName; });

            window.__SW_GOOGLE_OAUTH_ENABLED__ = googleEnabled;
            window.__SW_SUPPORT_EMAIL__ = supportEmail;
          }
        } catch (_) {}
        
        // Mark as initialized
        setIsInitialized(true);
      } catch (_) {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [authActions]);

  return (
    <>
      <TopProgressBar visible={!isInitialized} />
      {children}
    </>
  );
};

export default AppInitializer; 