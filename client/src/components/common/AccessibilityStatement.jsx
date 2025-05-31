// components/common/AccessibilityStatement.jsx
// Modal component for displaying accessibility statement as required by Israeli law
import React from 'react';
import { X, LifeBuoy } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const AccessibilityStatement = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 overflow-hidden"
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-primary-50 dark:bg-primary-900 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary-700 dark:text-primary-100 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5" />
            {isHebrew ? 'הצהרת נגישות' : 'Accessibility Statement'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-primary-100 transition-colors"
            aria-label={isHebrew ? "סגור" : "Close"}
          >
            <X className="h-6 w-6 text-primary-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-gray-700 dark:text-gray-200">
          {/* תקן ישראלי IS 5568 */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isHebrew ? 'עמידה בתקן נגישות' : 'Accessibility Standard Compliance'}
            </h3>
            <p className="mb-4">
              {isHebrew 
                ? 'אתר זה תואם לדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013 ועומד בדרישות תקן ישראלי IS 5568 ברמת AA.'
                : 'This site complies with the Israeli Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adjustments) and meets the requirements of Israeli Standard IS 5568 at AA level.'}
            </p>
          </div>

          {/* רשימת התאמות הנגישות */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isHebrew ? 'אמצעי נגישות באתר' : 'Accessibility Features'}
            </h3>
            <ul className="list-disc list-inside space-y-2">
              <li>{isHebrew ? 'תמיכה בתוכנות קורא מסך' : 'Screen reader support'}</li>
              <li>{isHebrew ? 'ניווט מלא באמצעות מקלדת' : 'Full keyboard navigation'}</li>
              <li>{isHebrew ? 'התאמת גודל טקסט' : 'Text size adjustment'}</li>
              <li>{isHebrew ? 'ניגודיות צבעים גבוהה' : 'High color contrast'}</li>
              <li>{isHebrew ? 'תיאורי תמונות חלופיים' : 'Alternative text for images'}</li>
              <li>{isHebrew ? 'מבנה אתר ברור וקבוע' : 'Clear and consistent site structure'}</li>
            </ul>
          </div>

          {/* פרטי קשר רכז נגישות */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isHebrew ? 'פרטי רכז הנגישות' : 'Accessibility Coordinator'}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="font-medium">
                {isHebrew ? 'שם: ' : 'Name: '} 
                <span>ישראל ישראלי</span>
              </p>
              <p className="font-medium">
                {isHebrew ? 'טלפון: ' : 'Phone: '}
                <a href="tel:+972-3-1234567" className="text-primary-600 dark:text-primary-400">03-1234567</a>
              </p>
              <p className="font-medium">
                {isHebrew ? 'דוא"ל: ' : 'Email: '}
                <a href="mailto:accessibility@spendwise.com" className="text-primary-600 dark:text-primary-400">
                  accessibility@spendwise.com
                </a>
              </p>
              <p className="mt-2 text-sm">
                {isHebrew 
                  ? 'זמן המענה המקסימלי לפניות: עד 48 שעות עבודה'
                  : 'Maximum response time: up to 48 business hours'}
              </p>
            </div>
          </div>

          {/* תאריך עדכון אחרון */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isHebrew 
              ? 'הצהרת הנגישות עודכנה לאחרונה בתאריך: 01.01.2024'
              : 'Last updated: January 1, 2024'}
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 border-t border-gray-200 dark:border-gray-600 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            {isHebrew ? 'סגור' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityStatement;