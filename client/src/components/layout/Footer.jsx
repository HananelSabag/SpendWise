// components/layout/Footer.jsx
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AccessibilityStatement from '../common/AccessibilityStatement';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const Footer = () => {
  const { t, language } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  return (
    <>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          {/* Logo & Copyright */}
          <div className="mb-4 md:mb-0 flex items-center" dir="ltr">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-sm text-white font-bold">S</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300">
              SpendWise &copy; {currentYear} {t('footer.allRightsReserved')}
            </span>
          </div>
          
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-4" style={{ direction: language === 'he' ? 'rtl' : 'ltr' }}>
            <button 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" 
              onClick={() => setShowSupport(true)}
            >
              {t('footer.support')}
            </button>
            
            <button 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" 
              onClick={() => window.open('https://github.com/HananelSabag/SpendWise', '_blank')}
            >
              {t('footer.openSource')}
            </button>
            
            <button 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" 
              onClick={() => setShowAccessibility(true)}
            >
              {t('footer.accessibilityStatement')}
            </button>
          </div>
        </div>
      </footer>

      {/* Support Modal */}
      <Modal
        isOpen={showSupport}
        onClose={() => setShowSupport(false)}
        title={t('footer.supportTitle')}
        size="small"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {t('footer.supportDescription')}
          </p>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="font-medium dark:text-gray-300">
              {t('common.email')}: <a href="mailto:support@spendwise.com" className="text-primary-600 dark:text-primary-400">support@spendwise.com</a>
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setShowSupport(false)}>
            {t('common.close')}
          </Button>
        </div>
      </Modal>

      {/* Accessibility Statement */}
      <AccessibilityStatement 
        isOpen={showAccessibility} 
        onClose={() => setShowAccessibility(false)} 
      />
    </>
  );
};

export default Footer;