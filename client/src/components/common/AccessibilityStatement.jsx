// components/common/AccessibilityStatement.jsx
// Modal component for displaying accessibility statement as required by Israeli law
import React from 'react';
import { motion } from 'framer-motion';
import { X, LifeBuoy } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const AccessibilityStatement = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  const currentYear = new Date().getFullYear();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('accessibility.statement.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>{t('accessibility.statement.intro')}</p>
          
          <h3 className="font-semibold text-lg mt-4">{t('accessibility.statement.features')}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isRTL ? 'תאימות לקוראי מסך' : 'Screen reader compatibility'}</li>
            <li>{isRTL ? 'ניגודיות צבעים מתכווננת' : 'Adjustable color contrast'}</li>
            <li>{isRTL ? 'אפשרות להגדלת טקסט' : 'Text size adjustment'}</li>
            <li>{isRTL ? 'תמיכה בניווט מקלדת' : 'Keyboard navigation support'}</li>
            <li>{isRTL ? 'תמיכה בשפות עברית ואנגלית' : 'Hebrew and English language support'}</li>
          </ul>
          
          <h3 className="font-semibold text-lg mt-4">{t('accessibility.statement.level')}</h3>
          <p>{t('accessibility.statement.levelDescription')}</p>
          
          <h3 className="font-semibold text-lg mt-4">{t('accessibility.statement.contact')}</h3>
          <p>{t('accessibility.statement.contactDescription')}</p>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mt-2">
            <p><strong>Email:</strong> accessibility@spendwise.com</p>
            <p><strong>{t('accessibility.statement.phone')}:</strong> 03-1234567</p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <p>© {currentYear} SpendWise</p>
            <p>{t('accessibility.compliance')}</p>
            <p>עדכון אחרון: 01/01/{currentYear}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AccessibilityStatement;