/**
 * 💰 AMOUNT INPUT — Clean currency-aware input
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation, useCurrency } from '../../../../stores';
import { cn } from '../../../../utils/helpers';
import { parseAmountInput } from '../forms/TransactionHelpers';
import { getCurrencySymbol } from '../../../../utils/currencyAPI';

const AmountInput = ({
  value = '',
  onChange,
  type = 'expense',
  error = null,
  required = false,
  disabled = false,
  autoFocus = false,
  className = '',
}) => {
  const { t } = useTranslation('transactions');
  const { currency } = useCurrency();
  const inputRef = useRef(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const symbol = useMemo(() => getCurrencySymbol(currency), [currency]);
  const isIncome = type === 'income';

  const handleChange = useCallback((e) => {
    const clean = parseAmountInput(e.target.value);
    setLocalValue(clean);
    onChange?.(clean);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') e.preventDefault();
    // Block non-numeric except control keys
    const ctrl = ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (ctrl.includes(e.key)) return;
    if (!/[0-9.]/.test(e.key)) { e.preventDefault(); return; }
    if (e.key === '.' && localValue.toString().includes('.')) e.preventDefault();
  }, [localValue]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const clean = parseAmountInput(e.clipboardData.getData('text'));
    setLocalValue(clean);
    onChange?.(clean);
  }, [onChange]);

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t('fields.amount.label', 'Amount')}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className={cn(
        'flex h-11 items-center gap-2 rounded-xl border px-3 transition-all',
        'bg-white dark:bg-gray-800',
        'ring-2 ring-transparent',
        error
          ? 'border-red-300 dark:border-red-600'
          : isIncome
            ? 'border-gray-200 dark:border-gray-700 focus-within:border-emerald-400 dark:focus-within:border-emerald-500 focus-within:ring-emerald-400/20'
            : 'border-gray-200 dark:border-gray-700 focus-within:border-red-400 dark:focus-within:border-red-500 focus-within:ring-red-400/20',
        disabled && 'opacity-50 cursor-not-allowed'
      )}>
        {/* Currency symbol */}
        <span className={cn(
          'shrink-0 text-base font-bold',
          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
        )}>
          {symbol}
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={t('fields.amount.placeholder', '0.00')}
          disabled={disabled}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent text-base font-semibold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none"
        />

        {error && <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default AmountInput;
