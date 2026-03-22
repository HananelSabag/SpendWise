/**
 * MobileBottomNav — native-app-style bottom tab bar for mobile.
 * Visible only on mobile (hidden on lg+).
 * Tabs: Dashboard | Transactions | [+] FAB | Analytics | Profile
 * The center "+" button dispatches the same event as FloatingAddTransactionButton.
 */

import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CreditCard, Plus, BarChart3, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { useTranslation } from '../../stores';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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
    // Center slot — FAB placeholder (rendered separately below)
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

  const handleAddPress = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('transaction:add'));
    } catch (_) {}
  }, []);

  return (
    <nav
      className={cn(
        'lg:hidden',
        'fixed bottom-0 left-0 right-0 z-[100]',
        'bg-white dark:bg-gray-900',
        'border-t border-gray-200 dark:border-gray-700',
        'flex items-end justify-around',
        'px-2',
        // Safe area for iPhone notch
        'pb-safe'
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      {tabs.map((tab, index) => {
        // Center slot — FAB
        if (tab === null) {
          return (
            <div key="fab" className="flex flex-col items-center -mt-5 mb-1">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleAddPress}
                aria-label={t('transactions.addTransaction') || 'Add Transaction'}
                className={cn(
                  'w-14 h-14 rounded-full',
                  'bg-gradient-to-br from-blue-600 to-indigo-600',
                  'shadow-lg shadow-blue-500/40',
                  'flex items-center justify-center',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                )}
              >
                <Plus className="w-7 h-7 text-white" />
              </motion.button>
              <span className="mt-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                {t('common.add') || 'Add'}
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
              'focus:outline-none',
              'transition-colors'
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
  );
};

export default MobileBottomNav;
