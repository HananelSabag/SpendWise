import React from 'react';
import { ChevronDown, Receipt, Users } from 'lucide-react';
import { cn } from '../../../utils/helpers';

/**
 * The page's entire chrome: one row and a hairline.
 *
 * Vertical space is the scarce resource on this screen — the bottom navigation
 * already owns ~60px — and this used to spend well over a hundred pixels of it
 * on a full-width tab bar whose second tab you visit maybe once a month, plus a
 * separate title row, plus a status line. The list itself got what was left.
 *
 * So: the page title is screen-reader-only (the nav bar and the header already
 * say where you are), history is one icon that opens a sheet, and the only text
 * that survives is the one line worth reading mid-aisle — how much is left.
 */
export default function GroceryToolbar({
  activeListLabel,
  onSwitchList,
  onShare,
  onHistory,
  invitationCount = 0,
  statusLine,
  progress,
  showProgress,
  t,
}) {
  const progressPercent = Math.min(100, Math.max(0, Number(progress) || 0));

  // 44px, because these are the two smallest tap targets on the screen.
  const iconButton = cn(
    'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
    'border-gray-200 bg-white text-gray-600 transition-colors',
    'hover:bg-blue-50 hover:text-blue-700',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
  );

  return (
    <header className="pt-2">
      <h1 className="sr-only">{t('title')}</h1>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          {/* The list's name is only worth a line when there is more than one. */}
          {onSwitchList ? (
            <button
              type="button"
              onClick={onSwitchList}
              aria-label={`${t('lists.switchTo')}: ${activeListLabel}`}
              className="flex max-w-full items-center gap-1 rounded-lg text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <span className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
                {activeListLabel}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            </button>
          ) : null}

          <p
            className={cn(
              'truncate text-xs leading-5 text-gray-500 dark:text-gray-400',
              !onSwitchList && 'text-sm font-semibold text-gray-700 dark:text-gray-200'
            )}
            role="status"
          >
            {statusLine}
          </p>
        </div>

        {/* A receipt, not a clock-with-arrow: at 16px that glyph is hard to
            tell from a refresh spinner, and what is behind this button is
            literally the receipts. */}
        <button type="button" onClick={onHistory} aria-label={t('history.open')} className={iconButton}>
          <Receipt className="h-4 w-4 rtl:-scale-x-100" />
        </button>

        <button type="button" onClick={onShare} aria-label={t('share.title')} className={cn(iconButton, 'lg:hidden')}>
          <Users className="h-4 w-4" />
          {invitationCount > 0 && (
            <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {invitationCount}
            </span>
          )}
        </button>
      </div>

      {showProgress && (
        <div
          role="progressbar"
          aria-label={t('title')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          aria-valuetext={statusLine}
          className="mt-1.5 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none',
              progressPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </header>
  );
}
