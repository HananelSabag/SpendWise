/**
 * 🗓️ BILLING CYCLE STEP - financial-period setup
 *
 * Replaces the old recurring-templates onboarding step. The system now
 * calculates the dashboard's "this period" numbers from a fixed day of the
 * month (e.g. salary day) instead of a rolling calendar-day window — this
 * step is where the user tells us which day that is.
 */

import React, { useCallback, useMemo } from 'react';
import { Calendar, Info } from 'lucide-react';
import { useTranslation } from '../../../../stores';
import { cn } from '../../../../utils/helpers';

const QUICK_PICKS = [1, 5, 10, 15, 20, 25];

const BillingCycleStep = ({
  data = {},
  onDataUpdate,
}) => {
  const { t, isRTL } = useTranslation('onboarding');
  const billingCycleDay = data.billingCycleDay || 1;

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  const setDay = useCallback((day) => {
    onDataUpdate({ billingCycleDay: day });
  }, [onDataUpdate]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Calendar className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('billingCycle.title', { fallback: 'When does your financial month start?' })}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
          {t('billingCycle.subtitle', { fallback: 'This is usually your salary day. We use it to calculate your dashboard totals for a real, fixed period — not just the last 30 days.' })}
        </p>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_PICKS.map((day) => (
          <button
            key={day}
            onClick={() => setDay(day)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              billingCycleDay === day
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            )}
          >
            {t('billingCycle.dayOfMonth', { day, fallback: `${day}${day === 1 ? 'st' : 'th'}` })}
          </button>
        ))}
      </div>

      {/* Full day picker */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 text-center">
          {t('billingCycle.pickAnyDay', { fallback: 'Or pick any day' })}
        </p>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setDay(day)}
              className={cn(
                'aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center',
                billingCycleDay === day
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Selected summary */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-center">
        <p className="text-sm text-indigo-900 dark:text-indigo-100">
          {t('billingCycle.selectedSummary', {
            day: billingCycleDay,
            fallback: `Your financial month runs from the ${billingCycleDay} of one month to the ${billingCycleDay} of the next.`,
          })}
        </p>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 max-w-lg mx-auto">
        <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('billingCycle.changeLater', { fallback: 'You can change this anytime in your profile settings.' })}
        </p>
      </div>
    </div>
  );
};

export default BillingCycleStep;
