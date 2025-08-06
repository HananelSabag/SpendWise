/**
 * 🏷️ CATEGORY FORM - MAIN ORCHESTRATOR
 * New clean architecture foundation - follows successful Transaction Redesign pattern
 * Features: Shared state management, Consistent UX, Mobile-first, Validation
 * @version 3.0.0 - CATEGORY REDESIGN
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useNotifications
} from '../../../../stores';

import { Button, LoadingSpinner } from '../../../ui';
import CategoryFormFields from './CategoryFormFields';
import { validateCategory, getValidationErrors } from './CategoryValidation';
import { formatCategoryForAPI, getDefaultCategoryData } from './CategoryHelpers';
import { cn } from '../../../../utils/helpers';

/**
 * 🏷️ Main Category Form Component
 */
const CategoryForm = ({
  mode = 'create', // create, edit, duplicate
  initialData = null,
  onSubmit,
  onCancel,
  onClose,
  isLoading = false,
  showAdvanced = true,
  className = ''
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('categories');
  const { addNotification } = useNotifications();

  // ✅ Centralized form state
  const [formData, setFormData] = useState(() => 
    getDefaultCategoryData(initialData, mode)
  );
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ✅ Form validation
  const { isValid, errors } = useMemo(() => {
    const validation = validateCategory(formData);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }, [formData]);

  // Update validation errors when form changes
  useEffect(() => {
    if (isDirty) {
      setValidationErrors(errors);
    }
  }, [errors, isDirty]);

  // ✅ Handle close modal
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (onCancel) {
      onCancel();
    }
  }, [onClose, onCancel]);

  // ✅ Handle form field changes
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (!isDirty) {
      setIsDirty(true);
    }

    // Clear specific field error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [isDirty, validationErrors]);

  // ✅ Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsDirty(true);

    // Validate form
    const validation = validateCategory(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      addNotification({
        type: 'error',
        message: t('form.validationFailed'),
        duration: 3000
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format data for API
      const apiData = formatCategoryForAPI(formData, mode);
      
      // Submit to parent
      await onSubmit?.(apiData);
      
      addNotification({
        type: 'success',
        message: t(mode === 'create' ? 'form.createSuccess' : 'form.updateSuccess'),
        duration: 3000
      });
      
      // Close modal after successful submission
      handleClose();
      
    } catch (error) {
      console.error('Category submission failed:', error);
      addNotification({
        type: 'error',
        message: t('form.submitFailed'),
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, onSubmit, addNotification, t]);

  // ✅ Handle cancel
  const handleCancel = useCallback(() => {
    if (isDirty) {
      // NOTE: Confirmation dialog for category deletion could enhance user safety
      const confirmed = window.confirm(t('form.unsavedChanges'));
      if (!confirmed) return;
    }
    
    onCancel?.();
  }, [isDirty, onCancel, t]);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const fieldVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700",
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Form Status */}
      <div className="flex items-center justify-end space-x-2 mb-4">
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-1 text-orange-600 dark:text-orange-400"
          >
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">{t('form.unsaved')}</span>
          </motion.div>
        )}
        
        {!isValid && isDirty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-1 text-red-600 dark:text-red-400"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{t('form.invalid')}</span>
          </motion.div>
        )}
        
        {isValid && isDirty && !isSubmitting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-1 text-green-600 dark:text-green-400"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{t('form.valid')}</span>
          </motion.div>
        )}
      </div>

      {/* Form Fields */}
      <motion.div variants={fieldVariants}>
        <CategoryFormFields
          formData={formData}
          validationErrors={validationErrors}
          onFieldChange={handleFieldChange}
          showAdvanced={showAdvanced}
          mode={mode}
        />
      </motion.div>

      {/* Form Actions */}
      <motion.div 
        className="flex items-center justify-end space-x-3 pt-6 mt-8 border-t border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting || isLoading}
          className="px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
        >
          <X className="w-4 h-4 mr-2" />
          {t('form.cancel')}
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || isSubmitting || isLoading}
          className={cn(
            "px-8 py-2.5 rounded-xl font-medium min-w-[140px] transition-all duration-200",
            "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
            "shadow-lg hover:shadow-xl transform hover:scale-105",
            "disabled:from-gray-400 disabled:to-gray-500 disabled:transform-none disabled:shadow-none"
          )}
        >
          {isSubmitting || isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSubmitting 
            ? t('form.saving')
            : mode === 'create' 
              ? t('form.create')
              : t('form.update')
          }
        </Button>
      </motion.div>
    </motion.form>
  );
};

export default CategoryForm; 