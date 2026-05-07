/**
 * HomePickerScreen — one-time screen shown when user hasn't chosen a default home yet.
 * Saves preference to user.preferences.default_home and redirects.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShoppingCart, Check, ChevronLeft } from 'lucide-react';
import { useAuth, useTranslation } from '../../stores';
import { cn } from '../../utils/helpers';

const OPTIONS = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    emoji: '📊',
    titleHe: 'SpendWise מלא',
    titleEn: 'Full SpendWise',
    descHe: 'לוח בקרה, הוצאות, אנליטיקס',
    descEn: 'Dashboard, expenses, analytics',
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    activeBorder: 'border-blue-500 dark:border-blue-400',
    dot: 'bg-blue-500',
    path: '/',
  },
  {
    id: 'shopping',
    icon: ShoppingCart,
    emoji: '🛒',
    titleHe: 'רשימת קניות',
    titleEn: 'Shopping List',
    descHe: 'רק רשימת הקניות',
    descEn: 'Shopping wishlist only',
    gradient: 'from-purple-500 to-pink-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700',
    activeBorder: 'border-purple-500 dark:border-purple-400',
    dot: 'bg-purple-500',
    path: '/shopping',
  },
];

const HomePickerScreen = () => {
  const { user, updateProfile } = useAuth();
  const { isRTL } = useTranslation();
  const navigate = useNavigate();

  const [selected,   setSelected]   = useState('dashboard');
  const [remember,   setRemember]   = useState(true);
  const [isSaving,   setIsSaving]   = useState(false);

  const isHe = isRTL;

  const handleContinue = useCallback(async () => {
    const opt = OPTIONS.find(o => o.id === selected);
    if (!opt) return;

    if (remember) {
      setIsSaving(true);
      try {
        await updateProfile({
          preferences: {
            ...(user?.preferences || {}),
            default_home: selected,
            home_preference_set: true,
            // keep backward-compat flag in sync
            shopping_list_as_default_page: selected === 'shopping',
          },
        });
      } catch (_) {
        // non-fatal — still navigate
      } finally {
        setIsSaving(false);
      }
    }

    // Clear the session redirect flag so the chosen preference takes effect immediately
    try { sessionStorage.removeItem('sw_home_redirect'); } catch (_) {}

    navigate(opt.path, { replace: true });
  }, [selected, remember, user, updateProfile, navigate]);

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex flex-col items-center justify-center p-5 relative overflow-hidden"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="w-96 h-96 rounded-full bg-blue-600/10 absolute -top-48 -end-24 blur-3xl" />
        <div className="w-80 h-80 rounded-full bg-purple-600/10 absolute -bottom-40 -start-20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">

        {/* Logo + title */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/30">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">
            {isHe ? 'ברוכים השבים!' : 'Welcome back!'}
          </h1>
          <p className="text-sm text-gray-400">
            {isHe ? 'על מה תרצה לפתוח את האפליקציה?' : 'What would you like to open first?'}
          </p>
        </div>

        {/* Option cards */}
        <div className="flex flex-col gap-3">
          {OPTIONS.map((opt, i) => {
            const active = selected === opt.id;
            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(opt.id)}
                className={cn(
                  'relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 text-start',
                  active
                    ? cn(opt.bg, opt.activeBorder, 'shadow-lg')
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                  `bg-gradient-to-br ${opt.gradient}`,
                  'shadow-md'
                )}>
                  <opt.icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={cn('font-bold text-sm', active ? 'text-gray-900 dark:text-white' : 'text-white')}>
                    {isHe ? opt.titleHe : opt.titleEn}
                  </p>
                  <p className={cn('text-xs mt-0.5', active ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400')}>
                    {isHe ? opt.descHe : opt.descEn}
                  </p>
                </div>

                {/* Selected indicator */}
                {active && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0', `bg-gradient-to-br ${opt.gradient}`)}
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Remember toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            type="button"
            onClick={() => setRemember(v => !v)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0',
              remember ? 'bg-blue-600' : 'bg-gray-600'
            )}
          >
            <span className={cn(
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              remember ? 'ltr:translate-x-6 rtl:-translate-x-6' : 'ltr:translate-x-1 rtl:-translate-x-1'
            )} />
          </button>
          <span className="text-sm text-gray-300">
            {isHe ? 'זכור את הבחירה שלי' : 'Remember my choice'}
          </span>
        </label>

        {/* Continue button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          disabled={isSaving}
          className={cn(
            'w-full h-13 py-3.5 rounded-2xl font-bold text-white text-base',
            'bg-gradient-to-l from-blue-600 to-indigo-600',
            'shadow-lg shadow-blue-500/30',
            'flex items-center justify-center gap-2',
            'transition-opacity duration-200',
            isSaving && 'opacity-70 cursor-not-allowed'
          )}
        >
          {isSaving
            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <>
                <span>{isHe ? 'המשך' : 'Continue'}</span>
                <ChevronLeft className={cn('w-5 h-5', !isHe && 'rotate-180')} strokeWidth={2.5} />
              </>
          }
        </motion.button>

      </div>
    </div>
  );
};

export default HomePickerScreen;
