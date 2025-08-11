/**
 * 🚀 APP INITIALIZER - RACE CONDITION FIX
 * Ensures proper initialization order to prevent auth/store race conditions
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores';
import LoadingSpinner from '../ui/LoadingSpinner';
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
          const token = localStorage.getItem('accessToken');
          if (token && typeof authActions.getProfile === 'function') {
            await authActions.getProfile();
          }
        } catch (e) {
          console.warn('Profile preload failed on init (non-fatal):', e?.message);
        }
        
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

            // Set document title and app store pageTitle base
            document.title = `${siteName}`;
            useAppStore.setState((state) => { state.pageTitle = siteName; });

            // Expose flag globally for conditional UI
            window.__SW_GOOGLE_OAUTH_ENABLED__ = googleEnabled;
            window.__SW_SUPPORT_EMAIL__ = supportEmail;
          }
        } catch (e) {
          // Non-fatal for init
          console.warn('Skipped admin settings on init:', e?.message);
        }
        
        // Mark as initialized
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        // Still mark as initialized to prevent infinite loading
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [authActions]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Initializing SpendWise...
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default AppInitializer; 