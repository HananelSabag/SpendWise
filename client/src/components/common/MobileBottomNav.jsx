/**
 * MobileBottomNav — native-app-style bottom tab bar + quick-action sheet.
 * Visible only on mobile (hidden on lg+).
 * Center FAB shows notification badge; sheet has sections:
 *   pendingInvitations → shopping featured → finance 2-col → tools 3-col → settings
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, CreditCard, Plus, BarChart3, User,
  PlusCircle, MinusCircle, Tag, RepeatIcon, Calculator,
  Shield, HelpCircle, Sun, Moon, Globe, ShoppingCart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { useTranslation, useIsAdmin, useTheme, useNotifications, useTranslationStore } from '../../stores';
import { useToast } from '../../hooks/useToast';
import { useShoppingShare } from '../../hooks/useShoppingShare';
import BottomSheet from './BottomSheet';
import NotificationBell from '../layout/NotificationBell';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { isDark, setTheme } = useTheme();
  const toast = useToast();
  const isAdmin = useIsAdmin();

  const { unreadCount, markAllRead } = useNotifications();
  const { pendingInvitationsCount } = useShoppingShare();
  // Subscribe to loadedModules so useMemos re-run when translations finish loading
  // (t() is a stable reference that doesn't change identity on translation load)
  const loadedModulesCount = useTranslationStore((s) => Object.keys(s.loadedModules).length);

  const totalBadge = unreadCount + pendingInvitationsCount;

  const [menuOpen, setMenuOpen] = useState(false);

  const handleThemeToggle = useCallback(() => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    try { sessionStorage.setItem('spendwise-session-theme', newTheme); } catch (_) {}
    toast.success(t('toast.settings.themeChangedSession', { theme: t(`common.${newTheme}Theme`) }), { duration: 2000 });
  }, [isDark, setTheme, toast, t]);

  const handleLanguageToggle = useCallback(() => {
    const newLang = currentLanguage === 'en' ? 'he' : 'en';
    setLanguage(newLang);
    try { sessionStorage.setItem('spendwise-session-language', newLang); } catch (_) {}
    toast.success(t('toast.settings.languageChangedSession'), { duration: 2000 });
  }, [currentLanguage, setLanguage, toast, t]);

  const handleClose = useCallback(() => {
    setMenuOpen(false);
    if (unreadCount > 0) markAllRead();
  }, [unreadCount, markAllRead]);

  const tabs = useMemo(() => [
    { key: 'dashboard',    label: t('nav.dashboard')    || 'Home',         icon: Home,       href: '/',             exact: true },
    { key: 'transactions', label: t('nav.transactions') || 'Transactions', icon: CreditCard, href: '/transactions' },
    null, // center FAB slot
    { key: 'analytics',   label: t('nav.analytics')    || 'Analytics',    icon: BarChart3,  href: '/analytics' },
    { key: 'profile',     label: t('nav.profile')      || 'Profile',      icon: User,       href: '/profile',      isProfile: true },
  ], [t, loadedModulesCount]);

  const isActive = useCallback(
    (tab) => {
      if (!tab) return false;
      if (tab.exact) return location.pathname === tab.href;
      return location.pathname.startsWith(tab.href);
    },
    [location.pathname]
  );

  const dispatch = useCallback((event, detail = {}) => {
    try { window.dispatchEvent(new CustomEvent(event, { detail })); } catch (_) {}
  }, []);

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
  ], [t, dispatch, handleClose, loadedModulesCount]);

  const toolActions = useMemo(() => [
    {
      key: 'categories',
      label: t('nav.categories') || 'Categories',
      icon: Tag,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      action: () => { handleClose(); dispatch('open-categories'); },
    },
    {
      key: 'recurring',
      label: t('nav.recurring') || 'Recurring',
      icon: RepeatIcon,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/30',
      action: () => { handleClose(); dispatch('open-recurring'); },
    },
    {
      key: 'exchange',
      label: t('nav.exchange') || 'Exchange',
      icon: Calculator,
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'shadow-amber-500/30',
      action: () => { handleClose(); dispatch('open-exchange'); },
    },
    {
      key: 'help',
      label: t('nav.help') || 'Help',
      icon: HelpCircle,
      gradient: 'from-teal-500 to-cyan-600',
      shadow: 'shadow-teal-500/30',
      action: () => { handleClose(); dispatch('open-onboarding'); },
    },
    ...(isAdmin ? [{
      key: 'admin',
      label: t('nav.admin') || 'Admin',
      icon: Shield,
      gradient: 'from-yellow-500 to-amber-600',
      shadow: 'shadow-yellow-500/30',
      action: () => { handleClose(); navigate('/admin'); },
    }] : []),
  ], [t, isAdmin, dispatch, handleClose, navigate, loadedModulesCount]);

  return (
    <>
      <nav
        className={cn(
          'lg:hidden',
          'fixed bottom-0 left-0 right-0 z-[100]',
          'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
          'border-t border-gray-200/80 dark:border-gray-700/80',
          'flex items-end justify-around',
          'px-2'
        )}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        {tabs.map((tab) => {
          if (tab === null) {
            return (
              <div key="menu" className="flex flex-col items-center -mt-6 mb-1">
                <motion.button
                  whileTap={{ scale: 0.90 }}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? (t('common.closeMenu') || 'Close menu') : (t('common.openMenu') || 'Open menu')}
                  className={cn(
                    'relative w-16 h-16 rounded-full',
                    'bg-gradient-to-br from-blue-600 to-indigo-600',
                    'shadow-xl shadow-blue-500/50',
                    'flex items-center justify-center',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'transition-all'
                  )}
                >
                  <motion.div animate={{ rotate: menuOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                    <Plus className="w-8 h-8 text-white" />
                  </motion.div>
                  {/* Notification badge */}
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
                          'border-2 border-white dark:border-gray-900',
                          'shadow-md'
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

          const Icon = tab.icon;
          const active = isActive(tab);

          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.href)}
              className={cn(
                'flex flex-col items-center justify-end py-2 flex-1 min-w-0',
                'focus:outline-none transition-colors'
              )}
            >
              <div className="relative flex items-center justify-center w-10 h-8">
                {active && (
                  <motion.div
                    layoutId="mobile-tab-indicator"
                    className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-blue-600"
                  />
                )}
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium mt-0.5 truncate max-w-full px-1',
                  active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Quick-actions BottomSheet */}
      <BottomSheet
        isOpen={menuOpen}
        onClose={handleClose}
        title={t('common.quickActions') || 'Quick Actions'}
      >
        <div className="space-y-4 pb-2">

          {/* ── Notifications row ────────────────────────────────────── */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('nav.notifications') || 'Notifications'}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
            <NotificationBell />
          </div>

          {/* ── Shopping — featured full-width card ─────────────────── */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03, type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => { handleClose(); navigate('/shopping'); }}
            className={cn(
              'w-full flex items-center gap-4 px-5 py-4 rounded-2xl',
              'bg-gradient-to-r from-emerald-500 to-teal-600',
              'shadow-lg shadow-emerald-500/30',
              'active:scale-[0.98] transition-all duration-150'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-7 h-7 text-white" strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-start min-w-0">
              <p className="text-base font-bold text-white leading-tight">
                {t('shopping.title') || 'Shopping List'}
              </p>
              <p className="text-xs text-white/75 mt-0.5">
                {t('shopping.manageList') || 'Manage your shared lists'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.button>

          {/* ── Finance actions — 2-col hero cards ──────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {financeActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.02, type: 'spring', stiffness: 400, damping: 30 }}
                  onClick={action.action}
                  className={cn(
                    'flex flex-col items-center gap-3 py-5 px-3 rounded-2xl',
                    'bg-gradient-to-br', action.gradient,
                    'shadow-lg', action.shadow,
                    'active:scale-95 transition-all duration-150'
                  )}
                >
                  <Icon className="w-8 h-8 text-white" strokeWidth={1.75} />
                  <span className="text-sm font-bold text-white text-center leading-tight">
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* ── Tools — 3-col grid ───────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2.5">
            {toolActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.10 + i * 0.02, type: 'spring', stiffness: 400, damping: 30 }}
                  onClick={action.action}
                  className={cn(
                    'flex flex-col items-center gap-2 py-4 px-2 rounded-2xl',
                    'bg-white dark:bg-gray-800',
                    'border border-gray-100 dark:border-gray-700/60',
                    'shadow-sm hover:shadow-md',
                    'active:scale-95 transition-all duration-150'
                  )}
                >
                  <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center shadow-md',
                    'bg-gradient-to-br', action.gradient, action.shadow
                  )}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={1.75} />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 text-center leading-tight">
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* ── Settings row ─────────────────────────────────────────── */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleThemeToggle}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 rounded-2xl',
                  'bg-white dark:bg-gray-800',
                  'border border-gray-100 dark:border-gray-700/60',
                  'shadow-sm active:scale-95 transition-all duration-150'
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-600 shadow-md">
                  {isDark
                    ? <Sun className="w-5 h-5 text-white" strokeWidth={1.75} />
                    : <Moon className="w-5 h-5 text-white" strokeWidth={1.75} />
                  }
                </div>
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                  {isDark ? (t('common.lightMode') || 'Light') : (t('common.darkMode') || 'Dark')}
                </span>
              </button>

              <button
                onClick={handleLanguageToggle}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 rounded-2xl',
                  'bg-white dark:bg-gray-800',
                  'border border-gray-100 dark:border-gray-700/60',
                  'shadow-sm active:scale-95 transition-all duration-150'
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-400 to-blue-600 shadow-md">
                  <Globe className="w-5 h-5 text-white" strokeWidth={1.75} />
                </div>
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                  {currentLanguage === 'en' ? t('common.hebrew') : t('common.english')}
                </span>
              </button>
            </div>
          </div>

        </div>
      </BottomSheet>
    </>
  );
};

export default MobileBottomNav;
