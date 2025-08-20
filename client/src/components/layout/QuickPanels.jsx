/**
 * 🎯 QUICK PANELS - Simple Desktop Dropdown Menu
 * Clean menu for categories, recurring, and calculator
 * @version 1.0.0 - SIMPLE & CLEAN
 */

import React, { useState, useCallback } from 'react';
import {
  Layers,
  ChevronDown,
  Tag,
  Clock,
  Calculator
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../stores';
import { cn } from '../../utils/helpers';

/**
 * 🎯 Simple Quick Panels Component
 */
const QuickPanels = ({ 
  onOpenModal,
  className = '' 
}) => {
  const { t, isRTL } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ Quick panel items
  const quickPanels = [
    {
      name: t('common.categoryManager', { fallback: t('common.categories') }),
      description: t('common.manageCategoriesDesc'),
      icon: Tag,
      color: 'blue',
      onClick: () => {
        onOpenModal?.('categories');
        setShowDropdown(false);
      }
    },
    {
      name: t('common.recurringManager', { fallback: t('common.recurring') }),
      description: t('common.recurringTransactionsDesc'),
      icon: Clock,
      color: 'green',
      onClick: () => {
        onOpenModal?.('recurring');
        setShowDropdown(false);
      }
    },
    {
      name: t('common.calculator'),
      description: t('common.quickCalculatorDesc'),
      icon: Calculator,
      color: 'orange',
      onClick: () => {
        onOpenModal?.('exchange');
        setShowDropdown(false);
      }
    }
  ];

  // ✅ Close dropdown when clicking outside
  const handleBackdropClick = useCallback(() => {
    setShowDropdown(false);
  }, []);

  return (
    <div className={cn("hidden lg:block relative", className)}>
      {/* Simple button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors min-h-[44px]"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <Layers className="w-4 h-4 mr-2" />
        {t('common.quickPanels')}
        <ChevronDown className={cn(
          "w-4 h-4 ml-1 transition-transform",
          showDropdown && "rotate-180"
        )} />
      </button>

      {/* Simple dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={handleBackdropClick}
          />
          
          {/* Clean dropdown content */}
          <div
            className={cn(
              "absolute mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-40",
              isRTL ? "left-0" : "right-0"
            )}
          >
            <div className="p-4">
              {/* Simple header */}
              <div className="flex items-center mb-4">
                <Layers className="w-5 h-5 text-gray-400 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('common.quickPanels')}
                </h3>
              </div>

              {/* Simple panels grid */}
              <div className="grid grid-cols-2 gap-3">
                {quickPanels.map((panel) => {
                  const Icon = panel.icon;
                  return (
                    <button
                      key={panel.name}
                      onClick={panel.onClick}
                      className="p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center mb-2",
                        panel.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                        panel.color === 'green' && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                        panel.color === 'orange' && "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {panel.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {panel.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Simple footer tip */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {t('common.quickPanelsTip')}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickPanels;