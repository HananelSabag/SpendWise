// client/src/hooks/useLoadAccessibilitySettings.js
// Hook to ensure accessibility settings are loaded on every page
import { useEffect } from 'react';

export const useLoadAccessibilitySettings = () => {
  useEffect(() => {
    // Ensure accessibility settings are loaded and applied on component mount
    const loadAndApplySettings = () => {
      try {
        const savedSettings = localStorage.getItem('accessibilitySettings');
        
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          
          // Apply font size
          if (settings.fontSize) {
            document.documentElement.style.fontSize = `${settings.fontSize}rem`;
          }
          
          // Apply dark mode
          if (settings.darkMode) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark-mode');
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark-mode');
          }
          
          // Apply high contrast
          if (settings.highContrast) {
            document.documentElement.classList.add('high-contrast');
          } else {
            document.documentElement.classList.remove('high-contrast');
          }
        }
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    };
    
    // Apply settings immediately
    loadAndApplySettings();
    
    // Also apply after a small delay to ensure DOM is ready
    const timeoutId = setTimeout(loadAndApplySettings, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);
};