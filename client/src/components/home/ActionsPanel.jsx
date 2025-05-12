// components/home/ActionsPanel.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useDate } from '../../context/DateContext';
import {
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Clock,
  Loader,
  CalendarIcon,
  ChevronDown,
  AlertCircle,
  Calendar,
  Info
} from 'lucide-react';
import CalendarWidget from './Transactions/CalendarWidget';
import { validateTransactionAmount, formatAmountInput } from '../../utils/validation';

const ActionsPanel = () => {
  const { createTransaction, loading: globalLoading } = useTransactions();
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const { selectedDate } = useDate();
  const isHebrew = language === 'he';
  
  // Refs for date pickers
  const dateButtonRef = useRef(null);
  const startDateButtonRef = useRef(null);
  const modalRef = useRef(null);

  // Modal and form states
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For controlling optional dates
  const [useEndDate, setUseEndDate] = useState(false);
  const [useCustomStartDate, setUseCustomStartDate] = useState(false);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get first day of month for default start date
  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date);
    firstDay.setDate(1);
    firstDay.setHours(12, 0, 0, 0);
    return firstDay;
  };

  // Transaction form data
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category_id: 9,
    is_recurring: false,
    recurring_interval: 'monthly',
    recurring_end_date: null,
    date: selectedDate.toISOString().split('T')[0],
    custom_start_date: getFirstDayOfMonth(selectedDate).toISOString().split('T')[0],
  });

  // Example categories
  const categories = [
    { id: 1, name: 'Salary', type: 'income' },
    { id: 2, name: 'Freelance', type: 'income' },
    { id: 3, name: 'Investments', type: 'income' },
    { id: 4, name: 'Rent', type: 'expense' },
    { id: 5, name: 'Groceries', type: 'expense' },
    { id: 6, name: 'Transportation', type: 'expense' },
    { id: 7, name: 'Utilities', type: 'expense' },
    { id: 8, name: 'Entertainment', type: 'expense' },
    { id: 9, name: 'General', type: null },
  ];

  // Transaction type tabs
  const transactionTypes = [
    {
      id: 'oneTimeExpense',
      icon: ArrowDownRight,
      title: t('actions.oneTimeExpense'),
      type: 'expense',
      isRecurring: false,
      color: 'text-error',
    },
    {
      id: 'recurringExpense',
      icon: Repeat,
      title: t('actions.recurringExpense'),
      type: 'expense',
      isRecurring: true,
      color: 'text-error',
    },
    {
      id: 'oneTimeIncome',
      icon: ArrowUpRight,
      title: t('actions.oneTimeIncome'),
      type: 'income',
      isRecurring: false,
      color: 'text-success',
    },
    {
      id: 'recurringIncome',
      icon: Clock,
      title: t('actions.recurringIncome'),
      type: 'income',
      isRecurring: true,
      color: 'text-success',
    },
  ];

  /**
   * handleTabClick
   * Switch form to the desired transaction type (one-time/recurring, expense/income)
   * Resets form data with appropriate defaults based on selection
   */
  const handleTabClick = useCallback(
    (tabConfig) => {
      setActiveTab(tabConfig.id);
      
      // Set default category based on type
      const defaultCategoryId = tabConfig.type === 'income' ? 1 : 4;
      
      // Get appropriate dates
      const transactionDate = selectedDate.toISOString().split('T')[0];
      const firstDayOfMonth = getFirstDayOfMonth(selectedDate).toISOString().split('T')[0];
      
      // Reset form with new defaults
      setFormData((prev) => ({
        ...prev,
        type: tabConfig.type,
        is_recurring: tabConfig.isRecurring,
        description: '',
        amount: '',
        category_id: defaultCategoryId,
        recurring_interval: 'monthly',
        recurring_end_date: null,
        // For transaction date, use the current selected date
        date: transactionDate,
        // For recurring calculations, always default to first day of month
        custom_start_date: firstDayOfMonth,
      }));
      
      // Reset optional fields
      setUseEndDate(false);
      // For recurring transactions, default to using custom start date off (will use 1st of month automatically)
      setUseCustomStartDate(false);
      setError('');
    },
    [selectedDate]
  );

  /**
   * handleInputChange
   * Generic change handler for form fields with validation
   */
  const handleInputChange = (fieldName, value) => {
    // Apply special validation for amount field
    if (fieldName === 'amount') {
      // Format and validate the amount
      const formatted = formatAmountInput(value);
      
      // Update form data with the formatted amount
      setFormData((prev) => ({
        ...prev,
        [fieldName]: formatted,
      }));
      
      // Clear error when user is typing
      setError('');
    } else {
      // For non-amount fields, just update normally
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
      setError('');
    }
  };

  /**
   * handleDateSelect
   * Updates transaction date in form data from the calendar
   */
  const handleDateSelect = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setFormData((prev) => ({
      ...prev,
      date: formattedDate,
    }));
    
    setShowCalendar(false);
  };

  /**
   * handleStartDateSelect
   * Updates custom start date for recurring transactions
   */
  const handleStartDateSelect = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setFormData((prev) => ({
      ...prev,
      custom_start_date: formattedDate,
    }));
    setShowStartDateCalendar(false);
  };

  /**
   * handleSubmit
   * Validates input and calls createTransaction
   * For recurring transactions, includes custom_start_date if specified
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate amount
    const amountError = validateTransactionAmount(formData.amount, language);
    if (amountError) {
      setError(amountError);
      return;
    }
    
    // Don't allow duplicate submissions while loading
    if (loading || globalLoading) return;

    try {
      setLoading(true);
      
      // Prepare form data for submission
      const submissionData = {
        ...formData,
        // For recurring transactions, use first day of month by default
        // Only use custom_start_date if explicitly set
        custom_start_date: formData.is_recurring 
          ? (useCustomStartDate ? formData.custom_start_date : getFirstDayOfMonth(new Date(formData.date)).toISOString().split('T')[0])
          : null,
        // Only include recurring_end_date if checkbox is checked
        recurring_end_date: useEndDate ? formData.recurring_end_date : null,
      };

      await createTransaction(submissionData.type, submissionData);
      
      // Reset form after successful submission
      setIsOpen(false);
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category_id: 9,
        is_recurring: false,
        recurring_interval: 'monthly',
        recurring_end_date: null,
        date: selectedDate.toISOString().split('T')[0],
        custom_start_date: getFirstDayOfMonth(selectedDate).toISOString().split('T')[0],
      });
      setActiveTab(null);
      setUseEndDate(false);
      setUseCustomStartDate(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || t('actions.errors.addingTransaction'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Button to open the panel */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-6 bg-white/90 text-primary-600 rounded-xl shadow-md 
                   hover:bg-white/95 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span className="text-lg font-medium">{t('actions.buttontitle')}</span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          {/* Main container with max-width */}
          <div 
            ref={modalRef}
            className="relative w-full max-w-3xl rounded-2xl shadow-xl border border-primary-300 mx-2 sm:mx-0 max-h-[90vh] flex flex-col"
            dir={isHebrew ? 'rtl' : 'ltr'}
          >
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-primary-400 to-primary-500 px-6 py-4 sm:py-6 rounded-t-2xl flex-shrink-0">
              {/* Title & Close Button row */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {t('actions.title')}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {t('actions.panel.subtitle')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setActiveTab(null);
                  }}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition"
                >
                  <X className="w-5 h-5 text-primary-600" />
                </button>
              </div>
            </div>

            {/* Content area - scrollable */}
            <div className="bg-white rounded-b-2xl overflow-y-auto flex-1">
              {/* Tabs Grid */}
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {transactionTypes.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        activeTab === tab.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <tab.icon className={`w-6 h-6 mb-2 ${tab.color}`} />
                      <span className="text-sm font-medium block">{tab.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form - only appears when a tab is active */}
              {activeTab && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('actions.amount')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="w-full h-12 pl-8 pr-4 rounded-xl border border-gray-200
                                 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        placeholder={t('actions.amountPlaceholder')}
                      />
                      {/* Currency symbol */}
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {formatAmount(0).replace(/[0-9]/g, '')}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('actions.description')}
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200
                               focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      placeholder={t('actions.descriptionPlaceholder')}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('actions.category')}
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => handleInputChange('category_id', e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200
                               focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      {categories
                        .filter((c) => c.type === formData.type || c.type === null)
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {t(`categories.${cat.name}`)}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('transactions.selectDate')}
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        ref={dateButtonRef}
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white
                                 focus:ring-2 focus:ring-primary-500 focus:outline-none
                                 flex items-center justify-between"
                      >
                        <span>{formData.date}</span>
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                      </button>

                      {showCalendar && (
                        <div className="absolute inset-x-0 sm:inset-auto sm:right-0 mt-2 z-10">
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
                  {formData.is_recurring && (
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('actions.frequency')}
                        </label>
                        <select
                          value={formData.recurring_interval}
                          onChange={(e) => handleInputChange('recurring_interval', e.target.value)}
                          className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        >
                          <option value="daily">{t('actions.frequencies.daily')}</option>
                          <option value="weekly">{t('actions.frequencies.weekly')}</option>
                          <option value="monthly">{t('actions.frequencies.monthly')}</option>
                        </select>
                      </div>

                      {/* Default date notice */}
                      {formData.recurring_interval === 'monthly' && !useCustomStartDate && (
                        <div className="flex items-start gap-2 text-sm bg-primary-50 p-3 rounded-lg">
                          <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-primary-700">Using 1st day of the month for calculations</p>
                            <p className="text-xs text-primary-600 opacity-80 mt-1">
                              For monthly recurring transactions, calculations use the 1st day of the month by default.
                              Enable Custom Start Date to change this.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Custom Start Date option */}
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={useCustomStartDate}
                          onChange={(e) => {
                            setUseCustomStartDate(e.target.checked);
                            if (e.target.checked && !formData.custom_start_date) {
                              const firstOfMonth = getFirstDayOfMonth(new Date(formData.date));
                              setFormData((prev) => ({
                                ...prev,
                                custom_start_date: firstOfMonth.toISOString().split('T')[0]
                              }));
                            }
                          }}
                          className="rounded text-primary-500 focus:ring-primary-500"
                        />
                        <span>Custom Start Date</span>
                      </label>

                      {useCustomStartDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Start Date
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              ref={startDateButtonRef}
                              onClick={() => setShowStartDateCalendar(!showStartDateCalendar)}
                              className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none flex items-center justify-between"
                            >
                              <span>{formData.custom_start_date}</span>
                              <Calendar className="w-5 h-5 text-gray-400" />
                            </button>

                            {showStartDateCalendar && (
                              <div className="absolute inset-x-0 sm:inset-auto sm:right-0 mt-2 z-20">
                                <CalendarWidget
                                  selectedDate={new Date(formData.custom_start_date)}
                                  onDateSelect={handleStartDateSelect}
                                  onClose={() => setShowStartDateCalendar(false)}
                                  toggleRef={startDateButtonRef}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            This date determines when recurring calculations begin. 
                            For monthly transactions, this is typically the first day of the month.
                          </p>
                        </div>
                      )}

                      {/* End Date option */}
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
                          }}
                          className="rounded text-primary-500 focus:ring-primary-500"
                        />
                        <span>{t('transactions.endsOn')}</span>
                      </label>

                      {useEndDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('transactions.endsOn')}
                          </label>
                          <input
                            type="date"
                            value={formData.recurring_end_date || ''}
                            onChange={(e) => handleInputChange('recurring_end_date', e.target.value)}
                            className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Action Bar */}
              {activeTab && (
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setActiveTab(null);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm mr-2 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!formData.amount || loading || !!error}
                    className={`px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 text-sm rounded-xl transition-colors flex items-center gap-2 ${
                      !formData.amount || loading || !!error ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      t('actions.add')
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsPanel;