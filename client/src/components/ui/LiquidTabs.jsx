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
  mobileCompact = false,
}) {
  // Unique per instance so two LiquidTabs on one page don't share (and fight
  // over) the same animated indicator.
  const layoutId = useId();
  const pad = mobileCompact && size === 'sm'
    ? 'px-1.5 py-1.5 text-[11px] sm:px-3 sm:text-xs'
    : (SIZES[size] || SIZES.md);

  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 rounded-2xl bg-gray-100/80 p-1 dark:bg-gray-800/70',
        // fill = everything fits one row (Profile, Bank Sync — no horizontal
        // scroll on mobile). Otherwise the row scrolls (Admin, which is fine
        // with more tabs than fit).
        fill ? 'w-full' : 'overflow-x-auto no-scrollbar',
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
              'relative flex items-center justify-center rounded-xl font-semibold transition-colors focus:outline-none',
              mobileCompact ? 'gap-0.5 sm:gap-1.5' : 'gap-1.5',
              pad,
              // fill → shrink to share the row (min-w-0 lets the label truncate
              // instead of forcing a scroll). Non-fill → size to content.
              fill ? 'min-w-0 flex-1' : 'min-w-max',
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
            {Icon && <Icon className={cn('relative z-10 shrink-0', mobileCompact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4')} />}
            <span className={cn('relative z-10', fill ? 'truncate' : 'whitespace-nowrap')}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
