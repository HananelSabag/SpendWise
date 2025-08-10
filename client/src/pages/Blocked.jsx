import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation, useAuth } from '../stores';

const Blocked = () => {
  const { t, currentLanguage } = useTranslation();
  const { logout, getProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const reason = location.state?.reason || null;
  const expiresAt = location.state?.expires_at || null;
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [tick, setTick] = useState(0);

  // Mark blocked session for other subsystems (auth recovery, client handlers)
  try {
    if (typeof window !== 'undefined') {
      window.__SPENDWISE_BLOCKED__ = true;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('blockedSession', '1');
    }
  } catch (_) {}

  // Helper to clear flags and navigate away when unblocked
  const clearBlockedAndNavigate = () => {
    try { localStorage.removeItem('blockedSession'); } catch (_) {}
    if (typeof window !== 'undefined') { window.__SPENDWISE_BLOCKED__ = false; }
    navigate('/', { replace: true });
  };

  // Manual check handler
  const checkUnblocked = async () => {
    const nowTs = Date.now();
    if (checking) return;
    if (nowTs < cooldownUntil) return;
    setChecking(true);
    try {
      const result = await getProfile();
      const user = result?.user;
      const stillBlocked = !!(user?.isBlocked || (Array.isArray(user?.restrictions) && user.restrictions.some(r => r.restriction_type === 'blocked')));
      if (result?.success && !stillBlocked) {
        clearBlockedAndNavigate();
      }
    } catch (_) {
      // ignore
    } finally {
      setChecking(false);
      // Apply cooldown (anti-spam)
      setCooldownUntil(Date.now() + 10000); // 10s cooldown
    }
  };

  // Periodic check while on blocked page
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      checkUnblocked();
    }, 15000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick every second while cooldown active to update label/disabled state
  useEffect(() => {
    if (cooldownUntil > Date.now()) {
      const id = setInterval(() => setTick((v) => v + 1), 1000);
      return () => clearInterval(id);
    }
  }, [cooldownUntil]);

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
          {(() => {
            const msLeft = Math.max(0, cooldownUntil - Date.now());
            const secondsLeft = Math.ceil(msLeft / 1000);
            const isCoolingDown = msLeft > 0;
            return (
              <button
                onClick={checkUnblocked}
                disabled={checking || isCoolingDown}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white"
              >
                {checking
                  ? (currentLanguage === 'he' ? 'בודק…' : 'Checking…')
                  : isCoolingDown
                    ? (currentLanguage === 'he' ? `המתן ${secondsLeft}ש׳` : `Wait ${secondsLeft}s`)
                    : t('common.checkAgain', { fallback: currentLanguage === 'he' ? 'בדוק שוב' : 'Check again' })}
              </button>
            );
          })()}
          <button
            onClick={() => {
              try { localStorage.removeItem('blockedSession'); } catch (_) {}
              if (typeof window !== 'undefined') { window.__SPENDWISE_BLOCKED__ = false; }
              logout(true);
            }}
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


