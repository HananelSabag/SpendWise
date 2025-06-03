// components/common/AccessibilityMenu.jsx
// Accessibility menu component with full translation support
// Provides accessibility controls like font size, contrast, and dark mode
import React, { useState, useRef, useEffect } from 'react';
import { 
  LifeBuoy, 
  Moon, 
  Sun, 
  ZoomIn, 
  ZoomOut, 
  Type, 
  X,
  RotateCcw,
  Eye,
  ChevronLeft,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAccessibility } from '../../context/AccessibilityContext'; // ✅ Use real context
import AccessibilityStatement from './AccessibilityStatement';

/**
 * AccessibilityMenu Component
 * Provides accessibility controls including font size, contrast, and theme options
 * Fully translated and RTL-aware interface
 */
const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const menuRef = useRef(null);
  const { t, language } = useLanguage();
  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    highContrast,
    setHighContrast,
    darkMode,
    setDarkMode,
    isCollapsed,
    setIsCollapsed,
    resetSettings,
    isMinFontSize,
    isMaxFontSize
  } = useAccessibility(); // ✅ Now using real context
  
  const isHebrew = language === 'he';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Toggle collapsed state
  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Toggle menu visibility
  const toggleMenu = () => setIsOpen(!isOpen);

  // Close menu
  const closeMenu = () => setIsOpen(false);

  // Toggle accessibility statement
  const toggleStatement = () => {
    setShowStatement(!showStatement);
    if (!showStatement) {
      closeMenu();
    }
  };

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ${isCollapsed ? 'right-0' : 'right-6'} bottom-24`} 
      dir={isHebrew ? 'rtl' : 'ltr'} 
      ref={menuRef}
    >
      {/* Collapsed state pull tab */}
      {isCollapsed ? (
        <button
          onClick={toggleCollapsed}
          className="bg-primary-500 text-white p-2 rounded-l-lg shadow-lg hover:bg-primary-600 transition-colors"
          aria-label={t('accessibility.openMenu')}
          title={t('accessibility.openMenu')}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      ) : (
        <div className="flex flex-col items-end">
          {/* Toggle collapsed button */}
          <button
            onClick={toggleCollapsed}
            className="mb-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-1 rounded-full shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label={t('accessibility.hide')}
            title={t('accessibility.hide')}
          >
            <ChevronLeft className="w-4 h-4 transform rotate-180" />
          </button>
          
          {/* Main accessibility toggle button */}
          <button
            onClick={toggleMenu}
            className="p-3 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
            aria-label={t('accessibility.menu')}
            title={t('accessibility.menu')}
          >
            <LifeBuoy className="w-6 h-6" />
          </button>

          {/* Menu panel */}
          {isOpen && (
            <div className="absolute bottom-14 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 w-64 overflow-hidden animate-fadeIn dark:bg-gray-800 dark:border-gray-700">
              {/* Menu header */}
              <div className="bg-primary-100 px-4 py-3 flex items-center justify-between dark:bg-primary-900">
                <h3 className="font-medium text-primary-700 flex items-center gap-2 dark:text-primary-300">
                  <LifeBuoy className="w-5 h-5" />
                  {t('accessibility.title')}
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-300"
                  aria-label={t('accessibility.closeMenu')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu options */}
              <div className="p-4 space-y-4 dark:text-gray-200">
                {/* Font size controls */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('accessibility.textSize')}
                  </p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={decreaseFontSize}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                      aria-label={t('accessibility.decreaseFontSize')}
                      disabled={isMinFontSize} // ✅ Use context values
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                      <Type className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium">
                        {Math.round(fontSize * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={increaseFontSize}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                      aria-label={t('accessibility.increaseFontSize')}
                      disabled={isMaxFontSize} // ✅ Use context values
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* High contrast toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('accessibility.highContrast')}
                    </span>
                  </div>
                  <button
                    onClick={() => setHighContrast(!highContrast)}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      highContrast ? 'bg-primary-500 justify-end' : 'bg-gray-300 justify-start dark:bg-gray-600'
                    }`}
                    aria-pressed={highContrast}
                  >
                    <span className="w-4 h-4 rounded-full bg-white" />
                  </button>
                </div>

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {darkMode ? 
                      <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : 
                      <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    }
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {darkMode ? t('accessibility.darkMode') : t('accessibility.lightMode')}
                    </span>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      darkMode ? 'bg-primary-500 justify-end' : 'bg-gray-300 justify-start dark:bg-gray-600'
                    }`}
                    aria-pressed={darkMode}
                  >
                    <span className="w-4 h-4 rounded-full bg-white" />
                  </button>
                </div>

                {/* Accessibility Statement Button - NEW */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={toggleStatement}
                    className="w-full py-2 px-3 flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg transition-colors"
                  >
                    <span className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      {t('accessibility.accessibilityStatement')}
                    </span>
                    <span className="text-xs bg-primary-100 dark:bg-primary-800 px-2 py-1 rounded">
                      Required
                    </span>
                  </button>
                </div>

                {/* Reset button */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={resetSettings}
                    className="w-full py-2 px-3 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t('accessibility.resetSettings')}
                  </button>
                </div>

                {/* Legal notice - required for compliance */}
                <div className="bg-gray-50 p-3 text-xs text-gray-500 border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400">
                  {t('accessibility.compliance')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Accessibility Statement Modal */}
      <AccessibilityStatement isOpen={showStatement} onClose={() => setShowStatement(false)} />
    </div>
  );
};

export default AccessibilityMenu;