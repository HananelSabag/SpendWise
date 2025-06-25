import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppStateContext = createContext();

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export const AppStateProvider = ({ children }) => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [appState, setAppState] = useState('initializing'); // initializing, ready, error, cold_start
  const [serverStatus, setServerStatus] = useState('unknown'); // unknown, cold, warming, ready
  const [initializationStep, setInitializationStep] = useState('auth');
  const [coldStartDetected, setColdStartDetected] = useState(false);

  // Centralized initialization sequence
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Step 1: Wait for auth to resolve
        setInitializationStep('auth');
        if (authLoading) return;

        // Step 2: Check server status
        setInitializationStep('server');
        const serverReady = await checkServerStatus();
        
        if (!serverReady) {
          setColdStartDetected(true);
          setAppState('cold_start');
          await waitForServerWarmup();
        }

        // Step 3: Initialize user data (if authenticated)
        if (isAuthenticated && user) {
          setInitializationStep('data');
          await preloadCriticalData();
        }

        // Step 4: App ready
        setAppState('ready');
        setInitializationStep('complete');
        
      } catch (error) {
        console.error('App initialization failed:', error);
        setAppState('error');
      }
    };

    initializeApp();
  }, [authLoading, isAuthenticated, user]);

  // Check if server is responsive
  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        setServerStatus('ready');
        return true;
      } else {
        setServerStatus('cold');
        return false;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setServerStatus('cold');
        return false;
      }
      throw error;
    }
  };

  // Wait for server to warm up with retry logic
  const waitForServerWarmup = async () => {
    const maxRetries = 12; // 2 minutes max
    let retries = 0;

    while (retries < maxRetries) {
      setServerStatus('warming');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const isReady = await checkServerStatus();
      if (isReady) {
        setColdStartDetected(false);
        return;
      }
      
      retries++;
    }
    
    throw new Error('Server failed to respond after cold start period');
  };

  // Preload critical data to avoid loading states later
  const preloadCriticalData = async () => {
    // Add your critical data loading here
    // This prevents loading states after app is "ready"
    try {
      // Example: Preload user profile, categories, recent transactions
      const promises = [
        // fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/profile`),
        // fetch(`${import.meta.env.VITE_API_URL}/api/v1/categories`),
        // Other critical data...
      ];
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn('Some critical data failed to preload:', error);
      // Don't fail the app initialization for this
    }
  };

  const value = {
    appState,
    serverStatus,
    initializationStep,
    coldStartDetected,
    isAppReady: appState === 'ready',
    isAppInitializing: appState === 'initializing',
    isAppError: appState === 'error',
    isColdStart: appState === 'cold_start'
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}; 