// components/common/AccessibilityStatement.jsx
// Modal component for displaying accessibility statement as required by Israeli law
import React from 'react';
import { motion } from 'framer-motion';
import { X, Eye } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const AccessibilityStatement = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US');

  if (!isOpen) return null;

  const features = [
    'screenReader',
    'colorContrast', 
    'textSize',
    'keyboardNav',
    'multiLanguage'
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
            <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Eye className="icon-adaptive-sm text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {t('accessibility.statement.title')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {t('accessibility.statement.lastUpdated', { year: currentYear })}
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
            {/* Introduction */}
            <div className="space-y-2">
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('accessibility.statement.intro')}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                {t('accessibility.statement.features')}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                {features.map((feature) => (
                  <li key={feature} className="leading-relaxed">
                    {t(`accessibility.statement.featuresList.${feature}`)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Level */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                {t('accessibility.statement.level')}
              </h3>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {t('accessibility.statement.levelDescription')}
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                {t('accessibility.statement.contact')}
              </h3>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                {t('accessibility.statement.contactDescription')}
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <p className="text-gray-700 dark:text-gray-300 break-all sm:break-normal">
                    <strong>{t('common.email')}:</strong> spendwise.verification@gmail.com
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>{t('accessibility.statement.phone')}:</strong> 03-9876543
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
              <p>{t('accessibility.compliance')}</p>
              <p>© {currentYear} SpendWise</p>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AccessibilityStatement;