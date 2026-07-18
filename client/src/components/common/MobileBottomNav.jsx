/**
 * MobileBottomNav — native-app-style bottom tab bar + quick-action sheet.
 * Visible only on mobile (hidden on lg+).
 *
 * Bug fixed: navigate() after handleClose() was being cancelled by the
 * BottomSheet's history.back() cleanup. Navigations now run in a
 * setTimeout so history.back() fires first.
 *
 * Sheet sections:
 *   top bar (notifications + theme + lang) →
 *   shopping featured card →
 *   finance 2-col →
 *   tools icon row →
 *   (admin row if applicable)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, CreditCard, User,
  PlusCircle, MinusCircle, Calculator,
  Shield, HelpCircle, Sun, Moon, Globe, ShoppingCart, X, Building2, Wallet, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { useTranslation, useIsAdmin, useTheme, useTranslationStore, useAuth } from '../../stores';
import { useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../../hooks/useToast';
import BottomSheet from './BottomSheet';
import NotificationBell from '../layout/NotificationBell';
import BrandMark from './BrandMark';

// ─── Shopping-only 2-tab nav ──────────────────────────────────────────────────

const ShoppingModeNav = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t }     = useTranslation();
  const isAdmin   = useIsAdmin();

  const tabs = [
    { key: 'shopping', icon: ShoppingCart, label: t('shopping.title') || 'Shopping', href: '/shopping' },
    { key: 'profile',  icon: User,         label: t('nav.profile')    || 'Profile',  href: '/profile'  },
    ...(isAdmin ? [{ key: 'admin', icon: Shield, label: t('nav.admin') || 'Admin', href: '/admin' }] : []),
  ];

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-[100]',
        'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
        'border-t border-gray-200/80 dark:border-gray-700/80',
        'flex items-end justify-around px-8',
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      {tabs.map(tab => {
        const Icon   = tab.icon;
        const active = location.pathname.startsWith(tab.href);
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.href)}
            className="flex flex-col items-center justify-end py-2 flex-1 min-w-0 focus:outline-none transition-colors"
          >
            <div className="relative flex items-center justify-center w-10 h-8">
              {active && (
                <motion.div
                  layoutId="shopping-tab-indicator"
                  className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-purple-600"
                />
              )}
              <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500')} />
            </div>
            <span className={cn('text-[10px] font-medium mt-0.5 truncate max-w-full px-1', active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500')}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

// ─── Tab bar ─────────────────────────────────────────────────────────────────

const FullNav = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { isDark, setTheme } = useTheme();
  const toast    = useToast();
  const isAdmin  = useIsAdmin();
  const { user } = useAuth();

  const displayName = user?.firstName || user?.first_name || user?.name || user?.username
    || user?.email?.split('@')[0] || (currentLanguage === 'he' ? 'משתמש' : 'User');
  const avatarUrl = user?.avatar || user?.profile_picture_url || user?.profilePicture;
  const initial = String(displayName).charAt(0).toUpperCase();

  const { notifications, unreadCount, markAllRead } = useNotifications();

  // Re-run memos when translations finish loading
  const loadedModulesCount = useTranslationStore((s) => Object.keys(s.loadedModules).length);

  // Shopping is a profile-gated mini-app — its invitations live in the shopping
  // page, not the main nav. The FAB badge reflects only non-shopping unread.
  const nonInviteUnread = notifications.filter(n => !String(n.type || '').startsWith('shopping') && !n.is_read).length;
  const totalBadge = nonInviteUnread;
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Settings helpers ──────────────────────────────────────────────────────

  const handleThemeToggle = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    try { sessionStorage.setItem('spendwise-session-theme', next); } catch (_) {}
    toast.success(
      t('toast.settings.themeChangedSession', { theme: t(`common.${next}Theme`) }),
      { duration: 2000 },
    );
  }, [isDark, setTheme, toast, t]);

  const handleLanguageToggle = useCallback(() => {
    const next = currentLanguage === 'en' ? 'he' : 'en';
    setLanguage(next);
    try { sessionStorage.setItem('spendwise-session-language', next); } catch (_) {}
    toast.success(t('toast.settings.languageChangedSession'), { duration: 2000 });
  }, [currentLanguage, setLanguage, toast, t]);

  // Close the sheet (and optionally navigate after the BottomSheet
  // history.back() cleanup has had time to complete).
  const handleClose = useCallback((afterMs) => {
    setMenuOpen(false);
    if (nonInviteUnread > 0) markAllRead();
  }, [nonInviteUnread, markAllRead]);

  // Navigation that waits for history.back() to finish
  const closeAndGo = useCallback((href) => {
    handleClose();
    setTimeout(() => navigate(href), 60);
  }, [handleClose, navigate]);

  // ── Tab definitions ───────────────────────────────────────────────────────

  // Profile moved off the tab bar into the menu sheet below — the salary-to-salary cycle earns
  // its slot far more than an account page does. Bank Sync stays; both are the core of the app.
  const tabs = useMemo(() => [
    { key: 'dashboard',       label: t('nav.dashboard')    || 'Home',         icon: Home,       href: '/',             exact: true },
    { key: 'transactions',    label: t('nav.transactions') || 'Transactions', icon: CreditCard, href: '/transactions' },
    null, // center FAB slot
    { key: 'financial-cycle', label: t('nav.financialCycle') || (currentLanguage === 'he' ? 'מחזור פיננסי' : 'Financial Cycle'), icon: Wallet, href: '/financial-cycle' },
    { key: 'bank-sync',       label: t('bankSync.title')   || 'Bank Sync',    icon: Building2,  href: '/bank-sync' },
  ], [t, currentLanguage, loadedModulesCount]); // eslint-disable-line

  const isActive = useCallback((tab) => {
    if (!tab) return false;
    if (tab.exact) return location.pathname === tab.href;
    return location.pathname.startsWith(tab.href);
  }, [location.pathname]);

  const dispatch = useCallback((event, detail = {}) => {
    try { window.dispatchEvent(new CustomEvent(event, { detail })); } catch (_) {}
  }, []);

  // ── Finance actions ───────────────────────────────────────────────────────

  const financeActions = useMemo(() => [
    {
      key: 'add-expense',
      label: t('transactions.addExpense') || 'Add Expense',
      icon: MinusCircle,
      gradient: 'from-red-500 to-rose-600',
      shadow: 'shadow-red-500/30',
      action: () => { handleClose(); dispatch('transaction:add', { type: 'expense' }); },
    },
    {
      key: 'add-income',
      label: t('transactions.addIncome') || 'Add Income',
      icon: PlusCircle,
      gradient: 'from-emerald-500 to-green-600',
      shadow: 'shadow-emerald-500/30',
      action: () => { handleClose(); dispatch('transaction:add', { type: 'income' }); },
    },
  ], [t, dispatch, handleClose, loadedModulesCount]); // eslint-disable-line

  // ── Tool shortcuts ────────────────────────────────────────────────────────

  const toolActions = useMemo(() => [
    {
      key: 'exchange',
      label: currentLanguage === 'he' ? 'המרת מטבע' : 'Exchange',
      icon: Calculator,
      iconTint: 'text-amber-500 dark:text-amber-400',
      action: () => { handleClose(); dispatch('open-exchange'); },
    },
    {
      key: 'help',
      label: t('nav.help') || 'Help',
      icon: HelpCircle,
      iconTint: 'text-teal-500 dark:text-teal-400',
      action: () => { handleClose(); dispatch('open-help'); },
    },
    ...(isAdmin ? [{
      key: 'admin',
      label: t('nav.admin') || 'Admin',
      icon: Shield,
      iconTint: 'text-yellow-600 dark:text-yellow-400',
      action: () => closeAndGo('/admin'),
    }] : []),
  ], [t, currentLanguage, isAdmin, dispatch, handleClose, closeAndGo, loadedModulesCount]); // eslint-disable-line

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <nav
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-[100]',
          'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
          'border-t border-gray-200/80 dark:border-gray-700/80',
          'flex items-end justify-around px-2',
        )}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        {tabs.map((tab) => {
          if (tab === null) {
            // ── Center FAB ─────────────────────────────────────────────
            return (
              <div key="menu" className="flex flex-col items-center -mt-6 mb-1">
                <motion.button
                  whileTap={{ scale: 0.90 }}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? (t('common.closeMenu') || 'Close') : (t('common.openMenu') || 'Menu')}
                  className={cn(
                    'relative w-16 h-16 rounded-full',
                    'bg-gradient-to-br from-blue-600 to-indigo-600',
                    'shadow-xl shadow-blue-500/50',
                    'flex items-center justify-center',
                    'focus:outline-none transition-all',
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {menuOpen
                      ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                          <X className="w-7 h-7 text-white" strokeWidth={2.5} />
                        </motion.div>
                      : <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                          <BrandMark size="md" className="h-11 w-11 rounded-full shadow-none" />
                        </motion.div>
                    }
                  </AnimatePresence>
                  <AnimatePresence>
                    {totalBadge > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={cn(
                          'absolute -top-1 -right-1',
                          'min-w-[20px] h-5 px-1.5 rounded-full',
                          'bg-red-500 text-white text-[10px] font-bold',
                          'flex items-center justify-center',
                          'border-2 border-white dark:border-gray-900 shadow-md',
                        )}
                      >
                        {totalBadge > 99 ? '99+' : totalBadge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                <span className="mt-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  {t('common.menu') || 'Menu'}
                </span>
              </div>
            );
          }

          const Icon   = tab.icon;
          const active = isActive(tab);
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.href)}
              className="flex flex-col items-center justify-end py-2 flex-1 min-w-0 focus:outline-none transition-colors"
            >
              <div className="relative flex items-center justify-center w-10 h-8">
                {active && (
                  <motion.div
                    layoutId="mobile-tab-indicator"
                    className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-blue-600"
                  />
                )}
                <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500')} />
              </div>
              <span className={cn('text-[10px] font-medium mt-0.5 truncate max-w-full px-1', active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Quick-actions sheet ───────────────────────────────────────────── */}
      <BottomSheet
        isOpen={menuOpen}
        onClose={handleClose}
        title={t('common.quickActions') || 'Quick Actions'}
      >
        <div className="px-4 pt-1 pb-6 space-y-5">

          {/* ── Top bar: notifications + theme + language ─────────────── */}
          <div className="flex items-center justify-between">
            {/* Notification bell */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              {unreadCount > 0 && (
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {unreadCount} {t('nav.unread') || 'unread'}
                </span>
              )}
            </div>

            {/* Compact theme + lang toggles */}
            <div className="flex items-center gap-2">
              {/* Language pill */}
              <button
                onClick={handleLanguageToggle}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold',
                  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
                  'active:scale-95 transition-all',
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                {currentLanguage === 'en' ? 'EN' : 'עב'}
              </button>

              {/* Theme pill */}
              <button
                onClick={handleThemeToggle}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center',
                  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
                  'active:scale-95 transition-all',
                )}
              >
                {isDark
                  ? <Sun  className="w-4 h-4" />
                  : <Moon className="w-4 h-4" />
                }
              </button>
            </div>
          </div>

          {/* ── Account — Profile as a full row, not a cramped tab ────── */}
          <button
            onClick={() => closeAndGo('/profile')}
            className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-start active:scale-[0.98] transition-all dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-bold text-white">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                : (initial || <User className="h-5 w-5" />)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
              {user?.email && <p className="truncate text-xs text-gray-400 dark:text-gray-500">{user.email}</p>}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 rtl:rotate-180" />
          </button>

          {/* ── Finance — 2 col (neutral cards, colored icon chips) ──── */}
          <div className="grid grid-cols-2 gap-3">
            {financeActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.07 + i * 0.03, type: 'spring', stiffness: 400, damping: 30 }}
                  onClick={action.action}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-2xl text-start',
                    'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700',
                    'active:scale-95 transition-all duration-150',
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm',
                    action.gradient,
                  )}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* ── Tools — icon row (quiet squares, tinted icons) ───────── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">
              {t('nav.tools') || 'Tools'}
            </p>
            <div className="flex items-start justify-around">
              {toolActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.025, type: 'spring', stiffness: 400, damping: 30 }}
                    onClick={action.action}
                    className="flex flex-col items-center gap-1.5 flex-1 active:scale-90 transition-transform"
                  >
                    <div className="w-[48px] h-[48px] rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <Icon className={cn('w-5 h-5', action.iconTint || 'text-gray-500 dark:text-gray-400')} strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 text-center leading-tight max-w-[56px]">
                      {action.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

        </div>
      </BottomSheet>
    </>
  );
};

const MobileBottomNav = () => {
  const { user } = useAuth();
  // Also check sessionStorage so the nav switches immediately after
  // HomePickerScreen or Profile saves (before getProfile overwrites Zustand).
  const sessionMode = (() => { try { return sessionStorage.getItem('sw_app_mode'); } catch { return null; } })();
  const isShoppingMode = user?.preferences?.default_home === 'shopping' ||
                         user?.preferences?.shopping_list_as_default_page === true ||
                         sessionMode === 'shopping';
  return isShoppingMode ? <ShoppingModeNav /> : <FullNav />;
};

export default MobileBottomNav;
