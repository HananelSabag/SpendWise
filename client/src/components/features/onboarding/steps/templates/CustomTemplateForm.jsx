/**
 * 📝 CUSTOM TEMPLATE FORM - Template Creation Form
 * Extracted from massive InitialTemplatesStep.jsx for better organization
 * Features: Form validation, Real-time preview, Category selection, Mobile-first
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, TrendingUp, TrendingDown, Save, 
  AlertCircle, CheckCircle, DollarSign 
} from 'lucide-react';

// ✅ Import stores and components
import { useTranslation, useCurrency, useNotifications } from '../../../../../stores';
import { Button, Input, Card, Badge, Dropdown } from '../../../../ui';
import { cn } from '../../../../../utils/helpers';

/**
 * 📝 Custom Template Form Component
 */
const CustomTemplateForm = ({
  isOpen = false,
  initialData = null,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');
  const { formatCurrency, currentCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  // ✅ Form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'other',
    frequency: 'monthly',
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Validation rules
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = t('templates.validation.descriptionRequired');
    } else if (formData.description.length < 3) {
      newErrors.description = t('templates.validation.descriptionTooShort');
    } else if (formData.description.length > 50) {
      newErrors.description = t('templates.validation.descriptionTooLong');
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = t('templates.validation.amountRequired');
    } else if (formData.amount > 1000000) {
      newErrors.amount = t('templates.validation.amountTooLarge');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // ✅ Handle form field changes
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // ✅ Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const templateData = {
        id: `custom_${Date.now()}`,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        frequency: formData.frequency,
        icon: formData.type === 'income' ? TrendingUp : TrendingDown,
        color: formData.type === 'income' ? 'text-green-600' : 'text-red-600',
        bgColor: formData.type === 'income' 
          ? 'bg-green-100 dark:bg-green-900/20' 
          : 'bg-red-100 dark:bg-red-900/20',
        isCustom: true,
        tags: ['custom'],
        priority: 999
      };

      await onSubmit?.(templateData);

      // Reset form
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        category: 'other',
        frequency: 'monthly'
      });

      addNotification({
        type: 'success',
        message: t('templates.customCreated'),
        duration: 3000
      });

    } catch (error) {
      console.error('Failed to create custom template:', error);
      addNotification({
        type: 'error',
        message: t('templates.createFailed'),
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, addNotification, t]);

  // ✅ Category options
  const categoryOptions = [
    { value: 'salary', label: t('categories.salary') },
    { value: 'freelance', label: t('categories.freelance') },
    { value: 'investment', label: t('categories.investment') },
    { value: 'housing', label: t('categories.housing') },
    { value: 'utilities', label: t('categories.utilities') },
    { value: 'food', label: t('categories.food') },
    { value: 'transportation', label: t('categories.transportation') },
    { value: 'healthcare', label: t('categories.healthcare') },
    { value: 'entertainment', label: t('categories.entertainment') },
    { value: 'shopping', label: t('categories.shopping') },
    { value: 'education', label: t('categories.education') },
    { value: 'travel', label: t('categories.travel') },
    { value: 'other', label: t('categories.other') }
  ];

  // ✅ Frequency options
  const frequencyOptions = [
    { value: 'weekly', label: t('frequencies.weekly') },
    { value: 'monthly', label: t('frequencies.monthly') },
    { value: 'quarterly', label: t('frequencies.quarterly') },
    { value: 'yearly', label: t('frequencies.yearly') }
  ];

  // ✅ Form validation state
  const isValid = useMemo(() => {
    return formData.description.trim() && 
           formData.amount > 0 && 
           Object.keys(errors).length === 0;
  }, [formData, errors]);

  // ✅ Animation variants
  const formVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn("w-full", className)}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        <Card className="p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>{t('templates.createCustom')}</span>
            </h3>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('templates.form.description')} *
              </label>
              <Input
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder={t('templates.form.descriptionPlaceholder')}
                error={errors.description}
                className="w-full"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.description}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('templates.form.amount')} *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || '')}
                    placeholder="0.00"
                    error={errors.amount}
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.amount}</span>
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('templates.form.type')} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('type', 'expense')}
                    className={cn(
                      "flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all",
                      formData.type === 'expense'
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-300"
                    )}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('templateTypes.expense')}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleFieldChange('type', 'income')}
                    className={cn(
                      "flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all",
                      formData.type === 'income'
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-300"
                    )}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('templateTypes.income')}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('templates.form.category')}
                </label>
                <Dropdown
                  value={formData.category}
                  onValueChange={(value) => handleFieldChange('category', value)}
                  options={categoryOptions}
                  placeholder={t('templates.form.selectCategory')}
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('templates.form.frequency')}
                </label>
                <Dropdown
                  value={formData.frequency}
                  onValueChange={(value) => handleFieldChange('frequency', value)}
                  options={frequencyOptions}
                  placeholder={t('templates.form.selectFrequency')}
                />
              </div>
            </div>

            {/* Preview */}
            {formData.description && formData.amount > 0 && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('templates.form.preview')}:
                </p>
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    formData.type === 'income' 
                      ? "bg-green-100 dark:bg-green-900/20" 
                      : "bg-red-100 dark:bg-red-900/20"
                  )}>
                    {formData.type === 'income' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formData.description}
                    </div>
                    <div className={cn(
                      "text-sm font-medium",
                      formData.type === 'income' ? "text-green-600" : "text-red-600"
                    )}>
                      {formData.type === 'income' ? '+' : '-'}
                      {formatCurrency(formData.amount)} / {t(`frequencies.${formData.frequency}`)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                loading={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  t('templates.creating')
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('templates.create')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomTemplateForm; 