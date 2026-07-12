import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2 } from 'lucide-react';

import transactionAPI from '../../../api/transactions';
import { useToast } from '../../../hooks/useToast';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

const CONDITIONS = [
  ['all', 'all'],
  ['above', 'above'],
  ['exact', 'exact'],
];

export default function MerchantWatchControl({ transaction }) {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState('all');
  const [amount, setAmount] = useState(String(Math.abs(Number(transaction?.amount) || 0)));

  const create = useMutation({
    mutationFn: async () => {
      const result = await transactionAPI.createMerchantWatch({
        transactionId: transaction.id,
        condition,
        amount: condition === 'all' ? null : Number(amount),
      });
      if (!result.success) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchantWatches'] });
      toast.success(t('merchantWatch.created'));
      setOpen(false);
    },
    onError: (error) => toast.error(error?.message || t('merchantWatch.createFailed')),
  });

  if (!String(transaction?.description || '').trim()) return null;

  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-start"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-indigo-300">
          <Eye className="h-4 w-4" />{t('merchantWatch.watch')}
        </span>
        <span className="text-[10px] text-indigo-500">{t(open ? 'merchantWatch.close' : 'merchantWatch.chooseRule')}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-indigo-100 pt-3 dark:border-indigo-900/50">
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            {t('merchantWatch.exactDescriptionHint')}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {CONDITIONS.map(([value, labelKey]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCondition(value)}
                className={cn(
                  'rounded-lg border px-2 py-2 text-[11px] font-semibold transition',
                  condition === value
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-indigo-100 bg-white text-gray-600 dark:border-indigo-900 dark:bg-gray-900 dark:text-gray-300',
                )}
              >
                {t(`merchantWatch.${labelKey}`)}
              </button>
            ))}
          </div>
          {condition !== 'all' && (
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-gray-500">{t('merchantWatch.amountIls')}</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500 dark:border-indigo-900 dark:bg-gray-900"
              />
            </label>
          )}
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending || (condition !== 'all' && !(Number(amount) > 0))}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-40"
          >
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('merchantWatch.save')}
          </button>
        </div>
      )}
    </div>
  );
}
