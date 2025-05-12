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
        className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-hidden"
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-primary-50 p-4 flex items-center justify-between border-b border-primary-100">
          <h2 className="text-xl font-semibold text-primary-700 flex items-center gap-2">
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
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div>
            <p className="mb-4">
              {isHebrew 
                ? 'אתר SpendWise מחויב להנגיש את שירותיו לאנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות (התשנ"ח-1998) ותקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.'
                : 'SpendWise is committed to making its website accessible to people with disabilities, in accordance with the Israeli Equal Rights for Persons with Disabilities Law (1998) and the Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adaptations) of 2013.'}
            </p>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                {isHebrew ? 'תכונות נגישות באתר:' : 'Accessibility Features:'}
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{isHebrew ? 'שינוי גודל טקסט' : 'Text size adjustment'}</li>
                <li>{isHebrew ? 'מצב ניגודיות גבוהה' : 'High contrast mode'}</li>
                <li>{isHebrew ? 'מצב כהה (דארק מוד)' : 'Dark mode'}</li>
                <li>{isHebrew ? 'תאימות לקורא מסך' : 'Screen reader compatibility'}</li>
                <li>{isHebrew ? 'ניווט מקלדת מלא' : 'Full keyboard navigation'}</li>
              </ul>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                {isHebrew ? 'דרגת הנגישות:' : 'Accessibility Level:'}
              </h3>
              <p>
                {isHebrew 
                  ? 'אתר זה עומד ברמת תאימות AA לפי הנחיות WCAG 2.1 ועומד בתקן הישראלי (ת"י 5568).'
                  : 'This site conforms to Level AA compliance per WCAG 2.1 guidelines and the Israeli Standard (IS 5568).'}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {isHebrew ? 'יצירת קשר בנושאי נגישות:' : 'Accessibility Contact:'}
              </h3>
              <p>
                {isHebrew 
                  ? 'אם נתקלת בבעיות נגישות או ברצונך לשלוח משוב לגבי הנגישות באתר, אנא צור קשר עם רכז הנגישות שלנו:'
                  : 'If you encounter accessibility issues or wish to provide feedback about accessibility on our site, please contact our accessibility coordinator:'}
              </p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">
                  {isHebrew ? 'אימייל:' : 'Email:'} <a href="mailto:accessibility@spendwise.com" className="text-primary-600">accessibility@spendwise.com</a>
                </p>
                <p className="font-medium">
                  {isHebrew ? 'טלפון:' : 'Phone:'} <a href="tel:+972123456789" className="text-primary-600">+972-12-345-6789</a>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
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