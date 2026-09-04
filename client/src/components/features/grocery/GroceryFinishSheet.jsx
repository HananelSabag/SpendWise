/**
 * GroceryFinishSheet — archive the trip and start the list over.
 *
 * The total is optional by design: it's often only known at the till and can be
 * added later from History. Anything still unpurchased is carried into the new
 * list rather than lost, which the sheet says out loud before you commit.
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Store, Wallet } from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

const GroceryFinishSheet = ({ isOpen, onClose, onConfirm, purchasedCount, pendingCount }) => {
  const { t } = useTranslation('grocery');
  const [storeName, setStoreName] = useState('');
  const [total, setTotal] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStoreName('');
    setTotal('');
    setBusy(false);
  }, [isOpen]);

  const inputClass = cn(
    'h-12 w-full rounded-xl border px-3 text-[15px]',
    'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400',
    'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500'
  );
  const labelClass = 'mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('finish.title')}>
      <div className="space-y-4 px-4 pb-6">
        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {t('finish.description')}
        </p>

        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {t('progress.done', { count: purchasedCount })}
          {pendingCount > 0 && (
            <span className="ms-auto text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
              {t('finish.carriedOver', { count: pendingCount })}
            </span>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="grocery-finish-store">
            <Store className="h-3.5 w-3.5" />
            {t('finish.store')}
          </label>
          <input
            id="grocery-finish-store"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            maxLength={120}
            placeholder={t('finish.storePlaceholder')}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="grocery-finish-total">
            <Wallet className="h-3.5 w-3.5" />
            {t('finish.total')}
          </label>
          <input
            id="grocery-finish-total"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            dir="ltr"
            value={total}
            onChange={(event) => setTotal(event.target.value)}
            placeholder={t('finish.totalPlaceholder')}
            className={cn(inputClass, 'text-start')}
          />
          <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            {t('finish.totalHint')}
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300"
          >
            {t('finish.cancel')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const result = await onConfirm({
                storeName: storeName.trim() || null,
                totalIls: total === '' ? null : Number(total),
              });
              setBusy(false);
              if (result) onClose();
            }}
            className="h-12 flex-[2] rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy
              ? <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              : t('finish.confirm')}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default GroceryFinishSheet;
