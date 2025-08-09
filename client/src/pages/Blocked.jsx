import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation, useAuth } from '../stores';

const Blocked = () => {
  const { t, currentLanguage } = useTranslation();
  const { logout } = useAuth();
  const location = useLocation();
  const reason = location.state?.reason || null;
  const expiresAt = location.state?.expires_at || null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3l-6.93-12a2 2 0 00-3.48 0l-6.93 12a2 2 0 001.74 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('pages.blocked.title', { fallback: currentLanguage === 'he' ? 'החשבון שלך נחסם' : 'Your account is blocked' })}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t('pages.blocked.description', { fallback: currentLanguage === 'he' ? 'החשבון שלך נחסם באופן זמני. אם זו טעות, פנה לתמיכה.' : 'Your account has been temporarily blocked. If this is a mistake, please contact support.' })}
        </p>

        {reason && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-left mb-6">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
              {t('pages.blocked.reasonTitle', { fallback: currentLanguage === 'he' ? 'סיבה' : 'Reason' })}
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300 break-words">{reason}</p>
            {expiresAt && (
              <p className="text-xs text-orange-600 dark:text-orange-300 mt-2">
                {t('pages.blocked.expiresAt', { date: new Date(expiresAt).toLocaleString(), fallback: currentLanguage === 'he' ? `תוקף החסימה עד: ${new Date(expiresAt).toLocaleString()}` : `Block active until: ${new Date(expiresAt).toLocaleString()}` })}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => logout(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100"
          >
            {t('pages.blocked.logout', { fallback: currentLanguage === 'he' ? 'התנתק' : 'Log out' })}
          </button>
          <a
            href="mailto:support@spendwise.app"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
          >
            {t('pages.blocked.contact', { fallback: currentLanguage === 'he' ? 'צור קשר עם התמיכה' : 'Contact Support' })}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Blocked;


