/**
 * 📝 TRANSACTION FORM FIELDS - SHARED COMPONENTS
 * Eliminates massive duplication between Add/Edit/Recurring forms
 * Features: Consistent UX, Validation, Mobile-first, Accessibility
 * @version 3.0.0 - NEW CLEAN ARCHITECTURE
 */

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Tag, FileText, Clock, Repeat, Settings
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useCurrency
} from '../../../../stores';

// ✅ Import form inputs (to be created)
import AmountInput from '../inputs/AmountInput';
import CategorySelector from '../inputs/CategorySelector';
import DateTimePicker from '../inputs/DateTimePicker';
import TransactionTypeToggle from '../inputs/TransactionTypeToggle';
import TagsInput from '../inputs/TagsInput';
import NotesInput from '../inputs/NotesInput';

import { Card, Switch, Badge } from '../../../ui';
import { getFieldError } from './TransactionValidation';
import { TRANSACTION_TYPES } from './TransactionHelpers';
import { cn } from '../../../../utils/helpers';

/**
 * 📝 Transaction Form Fields Component
 */
const TransactionFormFields = ({
  formData,
  validationErrors = {},
  onFieldChange,
  showRecurring = true,
  showAdvanced = true,
  mode = 'create',
  className = ''
}) => {
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency } = useCurrency();

  // ✅ Field change handler
  const handleFieldChange = useCallback((field, value) => {
    onFieldChange?.(field, value);
  }, [onFieldChange]);

  // ✅ Animation variants
  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  // ✅ Render basic transaction fields
  const renderBasicFields = () => (
    <div className="space-y-6">
      {/* Transaction Type & Amount Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={fieldVariants}>
          <TransactionTypeToggle
            value={formData.type}
            onChange={(type) => handleFieldChange('type', type)}
            error={getFieldError('type', validationErrors)}
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <AmountInput
            value={formData.amount}
            onChange={(amount) => handleFieldChange('amount', amount)}
            type={formData.type}
            error={getFieldError('amount', validationErrors)}
            required
          />
        </motion.div>
      </div>

      {/* Description */}
      <motion.div variants={fieldVariants}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('fields.description.label')} *
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            placeholder={t('fields.description.placeholder')}
            className={cn(
              "w-full px-4 py-3 border rounded-lg",
              "bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500 dark:placeholder-gray-400",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              getFieldError('description', validationErrors)
                ? "border-red-300 dark:border-red-600"
                : "border-gray-300 dark:border-gray-600"
            )}
          />
          {getFieldError('description', validationErrors) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {getFieldError('description', validationErrors)}
            </p>
          )}
        </div>
      </motion.div>

      {/* Category & Date Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={fieldVariants}>
          <CategorySelector
            value={formData.categoryId}
            onChange={(categoryId) => handleFieldChange('categoryId', categoryId)}
            transactionType={formData.type}
            error={getFieldError('categoryId', validationErrors)}
            required
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <DateTimePicker
            date={formData.date}
            time={formData.time}
            onDateChange={(date) => handleFieldChange('date', date)}
            onTimeChange={(time) => handleFieldChange('time', time)}
            error={getFieldError('date', validationErrors)}
            required
          />
        </motion.div>
      </div>
    </div>
  );

  // ✅ Render recurring fields
  const renderRecurringFields = () => {
    if (!showRecurring) return null;

    return (
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
        <div className="space-y-4">
          {/* Recurring Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {t('fields.recurring.title')}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('fields.recurring.description')}
                </p>
              </div>
            </div>
            
            <Switch
              checked={formData.isRecurring}
              onCheckedChange={(checked) => handleFieldChange('isRecurring', checked)}
            />
          </div>

          {/* Recurring Options */}
          {formData.isRecurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pl-7"
            >
              {/* Frequency & Interval */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('fields.recurring.frequency')}
                  </label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => handleFieldChange('recurringFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="daily">{t('frequencies.daily')}</option>
                    <option value="weekly">{t('frequencies.weekly')}</option>
                    <option value="monthly">{t('frequencies.monthly')}</option>
                    <option value="yearly">{t('frequencies.yearly')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('fields.recurring.interval')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.recurringInterval}
                    onChange={(e) => handleFieldChange('recurringInterval', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* End Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('fields.recurring.endType')}
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="endType"
                      value="never"
                      checked={formData.recurringEndType === 'never'}
                      onChange={(e) => handleFieldChange('recurringEndType', e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t('endTypes.never')}
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="endType"
                      value="date"
                      checked={formData.recurringEndType === 'date'}
                      onChange={(e) => handleFieldChange('recurringEndType', e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t('endTypes.date')}
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="endType"
                      value="occurrences"
                      checked={formData.recurringEndType === 'occurrences'}
                      onChange={(e) => handleFieldChange('recurringEndType', e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t('endTypes.occurrences')}
                    </span>
                  </label>
                </div>
              </div>

              {/* End Date or Max Occurrences */}
              {formData.recurringEndType === 'date' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('fields.recurring.endDate')}
                  </label>
                  <input
                    type="date"
                    value={formData.recurringEndDate}
                    onChange={(e) => handleFieldChange('recurringEndDate', e.target.value)}
                    min={formData.date}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {formData.recurringEndType === 'occurrences' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('fields.recurring.maxOccurrences')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={formData.recurringMaxOccurrences}
                    onChange={(e) => handleFieldChange('recurringMaxOccurrences', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </Card>
    );
  };

  // ✅ Render advanced fields
  const renderAdvancedFields = () => {
    if (!showAdvanced) return null;

    return (
      <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">
              {t('fields.advanced.title')}
            </h4>
          </div>

          {/* Tags */}
          <motion.div variants={fieldVariants}>
            <TagsInput
              value={formData.tags}
              onChange={(tags) => handleFieldChange('tags', tags)}
            />
          </motion.div>

          {/* Notes */}
          <motion.div variants={fieldVariants}>
            <NotesInput
              value={formData.notes}
              onChange={(notes) => handleFieldChange('notes', notes)}
            />
          </motion.div>
        </div>
      </Card>
    );
  };

  return (
    <motion.div
      className={cn("space-y-6", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Basic Fields */}
      {renderBasicFields()}

      {/* Recurring Fields */}
      {renderRecurringFields()}

      {/* Advanced Fields */}
      {renderAdvancedFields()}
    </motion.div>
  );
};

export default TransactionFormFields; 