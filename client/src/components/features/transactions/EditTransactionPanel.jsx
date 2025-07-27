/**
 * ✏️ EDIT TRANSACTION PANEL - MOBILE-FIRST
 * Enhanced transaction editing with better UX
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3, Save, X, TrendingUp, TrendingDown, Calendar,
  Tag, Receipt, Clock, AlertCircle, CheckCircle, Repeat,
  Copy, Trash2, MoreVertical, FileText, Camera
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useCurrency,
  useTheme,
  useNotifications,
  useCategory
} from '../../../stores';

import { Button, Input, Card, Badge, Dropdown, Modal, Tooltip } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

const EditTransactionPanel = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  onDelete,
  onDuplicate,
  mode = 'edit', // edit, duplicate, template
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency, currency } = useCurrency();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { categories, addCategory } = useCategory();

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    notes: '',
    receipt_url: null,
    is_recurring: false,
    recurring_frequency: 'monthly',
    recurring_interval: 1
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description || '',
        amount: Math.abs(transaction.amount || 0).toString(),
        type: transaction.type || (transaction.amount > 0 ? 'income' : 'expense'),
        category_id: transaction.category_id || '',
        date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
        tags: transaction.tags || [],
        notes: transaction.notes || '',
        receipt_url: transaction.receipt_url || null,
        is_recurring: transaction.is_recurring || false,
        recurring_frequency: transaction.recurring_frequency || 'monthly',
        recurring_interval: transaction.recurring_interval || 1
      });
    }
  }, [transaction]);

  // Get title based on mode and transaction type
  const getTitle = useMemo(() => {
    if (mode === 'duplicate') {
      return t('edit.duplicate.title');
    } else if (mode === 'template') {
      return t('edit.template.title');
    } else if (transaction?.is_recurring) {
      return t('edit.recurring.title');
    } else {
      return t('edit.title');
    }
  }, [mode, transaction, t]);

  // Categories filtered by type
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.type === formData.type || cat.type === 'both');
  }, [categories, formData.type]);

  // Update form data
  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Clear related validation errors
    if (validationErrors) {
      const newErrors = { ...validationErrors };
      Object.keys(updates).forEach(key => {
        delete newErrors[key];
      });
      setValidationErrors(newErrors);
    }
  }, [validationErrors]);

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.description.trim()) {
      errors.description = t('validation.descriptionRequired');
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = t('validation.amountRequired');
    }

    if (!formData.category_id) {
      errors.category_id = t('validation.categoryRequired');
    }

    if (!formData.date) {
      errors.date = t('validation.dateRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      addNotification({
        type: 'error',
        title: t('validation.pleaseFixErrors'),
        duration: 4000
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const saveData = {
        ...formData,
        amount: parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1),
        id: mode === 'duplicate' ? undefined : transaction?.id
      };

      await onSave(saveData);

      const successMessage = mode === 'duplicate' 
        ? t('success.transactionDuplicated')
        : t('success.transactionUpdated');

      addNotification({
        type: 'success',
        title: successMessage,
        duration: 3000
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('errors.savingFailed'),
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSave, mode, transaction, addNotification, t, onClose]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!transaction || !onDelete) return;

    setIsSubmitting(true);
    try {
      await onDelete(transaction.id);
      
      addNotification({
        type: 'success',
        title: t('success.transactionDeleted'),
        duration: 3000
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('errors.deletingFailed'),
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  }, [transaction, onDelete, addNotification, t, onClose]);

  // Handle duplicate
  const handleDuplicate = useCallback(async () => {
    if (!transaction || !onDuplicate) return;

    try {
      await onDuplicate(transaction);
      
      addNotification({
        type: 'success',
        title: t('success.transactionDuplicated'),
        duration: 3000
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('errors.duplicateFailed'),
        description: error.message,
        duration: 5000
      });
    }
  }, [transaction, onDuplicate, addNotification, t, onClose]);

  // Handle receipt upload
  const handleReceiptUpload = useCallback(async (file) => {
    if (!file) return;

    setUploadingReceipt(true);
    try {
      // ✅ IMPLEMENTED: Real file upload functionality
      const formData = new FormData();
      formData.append('file', file);
      formData.append('transactionId', formData.id || 'temp');
      formData.append('type', 'receipt');

      const response = await api.transactions.uploadAttachment(formData);
      const uploadedFile = response.data;
      
      updateFormData({ 
        receipt_url: uploadedFile.url,
        receipt_filename: uploadedFile.filename 
      });
      
      addNotification({
        type: 'success',
        title: t('success.receiptUploaded'),
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('errors.receiptUploadFailed'),
        message: error.message,
        duration: 5000
      });
    } finally {
      setUploadingReceipt(false);
    }
  }, [updateFormData, t, addNotification]);

  // Quick actions dropdown items
  const quickActions = [
    {
      label: t('actions.duplicate'),
      icon: Copy,
      onClick: handleDuplicate,
      disabled: !onDuplicate
    },
    {
      label: t('actions.delete'),
      icon: Trash2,
      onClick: () => setShowDeleteConfirm(true),
      variant: 'destructive',
      disabled: !onDelete || mode === 'duplicate'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle}
      maxWidth="2xl"
    >
      <div 
        className="space-y-6"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Header with quick actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Type indicator */}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              formData.type === 'income' 
                ? "bg-green-100 dark:bg-green-900/20" 
                : "bg-red-100 dark:bg-red-900/20"
            )}>
              {formData.type === 'income' ? (
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {getTitle}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" size="xs">
                  {t(`types.${formData.type}`)}
                </Badge>
                
                {formData.is_recurring && (
                  <Badge variant="secondary" size="xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {t('labels.recurring')}
                  </Badge>
                )}
                
                {formData.receipt_url && (
                  <Badge variant="secondary" size="xs">
                    <Receipt className="w-3 h-3 mr-1" />
                    {t('labels.hasReceipt')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          {mode === 'edit' && transaction && (
            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              }
              items={quickActions}
            />
          )}
        </div>

        {/* Transaction type selector */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={formData.type === 'income' ? 'primary' : 'outline'}
            onClick={() => updateFormData({ type: 'income', category_id: '' })}
            className="h-16 flex flex-col items-center justify-center"
          >
            <TrendingUp className="w-6 h-6 mb-1" />
            {t('types.income')}
          </Button>
          
          <Button
            variant={formData.type === 'expense' ? 'primary' : 'outline'}
            onClick={() => updateFormData({ type: 'expense', category_id: '' })}
            className="h-16 flex flex-col items-center justify-center"
          >
            <TrendingDown className="w-6 h-6 mb-1" />
            {t('types.expense')}
          </Button>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            {/* Description */}
            <Input
              label={t('fields.description')}
              placeholder={t('placeholders.description')}
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              error={validationErrors.description}
              required
            />

            {/* Amount */}
            <Input
              label={t('fields.amount')}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => updateFormData({ amount: e.target.value })}
              error={validationErrors.amount}
              required
              suffix={currency}
            />

            {/* Date */}
            <Input
              label={t('fields.date')}
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData({ date: e.target.value })}
              error={validationErrors.date}
              required
            />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fields.category')} *
              </label>
              
              <select
                value={formData.category_id}
                onChange={(e) => updateFormData({ category_id: e.target.value })}
                className={cn(
                  "w-full p-3 border rounded-lg bg-white dark:bg-gray-800",
                  "border-gray-200 dark:border-gray-700",
                  "text-gray-900 dark:text-white",
                  "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  validationErrors.category_id && "border-red-500"
                )}
                required
              >
                <option value="">{t('placeholders.selectCategory')}</option>
                {filteredCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              {validationErrors.category_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.category_id}
                </p>
              )}
            </div>

            {/* Tags */}
            <Input
              label={t('fields.tags')}
              placeholder={t('placeholders.addTags')}
              value={formData.tags.join(', ')}
              onChange={(e) => updateFormData({ 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              })}
            />

            {/* Receipt upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fields.receipt')}
              </label>
              
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleReceiptUpload(e.target.files[0])}
                  className="hidden"
                  id="receipt-upload"
                />
                
                <label
                  htmlFor="receipt-upload"
                  className={cn(
                    "flex-1 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                    "flex items-center justify-center space-x-2",
                    uploadingReceipt && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Camera className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.receipt_url ? t('receipts.change') : t('receipts.upload')}
                  </span>
                </label>

                {formData.receipt_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFormData({ receipt_url: null })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('fields.notes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            placeholder={t('placeholders.notes')}
            rows={3}
            className={cn(
              "w-full p-3 border rounded-lg bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-white",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "resize-none"
            )}
          />
        </div>

        {/* Recurring options */}
        {formData.is_recurring && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center space-x-2 mb-3">
              <Repeat className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                {t('recurring.settings')}
              </h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  {t('recurring.frequency.title')}
                </label>
                <select
                  value={formData.recurring_frequency}
                  onChange={(e) => updateFormData({ recurring_frequency: e.target.value })}
                  className="w-full p-2 border border-blue-200 dark:border-blue-700 rounded bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="daily">{t('recurring.frequency.daily')}</option>
                  <option value="weekly">{t('recurring.frequency.weekly')}</option>
                  <option value="monthly">{t('recurring.frequency.monthly')}</option>
                  <option value="yearly">{t('recurring.frequency.yearly')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  {t('recurring.interval.title')}
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.recurring_interval}
                  onChange={(e) => updateFormData({ recurring_interval: parseInt(e.target.value) || 1 })}
                  className="text-sm"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            {t('actions.cancel')}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting 
              ? t('loading.saving') 
              : mode === 'duplicate' 
                ? t('actions.create')
                : t('actions.save')
            }
          </Button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('delete.title')}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                {t('delete.description')}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {t('delete.warning')}
              </p>
            </div>
          </div>

          {/* Transaction details */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {formData.description}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {dateHelpers.format(formData.date, 'MMM DD, YYYY')}
                </p>
              </div>
              <Badge 
                variant={formData.type === 'income' ? 'success' : 'destructive'}
                className="text-lg font-bold"
              >
                {formData.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(formData.amount) || 0)}
              </Badge>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              {t('actions.cancel')}
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('delete.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default EditTransactionPanel;