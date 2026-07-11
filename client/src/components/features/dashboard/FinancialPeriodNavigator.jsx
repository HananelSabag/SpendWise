import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

import { useTranslation } from '../../../stores';
import { cn } from '../../../utils/helpers';

function parseCalendarDate(value) {
  return value ? new Date(`${value}T12:00:00`) : null;
}

function formatRange(period) {
  const start = parseCalendarDate(period?.start);
  const exclusiveEnd = parseCalendarDate(period?.end);
  if (!start || !exclusiveEnd) return '';
  exclusiveEnd.setDate(exclusiveEnd.getDate() - 1);
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: start.getFullYear() === exclusiveEnd.getFullYear() ? undefined : 'numeric',
  });
  return `${formatter.format(start)} – ${formatter.format(exclusiveEnd)}`;
}

export default function FinancialPeriodNavigator({
  period,
  periodOffset,
  onPeriodOffsetChange,
  className,
}) {
  const { t, isRTL } = useTranslation('dashboard');
  const offset = Number(period?.offset ?? periodOffset) || 0;
  const lookback = Math.abs(offset);
  // Never let the user page into calendar months that hold no data.
  const minOffset = Math.min(0, Number(period?.minOffset ?? -24));
  const quickOffsets = [0, -1, -2].filter((v) => v >= minOffset);
  const title = offset === 0
    ? t('period.current', { fallback: 'Current month' })
    : offset === -1
      ? t('period.previous', { fallback: 'Previous month' })
      : t('period.periodsAgo', { count: lookback, fallback: `${lookback} months ago` });

  const PreviousIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <section className={cn('glass-card rounded-2xl p-3 sm:p-4', className)} aria-label={t('period.navigator', { fallback: 'Financial period navigator' })}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPeriodOffsetChange(offset - 1)}
          disabled={offset <= minOffset}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          aria-label={t('period.older', { fallback: 'Older period' })}
        >
          <PreviousIcon className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{formatRange(period)}</p>
        </div>

        <button
          type="button"
          onClick={() => onPeriodOffsetChange(offset + 1)}
          disabled={offset >= 0}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          aria-label={t('period.newer', { fallback: 'Newer period' })}
        >
          <NextIcon className="h-4 w-4" />
        </button>
      </div>

      {quickOffsets.length > 1 && (
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${quickOffsets.length}, minmax(0, 1fr))` }}>
          {quickOffsets.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onPeriodOffsetChange(value)}
              className={cn(
                'rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors',
                offset === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              )}
            >
              {value === 0
                ? t('period.now', { fallback: 'Now' })
                : value === -1
                  ? t('period.last', { fallback: 'Last' })
                  : t('period.twoAgo', { fallback: '2 ago' })}
            </button>
          ))}
        </div>
      )}

      {offset < 0 && (
        <button
          type="button"
          onClick={() => onPeriodOffsetChange(0)}
          className="mx-auto mt-2 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300"
        >
          <RotateCcw className="h-3 w-3" />
          {t('period.backToCurrent', { fallback: 'Back to current period' })}
        </button>
      )}
    </section>
  );
}
