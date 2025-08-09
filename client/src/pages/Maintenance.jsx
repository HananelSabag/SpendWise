import React from 'react';
import { useTranslation } from '../stores';

const Maintenance = () => {
  const { t, isRTL } = useTranslation('common');
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('maintenance.title', { fallback: 'We’ll be back soon' })}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{t('maintenance.message', { fallback: 'The service is under maintenance. Please try again later.' })}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('maintenance.thanks', { fallback: 'Thank you for your patience.' })}</p>
      </div>
    </div>
  );
};

export default Maintenance;


