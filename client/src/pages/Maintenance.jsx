import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, useAuth } from '../stores';

const Maintenance = () => {
  const { t, isRTL } = useTranslation('common');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    try {
      const to = sessionStorage.getItem('maintenanceReturnTo') || '/';
      // Clear marker so we don't loop
      sessionStorage.removeItem('maintenanceReturnTo');
      navigate(to, { replace: true });
    } catch (_) {
      navigate('/', { replace: true });
    }
  };
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
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('maintenance.thanks', { fallback: 'Thank you for your patience.' })}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {t('common.goBack', { fallback: 'Go back' })}
          </button>
          <button
            onClick={() => logout(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100"
          >
            {t('common.logout', { fallback: 'Log out' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;


