/**
 * TransactionList — the grouped (month → day) transaction list with sticky
 * month headers, loading skeleton and empty state.
 */

import React, { useMemo } from 'react';
import { Receipt } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import { transactionTotalsContribution } from '../../../../utils/transactionCashFlow';
import ModernTransactionCard from '../ModernTransactionCard';
import { MonthHeader, DayHeader } from './ListHeaders';

const TransactionList = ({
  transactions, loading, onEdit, onDelete, onDuplicate, onOpenDetail,
  selectedIds, onSelect, multiSelectMode,
  includeCreditCardTotals = false,
}) => {
  const { t, isRTL } = useTranslation('transactions');

  const grouped = useMemo(() => {
    if (!transactions?.length) return [];
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const monthMap = {};
    sorted.forEach((tx) => {
      const d = new Date(tx.date);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[mk]) {
        monthMap[mk] = {
          title: d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' }),
          date: d, totalIncome: 0, totalExpenses: 0, days: {},
        };
      }
      const m = monthMap[mk];
      let dk, dt;
      if (d.toDateString() === today.toDateString()) {
        dk = 'today'; dt = t('common.date.today', 'Today');
      } else if (d.toDateString() === yesterday.toDateString()) {
        dk = 'yesterday'; dt = t('common.date.yesterday', 'Yesterday');
      } else {
        dk = d.toDateString();
        dt = d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }
      if (!m.days[dk]) m.days[dk] = { title: dt, date: d, transactions: [], totalIncome: 0, totalExpenses: 0 };
      m.days[dk].transactions.push(tx);
      const { income, expenses } = transactionTotalsContribution(tx, {
        includeCreditCardActivity: includeCreditCardTotals,
      });
      m.days[dk].totalIncome += income;
      m.days[dk].totalExpenses += expenses;
      m.totalIncome += income;
      m.totalExpenses += expenses;
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, month]) => ({
        ...month, key,
        days: Object.entries(month.days)
          .sort(([, a], [, b]) => b.date - a.date)
          .map(([dk, day]) => ({ ...day, key: dk })),
      }));
  }, [transactions, t, isRTL, includeCreditCardTotals]);

  if (loading && !transactions?.length) {
    return (
      <div className="py-8 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {t('emptyStates.noTransactions', 'No transactions found')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          {t('emptyStates.noResultsDesc', 'Try adjusting your filters or add a new transaction')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((month) => (
        <div key={month.key}>
          <MonthHeader title={month.title} totalIncome={month.totalIncome} totalExpenses={month.totalExpenses} />
          <div className="space-y-4">
            {month.days.map((day) => (
              <div key={day.key}>
                <DayHeader title={day.title} totalIncome={day.totalIncome} totalExpenses={day.totalExpenses} />
                <div className="space-y-2">
                  {day.transactions.map((tx) => (
                    <ModernTransactionCard
                      key={tx.id}
                      transaction={tx}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onOpenDetail={onOpenDetail}
                      isSelected={selectedIds?.has(tx.id)}
                      onSelect={multiSelectMode ? onSelect : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
