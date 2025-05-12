// client/src/context/AccessibilityContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  // States
  const [fontSize, setFontSize] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // טעינת הגדרות בעת הפעלה ראשונית
  useEffect(() => {
    const loadSettings = () => {
      try {
        // טעינת הגדרות נגישות
        const savedSettings = localStorage.getItem('accessibilitySettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          
          if (settings.fontSize !== undefined) {
            setFontSize(settings.fontSize);
            document.documentElement.style.fontSize = `${settings.fontSize}rem`;
          }
          
          if (settings.highContrast !== undefined) {
            setHighContrast(settings.highContrast);
            if (settings.highContrast) {
              document.documentElement.classList.add('high-contrast');
            }
          }
          
          if (settings.darkMode !== undefined) {
            setDarkMode(settings.darkMode);
            if (settings.darkMode) {
              document.documentElement.classList.add('dark');
              document.body.classList.add('dark-mode');
            }
          }
        }
        
        // טעינת מצב מוקטן
        const collapsed = localStorage.getItem('accessibilityCollapsed') === 'true';
        setIsCollapsed(collapsed);
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    };

    loadSettings();
  }, []);

  // שמירת הגדרות כאשר משתנות
  useEffect(() => {
    const settings = { fontSize, highContrast, darkMode };
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }, [fontSize, highContrast, darkMode]);

  // שמירת מצב מוקטן
  useEffect(() => {
    localStorage.setItem('accessibilityCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // החלת שינויים על ה-DOM
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}rem`;
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // פונקציות עזר
  const resetSettings = () => {
    setFontSize(1);
    setHighContrast(false);
    setDarkMode(false);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 0.1, 1.5));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 0.1, 0.8));
  };

  const value = {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    highContrast,
    setHighContrast,
    darkMode,
    setDarkMode,
    isCollapsed,
    setIsCollapsed,
    resetSettings
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};