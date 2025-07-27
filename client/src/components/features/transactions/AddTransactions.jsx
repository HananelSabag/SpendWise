/**
 * ➕ ADD TRANSACTIONS - Mobile-First Transaction Creation
 * Features: Zustand stores, Multi-step form, Mobile-responsive, Enhanced validation
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  Save, 
  X, 
  DollarSign,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Repeat,
  Clock
} from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { 
  useAuth,
  useTranslation, 
  useCurrency,
  useNotifications,
  useTheme 
} from '../../../stores';

// API, hooks and components
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { useCategory } from '../../../hooks/useCategory';
import { Button, Input, Card, LoadingSpinner, Modal, Dropdown } from '../../ui';
import { cn } from '../../../utils/helpers';

const AddTransactions = ({ isOpen, onClose, onSuccess }) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { currency, formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const { isDark } = useTheme();

  // Hooks
  const { createTransaction, isLoading } = useTransactionActions();
  const { categories, loading: categoriesLoading } = useCategory();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    recurring: false,
    recurringPattern: 'monthly',
    recurringEndDate: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Form steps configuration
  const steps = [
    {
      id: 1,
      title: t('transactions.basicInfo', { fallback: 'Basic Information' }),
      description: t('transactions.basicInfoDesc', { fallback: 'Transaction type and amount' }),
      icon: DollarSign
    },
    {
      id: 2,
      title: t('transactions.details', { fallback: 'Details' }),
      description: t('transactions.detailsDesc', { fallback: 'Category and description' }),
      icon: Tag
    },
    {
      id: 3,
      title: t('transactions.schedule', { fallback: 'Schedule' }),
      description: t('transactions.scheduleDesc', { fallback: 'Date and recurring options' }),
      icon: Calendar
    },
    {
      id: 4,
      title: t('transactions.review', { fallback: 'Review' }),
      description: t('transactions.reviewDesc', { fallback: 'Confirm transaction details' }),
      icon: CheckCircle
    }
  ];

  // ✅ Transaction type options
  const typeOptions = [
    {
      value: 'income',
      label: t('transactions.income', { fallback: 'Income' }),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      value: 'expense',
      label: t('transactions.expense', { fallback: 'Expense' }),
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  // ✅ Recurring pattern options
  const recurringOptions = [
    { value: 'daily', label: t('transactions.daily', { fallback: 'Daily' }) },
    { value: 'weekly', label: t('transactions.weekly', { fallback: 'Weekly' }) },
    { value: 'monthly', label: t('transactions.monthly', { fallback: 'Monthly' }) },
    { value: 'yearly', label: t('transactions.yearly', { fallback: 'Yearly' }) }
  ];

  // ✅ Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        recurring: false,
        recurringPattern: 'monthly',
        recurringEndDate: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  // ✅ Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // ✅ Validate current step
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.amount) {
          newErrors.amount = t('transactions.amountRequired', { fallback: 'Amount is required' });
        } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
          newErrors.amount = t('transactions.amountInvalid', { fallback: 'Enter a valid amount' });
        }
        break;

      case 2:
        if (!formData.category) {
          newErrors.category = t('transactions.categoryRequired', { fallback: 'Category is required' });
        }
        if (formData.description && formData.description.length > 200) {
          newErrors.description = t('transactions.descriptionTooLong', { fallback: 'Description is too long' });
        }
        break;

      case 3:
        if (!formData.date) {
          newErrors.date = t('transactions.dateRequired', { fallback: 'Date is required' });
        }
        if (formData.recurring && formData.recurringEndDate && formData.recurringEndDate <= formData.date) {
          newErrors.recurringEndDate = t('transactions.endDateInvalid', { fallback: 'End date must be after start date' });
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Navigate to next step
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  // ✅ Navigate to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // ✅ Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id: user?.id
      };

      await createTransaction(transactionData);
      
      addNotification({
        type: 'success',
        message: t('transactions.createSuccess', { fallback: 'Transaction created successfully!' })
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        message: error.message || t('transactions.createFailed', { fallback: 'Failed to create transaction' })
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Prepare category options for dropdown
  const categoryOptions = categories?.map(cat => ({
    value: cat.id,
    label: cat.name,
    icon: cat.icon
  })) || [];

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('transactions.addNew', { fallback: 'Add Transaction' })}
      size="large"
      className="max-w-2xl"
    >
      <div className={cn('space-y-6', isRTL && 'rtl')}>
        {/* Step indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      isActive && 'border-primary-500 bg-primary-500 text-white',
                      isCompleted && 'border-green-500 bg-green-500 text-white',
                      !isActive && !isCompleted && 'border-gray-300 dark:border-gray-600 text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={cn(
                      'text-xs font-medium',
                      isActive && 'text-primary-600 dark:text-primary-400',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      !isActive && !isCompleted && 'text-gray-500 dark:text-gray-400'
                    )}>
                      {step.title}
                    </p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-colors',
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <Card className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {steps[0].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {steps[0].description}
                    </p>
                  </div>

                  {/* Transaction type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t('transactions.type', { fallback: 'Transaction Type' })}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {typeOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleInputChange('type', option.value)}
                          className={cn(
                            'p-4 rounded-lg border-2 transition-all text-center',
                            formData.type === option.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          )}
                        >
                          <div className={cn(
                            'flex flex-col items-center space-y-2',
                            formData.type === option.value ? option.color : 'text-gray-600 dark:text-gray-400'
                          )}>
                            {option.icon}
                            <span className="font-medium">{option.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <Input
                      label={t('transactions.amount', { fallback: 'Amount' })}
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      error={errors.amount}
                      placeholder="0.00"
                      icon={<DollarSign />}
                      fullWidth
                      size="lg"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('transactions.currencyNote', { currency, fallback: `Amount in ${currency}` })}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {steps[1].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {steps[1].description}
                    </p>
                  </div>

                  {/* Category */}
                  <Dropdown
                    label={t('transactions.category', { fallback: 'Category' })}
                    options={categoryOptions}
                    value={formData.category}
                    onChange={(value) => handleInputChange('category', value)}
                    placeholder={t('transactions.selectCategory', { fallback: 'Select a category' })}
                    error={errors.category}
                    searchable
                    fullWidth
                    icon={<Tag />}
                  />

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('transactions.description', { fallback: 'Description' })}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder={t('transactions.descriptionPlaceholder', { fallback: 'Optional description...' })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formData.description.length}/200 {t('common.characters', { fallback: 'characters' })}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Schedule */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {steps[2].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {steps[2].description}
                    </p>
                  </div>

                  {/* Date */}
                  <Input
                    label={t('transactions.date', { fallback: 'Date' })}
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    error={errors.date}
                    icon={<Calendar />}
                    fullWidth
                  />

                  {/* Recurring option */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="recurring"
                        checked={formData.recurring}
                        onChange={(e) => handleInputChange('recurring', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="recurring" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Repeat className="w-4 h-4 mr-1" />
                        {t('transactions.makeRecurring', { fallback: 'Make this a recurring transaction' })}
                      </label>
                    </div>

                    {/* Recurring options */}
                    <AnimatePresence>
                      {formData.recurring && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pl-6 border-l-2 border-primary-200 dark:border-primary-800"
                        >
                          <Dropdown
                            label={t('transactions.frequency', { fallback: 'Frequency' })}
                            options={recurringOptions}
                            value={formData.recurringPattern}
                            onChange={(value) => handleInputChange('recurringPattern', value)}
                            fullWidth
                            icon={<Clock />}
                          />

                          <Input
                            label={t('transactions.endDate', { fallback: 'End Date (Optional)' })}
                            type="date"
                            value={formData.recurringEndDate}
                            onChange={(e) => handleInputChange('recurringEndDate', e.target.value)}
                            error={errors.recurringEndDate}
                            min={formData.date}
                            fullWidth
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {steps[3].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {steps[3].description}
                    </p>
                  </div>

                  {/* Transaction preview */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('transactions.type', { fallback: 'Type' })}
                      </span>
                      <div className="flex items-center space-x-2">
                        {formData.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={cn(
                          'font-medium capitalize',
                          formData.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {typeOptions.find(opt => opt.value === formData.type)?.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('transactions.amount', { fallback: 'Amount' })}
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(parseFloat(formData.amount) || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('transactions.category', { fallback: 'Category' })}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {categoryOptions.find(cat => cat.value === formData.category)?.label || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('transactions.date', { fallback: 'Date' })}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(formData.date).toLocaleDateString()}
                      </span>
                    </div>

                    {formData.description && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                          {t('transactions.description', { fallback: 'Description' })}
                        </span>
                        <p className="text-gray-900 dark:text-white">
                          {formData.description}
                        </p>
                      </div>
                    )}

                    {formData.recurring && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2 mb-2">
                          <Repeat className="w-4 h-4 text-primary-500" />
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {t('transactions.recurringTransaction', { fallback: 'Recurring Transaction' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('transactions.recurringEvery', { 
                            frequency: recurringOptions.find(opt => opt.value === formData.recurringPattern)?.label,
                            fallback: `Repeats ${recurringOptions.find(opt => opt.value === formData.recurringPattern)?.label.toLowerCase()}`
                          })}
                          {formData.recurringEndDate && (
                            <>
                              {' '}{t('transactions.until', { fallback: 'until' })}{' '}
                              {new Date(formData.recurringEndDate).toLocaleDateString()}
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : prevStep}
            icon={currentStep === 1 ? <X /> : <ArrowLeft />}
          >
            {currentStep === 1 
              ? t('common.cancel', { fallback: 'Cancel' })
              : t('common.back', { fallback: 'Back' })
            }
          </Button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('common.step', { current: currentStep, total: steps.length, fallback: `${currentStep} of ${steps.length}` })}
          </div>

          <Button
            onClick={currentStep === steps.length ? handleSubmit : nextStep}
            loading={isSubmitting}
            disabled={isSubmitting || (currentStep === 2 && categoriesLoading)}
            icon={currentStep === steps.length ? <Save /> : <ArrowRight />}
            iconPosition="right"
          >
            {currentStep === steps.length 
              ? t('transactions.create', { fallback: 'Create Transaction' })
              : t('common.next', { fallback: 'Next' })
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddTransactions;