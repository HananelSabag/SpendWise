// components/features/transactions/TransactionForm.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Calendar,
  Tag,
  FileText,
  RefreshCw,
  Clock,
  AlertCircle,
  X,
  Check,
  ChevronDown,
  Info,
  Loader,
  TrendingUp, // הוסף ייבוא חסר
  TrendingDown // הוסף ייבוא חסר
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useDate } from '../../../context/DateContext';
import { cn, dateHelpers, numbers } from '../../../utils/helpers';
import { Input, Select, Button, Alert, Badge } from '../../ui';
import CalendarWidget from '../../common/CalendarWidget';
import toast from 'react-hot-toast';
import { useCategories } from '../../../hooks/useApi';
import Modal from '../../ui/Modal';
import CategoryManager from '../categories/CategoryManager';

/**
 * TransactionForm Component
 * Modern form for creating and editing transactions
 * Supports both one-time and recurring transactions
 */
const TransactionForm = ({ 
  transaction,
  onClose,
  onSave,
  loading = false,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { currency } = useCurrency();
  const { selectedDate } = useDate();
  const { data: allCategories = [], isLoading: categoriesLoading } = useCategories();
  const isRTL = language === 'he';
  
  const isEditing = !!transaction;
  
  // Form state
  const [formData, setFormData] = useState({
    transaction_type: transaction?.transaction_type || 'expense',
    amount: transaction?.amount || '',
    description: transaction?.description || '',
    date: transaction?.date || selectedDate.toISOString().split('T')[0],
    category_id: transaction?.category_id || null,
    is_recurring: transaction?.is_recurring || false,
    recurring_interval: transaction?.recurring_interval || 'monthly',
    recurring_end_date: transaction?.recurring_end_date || null,
    recurring_start_date: transaction?.recurring_start_date || null,
    updateFuture: false
  });
  
  const [errors, setErrors] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(formData.is_recurring);
  const [useEndDate, setUseEndDate] = useState(!!formData.recurring_end_date);
  const [saving, setSaving] = useState(false);
  const [convertToTemplate, setConvertToTemplate] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Categories
  // Remove hardcoded categories - use API data instead
  const currentCategories = allCategories.filter(cat => 
    cat.type === formData.transaction_type || cat.type === null || cat.name === 'General'
  );

  // Add default category selection logic
  useEffect(() => {
    if (currentCategories.length > 0 && !formData.category_id) {
      // Find General category or use first available
      const generalCategory = currentCategories.find(cat => cat.name === 'General');
      const defaultCategory = generalCategory || currentCategories[0];
      setFormData(prev => ({ ...prev, category_id: defaultCategory.id }));
    }
  }, [currentCategories, formData.category_id]);

  // Validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || numbers.parseAmount(formData.amount) <= 0) {
      newErrors.amount = t('actions.errors.invalidAmount');
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = t('forms.errors.descriptionRequired');
    }
    
    if (!formData.date) {
      newErrors.date = t('actions.errors.invalidDate');
    }
    
    if (formData.is_recurring && useEndDate && !formData.recurring_end_date) {
      newErrors.recurring_end_date = t('forms.errors.endDateRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const saveData = {
        ...formData,
        amount: numbers.parseAmount(formData.amount),
        recurring_end_date: useEndDate ? formData.recurring_end_date : null,
        category_id: formData.category_id || 9,
        day_of_week: formData.recurring_interval === 'weekly' ? dayOfWeek : null,
        day_of_month: formData.recurring_interval === 'monthly' ? new Date(formData.date).getDate() : null
      };
      
      // If converting to template, create both transaction and template
      if (convertToTemplate && !formData.is_recurring) {
        // First create the one-time transaction
        await onSave?.(saveData);
        
        // Then create the recurring template
        await onSave?.({
          ...saveData,
          is_recurring: true,
          recurring_interval: 'monthly',
          recurring_start_date: formData.date
        });
        
        toast.success(t('transactions.convertedToRecurring'));
      } else {
        await onSave?.(saveData);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  // Animation variants
  const formVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: {
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    }
  };

  return (
    <motion.div
      variants={formVariants}
      initial="initial"
      animate="animate"
      className={cn('space-y-6', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? t('transactions.editTransaction') : t('actions.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isEditing ? t('transactions.editTitle') : t('actions.fillDetails')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Transaction Type Tabs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('actions.selectType')}
          </label>
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {['expense', 'income'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('transaction_type', type)}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
                  formData.transaction_type === type
                    ? type === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-green-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {type === 'expense' ? (
                  <>
                    <TrendingDown className="w-4 h-4 inline mr-2" />
                    {t('transactions.expense')}
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    {t('transactions.income')}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <Input
            label={t('common.amount')}
            type="text"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="0.00"
            icon={DollarSign}
            error={errors.amount}
            required
            className="text-lg"
          />
        </div>

        {/* Description */}
        <div>
          <Input
            label={t('common.description')}
            type="text"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={t('actions.descriptionPlaceholder')}
            icon={FileText}
            error={errors.description}
            required
          />
        </div>

        {/* Date & Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.date')}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800',
                  'flex items-center justify-between transition-all',
                  errors.date 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  {dateHelpers.format(formData.date, 'PP', language)}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
              
              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 mt-2"
                  >
                    <CalendarWidget
                      selectedDate={new Date(formData.date)}
                      onDateSelect={(date) => {
                        handleChange('date', date.toISOString().split('T')[0]);
                        setShowCalendar(false);
                      }}
                      onClose={() => setShowCalendar(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.date}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('common.category')}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => setShowCategoryManager(true)}
                className="text-xs"
              >
                <Tag className="w-3 h-3 mr-1" />
                {t('categories.manage')}
              </Button>
            </div>
            {categoriesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <select
                value={formData.category_id || ''}
                onChange={(e) => handleChange('category_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                required
              >
                <option value="">{t('categories.selectCategory')}</option>
                {/* Group categories by type */}
                {formData.transaction_type === 'expense' && (
                  <optgroup label={t('transactions.expense')}>
                    {currentCategories.filter(cat => cat.type === 'expense' || cat.name === 'General').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.is_default ? t(`categories.${cat.name}`) : cat.name}
                        {cat.is_default && ' (Default)'}
                      </option>
                    ))}
                  </optgroup>
                )}
                {formData.transaction_type === 'income' && (
                  <optgroup label={t('transactions.income')}>
                    {currentCategories.filter(cat => cat.type === 'income' || cat.name === 'General').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.is_default ? t(`categories.${cat.name}`) : cat.name}
                        {cat.is_default && ' (Default)'}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}
            {!formData.category_id && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {t('categories.selectCategoryHint')}
              </p>
            )}
          </div>
        </div>

        {/* Recurring Toggle */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_recurring}
              onChange={(e) => {
                handleChange('is_recurring', e.target.checked);
                setShowRecurringOptions(e.target.checked);
              }}
              className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500"
            />
            <span className={cn(
              'text-sm font-medium text-gray-700 dark:text-gray-300',
              isRTL ? 'mr-3' : 'ml-3'
            )}>
              {t('transactions.recurring')}
            </span>
            <Badge variant="primary" size="small" className={cn(isRTL ? 'mr-2' : 'ml-2')}>
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('transactions.recurring')}
            </Badge>
          </label>

          {/* Recurring Options */}
          <AnimatePresence>
            {showRecurringOptions && formData.is_recurring && (
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="mt-4 space-y-4"
              >
                {/* Frequency */}
                <Select
                  label={t('transactions.frequency')}
                  value={formData.recurring_interval}
                  onChange={(e) => handleChange('recurring_interval', e.target.value)}
                  options={[
                    { value: 'daily', label: t('transactions.frequencies.daily') },
                    { value: 'weekly', label: t('transactions.frequencies.weekly') },
                    { value: 'monthly', label: t('transactions.frequencies.monthly') }
                  ]}
                />

                {/* Day of Week for Weekly Recurring */}
                {formData.is_recurring && formData.recurring_interval === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Day of Week
                    </label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      {[
                        { value: 0, label: 'Sunday' },
                        { value: 1, label: 'Monday' },
                        { value: 2, label: 'Tuesday' },
                        { value: 3, label: 'Wednesday' },
                        { value: 4, label: 'Thursday' },
                        { value: 5, label: 'Friday' },
                        { value: 6, label: 'Saturday' }
                      ].map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* End Date Option */}
                <div>
                  <label className="flex items-center cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={useEndDate}
                      onChange={(e) => setUseEndDate(e.target.checked)}
                      className="w-4 h-4 rounded text-primary-500"
                    />
                    <span className={cn(
                      'text-sm text-gray-700 dark:text-gray-300',
                      isRTL ? 'mr-2' : 'ml-2'
                    )}>
                      {t('transactions.endsOn')}
                    </span>
                  </label>
                  
                  {useEndDate && (
                    <Input
                      type="date"
                      value={formData.recurring_end_date || ''}
                      onChange={(e) => handleChange('recurring_end_date', e.target.value)}
                      min={formData.date}
                      error={errors.recurring_end_date}
                    />
                  )}
                </div>

                {/* Update Future Option for Editing */}
                {isEditing && (
                  <label className="flex items-start cursor-pointer p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.updateFuture}
                      onChange={(e) => handleChange('updateFuture', e.target.checked)}
                      className="w-4 h-4 rounded text-primary-500 mt-0.5"
                    />
                    <div className={cn(isRTL ? 'mr-3' : 'ml-3')}>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('transactions.updateFuture')}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('transactions.updateFutureDesc')}
                      </p>
                    </div>
                  </label>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Convert to Template - Only for new non-recurring transactions */}
        {!isEditing && !formData.is_recurring && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={convertToTemplate}
                onChange={(e) => setConvertToTemplate(e.target.checked)}
                className="w-5 h-5 rounded text-primary-500 focus:ring-primary-500"
              />
              <span className={cn(
                'text-sm font-medium text-gray-700 dark:text-gray-300',
                isRTL ? 'mr-3' : 'ml-3'
              )}>
                Create recurring template
              </span>
              <Badge variant="info" size="small" className={cn(isRTL ? 'mr-2' : 'ml-2')}>
                <Info className="w-3 h-3 mr-1" />
                {t('actions.new')}
              </Badge>
            </label>
            {convertToTemplate && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                This will create both a one-time transaction and a recurring template for future use.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            {t('common.cancel')}
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            loading={saving || loading}
            disabled={saving || loading}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {isEditing ? t('common.save') : t('actions.add')}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Category Manager Modal */}
      <Modal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        title={t('categories.manageCategories')}
        size="large"
      >
        <CategoryManager />
      </Modal>
    </motion.div>
  );
};

export default TransactionForm;