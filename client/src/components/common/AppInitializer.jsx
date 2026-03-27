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

  useEffect(() => {
    // Use getState() directly — avoids subscribing to the store and prevents
    // this effect from re-running on every auth state change (fixes INIT-1).
    const initializeApp = async () => {
      try {
        const authActions = useAuthStore.getState().actions;

        // Initialize auth store synchronously
        authActions.initialize();

        // If already authenticated (token in storage), fetch fresh profile
        try {
          const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
          if (token && typeof authActions.getProfile === 'function') {
            await authActions.getProfile();
          }
        } catch (_) {}

        // Load admin system settings ONLY for authenticated admins
        try {
          const { isAuthenticated, user } = useAuthStore.getState();
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

        setIsInitialized(true);
      } catch (_) {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []); // Empty deps — runs once on mount only

  return (
    <>
      <TopProgressBar visible={!isInitialized} />
      {children}
    </>
  );
};

export default AppInitializer; 