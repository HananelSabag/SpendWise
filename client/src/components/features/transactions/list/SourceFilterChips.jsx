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

  const groups = [
    {
      key: 'general',
      label: '',
      chips: [
        { key: 'all', label: t('source.all', 'All') },
        { key: 'manual', label: t('source.manual', 'Manual') },
      ],
    },
    {
      key: 'banks',
      label: t('source.banks', 'Bank accounts'),
      chips: banks.map((s) => ({ key: s, label: institutionLabel(s, lang), icon: Landmark })),
    },
    {
      key: 'cards',
      label: t('source.cards', 'Credit companies'),
      chips: cards.map((s) => ({ key: s, label: institutionLabel(s, lang), icon: CreditCard })),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 text-[11px] text-gray-400 dark:text-gray-500 leading-snug">
        <Landmark className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{t('source.legend', 'Bank rows are account cash flow. Credit-company rows are itemized card purchases.')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {groups.filter((group) => group.chips.length > 0).map((group) => (
          <div key={group.key} className="flex items-center gap-1.5">
            {group.label && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 px-1">
                {group.label}
              </span>
            )}
            {group.chips.map(({ key, label, icon: ChipIcon }) => (
              <button
                key={key}
                onClick={() => setSourceFilter(key)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0',
                  selectedSource === key
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400',
                )}
              >
                {ChipIcon && <ChipIcon className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>
        ))}
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
