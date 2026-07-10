/**
 * LiquidTabs — segmented tab selector with an active pill that *slides*
 * between tabs (framer-motion shared layout). Built to sit at the top of
 * header-less pages (Profile, Admin, Bank Sync) and double as their section
 * nav. Horizontally scrollable when the tabs overflow.
 *
 *   tabs:   [{ id, label, icon? }]
 *   active: current tab id
 *   fill:   stretch tabs to equal width (good for 2–4 tabs on a full row)
 */

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export default function LiquidTabs({
  tabs = [],
  active,
  onChange,
  className = '',
  size = 'md',
  fill = false,
}) {
  // Unique per instance so two LiquidTabs on one page don't share (and fight
  // over) the same animated indicator.
  const layoutId = useId();
  const pad = SIZES[size] || SIZES.md;

  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto no-scrollbar rounded-2xl bg-gray-100/80 p-1 dark:bg-gray-800/70',
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(tab.id)}
            className={cn(
              'relative flex min-w-max items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors focus:outline-none',
              pad,
              fill && 'flex-1',
              isActive
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-indigo-600 shadow-sm shadow-indigo-500/30"
              />
            )}
            {Icon && <Icon className="relative z-10 h-4 w-4 shrink-0" />}
            <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
