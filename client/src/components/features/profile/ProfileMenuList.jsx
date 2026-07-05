import React from 'react';
import { ShoppingCart, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';
import { Avatar } from '../../ui';
import { cn } from '../../../utils/helpers';
import { TABS, MENU_META, MENU_FALLBACKS } from './ProfileTabsConfig';

export const ProfileMenuList = ({ user, onSelect, onLogout, onShopping, t, tc, isRTL }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
    {/* Hero card */}
    <div className="bg-white dark:bg-gray-900 px-5 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-indigo-100 dark:ring-indigo-900/40 shrink-0 shadow-sm">
          <Avatar
            src={user?.avatar}
            alt={user?.name || user?.email}
            size="xl"
            fallback={(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            className="w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-gray-900 dark:text-white truncate">
            {user?.name || user?.email?.split('@')[0]}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
        </div>
      </div>
    </div>

    {/* Section list */}
    <div className="px-4 pt-5 space-y-2.5">
      {TABS.map(tab => {
        const Icon  = tab.icon;
        const meta  = MENU_META[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={cn(
              'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl',
              'bg-white dark:bg-gray-900',
              'border border-gray-100 dark:border-gray-800',
              'shadow-sm active:scale-[0.98] transition-all duration-150',
              'text-start cursor-pointer'
            )}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-sm', meta.color)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t(tab.labelKey) || tab.id}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                {t(meta.subtitleKey) || MENU_FALLBACKS[tab.id]}
              </p>
            </div>
            {isRTL
              ? <ChevronLeft  className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
              : <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
          </button>
        );
      })}

      {/* Shopping — profile-gated mini-app (not in the main nav) */}
      <button
        onClick={onShopping}
        className={cn(
          'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl',
          'bg-white dark:bg-gray-900',
          'border border-gray-100 dark:border-gray-800',
          'shadow-sm active:scale-[0.98] transition-all duration-150',
          'text-start cursor-pointer'
        )}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('shoppingEntry.title') || 'Shopping'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {t('shoppingEntry.subtitle') || 'Your shared shopping lists'}
          </p>
        </div>
        {isRTL
          ? <ChevronLeft  className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
      </button>
    </div>

    {/* Logout */}
    <div className="mt-auto px-4 py-5 pb-28">
      <button
        onClick={onLogout}
        className={cn(
          'w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl',
          'bg-white dark:bg-gray-900',
          'border border-red-100 dark:border-red-900/40',
          'text-red-600 dark:text-red-400 font-semibold text-sm',
          'shadow-sm active:scale-[0.98] transition-all duration-150'
        )}
      >
        <LogOut className="w-4 h-4" strokeWidth={2} />
        {tc?.('common.logout') || 'Logout'}
      </button>
    </div>
  </div>
);

export default ProfileMenuList;
