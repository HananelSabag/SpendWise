/**
 * GroceryLockBanner — who is editing, and when you can take over.
 *
 * The lease is server-authoritative and short, so "Take over" is only offered
 * once it has actually lapsed; showing an always-tappable button that the server
 * would reject would be a lie. Until then the banner counts down, which is also
 * what tells you the other person is still alive on the list.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Loader2, PenLine, Unlock } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

const secondsLeft = (expiresAt) => {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
};

const GroceryLockBanner = ({
  lockedByOther, lockedBy, expiresAt,
  isEditMode, holdsLease,
  onRequestControl, onReleaseControl,
}) => {
  const { t } = useTranslation('grocery');
  const [remaining, setRemaining] = useState(() => secondsLeft(expiresAt));
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    setRemaining(secondsLeft(expiresAt));
    if (!lockedByOther) return undefined;
    const timer = setInterval(() => setRemaining(secondsLeft(expiresAt)), 1000);
    return () => clearInterval(timer);
  }, [expiresAt, lockedByOther]);

  if (lockedByOther) {
    const name = lockedBy?.firstName || lockedBy?.username || t('lock.someone');
    const free = remaining <= 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Eye className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-amber-900 dark:text-amber-200">
            {t('lock.editingNow', { name })}
          </p>
          <p className="truncate text-xs text-amber-700/80 dark:text-amber-300/70">
            {free ? t('lock.freeAgain') : t('lock.readOnlyHint')}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setRequesting(true);
            await onRequestControl();
            setRequesting(false);
          }}
          disabled={!free || requesting}
          className={cn(
            'flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors',
            free
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
          )}
        >
          {requesting
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Unlock className="h-3.5 w-3.5" />}
          {free ? t('lock.requestControl') : `${remaining}s`}
        </button>
      </motion.div>
    );
  }

  // Only surface "you're editing" when the user asked for the mode explicitly —
  // an implicitly-taken lease from tapping a checkbox shouldn't add chrome.
  if (isEditMode && holdsLease) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-500/30 dark:bg-blue-500/10"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
          <PenLine className="h-4 w-4" />
        </span>
        <p className="flex-1 truncate text-sm font-semibold text-blue-900 dark:text-blue-200">
          {t('lock.youAreEditing')}
        </p>
        <button
          type="button"
          onClick={onReleaseControl}
          className="h-9 shrink-0 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
        >
          {t('lock.done')}
        </button>
      </motion.div>
    );
  }

  return null;
};

export default GroceryLockBanner;
