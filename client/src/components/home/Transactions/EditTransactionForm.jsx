import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import {
  X,
  CalendarIcon,
  AlertCircle,
  Clock,
  Trash2,
  ChevronDown,
  Calendar,
  Loader,
  Info
} from 'lucide-react';
import CalendarWidget from './CalendarWidget';
import { validateTransactionAmount, formatAmountInput } from '../../../utils/validation';

const EditTransactionForm = ({
  transaction,
  onClose,
  onDelete,
  loading = false,
  onSubmit // receives form data for saving
}) => {
  // Language and currency hooks
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const isHebrew = language === 'he';
  
  // Refs for calendar dropdowns
  const dateButtonRef = useRef(null);
  const startDateButtonRef = useRef(null);

  // Get first day of month for default start date
  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date);
    firstDay.setDate(1);
    firstDay.setHours(12, 0, 0, 0);
    return firstDay;
  };

  // Form state
  const [formData, setFormData] = useState({
    id: transaction?.id || null,
    transaction_type: transaction?.transaction_type || 'expense',
    amount: transaction?.amount || '',
    description: transaction?.description || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
    category_id: transaction?.category_id || 9,
    is_recurring: transaction?.is_recurring || false,
    recurring_interval: transaction?.recurring_interval || 'monthly',
    recurring_end_date: transaction?.recurring_end_date || null,
    custom_start_date: transaction?.recurring_start_date || null,
    updateFuture: false // decides whether to apply changes to future occurrences
  });

  // Checkboxes for optional fields
  const [useEndDate, setUseEndDate] = useState(Boolean(transaction?.recurring_end_date));
  const [useCustomStartDate, setUseCustomStartDate] = useState(Boolean(transaction?.recurring_start_date));

  // UI state
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(
    transaction?.is_recurring || false
  );
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Set defaults when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        id: transaction.id || null,
        transaction_type: transaction.transaction_type || 'expense',
        amount: transaction.amount || '',
        description: transaction.description || '',
        date: transaction.date || new Date().toISOString().split('T')[0],
        category_id: transaction.category_id || 9,
        is_recurring: transaction.is_recurring || false,
        recurring_interval: transaction.recurring_interval || 'monthly',
        recurring_end_date: transaction.recurring_end_date || null,
        custom_start_date: transaction.recurring_start_date || getFirstDayOfMonth(new Date(transaction.date)).toISOString().split('T')[0],
        updateFuture: false
      });
      
      setUseEndDate(Boolean(transaction.recurring_end_date));
      setUseCustomStartDate(Boolean(transaction.recurring_start_date));
      setShowRecurringOptions(transaction.is_recurring || false);
      setError('');
      setFieldErrors({});
    }
  }, [transaction]);

  /**
   * handleDateSelect(date)
   * Updates the 'date' field in formData when the user picks a date from the calendar.
   */
  const handleDateSelect = (date) => {
    setFormData((prev) => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
    
    // If this is a recurring transaction and not using custom start date,
    // update the custom_start_date to first day of month when date changes
    if (formData.is_recurring && !useCustomStartDate) {
      const firstDay = getFirstDayOfMonth(date);
      setFormData(prev => ({
        ...prev,
        custom_start_date: firstDay.toISOString().split('T')[0]
      }));
    }
    
    setShowCalendar(false);
  };

  /**
   * handleStartDateSelect(date)
   * Updates the 'custom_start_date' field in formData for recurring transactions.
   */
  const handleStartDateSelect = (date) => {
    setFormData((prev) => ({
      ...prev,
      custom_start_date: date.toISOString().split('T')[0]
    }));
    setShowStartDateCalendar(false);
  };

  /**
   * handleAmountChange(e)
   * Handle amount changes with validation and formatting
   */
  const handleAmountChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatAmountInput(value);
    
    setFormData(prev => ({
      ...prev,
      amount: formattedValue
    }));
    
    // Clear specific error when user makes changes
    if (fieldErrors.amount) {
      setFieldErrors(prev => ({
        ...prev,
        amount: null
      }));
    }
  };

  /**
   * handleChange(e)
   * A generic change handler for form inputs
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear specific field error when user makes changes
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // Clear global error
    if (error) {
      setError('');
    }
  };

  /**
   * validateForm()
   * Validates all required form fields
   * @returns {boolean} - Whether the form is valid
   */
  const validateForm = () => {
    const errors = {};
    
    // Validate amount
    const amountError = validateTransactionAmount(formData.amount, language);
    if (amountError) {
      errors.amount = amountError;
    }
    
    // Validate description (optional - only if we want to enforce a description)
    if (!formData.description?.trim()) {
      errors.description = isHebrew 
      errors.description = t('forms.errors.descriptionRequired');
    }
    
    // For recurring transactions, validate other fields
    if (formData.is_recurring) {
      // If end date is used, validate it
      if (useEndDate && !formData.recurring_end_date) {
        errors.recurring_end_date = isHebrew 
        errors.recurring_end_date = t('forms.errors.endDateRequired');
      }
      
      // If custom start date is used, validate it
      if (useCustomStartDate && !formData.custom_start_date) {
        errors.custom_start_date = isHebrew
        errors.custom_start_date = t('forms.errors.startDateRequired');
        
    }
  }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * handleDelete(option)
   * Handles different deletion options for recurring transactions
   */
  const handleDelete = (option) => {
    if (!transaction) return;
    
    if (option === 'single') {
      onDelete?.({ 
        ...transaction,
        deleteFuture: false
      });
    } else if (option === 'future') {
      onDelete?.({ 
        ...transaction,
        deleteFuture: true
      });
    }
    
    onClose();
  };

  /**
   * handleSubmit()
   * Calls the onSubmit prop with formData to save changes.
   */
  const handleSubmit = () => {
    // First validate the form
    if (!validateForm()) {
      // Focus the first field with an error
      const firstErrorField = Object.keys(fieldErrors)[0];
      const element = document.getElementById(`transaction-${firstErrorField}`);
      if (element) {
        element.focus();
      }
      
      // Display a global error message
      setError(t('actions.errors.formErrors'));
      return;
    }
    
    // Prepare the data for submission
    const submissionData = {
      ...formData,
      // Only include custom_start_date if we're using it for recurring transactions
      custom_start_date: formData.is_recurring && useCustomStartDate ? formData.custom_start_date : null,
      // Only include recurring_end_date if we're using it
      recurring_end_date: useEndDate ? formData.recurring_end_date : null,
    };
    
    // Submit the data to parent component
    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="relative w-full max-w-3xl rounded-2xl shadow-xl border border-primary-300 mx-2 sm:mx-0 bg-white"
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-primary-400 to-primary-500 px-6 py-4 sm:py-6 rounded-t-2xl">
          {/* Title & Close Button row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {t('transactions.editTransaction')}
              </h2>
              <p className="text-white/80 text-sm">
                {t('transactions.editTitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition"
            >
              <X className="w-5 h-5 text-primary-600" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 space-y-5">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="transaction-amount">
              {t('actions.amount')}
            </label>
            <div className="relative">
              <input
                id="transaction-amount"
                type="text"
                name="amount"
                value={formData.amount}
                onChange={handleAmountChange}
                className={`w-full h-12 px-4 border ${fieldErrors.amount ? 'border-error focus:ring-error' : 'border-gray-200 focus:ring-primary-500'} rounded-xl focus:ring-2 focus:border-transparent text-lg`}
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {formatAmount(0).replace(/[0-9]/g, '')}
              </span>
              {fieldErrors.amount && (
                <p className="mt-1 text-error text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldErrors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="transaction-description">
              {t('actions.description')}
            </label>
            <input
              id="transaction-description"
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`w-full h-12 px-4 border ${fieldErrors.description ? 'border-error focus:ring-error' : 'border-gray-200 focus:ring-primary-500'} rounded-xl focus:ring-2 focus:border-transparent`}
              placeholder={t('actions.descriptionPlaceholder')}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-error text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="transaction-category">
              {t('actions.category')}
            </label>
            <select
              id="transaction-category"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {[
                { id: 1, name: 'Salary', type: 'income' },
                { id: 2, name: 'Freelance', type: 'income' },
                { id: 3, name: 'Investments', type: 'income' },
                { id: 4, name: 'Rent', type: 'expense' },
                { id: 5, name: 'Groceries', type: 'expense' },
                { id: 6, name: 'Transportation', type: 'expense' },
                { id: 7, name: 'Utilities', type: 'expense' },
                { id: 8, name: 'Entertainment', type: 'expense' },
                { id: 9, name: 'General', type: null }
              ]
                .filter((c) => c.type === formData.transaction_type || c.type === null)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {t(`categories.${cat.name}`)}
                  </option>
                ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('transactions.date')}
            </label>
            <div className="relative">
              <button
                ref={dateButtonRef}
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left flex items-center justify-between"
                type="button"
              >
                <span>{formData.date}</span>
                <CalendarIcon className="w-5 h-5 text-gray-400" />
              </button>

              {showCalendar && (
                <div className="absolute left-0 right-0 sm:left-auto sm:right-auto mt-2 z-10">
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

          {/* Recurring Options */}
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_recurring"
                  checked={formData.is_recurring}
                  onChange={handleChange}
                  className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('transactions.recurring')}
                </span>
              </label>
              {formData.is_recurring && (
                <button
                  type="button"
                  onClick={() => setShowRecurringOptions(!showRecurringOptions)}
                  className="text-primary-500 flex items-center gap-1"
                >
                  <span className="text-sm">{t('actions.options')}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showRecurringOptions ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
            </div>

            {formData.is_recurring && showRecurringOptions && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="recurring-interval">
                    {t('actions.frequency')}
                  </label>
                  <select
                    id="recurring-interval"
                    name="recurring_interval"
                    value={formData.recurring_interval}
                    onChange={handleChange}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="daily">{t('actions.frequencies.daily')}</option>
                    <option value="weekly">{t('actions.frequencies.weekly')}</option>
                    <option value="monthly">{t('actions.frequencies.monthly')}</option>
                  </select>
                </div>

                {/* Custom Start Date - NEW FEATURE */}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useCustomStartDate}
                    onChange={(e) => {
                      setUseCustomStartDate(e.target.checked);
                      // If enabling, set default to first day of month if none exists
                      if (e.target.checked && !formData.custom_start_date) {
                        const firstDay = getFirstDayOfMonth(new Date(formData.date));
                        setFormData(prev => ({
                          ...prev,
                          custom_start_date: firstDay.toISOString().split('T')[0]
                        }));
                      }
                      
                      // Clear any related field errors
                      if (fieldErrors.custom_start_date) {
                        setFieldErrors(prev => ({
                          ...prev,
                          custom_start_date: null
                        }));
                      }
                    }}
                    className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span>{t('transactions.customStartDate')}</span>
                </label>

                {useCustomStartDate && (
                  <div>
                    <label>{t('transactions.selectStartDate')}</label>
                    <div className="relative">
                      <button
                        type="button"
                        ref={startDateButtonRef}
                        onClick={() => setShowStartDateCalendar(!showStartDateCalendar)}
                        className={`w-full h-12 px-4 border ${fieldErrors.custom_start_date ? 'border-error' : 'border-gray-200'} rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none flex items-center justify-between`}
                      >
                        <span>{formData.custom_start_date || 'Select date'}</span>
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </button>

                      {showStartDateCalendar && (
                        <div className="absolute left-0 right-0 sm:left-auto sm:right-auto mt-2 z-20">
                          <CalendarWidget
                            selectedDate={formData.custom_start_date ? new Date(formData.custom_start_date) : getFirstDayOfMonth(new Date(formData.date))}
                            onDateSelect={handleStartDateSelect}
                            onClose={() => setShowStartDateCalendar(false)}
                            toggleRef={startDateButtonRef}
                          />
                        </div>
                      )}
                      
                      {fieldErrors.custom_start_date && (
                        <p className="mt-1 text-error text-sm flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {fieldErrors.custom_start_date}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This date determines when recurring calculations begin. 
                      For monthly transactions, this is typically the first day of the month.
                    </p>
                  </div>
                )}

                {/* End Date */}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useEndDate}
                    onChange={(e) => {
                      setUseEndDate(e.target.checked);
                      if (!e.target.checked) {
                        setFormData((prev) => ({
                          ...prev,
                          recurring_end_date: null,
                        }));
                      }
                      
                      // Clear any related field errors
                      if (fieldErrors.recurring_end_date) {
                        setFieldErrors(prev => ({
                          ...prev,
                          recurring_end_date: null
                        }));
                      }
                    }}
                    className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span>{t('transactions.endsOn')}</span>
                </label>

                {useEndDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('transactions.endsOn')}
                    </label>
                    <input
                      type="date"
                      name="recurring_end_date"
                      value={formData.recurring_end_date || ''}
                      onChange={handleChange}
                      className={`w-full h-12 px-4 border ${fieldErrors.recurring_end_date ? 'border-error' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    />
                    
                    {fieldErrors.recurring_end_date && (
                      <p className="mt-1 text-error text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {fieldErrors.recurring_end_date}
                      </p>
                    )}
                  </div>
                )}

                {/* Apply to future occurrences */}
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="updateFuture"
                    checked={formData.updateFuture}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t('transactions.updateFuture')}
                  </span>
                </label>
                
                {/* Display calculated daily amount */}
                {transaction && transaction.daily_amount && (
                  <div className="bg-primary-50 p-3 rounded-lg">
                    <p className="text-sm text-primary-700 font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Daily Amount: {formatAmount(transaction.daily_amount)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      This is the calculated daily equivalent of this recurring transaction.
                    </p>
                  </div>
                )}
                
                {/* Warning for large amounts */}
                {parseFloat(formData.amount) > 10000 && (
                  <div className="bg-warning-light p-3 rounded-lg">
                    <p className="text-sm text-warning-dark font-medium flex items-center">
                      <Info className="w-4 h-4 mr-1" />
                      Warning: Large Amount
                    </p>
                    <p className="text-xs text-warning-dark mt-1">
                      You're entering a large amount of {formatAmount(formData.amount)}. 
                      Please verify that this is correct.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between gap-4 rounded-b-2xl">
          {/* Delete options button */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowDeleteOptions(!showDeleteOptions)}
              className="p-3 text-error bg-error-light rounded-xl flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>{t('common.delete')}</span>
            </button>

            {/* Delete options dropdown */}
            {showDeleteOptions && (
              <div className="absolute mt-2 bg-white rounded-xl shadow-lg p-3 min-w-[220px] left-0 text-sm z-50 border border-gray-200">
                <div 
                  className="py-2 px-3 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => handleDelete('single')}
                >
                  {t('transactions.deleteThisOnly')}
                </div>
                {formData.is_recurring && (
                  <div 
                    className="py-2 px-3 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => handleDelete('future')}
                  >
                    {t('transactions.deleteThisAndFuture')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save and cancel buttons */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="p-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white transition-colors text-sm flex items-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              <span>{loading ? t('common.loading') : t('common.save')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionForm;