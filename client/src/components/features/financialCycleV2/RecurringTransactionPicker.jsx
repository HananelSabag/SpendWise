import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CreditCard, Landmark, Search } from 'lucide-react';

import { Modal } from '../../ui';
import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';
import { signedCurrency } from '../../../utils/cycleFormat';

const CARD_SOURCES = new Set(['max', 'visa_cal', 'isracard', 'amex']);

export function filterRecurringTransactions(candidates, query, direction = 'all') {
  const normalized = String(query || '').trim().toLocaleLowerCase();
  return candidates.filter((item) => {
    const amount = Number(item.amount);
    if (direction === 'income' && amount <= 0) return false;
    if (direction === 'expense' && amount >= 0) return false;
    if (!normalized) return true;
    return [
      item.description,
      item.source,
      item.accountNumber,
      item.processedDate,
      item.date,
      amount,
    ].some((value) => String(value || '').toLocaleLowerCase().includes(normalized));
  });
}

export default function RecurringTransactionPicker({
  isOpen,
  onClose,
  onSelect,
  candidates,
  formatCurrency,
  language,
  t,
  title,
  lockedDirection = null,
}) {
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState(lockedDirection || 'all');
  const activeDirection = lockedDirection || direction;
  const filtered = useMemo(
    () => filterRecurringTransactions(candidates, query, activeDirection),
    [activeDirection, candidates, query],
  );

  const close = () => {
    setQuery('');
    setDirection(lockedDirection || 'all');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={title || t('cycleV2.chooseRecurringTransaction')}
      sheet
      drawerWidth={560}
    >
      <div className="space-y-4 pb-5">
        <div className="sticky top-0 z-10 space-y-3 bg-white pb-2 dark:bg-slate-900">
          <label className="relative block">
            <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('cycleV2.searchTransactions')}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pe-3 ps-10 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-950"
            />
          </label>

          {!lockedDirection && (
            <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('cycleV2.transactionDirection')}>
              {['all', 'expense', 'income'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDirection(value)}
                  className={cn(
                    'rounded-xl px-3 py-2 text-xs font-black transition',
                    direction === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                  )}
                >
                  {t(`cycleV2.picker_${value}`)}
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] font-semibold text-slate-400">
            {t('cycleV2.transactionsFound', { count: filtered.length })}
          </p>
        </div>

        <div className="space-y-2">
          {filtered.slice(0, 100).map((item) => {
            const amount = Number(item.amount);
            const income = amount > 0;
            const card = CARD_SOURCES.has(String(item.source || '').toLowerCase());
            const SourceIcon = card ? CreditCard : Landmark;
            const id = item.overrideTransactionId || item.transactionId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  close();
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-start transition hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20"
              >
                <span className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  income
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                )}>
                  <SourceIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-950 dark:text-white">
                    {item.description || t('cycleV2.unnamedTransaction')}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-slate-400">
                    <span>{formatCycleDay(item.processedDate || item.date, language)}</span>
                    <span>{String(item.source || t('cycleV2.unknownSource')).toUpperCase()}{item.accountNumber ? ` ••••${String(item.accountNumber).slice(-4)}` : ''}</span>
                  </span>
                </span>
                <span className={cn(
                  'flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-black tabular-nums',
                  income ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white',
                )}>
                  {income ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                  {signedCurrency(amount, formatCurrency, { signPositive: true })}
                </span>
              </button>
            );
          })}
          {!filtered.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-400 dark:border-slate-700">
              {t('cycleV2.noPickerResults')}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
