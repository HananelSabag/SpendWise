import React, { useState } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Loader } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

/**
* QuickExpenseBar - A component for quickly adding expenses
* Appears at the bottom of DailyBalance component
*/
const QuickExpenseBar = ({ selectedDate }) => {
  const { addQuickExpense, addTransaction, loading } = useTransactions();
  const { t } = useLanguage();
  const { currencySymbol } = useCurrency();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [type, setType] = useState('expense');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError(t('actions.quickExpense.amountRequired'));
      return;
    }

    try {
      if (type === 'expense') {
        await addQuickExpense(parseFloat(amount), 'Quick Expense', selectedDate);
      } else {
        await addTransaction({
          type: 'income',
          amount: parseFloat(amount),
          description: 'Quick Income',
          date: selectedDate,
          is_recurring: false
        });
      }
      setAmount('');
      setError('');
    } catch (err) {
      setError(t('actions.quickExpense.error'));
    }
  };

  return (
    <div className="flex-1">
      <form onSubmit={handleSubmit} className="flex items-center justify-end gap-2">

        {/* Type Toggle & Submit Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setType(type === 'expense' ? 'income' : 'expense')}
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

          {/* Amount Input - Smaller width, right aligned */}
          <div className="relative w-32"> {/* Reduced width */}
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
            <input
              type="number"
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder={t('actions.quickExpense.placeholder')}
              className="w-full pl-6 pr-2 py-2 rounded-xl bg-white/90 hover:bg-white/95 border border-white/20
                    focus:ring-2 focus:ring-primary-500 focus:outline-none focus:bg-white text-sm"
              min="0"
              step="0.01"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`p-2 py-2 rounded-xl  shadow-md flex items-center gap-2 font-medium
              ${type === 'expense'
                ? 'bg-white/90 text-error border border-error/20'
                : 'bg-white/90 text-success border border-success/20'}`}
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
        </div>
      </form>
    </div>
  );
};
export default QuickExpenseBar;