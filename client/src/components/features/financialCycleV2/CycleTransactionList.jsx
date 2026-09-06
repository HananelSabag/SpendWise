import React, { useState } from 'react';
import { formatCycleDay } from '../../../utils/cycleDate';
import { CycleMoney, cycleButton } from './CyclePrimitives';

const PAGE_SIZE = 24;

export default function CycleTransactionList({ transactions = [], formatCurrency, language, t }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  if (!transactions.length)
    return (
      <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('cycleV2.noCardTransactions')}
      </p>
    );
  return (
    <div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {transactions.slice(0, visibleCount).map((transaction, index) => (
          <div key={transaction.id || index} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium text-slate-800 dark:text-slate-100">
                {transaction.description || '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatCycleDay(transaction.processedDate || transaction.date, language)}
                {transaction.installments &&
                  ` · ${t('cycleV2.installment', { number: transaction.installments.number, total: transaction.installments.total })}`}
              </p>
            </div>
            <CycleMoney
              value={Number(transaction.amount)}
              formatCurrency={formatCurrency}
              signed
              className={`shrink-0 text-sm ${Number(transaction.amount) > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}
            />
          </div>
        ))}
      </div>
      {transactions.length > visibleCount && (
        <button
          type="button"
          className={`${cycleButton} mt-2 w-full bg-slate-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300`}
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          {t('cycleV2.showMoreTransactions', {
            count: Math.min(PAGE_SIZE, transactions.length - visibleCount),
          })}
        </button>
      )}
    </div>
  );
}
