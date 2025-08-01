/**
 * ✏️ RECURRING EDIT MODAL - עריכה מתקדמת לעסקאות חוזרות
 * מודל לעריכת עסקאות חוזרות עם אפשרויות להשפיע על עתידיות
 * Features: עריכה גמישה, השפעה על עתידיות, תצוגה מקדימה של שינויים
 * @version 1.0.0 - בהתאם לבקשת המשתמש
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, Target, Calendar, Clock, Save, X, 
  CheckCircle, AlertTriangle, Info, Zap
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useNotifications,
  useCurrency
} from '../../../../stores';

import { Modal, Button, Card, Badge } from '../../../ui';
import TransactionFormTabs from '../forms/TransactionFormTabs';
import { cn } from '../../../../utils/helpers';

/**
 * ✏️ Recurring Edit Modal Component
 */
const RecurringEditModal = ({
  isOpen = false,
  onClose,
  transaction,
  onEditConfirm,
  isLoading = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('transactions');
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  
  const [editScope, setEditScope] = useState('current');
  const [formData, setFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Edit scope options
  const editOptions = [
    {
      id: 'current',
      icon: Calendar,
      title: t('edit.options.current.title', { fallback: 'ערוך עסקה זו בלבד' }),
      subtitle: t('edit.options.current.subtitle', { fallback: 'השאר את התבנית החוזרת ללא שינוי' }),
      description: t('edit.options.current.description', { fallback: 'ערוך רק את העסקה הנוכחית מבלי להשפיע על עתידיות' }),
      impact: 'minimal',
      color: 'blue'
    },
    {
      id: 'future',
      icon: Target,
      title: t('edit.options.future.title', { fallback: 'ערוך מהיום ואילך' }),
      subtitle: t('edit.options.future.subtitle', { fallback: 'עדכן את התבנית עבור העתיד' }),
      description: t('edit.options.future.description', { fallback: 'ערוך את העסקה הנוכחית ועדכן את התבנית לעסקאות עתידיות' }),
      impact: 'moderate',
      color: 'orange'
    },
    {
      id: 'all',
      icon: Edit3,
      title: t('edit.options.all.title', { fallback: 'ערוך את כל התבנית' }),
      subtitle: t('edit.options.all.subtitle', { fallback: 'עדכן עבר, הווה ועתיד' }),
      description: t('edit.options.all.description', { fallback: 'עדכן את התבנית החוזרת ואת כל העסקאות הקיימות' }),
      impact: 'extensive',
      color: 'purple'
    }
  ];

  const selectedOption = editOptions.find(opt => opt.id === editScope);

  // ✅ Calculate impact preview
  const impactPreview = useMemo(() => {
    if (!transaction || !formData) return null;

    const today = new Date();
    const amount = Math.abs(formData.amount || transaction.amount || 0);
    
    switch (editScope) {
      case 'current':
        return {
          transactionsAffected: 1,
          futureTransactions: t('edit.preview.noChange', { fallback: 'ללא שינוי' }),
          templateStatus: t('edit.preview.unchanged', { fallback: 'נשאר ללא שינוי' }),
          warning: null
        };
      
      case 'future':
        return {
          transactionsAffected: '1+',
          futureTransactions: t('edit.preview.willUpdate', { fallback: 'יעודכנו לפי השינויים' }),
          templateStatus: t('edit.preview.updated', { fallback: 'יעודכן' }),
          warning: t('edit.preview.futureWarning', { fallback: 'עסקאות עתידיות יושפעו מהשינויים' })
        };
      
      case 'all':
        return {
          transactionsAffected: t('edit.preview.allTransactions', { fallback: 'כל העסקאות' }),
          futureTransactions: t('edit.preview.retroactiveUpdate', { fallback: 'עדכון רטרואקטיבי' }),
          templateStatus: t('edit.preview.completeUpdate', { fallback: 'עדכון מלא' }),
          warning: t('edit.preview.extensiveWarning', { fallback: 'שינוי נרחב - יקח זמן לטעינה' })
        };
      
      default:
        return null;
    }
  }, [editScope, transaction, formData, t]);

  // ✅ Handle form data change
  const handleFormDataChange = useCallback((data) => {
    setFormData(data);
  }, []);

  // ✅ Handle edit confirmation
  const handleEdit = useCallback(async () => {
    if (!transaction || !selectedOption || !formData) return;

    setIsSubmitting(true);
    
    try {
      await onEditConfirm({
        transactionId: transaction.id,
        templateId: transaction.template_id,
        editScope: editScope,
        formData: formData,
        transaction
      });
      
      addNotification({
        type: 'success',
        message: t(`edit.success.${editScope}`, { 
          fallback: 'העסקה עודכנה בהצלחה' 
        }),
        duration: 3000
      });
      
      onClose?.();
      
    } catch (error) {
      console.error('Edit failed:', error);
      addNotification({
        type: 'error',
        message: error.message || t('edit.error', { fallback: 'עריכה נכשלה' }),
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [transaction, selectedOption, formData, editScope, onEditConfirm, addNotification, t, onClose]);

  // ✅ Handle modal close
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setEditScope('current'); // Reset to default
    setFormData(null);
    onClose?.();
  }, [isSubmitting, onClose]);

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="4xl"
      className={className}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Edit3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('edit.modal.title', { fallback: 'עריכת עסקה חוזרת' })}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {transaction.description}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left Side - Edit Scope Selection */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('edit.selectScope', { fallback: 'בחר היקף העריכה:' })}
            </h3>
            
            <div className="space-y-3">
              {editOptions.map((option) => {
                const OptionIcon = option.icon;
                const isSelected = editScope === option.id;
                
                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    onClick={() => setEditScope(option.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "w-full p-3 rounded-xl border-2 transition-all duration-200 text-right rtl:text-right",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isSelected ? [
                        option.color === 'blue' 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 focus:ring-blue-500"
                          : option.color === 'orange'
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 focus:ring-orange-500"
                            : "border-purple-500 bg-purple-50 dark:bg-purple-900/30 focus:ring-purple-500"
                      ] : [
                        "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700",
                        "hover:border-gray-300 dark:hover:border-gray-500"
                      ]
                    )}
                  >
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        isSelected ? [
                          option.color === 'blue'
                            ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300"
                            : option.color === 'orange'
                              ? "bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300"
                              : "bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300"
                        ] : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      )}>
                        <OptionIcon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 text-right rtl:text-right">
                        <h4 className={cn(
                          "font-semibold text-sm",
                          isSelected ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                        )}>
                          {option.title}
                        </h4>
                        
                        <p className={cn(
                          "text-xs mt-0.5",
                          isSelected ? [
                            option.color === 'blue' ? "text-blue-600 dark:text-blue-300"
                            : option.color === 'orange' ? "text-orange-600 dark:text-orange-300" 
                            : "text-purple-600 dark:text-purple-300"
                          ] : "text-gray-500 dark:text-gray-400"
                        )}>
                          {option.subtitle}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Impact Preview */}
            {impactPreview && (
              <Card className={cn(
                "p-3 mt-4",
                selectedOption?.color === 'blue' 
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                  : selectedOption?.color === 'orange'
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700"
                    : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
              )}>
                <div className="flex items-start space-x-2 rtl:space-x-reverse">
                  <Info className={cn(
                    "w-4 h-4 flex-shrink-0 mt-0.5",
                    selectedOption?.color === 'blue' ? "text-blue-600 dark:text-blue-400"
                    : selectedOption?.color === 'orange' ? "text-orange-600 dark:text-orange-400"
                    : "text-purple-600 dark:text-purple-400"
                  )} />
                  
                  <div className="flex-1">
                    <h4 className={cn(
                      "font-medium text-xs mb-1",
                      selectedOption?.color === 'blue' ? "text-blue-800 dark:text-blue-200"
                      : selectedOption?.color === 'orange' ? "text-orange-800 dark:text-orange-200"
                      : "text-purple-800 dark:text-purple-200"
                    )}>
                      {t('edit.preview.title', { fallback: 'השפעת השינוי:' })}
                    </h4>
                    
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('edit.preview.affected', { fallback: 'מושפע:' })}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white ml-1">
                          {impactPreview.transactionsAffected}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('edit.preview.template', { fallback: 'תבנית:' })}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white ml-1">
                          {impactPreview.templateStatus}
                        </span>
                      </div>
                    </div>
                    
                    {impactPreview.warning && (
                      <div className={cn(
                        "mt-2 p-1.5 rounded text-xs font-medium",
                        selectedOption?.color === 'purple' 
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                      )}>
                        ⚠️ {impactPreview.warning}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Side - Transaction Form */}
          <div className="lg:col-span-2">
            <TransactionFormTabs
              mode="edit"
              initialData={transaction}
              onSubmit={handleFormDataChange}
              onCancel={handleClose}
              isLoading={isSubmitting}
              className="border-0 shadow-none p-0"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-2.5"
          >
            <X className="w-4 h-4 mr-2" />
            {t('actions.cancel')}
          </Button>

          <Button
            variant="primary"
            onClick={handleEdit}
            disabled={isSubmitting || isLoading || !formData}
            className={cn(
              "min-w-[140px] px-6 py-2.5",
              selectedOption?.color === 'blue' 
                ? "bg-blue-600 hover:bg-blue-700"
                : selectedOption?.color === 'orange'
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-purple-600 hover:bg-purple-700"
            )}
          >
            {isSubmitting ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                {t('actions.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {selectedOption?.title || t('actions.save')}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default RecurringEditModal;