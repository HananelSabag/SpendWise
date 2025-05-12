import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useDate } from '../../context/DateContext';
import { Plus, Loader, AlertCircle } from 'lucide-react';
import { validateTransactionAmount, formatAmountInput } from '../../utils/validation';

/**
 * QuickExpenseBar Component
 * Enables rapid transaction entry with minimal input.
 * Switches between 'expense' and 'income' with one button.
 */
const QuickExpenseBar = () => {
  // Hooks for data
  const { quickAddTransaction, loading } = useTransactions();
  const { t, language } = useLanguage();
  const { currencySymbol } = useCurrency();
  const { selectedDate } = useDate();

  // Local UI states
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [type, setType] = useState('expense'); // toggles 'expense' or 'income'

  // Handle form submission with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate amount
    const validationError = validateTransactionAmount(amount, language);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const normalizedDate = new Date(selectedDate);
      normalizedDate.setHours(12, 0, 0, 0);

      if (type === 'expense') {
        // Use the quickAddTransaction
        await quickAddTransaction('expense', parseFloat(amount), 'Quick Expense', normalizedDate);
      } else {
        // Or call createTransaction for an 'income'
        await quickAddTransaction('income', parseFloat(amount), 'Quick Income', normalizedDate);
      }
      
      // Reset form after successful submission
      setAmount('');
      setError('');
    } catch (err) {
      console.error('Quick transaction error:', err);
      setError(t('actions.quickExpense.error'));
    }
  };

  // Handle amount input with validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    const formatted = formatAmountInput(value);
    setAmount(formatted);
    
    // Clear error when user starts typing again
    if (error) setError('');
  };

  // Toggle transaction type
  const handleTypeToggle = () => {
    setType(type === 'expense' ? 'income' : 'expense');
    setError('');
  };

  return (
    <div className="flex-1">
      <form onSubmit={handleSubmit} className="flex items-center justify-end gap-2">
        {/* Type Toggle Button */}
        <button
          type="button"
          onClick={handleTypeToggle}
          className="p-1.5 rounded-lg bg-white/80 hover:bg-white/95 transition-colors"
        >
          <svg
            className={`w-4 h-4 ${type === 'expense' ? 'text-error' : 'text-success'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={type === 'expense' ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}
            />
          </svg>
        </button>

        {/* Amount Input */}
        <div className="relative w-32">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
            {currencySymbol || '₪'}
          </span>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder={t('actions.quickExpense.placeholder')}
            className="w-full pl-6 pr-2 py-2 rounded-xl bg-white/90 hover:bg-white/95
                       border border-white/20 focus:ring-2 focus:ring-primary-500
                       focus:outline-none focus:bg-white text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !amount || error}
          className={`
            p-2 py-2 rounded-xl shadow-md flex items-center gap-2 font-medium
            bg-white/90 border 
            ${type === 'expense'
              ? 'text-error border-error/20'
              : 'text-success border-success/20'
            }
            ${(!amount || error) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {type === 'expense'
                ? t('actions.quickExpense.add')
                : t('actions.quickExpense.addincome')}
            </>
          )}
        </button>
      </form>
      
      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-error flex items-center gap-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(QuickExpenseBar);