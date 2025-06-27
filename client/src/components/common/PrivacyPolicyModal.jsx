// components/common/PrivacyPolicyModal.jsx
// Minimal privacy policy modal as required by Israeli law
import React from 'react';
import { motion } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  const currentDate = new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US');

  if (!isOpen) return null;

  const sections = [
    'intro',
    'dataCollection', 
    'dataUse',
    'dataProtection',
    'userRights',
    'contact'
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl adaptive-card max-w-md sm:max-w-lg lg:max-w-2xl w-full max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="icon-adaptive-sm text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {t('privacy.title')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {t('privacy.lastUpdated', { date: currentDate })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="icon-adaptive-sm text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 sm:space-y-6">
            {sections.map((section) => (
              <div key={section} className="space-y-2">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                  {t(`privacy.sections.${section}.title`)}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t(`privacy.sections.${section}.content`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
              © {new Date().getFullYear()} SpendWise
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PrivacyPolicyModal; 