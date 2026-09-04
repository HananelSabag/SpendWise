/**
 * GroceryModeHeader — the desktop chrome for grocery-only mode.
 *
 * Grocery mode is its own app, not a section of SpendWise: this header carries
 * only what belongs to it — the list, Profile, notifications, theme, language.
 * Which app you open is changed deliberately in Profile → Preferences, so
 * neither mode leaks a shortcut into the other.
 *
 * Appears on lg+ only; the bottom bar covers mobile.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Shield, ShoppingCart, Sun, User } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useTranslation, useTheme, useIsAdmin } from '../../stores';
import NotificationBell from './NotificationBell';

const GroceryModeHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { t: tg } = useTranslation('grocery');
  const { isDark, setTheme } = useTheme();
  const isAdmin = useIsAdmin();

  const linkClass = (path) => cn(
    'flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors',
    location.pathname.startsWith(path)
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
  );

  return (
    <header className="hidden border-b border-gray-100 bg-white/95 backdrop-blur-md lg:block dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <ShoppingCart className="h-4.5 w-4.5 rtl:-scale-x-100" />
        </span>
        <span className="me-4 text-base font-extrabold text-gray-900 dark:text-gray-50">
          {tg('title')}
        </span>

        <nav className="flex items-center gap-1">
          <button type="button" onClick={() => navigate('/grocery')} className={linkClass('/grocery')}>
            <ShoppingCart className="h-4 w-4 rtl:-scale-x-100" />
            {tg('tabs.list')}
          </button>
          <button type="button" onClick={() => navigate('/profile')} className={linkClass('/profile')}>
            <User className="h-4 w-4" />
            {t('nav.profile') || 'Profile'}
          </button>
          {isAdmin && (
            <button type="button" onClick={() => navigate('/admin')} className={linkClass('/admin')}>
              <Shield className="h-4 w-4" />
              {t('nav.admin') || 'Admin'}
            </button>
          )}
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <NotificationBell />

          <button
            type="button"
            onClick={() => setLanguage(currentLanguage === 'en' ? 'he' : 'en')}
            className="flex h-10 min-w-[44px] items-center justify-center rounded-xl px-2 text-sm font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400"
            aria-label={t('nav.language') || 'Language'}
          >
            {currentLanguage === 'en' ? 'EN' : 'עב'}
          </button>

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex h-10 w-11 items-center justify-center rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400"
            aria-label={t('nav.theme') || 'Theme'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

        </div>
      </div>
    </header>
  );
};

export default GroceryModeHeader;
