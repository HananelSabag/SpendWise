/**
 * WelcomeOnboarding — one screen, once, then never again.
 *
 * It replaces a three-step modal that walked every new account through profile
 * setup and a bank-connection wizard before they had seen anything, and was
 * long enough that the fastest way through it was to dismiss it.
 *
 * This says what SpendWise is for in four lines and gets out of the way.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Check, Loader2, Repeat, Sparkles, Wallet,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useAuth, useTranslation } from '../../stores';
/**
 * What the app is, in three points.
 *
 * This used to be a map keyed by app mode, because the grocery list ran here
 * as a second app with a welcome of its own. One app, one welcome.
 */
const CONTENT = {
  icon: Wallet,
  accent: 'bg-indigo-600',
  points: [
    { icon: Building2, key: 'full.sync' },
    { icon: Repeat, key: 'full.cycle' },
    { icon: Sparkles, key: 'full.insights' },
  ],
};

const SEEN_KEY = 'onboarding_seen';

/**
 * Accounts from the two-app era carry `{ full: true, grocery: true }` here
 * rather than a boolean, so the old shape is still read as "seen".
 */
const hasSeenOnboarding = (user) => {
  const seen = user?.preferences?.[SEEN_KEY];
  return seen === true || (!!seen && typeof seen === 'object' && seen.full === true);
};

const preferencesWithOnboardingSeen = (existing) => ({
  ...(existing || {}),
  [SEEN_KEY]: true,
});

const WelcomeOnboarding = () => {
  const { user, updateProfile } = useAuth();
  const { t, isRTL } = useTranslation('onboarding');
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [replaying, setReplaying] = useState(false);

  const alreadySeen = hasSeenOnboarding(user);

  // The Help Center offers "show me this again". Same screen, forced open.
  useEffect(() => {
    const replay = () => { setDismissed(false); setReplaying(true); };
    window.addEventListener('open-onboarding', replay);
    return () => window.removeEventListener('open-onboarding', replay);
  }, []);

  const finish = useCallback(async (thenGoTo) => {
    // Close first: this is an acknowledgement, not a transaction, and it must
    // never leave the user staring at a spinner if the save is slow.
    setDismissed(true);
    setReplaying(false);
    setSaving(true);
    try {
      await updateProfile({
        preferences: preferencesWithOnboardingSeen(user?.preferences),
      });
    } catch {
      // Non-fatal: worst case they see this screen once more.
    } finally {
      setSaving(false);
      if (thenGoTo) navigate(thenGoTo);
    }
  }, [navigate, updateProfile, user?.preferences]);

  if (!user || dismissed || (alreadySeen && !replaying)) return null;

  const { icon: Icon, accent, points, mirrorIcon } = CONTENT;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      dir={isRTL ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-gray-900/60 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl dark:bg-gray-900"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}
      >
        <span className={cn(
          'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white',
          accent
        )}>
          <Icon className={cn('h-7 w-7', mirrorIcon && 'rtl:-scale-x-100')} strokeWidth={1.75} />
        </span>

        <h1
          id="welcome-title"
          className="text-center text-lg font-extrabold text-gray-900 dark:text-gray-50"
        >
          {t('full.title')}
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('full.subtitle')}
        </p>

        <ul className="mt-5 space-y-3">
          {points.map(({ icon: PointIcon, key }) => (
            <li key={key} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <PointIcon className="h-4 w-4" />
              </span>
              <span className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {t(`points.${key}`)}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => finish(null)}
          disabled={saving}
          className={cn(
            'mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white transition-colors',
            accent, 'hover:opacity-90 disabled:opacity-70'
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {t('start')}
        </button>

        {/* The one genuinely useful thing the old wizard did: SpendWise is empty
            until a bank is connected, so offer that as the next step. */}
        <button
          type="button"
          onClick={() => finish('/bank-sync')}
          disabled={saving}
          className="mt-2 h-11 w-full rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-70 dark:border-gray-700 dark:text-gray-300"
        >
          {t('full.connect')}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeOnboarding;
