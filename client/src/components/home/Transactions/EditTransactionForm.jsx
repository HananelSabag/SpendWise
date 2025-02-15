import React, { useState, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { X, CalendarIcon } from 'lucide-react';
import CalendarWidget from './CalendarWidget';

/**
 * EditTransactionForm Component
 * Allows users to edit existing transactions with form validation
 * 
 * @param {Object} transaction - The transaction to edit
 * @param {Function} onClose - Function to close the form
 * @param {Function} onSubmit - Function to handle form submission
 * @param {boolean} loading - Loading state for submission
 */
const EditTransactionForm = ({
  transaction,
  onClose,
  onSubmit,
  loading = false
}) => {
  // Context hooks
  const { t, language } = useLanguage();
  const { currencySymbol } = useCurrency();
  const isHebrew = language === 'he';

  // Date formatting helper
  const formatDateForInput = (dateString) => {
    try {
      const date = new Date(dateString);
      date.setHours(12, 0, 0, 0);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    id: transaction?.id,
    amount: transaction?.amount || '',
    description: transaction?.description || '',
    date: formatDateForInput(transaction?.date),
    category_id: transaction?.category_id || 1,
    transaction_type: transaction?.transaction_type || 'expense',
    is_recurring: transaction?.is_recurring || false,
    recurring_interval: transaction?.recurring_interval || 'monthly'
  });

  // UI states
  const [error, setError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const dateButtonRef = useRef(null);

  // Categories configuration
  const categories = [
    { id: 1, name: 'Salary', type: 'income' },
    { id: 2, name: 'Freelance', type: 'income' },
    { id: 3, name: 'Investments', type: 'income' },
    { id: 4, name: 'Rent', type: 'expense' },
    { id: 5, name: 'Groceries', type: 'expense' },
    { id: 6, name: 'Transportation', type: 'expense' },
    { id: 7, name: 'Utilities', type: 'expense' },
    { id: 8, name: 'Entertainment', type: 'expense' },
    { id: 9, name: 'General', type: null }
  ];

  // Event handlers
  const handleDateSelect = (date) => {
    setFormData(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
    setShowCalendar(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.date) {
      setError(t('errors.allFieldsRequired'));
      return;
    }
    await onSubmit(formData);
  };

  // Render component
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 w-full max-w-md relative"
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {/* Form Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {t('transactions.editTransaction')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t('actions.amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="0.00"
            />
            <span className="absolute top-1/2 -translate-y-1/2 right-3">
              {currencySymbol}
            </span>
          </div>
        </div>

        {/* Description Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t('actions.description')}
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Date Input with Calendar */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t('actions.selectDate')}
          </label>
          <div className="relative">
            <input
              ref={dateButtonRef}
              type="text"
              value={formData.date}
              readOnly
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={`absolute ${isHebrew ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`}
            >
              <CalendarIcon className="w-5 h-5 text-gray-400" />
            </button>

            {showCalendar && (
              <div className="absolute left-0 bottom-full mb-2 bg-white shadow-lg rounded-lg z-10">
                <CalendarWidget
                  selectedDate={new Date(formData.date)}
                  onDateSelect={handleDateSelect}
                  onClose={() => setShowCalendar(false)}
                  toggleRef={dateButtonRef}
                />
              </div>
            )}
          </div>
        </div>

        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t('actions.category')}
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {t(`categories.${category.name}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Recurring Transaction Options */}
        <div className="mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_recurring"
              checked={formData.is_recurring}
              onChange={handleInputChange}
              className="rounded text-primary-500 focus:ring-primary-500"
            />
            <span>{t('transactions.isRecurring')}</span>
          </label>

          {formData.is_recurring && (
            <select
              name="recurring_interval"
              value={formData.recurring_interval}
              onChange={handleInputChange}
              className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="daily">{t('recurring.daily')}</option>
              <option value="weekly">{t('recurring.weekly')}</option>
              <option value="monthly">{t('recurring.monthly')}</option>
              <option value="yearly">{t('recurring.yearly')}</option>
            </select>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTransactionForm;