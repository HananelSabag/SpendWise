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

export const AccessibilityProvider = ({ children }) => {
  // States with localStorage persistence
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('a11y_fontSize');
    return saved ? parseFloat(saved) : 1;
  });
  
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('a11y_highContrast') === 'true';
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    // Check system preference if no saved preference
    if (!localStorage.getItem('a11y_darkMode')) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return localStorage.getItem('a11y_darkMode') === 'true';
  });
  
  // Fix: Define isCollapsed state properly
  const [menuCollapsed, setMenuCollapsed] = useState(() => {
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

  // Effect to apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('a11y_darkMode', darkMode.toString());
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