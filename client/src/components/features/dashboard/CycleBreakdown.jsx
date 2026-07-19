/**
 * Where every number in the cycle came from.
 *
 * The headline is only trustworthy if the user can open it: tap a row and see the exact
 * purchases the engine summed. Each row is one real bank debit — the monthly card bill, an
 * immediate charge, a debit-card purchase — because that is how the money actually moves
 * (FINANCIAL_CYCLE_SPEC.md §1–§2), so what you see here is what left the account.
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  CreditCard,
  Receipt,
} from 'lucide-react';

import { cn } from '../../../utils/helpers';
import { formatCycleDay } from '../../../utils/cycleDate';
import { cardShortName, last4 } from '../../../utils/cycleFormat';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { institutionLabel } from '../bankSync/bankSyncMeta';
import BottomSheet from '../../common/BottomSheet';
import Modal from '../../ui/Modal';

function bankAccountLabel(source, accountNumber, language, fallback) {
  if (!source) return fallback;
  const bank = institutionLabel(source, language) || cardShortName(source);
  return accountNumber ? `${bank} ••••${last4(accountNumber)}` : bank;
}

/** Keep provenance grouped by the account whose balance actually moved. */
function groupByBankAccount(items) {
  const groups = new Map();
  (items || []).forEach((txn) => {
    const key = `${txn.source || 'unknown'}:${txn.accountNumber || 'default'}`;
    if (!groups.has(key)) {
      groups.set(key, { key, source: txn.source, accountNumber: txn.accountNumber, txns: [], total: 0 });
    }
    const group = groups.get(key);
    group.txns.push(txn);
    group.total += Number(txn.amount || 0);
  });
  return [...groups.values()];
}

function Row({ icon: Icon, label, meta, amount, tone = 'neutral', formatCurrency, onClick }) {
  const tones = {
    card: 'bg-violet-50/80 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/25 dark:text-violet-300 dark:hover:bg-violet-950/40',
    income: 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:hover:bg-emerald-950/35',
    neutral: 'bg-gray-50 text-gray-800 hover:bg-gray-100 dark:bg-gray-800/60 dark:text-gray-100 dark:hover:bg-gray-800',
  };
  const value = Number(amount) || 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition', tones[tone])}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold sm:text-sm">{label}</span>
        {meta && <span className="mt-0.5 block truncate text-[10px] opacity-70">{meta}</span>}
      </span>
      <span className="shrink-0 whitespace-nowrap text-xs font-black tabular-nums sm:text-sm">
        {value < 0 ? '−' : '+'}{formatCurrency(Math.abs(value))}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-35 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
    </button>
  );
}

function DetailBody({ group, formatCurrency, t, language }) {
  if (!group) return null;
  const total = group.txns.reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
  return (
    <div className="space-y-3 p-4 sm:p-0">
      <div className="flex items-end justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
        <div className="min-w-0">
          {/* This line explains which charge the user opened — never clip it. */}
          <p className="text-xs leading-tight text-gray-500">{group.meta}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {t('cycle.rowsCounted', { fallback: 'transactions counted' })}: {group.txns.length}
          </p>
        </div>
        <p className={cn('shrink-0 text-lg font-black tabular-nums', total < 0 ? 'text-gray-950 dark:text-white' : 'text-emerald-600')}>
          {total < 0 ? '−' : '+'}{formatCurrency(Math.abs(total))}
        </p>
      </div>

      <div className="max-h-[60vh] space-y-1 overflow-y-auto sm:max-h-96">
        {group.txns.map((txn) => {
          const income = Number(txn.amount) > 0;
          return (
            <div key={txn.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{txn.description || '—'}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                  <span>{formatCycleDay(txn.date, language)}</span>
                  {txn.installments && (
                    <span className="text-indigo-500">
                      {t('cycle.installment', { fallback: 'payment' })} {txn.installments.number}/{txn.installments.total}
                    </span>
                  )}
                  {txn.currency && <span className="text-violet-500">{txn.currency}</span>}
                  {txn.fixedCharge && <span className="text-indigo-500">{txn.fixedCharge}</span>}
                  {txn.pending && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Clock3 className="h-3 w-3" />{t('cycle.pending', { fallback: 'pending' })}
                    </span>
                  )}
                </p>
              </div>
              <p className={cn('shrink-0 whitespace-nowrap text-sm font-black tabular-nums', income ? 'text-emerald-600' : 'text-gray-950 dark:text-white')}>
                {income ? '+' : '−'}{formatCurrency(Math.abs(Number(txn.amount) || 0))}
              </p>
            </div>
          );
        })}
        {!group.txns.length && (
          <p className="py-8 text-center text-sm text-gray-500">{t('cycle.noRows', { fallback: 'Nothing here' })}</p>
        )}
      </div>
    </div>
  );
}

export default function CycleBreakdown({ cycle, formatCurrency, t, language = 'en', compactRowLimit = 3 }) {
  const isMobile = useIsMobile();
  const [group, setGroup] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // A newly selected cycle starts compact. Carrying an expanded breakdown into another
  // salary window would make the dashboard jump back to the oversized state unexpectedly.
  useEffect(() => {
    setGroup(null);
    setIsExpanded(false);
  }, [cycle?.window?.start, cycle?.window?.end]);

  if (!cycle) return null;
  const { expenses, income } = cycle;

  const classLabel = (event) => {
    if (event.class !== 'statement') return t('cycle.classImmediate', { fallback: 'Charged directly' });
    // A statement still building this cycle: its purchases count now, but the bank charges it
    // next month — so it reads as a bill in progress, not one that already left the account.
    return event.accruing
      ? t('cycle.classAccruing', { fallback: 'Bill building' })
      : t('cycle.classStatement', { fallback: 'Monthly bill' });
  };

  /** "1 transactions" reads like a bug to a user; both languages need the singular. */
  const countLabel = (n) => `${n} ${n === 1
    ? t('cycle.txn', { fallback: 'transaction' })
    : t('cycle.txns', { fallback: 'transactions' })}`;

  const rows = [
    // One row per real bank debit the card produced.
    ...(expenses.events || []).map((event, index) => {
      const label = `${cardShortName(event.source)} ••••${last4(event.accountNumber)}`;
      const when = `${event.accruing ? `${t('cycle.billsOn', { fallback: 'bills' })} ` : ''}${formatCycleDay(event.chargeDate, language)}`;
      const meta = `${classLabel(event)} · ${when} · ${countLabel(event.count)}`;
      return {
        // Immediate debits can share a card and charge date, so the old three-part key was
        // not unique (the live MAX 8345 data has exactly this case).
        key: `${event.source}-${event.accountNumber}-${event.chargeDate}-${event.class}-${event.total}-${event.txns?.[0]?.id || index}`,
        compactGroup: `${event.source}-${event.accountNumber}`,
        icon: CreditCard,
        label,
        meta,
        amount: event.total,
        tone: 'card',
        onClick: () => setGroup({ title: label, meta, txns: event.txns || [] }),
      };
    }),
    ...groupByBankAccount(expenses.directItems).map((account) => {
      const fallback = t('cycle.bankOut', { fallback: 'Out of the account' });
      const label = bankAccountLabel(account.source, account.accountNumber, language, fallback);
      return {
        key: `bank-out-${account.key}`,
        icon: ArrowDownToLine,
        label,
        meta: `${fallback} · ${countLabel(account.txns.length)}`,
        amount: account.total,
        tone: 'neutral',
        onClick: () => setGroup({
          title: label,
          meta: t('cycle.bankOutHint', { fallback: 'Loans, standing orders, cash — straight from the bank' }),
          txns: account.txns,
        }),
      };
    }),
    ...groupByBankAccount(income.items).map((account) => {
      const fallback = t('cycle.incomeRow', { fallback: 'Into the account' });
      const label = bankAccountLabel(account.source, account.accountNumber, language, fallback);
      return {
        key: `income-${account.key}`,
        icon: ArrowUpFromLine,
        label,
        meta: `${fallback} · ${countLabel(account.txns.length)}`,
        amount: account.total,
        tone: 'income',
        onClick: () => setGroup({
          title: label,
          meta: t('cycle.incomeHint', { fallback: 'Money that is yours — borrowing is not counted here' }),
          txns: account.txns,
        }),
      };
    }),
  ].filter(Boolean);

  // The compact state should scan like the old card: one meaningful row per card/account,
  // not three variants of the same card. Pick the largest real debit as that account's
  // representative, then put bank rows next and reveal secondary charge events on expansion.
  const representativeByAccount = new Map();
  rows.forEach((row) => {
    if (!row.compactGroup) return;
    const current = representativeByAccount.get(row.compactGroup);
    if (!current || Math.abs(Number(row.amount) || 0) > Math.abs(Number(current.amount) || 0)) {
      representativeByAccount.set(row.compactGroup, row);
    }
  });
  const representativeRows = [...representativeByAccount.values()];
  const representativeSet = new Set(representativeRows);
  const prioritizedRows = [
    ...representativeRows,
    ...rows.filter((row) => !row.compactGroup),
    ...rows.filter((row) => row.compactGroup && !representativeSet.has(row)),
  ];
  const compactRowCount = Math.min(prioritizedRows.length, compactRowLimit);
  const hiddenRowCount = Math.max(prioritizedRows.length - compactRowCount, 0);
  const visibleRows = isExpanded ? prioritizedRows : prioritizedRows.slice(0, compactRowCount);

  const body = <DetailBody group={group} formatCurrency={formatCurrency} t={t} language={language} />;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400">
        <Receipt className="h-3.5 w-3.5" />
        {t('cycle.whatBuiltThis', { fallback: 'Tap any row to see exactly what built it' })}
      </p>
      <div className="space-y-1.5">
        {visibleRows.map(({ key, ...row }) => <Row key={key} {...row} formatCurrency={formatCurrency} />)}
        {hiddenRowCount > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            aria-expanded={isExpanded}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/25"
          >
            {isExpanded
              ? t('cycle.showLess', { fallback: 'Show less' })
              : t('cycle.showMore', { count: hiddenRowCount, fallback: `Show ${hiddenRowCount} more` })}
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {isMobile ? (
        <BottomSheet isOpen={Boolean(group)} onClose={() => setGroup(null)} title={group?.title || ''} height="full">
          {body}
        </BottomSheet>
      ) : (
        <Modal isOpen={Boolean(group)} onClose={() => setGroup(null)} title={group?.title || ''} size="lg">
          {body}
        </Modal>
      )}
    </div>
  );
}
