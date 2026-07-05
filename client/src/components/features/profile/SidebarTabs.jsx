import React from 'react';
import { ShoppingCart, LogOut } from 'lucide-react';
import { cn } from '../../../utils/helpers';
import { TABS } from './ProfileTabsConfig';

export const SidebarTabs = ({ active, onChange, t, onLogout, onShopping, tc }) => (
  <div className="w-48 shrink-0 space-y-0.5">
    {TABS.map(tab => {
      const Icon     = tab.icon;
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer',
            isActive
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:shadow-sm'
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{t(tab.labelKey, tab.id)}</span>
        </button>
      );
    })}
    {/* Shopping — profile-gated mini-app (not in the main nav) */}
    <button
      onClick={onShopping}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:shadow-sm"
    >
      <ShoppingCart className="w-4 h-4 shrink-0" />
      <span>{t('shoppingEntry.title') || 'Shopping'}</span>
    </button>
    <div className="pt-3 mt-1 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={onLogout}
        className={cn(
          'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer',
          'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        )}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>{tc?.('common.logout') || 'Logout'}</span>
      </button>
    </div>
  </div>
);

export default SidebarTabs;
