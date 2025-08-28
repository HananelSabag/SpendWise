import React, { useMemo, useState } from 'react';
import { MoreVertical, Edit, Trash2, Copy, Repeat } from 'lucide-react';
import { useTranslation, useCurrency, useTheme } from '../../../stores';
import { getIconComponent } from '../../../config/categoryIcons';
import { cn, dateHelpers } from '../../../utils/helpers';

const SimpleTransactionCard = ({
  transaction,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  // ✅ FIX: Use transaction type instead of amount sign to determine income/expense
  const isIncome = transaction?.type === 'income';
  const amountAbs = Math.abs(transaction?.amount || 0);
  // ✅ TIMEZONE-AWARE: Use transaction_datetime (user's intended time) over created_at (server time)
  const getTransactionDate = () => {
    return transaction?.transaction_datetime || transaction?.created_at || transaction?.date;
  };
  const dateText = dateHelpers.fromNow(getTransactionDate());
  const isRecurring = transaction?.template_id || transaction?.is_recurring;

  const Icon = useMemo(() => getIconComponent(
    transaction?.category_icon || transaction?.category?.icon || 'Receipt'
  ), [transaction]);

  return (
    <div
      className={cn(
        'relative w-full rounded-2xl border-2 transition-all duration-200',
        'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750',
        'border-gray-200 dark:border-gray-700',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600',
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <div className={cn('flex items-center gap-3 p-4', isRTL && 'flex-row-reverse')}> 
        {/* Select */}
        {onSelect && (
          <button
            onClick={() => onSelect(transaction.id, !isSelected)}
            className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition',
              isSelected
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            )}
            aria-label={t('actions.select', { fallback: 'Select' })}
          >
            {isSelected && <span className="text-[10px] leading-none">✓</span>}
          </button>
        )}

        {/* Category Icon */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-sm',
              isIncome
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
            )}
          >
            {/* force visible icon color */}
            <Icon className="w-6 h-6 text-current" strokeWidth={2.25} aria-hidden />
          </div>
          {isRecurring && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center border-2 border-white dark:border-gray-800">
              <Repeat className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {transaction?.description || t('labels.noDescription', { fallback: 'No description' })}
                </h4>
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span className="truncate">{transaction?.category_name || transaction?.category?.name || t('categories.uncategorized', 'Uncategorized')}</span>
                <span className="text-gray-400">•</span>
                <span className="flex-shrink-0">{dateText}</span>
              </div>
            </div>
            {/* Amount + Menu */}
            <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
              <div className={cn('font-bold text-lg text-right', isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                {isIncome ? '+' : '-'}{formatCurrency(amountAbs)}
              </div>

              <div className="relative">
                <button
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  onClick={() => setOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  <MoreVertical className="w-4 h-4" strokeWidth={2} />
                </button>
                {open && (
                  <div
                    className={cn(
                      'absolute z-50 w-44 rounded-xl shadow-2xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                      isRTL ? 'left-0' : 'right-0'
                    )}
                  >
                    <div className="py-1">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200" onClick={() => { setOpen(false); onEdit?.(transaction); }}>
                        <Edit className="w-4 h-4" /> {t('actions.edit', { fallback: 'Edit' })}
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200" onClick={() => { setOpen(false); onDuplicate?.(transaction); }}>
                        <Copy className="w-4 h-4" /> {t('actions.duplicate', { fallback: 'Duplicate' })}
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400" onClick={() => { setOpen(false); onDelete?.(transaction); }}>
                        <Trash2 className="w-4 h-4" /> {t('actions.delete', { fallback: 'Delete' })}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTransactionCard;

