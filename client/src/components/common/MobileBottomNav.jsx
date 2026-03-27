/**
 * MobileBottomNav — native-app-style bottom tab bar for mobile.
 * Visible only on mobile (hidden on lg+).
 * Tabs: Dashboard | Transactions | [⋯ menu] | Analytics | Profile
 * Center button opens a BottomSheet with all quick actions.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, CreditCard, Plus, BarChart3, User,
  PlusCircle, MinusCircle, Tag, RepeatIcon, Calculator, Shield, X, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { useTranslation, useIsAdmin } from '../../stores';
import BottomSheet from './BottomSheet';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();

  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    {
      key: 'dashboard',
      label: t('nav.dashboard') || 'Home',
      icon: Home,
      href: '/',
      exact: true,
    },
    {
      key: 'transactions',
      label: t('nav.transactions') || 'Transactions',
      icon: CreditCard,
      href: '/transactions',
    },
    // Center slot — menu (rendered separately below)
    null,
    {
      key: 'analytics',
      label: t('nav.analytics') || 'Analytics',
      icon: BarChart3,
      href: '/analytics',
    },
    {
      key: 'profile',
      label: t('nav.profile') || 'Profile',
      icon: User,
      href: '/profile',
    },
  ];

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

  const menuActions = [
    {
      key: 'add-expense',
      label: t('transactions.addExpense') || 'Add Expense',
      icon: MinusCircle,
      gradient: 'from-red-400 to-rose-600',
      shadow: 'shadow-red-400/40',
      action: () => { setMenuOpen(false); dispatch('transaction:add', { type: 'expense' }); },
    },
    {
      key: 'add-income',
      label: t('transactions.addIncome') || 'Add Income',
      icon: PlusCircle,
      gradient: 'from-emerald-400 to-green-600',
      shadow: 'shadow-emerald-400/40',
      action: () => { setMenuOpen(false); dispatch('transaction:add', { type: 'income' }); },
    },
    {
      key: 'categories',
      label: t('nav.categories') || 'Categories',
      icon: Tag,
      gradient: 'from-blue-400 to-indigo-600',
      shadow: 'shadow-blue-400/40',
      action: () => { setMenuOpen(false); dispatch('open-categories'); },
    },
    {
      key: 'recurring',
      label: t('nav.recurring') || 'Recurring',
      icon: RepeatIcon,
      gradient: 'from-violet-400 to-purple-600',
      shadow: 'shadow-violet-400/40',
      action: () => { setMenuOpen(false); dispatch('open-recurring'); },
    },
    {
      key: 'exchange',
      label: t('nav.exchange') || 'Exchange',
      icon: Calculator,
      gradient: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-400/40',
      action: () => { setMenuOpen(false); dispatch('open-exchange'); },
    },
    {
      key: 'help',
      label: t('nav.help') || 'Help & Guide',
      icon: HelpCircle,
      gradient: 'from-teal-400 to-cyan-600',
      shadow: 'shadow-teal-400/40',
      action: () => { setMenuOpen(false); dispatch('open-onboarding'); },
    },
    ...(isAdmin ? [{
      key: 'admin',
      label: t('nav.admin') || 'Admin Panel',
      icon: Shield,
      gradient: 'from-yellow-400 to-amber-600',
      shadow: 'shadow-yellow-400/40',
      action: () => { setMenuOpen(false); navigate('/admin'); },
    }] : []),
  ];

  return (
    <>
      <nav
        className={cn(
          'lg:hidden',
          'fixed bottom-0 left-0 right-0 z-[100]',
          'bg-white dark:bg-gray-900',
          'border-t border-gray-200 dark:border-gray-700',
          'flex items-end justify-around',
          'px-2'
        )}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        {tabs.map((tab, index) => {
          // Center slot — menu button
          if (tab === null) {
            return (
              <div key="menu" className="flex flex-col items-center -mt-6 mb-1">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? (t('common.closeMenu') || 'Close menu') : (t('common.openMenu') || 'Open menu')}
                  className={cn(
                    'w-16 h-16 rounded-full',
                    'bg-gradient-to-br from-blue-600 to-indigo-600',
                    'shadow-xl shadow-blue-500/50',
                    'flex items-center justify-center',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'transition-all'
                  )}
                >
                  <motion.div
                    animate={{ rotate: menuOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus className="w-8 h-8 text-white" />
                  </motion.div>
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
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium mt-0.5 truncate max-w-full px-1',
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
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
        onClose={() => setMenuOpen(false)}
        title={t('common.quickActions') || 'Quick Actions'}
      >
        <div className="grid grid-cols-3 gap-3 pb-4">
          {menuActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.key}
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 360, damping: 28 }}
                onClick={action.action}
                className={cn(
                  'flex flex-col items-center gap-2.5 py-5 px-2 rounded-2xl',
                  'bg-white dark:bg-gray-800',
                  'border border-gray-100 dark:border-gray-700/60',
                  'shadow-sm hover:shadow-md',
                  'active:scale-95 transition-all duration-150'
                )}
              >
                {/* Gradient icon circle */}
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                  'bg-gradient-to-br',
                  action.gradient,
                  action.shadow
                )}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
                </div>
                {/* Label */}
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 text-center leading-tight px-1">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
};

export default MobileBottomNav;
