/**
 * 🚀 APP INITIALIZER - RACE CONDITION FIX
 * Ensures proper initialization order to prevent auth/store race conditions
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores';
import LoadingSpinner from '../ui/LoadingSpinner';

const AppInitializer = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const authActions = useAuthStore((state) => state.actions);
  
  useEffect(() => {
    const initializeApp = () => {
      try {
        // Initialize auth store synchronously
        authActions.initialize();
        
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