/**
 * ThemeContext - Database-Driven Theme Management
 * Syncs with user preferences from database, no localStorage for authenticated users
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const ThemeContext = createContext(null);

// Theme configurations
const THEMES = {
  light: {
    name: 'Light',
    class: 'light',
    colors: {
      primary: '#3B82F6',
      background: '#FFFFFF',
      text: '#1F2937'
    }
  },
  dark: {
    name: 'Dark',
    class: 'dark',
    colors: {
      primary: '#60A5FA',
      background: '#111827',
      text: '#F9FAFB'
    }
  },
  system: {
    name: 'System',
    class: null, // Follows system preference
    colors: null
  }
};

export const ThemeProvider = ({ children, initialMode = null }) => {
  const { user, isAuthenticated, updatePreferences } = useAuth();
  
  // Get system theme preference
  const getSystemTheme = useCallback(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);
  
  // Theme state - database driven for authenticated users
  const [theme, setThemeState] = useState(() => {
    // Force initial mode if provided (for development)
    if (initialMode) {
      return initialMode;
    }
    
    // For authenticated users, use user preference
    if (user?.preferences?.theme) {
      return user.preferences.theme;
    }
    
    // For guests, check localStorage fallback
    if (!isAuthenticated) {
      const saved = localStorage.getItem('guestTheme');
      return saved || 'system';
    }
    
    return 'system';
  });
  
  // Actual theme being applied (resolves 'system' to actual theme)
  const [appliedTheme, setAppliedTheme] = useState(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  });
  
  // Sync theme with user preferences
  useEffect(() => {
    if (user?.preferences?.theme && user.preferences.theme !== theme && !initialMode) {
      setThemeState(user.preferences.theme);
    }
  }, [user?.preferences?.theme, initialMode]);
  
  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    Object.values(THEMES).forEach(t => {
      if (t.class) {
        root.classList.remove(t.class);
      }
    });
    
    // Apply new theme
    if (appliedTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = appliedTheme === 'dark' ? '#111827' : '#FFFFFF';
    }
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: appliedTheme }));
  }, [appliedTheme]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setAppliedTheme(e.matches ? 'dark' : 'light');
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);
  
  // Update applied theme when theme changes
  useEffect(() => {
    if (theme === 'system') {
      setAppliedTheme(getSystemTheme());
    } else {
      setAppliedTheme(theme);
    }
  }, [theme, getSystemTheme]);
  
  // Change theme - syncs with database for authenticated users
  const setTheme = useCallback(async (newTheme) => {
    if (!THEMES[newTheme]) {
      console.warn('Invalid theme:', newTheme);
      return;
    }
    
    // Don't change if forced by initialMode
    if (initialMode) {
      console.warn('Theme is locked by initialMode');
      return;
    }
    
    // Optimistically update UI
    setThemeState(newTheme);
    
    if (isAuthenticated) {
      // Update in database
      try {
        await updatePreferences({ theme_preference: newTheme });
        toast.success(`Theme changed to ${THEMES[newTheme].name}`);
      } catch (error) {
        // Revert on error
        setThemeState(theme);
        toast.error('Failed to update theme preference');
      }
    } else {
      // For guests, save to localStorage
      localStorage.setItem('guestTheme', newTheme);
      toast.success(`Theme changed to ${THEMES[newTheme].name}`);
    }
  }, [isAuthenticated, updatePreferences, theme, initialMode]);
  
  // Toggle between themes
  const toggleTheme = useCallback(() => {
    const themes = Object.keys(THEMES);
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);
  
  // Toggle between light and dark only
  const toggleLightDark = useCallback(() => {
    if (appliedTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  }, [appliedTheme, setTheme]);
  
  // Check if current theme is dark
  const isDark = useMemo(() => appliedTheme === 'dark', [appliedTheme]);
  const isLight = useMemo(() => appliedTheme === 'light', [appliedTheme]);
  const isSystem = useMemo(() => theme === 'system', [theme]);
  
  // Get theme colors
  const colors = useMemo(() => {
    const themeConfig = THEMES[appliedTheme] || THEMES.light;
    return themeConfig.colors || THEMES.light.colors;
  }, [appliedTheme]);
  
  // Listen for external theme changes
  useEffect(() => {
    const handleExternalChange = (event) => {
      const newTheme = event.detail;
      if (THEMES[newTheme] && newTheme !== theme && !initialMode) {
        setThemeState(newTheme);
      }
    };
    
    window.addEventListener('theme-preference-changed', handleExternalChange);
    return () => window.removeEventListener('theme-preference-changed', handleExternalChange);
  }, [theme, initialMode]);
  
  // Listen for preferences reset
  useEffect(() => {
    const handleReset = () => {
      if (!initialMode) {
        setThemeState('system');
        if (!isAuthenticated) {
          localStorage.removeItem('guestTheme');
        }
      }
    };
    
    window.addEventListener('preferences-reset', handleReset);
    return () => window.removeEventListener('preferences-reset', handleReset);
  }, [isAuthenticated, initialMode]);
  
  // Preload theme assets
  useEffect(() => {
    // Preload dark mode styles if not currently dark
    if (!isDark) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'style';
      link.href = '/dark-theme.css'; // If you have separate theme CSS
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [isDark]);
  
  const value = useMemo(() => ({
    // Current theme settings
    theme,
    setTheme,
    toggleTheme,
    toggleLightDark,
    
    // Applied theme (resolved system preference)
    appliedTheme,
    isDark,
    isLight,
    isSystem,
    
    // Theme data
    themes: THEMES,
    colors,
    
    // Utility
    getSystemTheme,
    isLocked: !!initialMode
  }), [
    theme,
    setTheme,
    toggleTheme,
    toggleLightDark,
    appliedTheme,
    isDark,
    isLight,
    isSystem,
    colors,
    getSystemTheme,
    initialMode
  ]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Export for external use
export default ThemeContext;