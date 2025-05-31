import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AccessibilityMenu from '../components/common/AccessibilityMenu';
import AccessibilityStatement from '../components/common/AccessibilityStatement';

const AuthLayout = () => {
  const { t, language } = useLanguage();
  const [showAccessibility, setShowAccessibility] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col relative" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span>© {currentYear} SpendWise</span>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => setShowAccessibility(true)}
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {t('accessibility.statement.title')}
          </button>
        </div>
      </footer>

      {/* Accessibility Statement Modal */}
      <AccessibilityStatement 
        isOpen={showAccessibility}
        onClose={() => setShowAccessibility(false)}
      />
    </div>
  );
};

export default AuthLayout;
