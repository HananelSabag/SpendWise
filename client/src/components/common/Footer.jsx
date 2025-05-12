// components/common/Footer.jsx
// Clean footer implementation with full translation support
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AccessibilityStatement from './AccessibilityStatement';

const Footer = () => {
  const { t, language } = useLanguage();
  const currentYear = new Date().getFullYear();
  
  // State for accessibility statement modal
  const [showAccessibilityStatement, setShowAccessibilityStatement] = useState(false);
  // State for support popup
  const [showSupportPopup, setShowSupportPopup] = useState(false);

  // Support popup component - fully translated
  const SupportPopup = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4 dark:text-white">
          {t('footer.supportTitle')}
        </h3>
        <p className="mb-4 dark:text-gray-300">
          {t('footer.supportDescription')}
        </p>
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
          <p className="font-medium dark:text-gray-300">
            {t('auth.email')}: <a href="mailto:example@gmail.com" className="text-primary-600 dark:text-primary-400">example@gmail.com</a>
          </p>
        </div>
        <div className="flex justify-end">
          <button 
            onClick={() => setShowSupportPopup(false)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <footer 
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-auto relative z-20"
        // Force LTR layout regardless of language for logo and copyright
        dir="ltr"
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 flex items-center">
            {/* Logo and copyright */}
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-sm text-white font-bold">S</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              SpendWise &copy; {currentYear} {t('footer.allRightsReserved')}
            </span>
          </div>
          
          {/* Footer links - text direction changes based on language */}
          <div className="flex flex-wrap justify-center gap-4" style={{ direction: language === 'he' ? 'rtl' : 'ltr' }}>
            <button 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" 
              onClick={() => setShowSupportPopup(true)}
            >
              {t('footer.support')}
            </button>
            
            <button 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" 
              onClick={() => window.open('https://github.com/HananelSabag/SpendWise', '_blank')}
            >
              {t('footer.openSource')}
            </button>
            
            {/* Accessibility Statement Button */}
            <button 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" 
              onClick={() => setShowAccessibilityStatement(true)}
              aria-label={t('footer.accessibilityStatement')}
            >
              {t('footer.accessibilityStatement')}
            </button>
          </div>
        </div>
      </footer>

      {/* Support Popup */}
      {showSupportPopup && <SupportPopup />}

      {/* Accessibility Statement Modal */}
      {showAccessibilityStatement && (
        <AccessibilityStatement 
          isOpen={showAccessibilityStatement} 
          onClose={() => setShowAccessibilityStatement(false)} 
        />
      )}
    </>
  );
};

export default Footer;