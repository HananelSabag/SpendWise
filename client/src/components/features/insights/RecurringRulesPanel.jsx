import React, { useEffect, useState } from 'react';
import { Link2, Save } from 'lucide-react';

import { cn } from '../../../utils/helpers';

export default function RecurringRulesPanel({ groups = [], onUpdate, isUpdating, t }) {
  const [names, setNames] = useState({});
  useEffect(() => {
    setNames(Object.fromEntries(groups.map((group) => [group.id, group.label])));
  }, [groups]);

  if (!groups.length) return null;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-indigo-500" />
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">{t('cycle.recurringRules', { fallback: 'Recurring transactions' })}</h3>
          <p className="text-[11px] text-gray-500">{t('cycle.recurringRulesHint', { fallback: 'Rename a rule, link more transactions to it, and decide whether it belongs in the forecast.' })}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {groups.map((group) => {
          const changed = names[group.id] !== group.label && names[group.id]?.trim();
          return (
            <div key={group.id} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
              <div className="flex min-w-0 items-center gap-2">
                <input
                  value={names[group.id] || ''}
                  maxLength={100}
                  onChange={(event) => setNames((current) => ({ ...current, [group.id]: event.target.value }))}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold dark:border-gray-700 dark:bg-gray-900"
                  aria-label={t('cycle.recurringName', { fallback: 'Recurring transaction name' })}
                />
                <button
                  type="button"
                  disabled={!changed || isUpdating}
                  onClick={() => onUpdate?.({ groupId: group.id, label: names[group.id].trim() })}
                  className="rounded-lg p-2 text-indigo-600 disabled:opacity-25"
                  aria-label={t('save', { fallback: 'Save' })}
                ><Save className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                <span className="truncate text-gray-500">{group.matchers?.length || 1} {t('cycle.linkedPatterns', { fallback: 'linked patterns' })}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={group.includeInEstimate !== false}
                  disabled={isUpdating}
                  onClick={() => onUpdate?.({ groupId: group.id, includeInEstimate: group.includeInEstimate === false })}
                  className="inline-flex shrink-0 items-center gap-2 font-bold text-gray-600 dark:text-gray-300"
                >
                  {t('cycle.includeForecast', { fallback: 'Include in forecast' })}
                  <span className={cn('relative h-5 w-9 rounded-full transition', group.includeInEstimate !== false ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600')}>
                    <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', group.includeInEstimate !== false ? 'end-0.5' : 'start-0.5')} />
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
