// client/src/context/AccessibilityContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AccessibilityContext = createContext(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children, initialDarkMode = false }) => {
  // ✅ FIX: Don't use useAuth directly to avoid circular dependency
  // We'll sync with auth state via events instead
  
  // ✅ NEW: Session-based reset - clear settings on new browser session
  useEffect(() => {
    const isNewSession = !sessionStorage.getItem('a11y_session_started');
    
    if (isNewSession) {
      console.log('🎨 [ACCESSIBILITY] New browser session detected - resetting accessibility settings to defaults');
      
      // Clear all accessibility localStorage on new session
      localStorage.removeItem('a11y_fontSize');
      localStorage.removeItem('a11y_highContrast');
      localStorage.removeItem('a11y_darkMode');
      localStorage.removeItem('a11y_menuCollapsed');
      
      // Mark this session as started
      sessionStorage.setItem('a11y_session_started', 'true');
      
      // Reset document styles immediately
      document.documentElement.style.fontSize = '1rem';
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Only clear localStorage if needed, don't touch DOM classes
    if (initialDarkMode === false) {
      localStorage.removeItem('a11y_darkMode');
      console.log('🎨 [ACCESSIBILITY] Cleared dark mode setting on init');
    }
  }, [initialDarkMode]);

  // ✅ NEW: Check if this is a session that should use defaults
  const shouldUseDefaults = () => {
    // If this is a new session, use defaults
    const isNewSession = !sessionStorage.getItem('a11y_session_started');
    if (isNewSession) {
      return true;
    }
    
    // If user is not authenticated, use defaults
    const hasAuth = localStorage.getItem('accessToken');
    if (!hasAuth) {
      return true;
    }
    
    return false;
  };

  // States with conditional localStorage persistence
  const [fontSize, setFontSize] = useState(() => {
    if (shouldUseDefaults()) {
      return 1; // Default font size
    }
    const saved = localStorage.getItem('a11y_fontSize');
    return saved ? parseFloat(saved) : 1;
  });
  
  const [highContrast, setHighContrast] = useState(() => {
    if (shouldUseDefaults()) {
      return false; // Default high contrast off
    }
    return localStorage.getItem('a11y_highContrast') === 'true';
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    // IMPORTANT: Override localStorage if initialDarkMode is explicitly false
    if (initialDarkMode === false || shouldUseDefaults()) {
      return false;
    }
    
    // Otherwise check localStorage
    if (localStorage.getItem('a11y_darkMode') !== null) {
      return localStorage.getItem('a11y_darkMode') === 'true';
    }
    
    // Then check initialDarkMode prop
    if (initialDarkMode !== undefined) {
      return initialDarkMode;
    }
    
    // Finally fallback to system preference (but prioritize light mode)
    return false; // Default to light mode instead of system preference
  });
  
  // Fix: Define isCollapsed state properly
  const [menuCollapsed, setMenuCollapsed] = useState(() => {
    if (shouldUseDefaults()) {
      return false; // Default menu not collapsed
    }
    return localStorage.getItem('a11y_menuCollapsed') === 'true';
  });

  // Effect to apply font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}rem`;
    localStorage.setItem('a11y_fontSize', fontSize.toString());
  }, [fontSize]);

  // Effect to apply high contrast
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('a11y_highContrast', highContrast.toString());
  }, [highContrast]);

  // ✅ REMOVED: Don't apply dark mode here - let ThemeContext handle it
  // The AccessibilityProvider should not interfere with theme management
  useEffect(() => {
    // Only save to localStorage, don't apply classes
    localStorage.setItem('a11y_darkMode', darkMode.toString());
    console.log('🎨 [ACCESSIBILITY] Dark mode preference saved:', darkMode, '(but not applied - ThemeContext handles this)');
  }, [darkMode]);

  // Effect for menu collapsed state
  useEffect(() => {
    localStorage.setItem('a11y_menuCollapsed', menuCollapsed.toString());
  }, [menuCollapsed]);

  // Enhanced functions with bounds checking
  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 0.1, 1.5));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 0.1, 0.8));
  }, []);

  const setFontSizeWithBounds = useCallback((size) => {
    const boundedSize = Math.min(Math.max(size, 0.8), 1.5);
    setFontSize(boundedSize);
  }, []);

  // Reset all settings
  const resetSettings = useCallback(() => {
    setFontSize(1);
    setHighContrast(false);
    setDarkMode(false); // שינוי: תמיד מחזיר ללייט מוד
    setMenuCollapsed(false);
    
    // Clear all accessibility settings from localStorage
    localStorage.removeItem('a11y_fontSize');
    localStorage.removeItem('a11y_highContrast');
    localStorage.removeItem('a11y_darkMode');
    localStorage.removeItem('a11y_menuCollapsed');
  }, []);

  // ✅ FIX: Reset accessibility settings on logout
  useEffect(() => {
    const handleLogout = () => {
      console.log('🎨 [ACCESSIBILITY] User logged out - resetting accessibility settings to defaults');
      
      // Reset all accessibility settings to defaults (but don't clear localStorage)
      setFontSize(1);
      setHighContrast(false);
      setDarkMode(false); // Always reset to light mode on logout
      setMenuCollapsed(false);
      
      // ✅ IMPORTANT: Clear accessibility localStorage on logout
      localStorage.removeItem('a11y_fontSize');
      localStorage.removeItem('a11y_highContrast');
      localStorage.removeItem('a11y_darkMode');
      localStorage.removeItem('a11y_menuCollapsed');
      
      // Reset document styles immediately
      document.documentElement.style.fontSize = '1rem';
      document.documentElement.classList.remove('high-contrast');
    };

    const handleUserPreferencesSync = (event) => {
      const { user } = event.detail;
      if (user?.preferences?.theme_preference) {
        const userTheme = user.preferences.theme_preference;
        const isDark = userTheme === 'dark';
        if (isDark !== darkMode) {
          console.log(`🎨 [THEME] Syncing with user preference: ${darkMode ? 'dark' : 'light'} → ${userTheme}`);
          setDarkMode(isDark);
          localStorage.setItem('a11y_darkMode', isDark.toString());
        }
      }
    };

    // ✅ NEW: Listen for logout events
    window.addEventListener('auth-logout', handleLogout);
    window.addEventListener('user-preferences-loaded', handleUserPreferencesSync);
    
    return () => {
      window.removeEventListener('auth-logout', handleLogout);
      window.removeEventListener('user-preferences-loaded', handleUserPreferencesSync);
    };
  }, [darkMode]);

  // Add system theme listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't set a preference
      if (!localStorage.getItem('a11y_darkMode')) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const value = {
    // States
    fontSize,
    highContrast,
    darkMode,
    isCollapsed: menuCollapsed,
    
    // Setters
    setFontSize: setFontSizeWithBounds,
    setHighContrast,
    setDarkMode,
    setIsCollapsed: setMenuCollapsed,
    
    // Helper functions
    increaseFontSize,
    decreaseFontSize,
    resetSettings,
    
    // Computed values
    isMinFontSize: fontSize <= 0.8,
    isMaxFontSize: fontSize >= 1.5
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};