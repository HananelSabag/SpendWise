/**
 * SourceFilterChips — bank-aware source quick filter:
 * 'all' | 'manual' | a specific bank_source, optionally narrowed to one
 * account/card ('source::account'). Options come from /bank-sync/stats
 * (every synced source + its accounts) — NOT from the loaded transaction
 * pages, which would hide any source/account that hasn't scrolled into view.
 */

import React, { useMemo } from 'react';
import { Landmark, CreditCard } from 'lucide-react';

import { cn } from '../../../../utils/helpers';
import { institutionLabel } from '../../bankSync/bankSyncMeta';

const SourceFilterChips = ({ syncedSources, sourceFilter, setSourceFilter, t, lang }) => {
  const { banks, cards } = useMemo(() => {
    const banks = [];
    const cards = [];
    for (const s of syncedSources || []) {
      (s.kind === 'credit_card' ? cards : banks).push(s.source);
    }
    return { banks, cards };
  }, [syncedSources]);
  const [selectedSource, selectedAccount] = sourceFilter.split('::');
  const accountsForSelectedSource = useMemo(() => {
    if (selectedSource === 'all' || selectedSource === 'manual') return [];
    const src = (syncedSources || []).find((s) => s.source === selectedSource);
    return (src?.accounts || [])
      .map((a) => a.account_number)
      .filter(Boolean)
      .sort();
  }, [syncedSources, selectedSource]);

  const chip = ({ key, label, icon: ChipIcon }) => (
    <button
      key={key}
      onClick={() => setSourceFilter(key)}
      className={cn(
        'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0',
        selectedSource === key
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
          : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-gray-700/80',
      )}
    >
      {ChipIcon && <ChipIcon className="w-3 h-3" />}
      {label}
    </button>
  );

  // One quiet row. Banks vs credit companies are told apart by the icon and a hairline divider —
  // the old uppercase "Bank accounts / Credit companies" headers read as clutter, not structure.
  const divider = (id) => (
    <span key={id} aria-hidden="true" className="mx-0.5 h-4 w-px shrink-0 self-center bg-gray-200 dark:bg-gray-700" />
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {chip({ key: 'all', label: t('source.all', 'All') })}
        {chip({ key: 'manual', label: t('source.manual', 'Manual') })}
        {banks.length > 0 && divider('d-banks')}
        {banks.map((s) => chip({ key: s, label: institutionLabel(s, lang), icon: Landmark }))}
        {cards.length > 0 && divider('d-cards')}
        {cards.map((s) => chip({ key: s, label: institutionLabel(s, lang), icon: CreditCard }))}
      </div>

      {/* Account/card sub-filter — only appears once a single institution is
          selected AND it has more than one account/card, e.g. two Isracard
          cards. Lets the user isolate one specific card's transactions. */}
      {accountsForSelectedSource.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 ps-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 shrink-0">
            {t('source.account', 'Account/card')}
          </span>
          <button
            onClick={() => setSourceFilter(selectedSource)}
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap shrink-0',
              !selectedAccount
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400',
            )}
          >
            {t('source.allAccounts', 'All')}
          </button>
          {accountsForSelectedSource.map((acc) => (
            <button
              key={acc}
              onClick={() => setSourceFilter(`${selectedSource}::${acc}`)}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap shrink-0',
                selectedAccount === acc
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400',
              )}
            >
              {acc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SourceFilterChips;
