/**
 * HomePickerScreen — the one-time first-run question: which of the two apps
 * does this account open as?
 *
 * It is the very first screen a new account sees, which is exactly why its copy
 * used to be wrong: every string was hard-coded as `isRTL ? 'עברית' : 'English'`
 * rather than translated, and `isRTL` (a direction) was being used to mean "is
 * Hebrew" (a language). Both now come from the same place as the rest of the
 * app — `translations/{en,he}/onboarding.js` under `picker`.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { useAuth, useTranslation } from '../../stores';
import { cn } from '../../utils/helpers';
import { APP_MODE, preferencesForMode, setModeOverride } from '../../utils/appMode';

const OPTIONS = [
  {
    id: 'dashboard',
    mode: APP_MODE.FULL,
    key: 'full',
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    activeBorder: 'border-blue-500 dark:border-blue-400',
    path: '/',
  },
  {
    id: 'grocery',
    mode: APP_MODE.GROCERY,
    key: 'grocery',
    icon: ShoppingCart,
    // A cart is drawn handle-left; in Hebrew it has to face the other way.
    mirrorIcon: true,
    gradient: 'from-emerald-500 to-teal-600',
    activeBorder: 'border-emerald-500 dark:border-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    path: '/grocery',
  },
];

const HomePickerScreen = () => {
  const { user, updateProfile } = useAuth();
  const { t, isRTL } = useTranslation('onboarding');
  const navigate = useNavigate();

  const [selected, setSelected] = useState('dashboard');
  const [remember, setRemember] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = useCallback(async () => {
    const option = OPTIONS.find((entry) => entry.id === selected);
    if (!option) return;

    // Apply the choice to this tab before any async work, so the shell switches
    // instantly instead of waiting on the profile cache to catch up.
    try {
      sessionStorage.setItem('sw_picker_done', '1');
      sessionStorage.removeItem('sw_home_redirect');
    } catch (_) { /* private mode — the in-memory choice still applies */ }
    setModeOverride(option.mode);

    if (remember) {
      setIsSaving(true);
      try {
        await updateProfile({ preferences: preferencesForMode(user?.preferences, option.mode) });
      } catch (_) {
        // Non-fatal — the override keeps this session on the right screen.
      } finally {
        setIsSaving(false);
      }
    }

    navigate(option.path, { replace: true });
  }, [selected, remember, user, updateProfile, navigate]);

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 p-5"
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-48 -end-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -start-20 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">

        {/* Logo + title */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="mb-1 text-2xl font-extrabold text-white">{t('picker.title')}</h1>
          <p className="text-sm text-gray-400">{t('picker.subtitle')}</p>
        </div>

        {/* Option cards */}
        <div className="flex flex-col gap-3">
          {OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const active = selected === option.id;
            return (
              <motion.button
                key={option.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(option.id)}
                aria-pressed={active}
                className={cn(
                  'relative flex items-center gap-4 rounded-2xl border-2 p-4 text-start transition-all duration-150',
                  active
                    ? cn(option.bg, option.activeBorder, 'shadow-lg')
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                )}
              >
                <div className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md',
                  'bg-gradient-to-br', option.gradient
                )}>
                  <Icon
                    className={cn('h-6 w-6 text-white', option.mirrorIcon && 'rtl:-scale-x-100')}
                    strokeWidth={2}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm font-bold', active ? 'text-gray-900 dark:text-white' : 'text-white')}>
                    {t(`picker.${option.key}.title`)}
                  </p>
                  <p className={cn('mt-0.5 text-xs', active ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400')}>
                    {t(`picker.${option.key}.description`)}
                  </p>
                </div>

                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br',
                      option.gradient
                    )}
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Remember toggle */}
        <label className="flex cursor-pointer select-none items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={remember}
            onClick={() => setRemember((value) => !value)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
              remember ? 'bg-blue-600' : 'bg-gray-600'
            )}
          >
            {/* `translate-x` is geometry, not text flow — RTL needs the mirror
                written out, because `dir` alone does not flip a transform. */}
            <span className={cn(
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              remember
                ? 'ltr:translate-x-6 rtl:-translate-x-6'
                : 'ltr:translate-x-1 rtl:-translate-x-1'
            )} />
          </button>
          <span className="text-sm text-gray-300">{t('picker.remember')}</span>
        </label>

        {/* Continue */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          disabled={isSaving}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold text-white',
            'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30',
            'transition-opacity duration-200',
            isSaving && 'cursor-not-allowed opacity-70'
          )}
        >
          {isSaving
            ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            : (
              <>
                <span>{t('picker.continue')}</span>
                <ArrowRight className="h-5 w-5 rtl:-scale-x-100" strokeWidth={2.5} />
              </>
            )}
        </motion.button>

      </div>
    </div>
  );
};

export default HomePickerScreen;
