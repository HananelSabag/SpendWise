import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AccessibilityStatement from '../common/AccessibilityStatement';

const AuthFooter = () => {
  const { t, language } = useLanguage();
  const [showAccessibility, setShowAccessibility] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 flex-wrap" dir={language === 'he' ? 'rtl' : 'ltr'}>
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

      <AccessibilityStatement 
        isOpen={showAccessibility}
        onClose={() => setShowAccessibility(false)}
      />
    </>
  );
};

export default AuthFooter;
