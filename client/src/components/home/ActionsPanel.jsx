// ActionsPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { CalendarIcon, Plus, X, ArrowUpRight, ArrowDownRight, Repeat, Clock, Loader } from 'lucide-react';
import CalendarWidget from '../home/Transactions/CalendarWidget';

/**
 * ActionsPanel Component
 * Handles adding new transactions with type-specific category filtering
 */
const ActionsPanel = ({ selectedDate }) => {

  // Core hooks
  const { addTransaction, loading } = useTransactions();
  const { t, language } = useLanguage();
  const { formatAmount, currencySymbol } = useCurrency();
  const isHebrew = language === 'he';
  const dateButtonRef = useRef(null);

  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category_id: 1,
    isRecurring: false,
    frequency: 'monthly',
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);


  // Update form date when selectedDate changes
  useEffect(() => {
    if (!selectedDate) {
      console.warn("No selectedDate received, using default date.");
    }
    const defaultDate = selectedDate || new Date();
    defaultDate.setHours(12, 0, 0, 0);

    setFormData(prev => ({
      ...prev,
      date: defaultDate.toISOString().split('T')[0]
    }));
  }, [selectedDate]);


  const handleDateSelect = (date) => {
    console.log("Selected date:", date);
    setFormData(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
    setShowCalendar(false);
  };


  // Categories configuration based on database structure
  // Each category has a specific type (income/expense) or null for general use
  const categories = [
    // Income categories
    { id: 1, label: 'Salary', description: 'Regular employment income', icon: 'briefcase', type: 'income' },
    { id: 2, label: 'Freelance', description: 'Project-based income', icon: 'laptop', type: 'income' },
    { id: 3, label: 'Investments', description: 'Investment returns', icon: 'trending-up', type: 'income' },

    // Expense categories
    { id: 4, label: 'Rent', description: 'Housing expenses', icon: 'home', type: 'expense' },
    { id: 5, label: 'Groceries', description: 'Food and household items', icon: 'shopping-cart', type: 'expense' },
    { id: 6, label: 'Transportation', description: 'Bus and fuel costs', icon: 'car', type: 'expense' },
    { id: 7, label: 'Utilities', description: 'Electricity, water, internet', icon: 'zap', type: 'expense' },
    { id: 8, label: 'Entertainment', description: 'Movies, games, hobbies', icon: 'music', type: 'expense' },

    // General category for both types
    { id: 9, label: 'General', description: 'General purpose transactions', icon: 'circle', type: null }
  ];

  // Transaction type tabs configuration
  const tabs = [
    {
      id: 'oneTimeExpense',
      icon: ArrowDownRight,
      title: t('actions.oneTimeExpense'),
      color: 'text-error'
    },
    {
      id: 'recurringExpense',
      icon: Repeat,
      title: t('actions.recurringExpense'),
      color: 'text-error'
    },
    {
      id: 'oneTimeIncome',
      icon: ArrowUpRight,
      title: t('actions.oneTimeIncome'),
      color: 'text-success'
    },
    {
      id: 'recurringIncome',
      icon: Clock,
      title: t('actions.recurringIncome'),
      color: 'text-success'
    }
  ];

  /**
   * Filters categories based on transaction type
   */
  const getRelevantCategories = (transactionType) => {
    return categories.filter(cat =>
      cat.type === transactionType || cat.type === null
    );
  };

  /**
   * Handles tab selection and form reset
   */
  const handleTabClick = (tabId) => {
    const type = tabId.includes('Income') ? 'income' : 'expense';
    const relevantCategories = getRelevantCategories(type);

    setActiveTab(tabId);
    setFormData({
      ...formData,
      type: type,
      isRecurring: tabId.includes('recurring'),
      description: '',
      amount: '',
      category_id: relevantCategories[0]?.id || 9
    });
    setError('');
  };

  /**
   * Form submission handler
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError(t('actions.errors.amountRequired'));
      return;
    }

    if (loading) return;

    try {
      const processedData = {
        ...formData,
        amount: parseFloat(formData.amount),
        description: formData.description || getDefaultDescription(activeTab),
        recurring_interval: formData.isRecurring ? formData.frequency : null,
        recurring_amount: formData.isRecurring ? parseFloat(formData.amount) : null,
        is_recurring: formData.isRecurring
      };

      await addTransaction(processedData);
      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error submitting transaction:', err);
      setError(t('actions.errors.addingTransaction'));
    }
  };

  /**
   * Gets default description based on transaction type
   */
  const getDefaultDescription = (tabId) => {
    const type = tabId.includes('Income') ? 'income' : 'expense';
    return t(`actions.default.${type}`);
  };

  /**
   * Resets form to initial state
   */
  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      category_id: 1,
      isRecurring: false,
      frequency: 'monthly',
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setActiveTab(null);
    setError('');
  };

  // Get categories relevant to current transaction type
  const currentCategories = getRelevantCategories(formData.type);
  return (
    <div className="relative">
      {/* Add Transaction Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-6 bg-white/90 text-primary-600 rounded-xl shadow-md hover:bg-white/95 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span className="text-lg font-medium">{t('actions.buttontitle')}</span>
      </button>
   
      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center md:items-center">
          {/* Modal Container */}
          <div
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 md:max-w-2xl md:mx-auto overflow-hidden
                       max-h-[90vh] mt-16 md:mt-0 overflow-y-auto"
            dir={isHebrew ? 'rtl' : 'ltr'}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
              className={`absolute top-4 ${isHebrew ? 'left-4' : 'right-4'} 
                         p-2 bg-white text-gray-500 hover:bg-gray-100 rounded-full transition
                         z-50`}
            >
              <X className="w-5 h-5" />
            </button>
   
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-primary-400 to-primary-500 p-6 rounded-t-2xl text-white">
              <h2 className="text-2xl font-bold">{t('actions.title')}</h2>
              <p className="mt-2 text-sm opacity-90">{t('actions.panel.subtitle')}</p>
            </div>
   
            {/* Modal Content */}
            <div className="p-6">
              {/* Transaction Type Tabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
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
   
              {/* Transaction Form */}
              {activeTab && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('actions.amount')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        ₪
                      </span>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => {
                          setFormData({ ...formData, amount: e.target.value });
                          setError('');
                        }}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        placeholder={t('actions.amountPlaceholder')}
                        disabled={loading}
                      />
                    </div>
                  </div>
   
                  {/* Description Input */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('actions.description')}
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      placeholder={t('actions.descriptionPlaceholder')}
                      disabled={loading}
                    />
                  </div>
   
                  {/* Category Select */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('actions.category')}
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category_id: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      disabled={loading}
                    >
                      {currentCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {t(`categories.${category.label}`)}
                        </option>
                      ))}
                    </select>
                  </div>
   
                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm font-medium mb-1 flex justify-between">
                      <span>{t('transactions.selectDate')}</span>
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
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`absolute ${isHebrew ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`}
                      >
                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                      </button>
   
                      {/* Calendar Popup */}
                      {showCalendar && (
                        <div className="absolute left-0 bottom-full mb-2 bg-white shadow-lg rounded-lg z-50">
                          <CalendarWidget
                            selectedDate={new Date(formData.date)}
                            onDateSelect={(date) => {
                              setFormData({
                                ...formData,
                                date: date.toISOString().split("T")[0],
                              });
                              setShowCalendar(false);
                            }}
                            onClose={() => setShowCalendar(false)}
                            toggleRef={dateButtonRef}
                          />
                        </div>
                      )}
                    </div>
                  </div>
   
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        {t('actions.add')}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
   );



};

export default ActionsPanel;