// components/features/transactions/TransactionFilters.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Calendar,
  DollarSign,
  Tag,
  RefreshCw,
  X,
  Check,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Search
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { cn } from '../../../utils/helpers';
import { Input, Button, Badge } from '../../ui';
import CalendarWidget from '../../common/CalendarWidget';

/**
 * TransactionFilters Component
 * Advanced filtering system for transactions
 * Supports multiple filter types with modern UI
 */
const TransactionFilters = ({ 
  filters = {},
  onChange,
  onReset,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    type: true,
    categories: false,
    amount: false,
    date: false,
    recurring: false
  });

  // Categories list
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

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    onChange?.({
      ...filters,
      [key]: value
    });
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.type && filters.type !== 'all') count++;
    if (filters.categories?.length > 0) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.recurring !== 'all') count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  // Animation variants
  const sectionVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      transition: {
        opacity: { duration: 0.2 },
        height: { duration: 0.3, ease: "easeInOut" }
      }
    },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: {
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    }
  };

  const FilterSection = ({ title, icon: Icon, section, children }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-700 dark:text-gray-300">{title}</span>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-gray-400 transition-transform',
          expandedSections[section] && 'rotate-180'
        )} />
      </button>
      
      <AnimatePresence>
        {expandedSections[section] && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="px-4 pb-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-sm', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('transactions.filters.title')}
            </h3>
            {activeCount > 0 && (
              <Badge variant="primary" size="small">
                {activeCount}
              </Badge>
            )}
          </div>
          
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="small"
              onClick={onReset}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4 mr-1" />
              {t('common.reset')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div>
        {/* Transaction Type */}
        <FilterSection
          title={t('transactions.filters.type')}
          icon={DollarSign}
          section="type"
        >
          <div className="flex gap-2 mt-3">
            {['all', 'income', 'expense'].map(type => (
              <button
                key={type}
                onClick={() => handleFilterChange('type', type)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg font-medium transition-all',
                  filters.type === type || (!filters.type && type === 'all')
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                )}
              >
                {type === 'all' && t('common.all')}
                {type === 'income' && (
                  <>
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    {t('home.balance.income')}
                  </>
                )}
                {type === 'expense' && (
                  <>
                    <TrendingDown className="w-4 h-4 inline mr-1" />
                    {t('home.balance.expenses')}
                  </>
                )}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Categories */}
        <FilterSection
          title={t('categories.title')}
          icon={Tag}
          section="categories"
        >
          <div className="grid grid-cols-2 gap-2 mt-3">
            {categories.map(category => {
              const isSelected = filters.categories?.includes(category.id);
              
              return (
                <label
                  key={category.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                    isSelected
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...(filters.categories || []), category.id]
                        : (filters.categories || []).filter(id => id !== category.id);
                      handleFilterChange('categories', newCategories);
                    }}
                    className="w-4 h-4 rounded text-primary-500"
                  />
                  <span className="text-sm">
                    {t(`categories.${category.name}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* Amount Range */}
        <FilterSection
          title={t('transactions.filters.amountRange')}
          icon={DollarSign}
          section="amount"
        >
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input
              type="number"
              placeholder={t('transactions.filters.minAmount')}
              value={filters.minAmount || ''}
              onChange={(e) => handleFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : null)}
              icon={DollarSign}
            />
            <Input
              type="number"
              placeholder={t('transactions.filters.maxAmount')}
              value={filters.maxAmount || ''}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
              icon={DollarSign}
            />
          </div>
        </FilterSection>

        {/* Date Range */}
        <FilterSection
          title={t('transactions.filters.dateRange')}
          icon={Calendar}
          section="date"
        >
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                {t('transactions.filters.startDate')}
              </label>
              <button
                onClick={() => {
                  setDatePickerType('start');
                  setShowDatePicker(true);
                }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
              >
                {filters.startDate ? 
                  new Date(filters.startDate).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US') : 
                  t('transactions.selectDate')
                }
              </button>
            </div>
            
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                {t('transactions.filters.endDate')}
              </label>
              <button
                onClick={() => {
                  setDatePickerType('end');
                  setShowDatePicker(true);
                }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
              >
                {filters.endDate ? 
                  new Date(filters.endDate).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US') : 
                  t('transactions.selectDate')
                }
              </button>
            </div>
          </div>
        </FilterSection>

        {/* Recurring Filter */}
        <FilterSection
          title={t('transactions.filters.recurringType')}
          icon={RefreshCw}
          section="recurring"
        >
          <div className="flex gap-2 mt-3">
            {['all', 'recurring', 'oneTime'].map(type => (
              <button
                key={type}
                onClick={() => handleFilterChange('recurring', type)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  filters.recurring === type || (!filters.recurring && type === 'all')
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                )}
              >
                {t(`transactions.filters.${type}`)}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDatePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CalendarWidget
                selectedDate={
                  datePickerType === 'start' && filters.startDate
                    ? new Date(filters.startDate)
                    : datePickerType === 'end' && filters.endDate
                    ? new Date(filters.endDate)
                    : new Date()
                }
                onDateSelect={(date) => {
                  handleFilterChange(
                    datePickerType === 'start' ? 'startDate' : 'endDate',
                    date.toISOString().split('T')[0]
                  );
                  setShowDatePicker(false);
                }}
                onClose={() => setShowDatePicker(false)}
                minDate={datePickerType === 'end' && filters.startDate ? new Date(filters.startDate) : undefined}
                maxDate={datePickerType === 'start' && filters.endDate ? new Date(filters.endDate) : undefined}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionFilters;