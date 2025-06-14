/**
 * ThemeContext - Database-Driven Theme Management
 * Syncs with user preferences from database, no localStorage for authenticated users
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // ✅ FIX: Initialize theme from localStorage first, then fallback to system
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('preferredTheme');
    console.log('🎨 [THEME] Initializing theme from localStorage:', savedTheme);
    
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      console.log('🎨 [THEME] Using saved theme:', savedTheme);
      return savedTheme;
    }

    // Check system preference as fallback
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const fallbackTheme = systemPrefersDark ? 'dark' : 'light';
    console.log('🎨 [THEME] Using system fallback:', fallbackTheme);
    return fallbackTheme;
  });

  // ✅ ADD: Track session-only theme changes
  const [sessionTheme, setSessionTheme] = useState(null);

  // ✅ FIX: Get effective theme (session override or saved preference)
  const effectiveTheme = sessionTheme || theme;

  // ✅ FIX: Permanent theme change (for profile settings)
  const changeThemePermanent = (newTheme) => {
    if (!['light', 'dark', 'system'].includes(newTheme)) {
      console.warn('🎨 [THEME] Invalid theme:', newTheme);
      return;
    }

    console.log(`🎨 [THEME] Permanent change: ${theme} → ${newTheme} (session: ${sessionTheme})`);

    setTheme(newTheme);
    setSessionTheme(null); // Clear session override
    localStorage.setItem('preferredTheme', newTheme);
    
    console.log(`🎨 [THEME] Permanent change completed. New effective theme: ${newTheme}`);
  };

  // ✅ ADD: Session-only theme change (for header toggle)
  const changeThemeSession = (newTheme) => {
    if (!['light', 'dark', 'system'].includes(newTheme)) {
      console.warn('🎨 [THEME] Invalid session theme:', newTheme);
      return;
    }

    console.log(`🎨 [THEME] Session change: ${effectiveTheme} → ${newTheme} (saved: ${theme})`);

    setSessionTheme(newTheme);
    // Note: Don't save to localStorage for session changes
    
    console.log(`🎨 [THEME] Session change completed. New effective theme: ${newTheme}`);
  };

  // ✅ FIX: Enhanced toggleTheme for session-only changes
  const toggleLightDark = () => {
    const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    changeThemeSession(newTheme);
  };

  // ✅ ADD: Reset to saved preference (called on logout)
  const resetToSavedTheme = () => {
    console.log(`🎨 [THEME] Resetting to saved preference: ${theme}`);
    setSessionTheme(null);
  };

  // ✅ ADD: Sync with user preferences from database
  useEffect(() => {
    const handleUserPreferencesSync = (event) => {
      const { user } = event.detail || {};
      if (user?.preferences?.theme) {
        const userTheme = user.preferences.theme;
        if (['light', 'dark', 'system'].includes(userTheme)) {
          console.log(`🎨 [THEME] Syncing from database: ${theme} → ${userTheme}`);
          setTheme(userTheme);
          setSessionTheme(null); // Clear session override when loading user preferences
          localStorage.setItem('preferredTheme', userTheme);
        }
      }
    };

    window.addEventListener('user-preferences-loaded', handleUserPreferencesSync);
    return () => window.removeEventListener('user-preferences-loaded', handleUserPreferencesSync);
  }, [theme]);

  // ✅ ADD: Effect to sync theme changes across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'preferredTheme' && e.newValue !== theme) {
        console.log(`🎨 [THEME] Storage change detected: ${theme} → ${e.newValue}`);
        setTheme(e.newValue);
        setSessionTheme(null); // Clear session override when permanent preference changes
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [theme]);

  // ✅ FIX: Apply theme to document - Tailwind expects only 'dark' class
  useEffect(() => {
    const root = document.documentElement;
    
    // ✅ FIXED: Tailwind only needs 'dark' class, not 'light'
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#0a0a0a' : '#ffffff');
    }

    console.log(`🎨 [THEME] Applied to DOM: ${effectiveTheme} (dark class: ${root.classList.contains('dark')})`);
  }, [effectiveTheme]);

  // ✅ FIXED: Listen for session reset events (logout)
  useEffect(() => {
    const handleSessionReset = () => {
      console.log(`🎨 [THEME] Session reset detected - clearing session overrides`);
      resetToSavedTheme();
    };

    window.addEventListener('auth-logout', handleSessionReset);
    window.addEventListener('theme-session-reset', handleSessionReset);
    
    return () => {
      window.removeEventListener('auth-logout', handleSessionReset);
      window.removeEventListener('theme-session-reset', handleSessionReset);
    };
  }, []);

  // ✅ ADD: Check if current theme is dark/light
  const isDark = effectiveTheme === 'dark';
  const isLight = effectiveTheme === 'light';

  const value = {
    theme: effectiveTheme, // ✅ Use effective theme
    savedTheme: theme, // ✅ Expose saved preference
    sessionTheme, // ✅ Expose session override
    setTheme: changeThemePermanent, // ✅ For profile settings (permanent)
    setThemeSession: changeThemeSession, // ✅ For header toggle (session)
    toggleTheme: toggleLightDark, // ✅ Session-only toggle
    resetToSavedTheme, // ✅ Reset on logout
    isDark,
    isLight,
    isSessionOverride: !!sessionTheme // ✅ Check if session override is active
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};