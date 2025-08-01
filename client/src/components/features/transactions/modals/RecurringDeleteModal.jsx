/**
 * 🗑️ RECURRING DELETE MODAL - אפשרויות מחיקה מתקדמות
 * מודל למחיקת עסקאות חוזרות עם אפשרויות גמישות
 * Features: מחיקה חלקית, הוויזואליזציה של ההשפעה, אישור מתקדם
 * @version 1.0.0 - בהתאם לבקשת המשתמש
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, AlertTriangle, Calendar, Target, 
  X, CheckCircle, Clock, Zap, Info
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useNotifications,
  useCurrency
} from '../../../../stores';

import { Modal, Button, Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🗑️ Recurring Delete Modal Component
 */
const RecurringDeleteModal = ({
  isOpen = false,
  onClose,
  transaction,
  onDeleteConfirm,
  isLoading = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('transactions');
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  
  const [selectedOption, setSelectedOption] = useState('current');
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Delete options
  const deleteOptions = [
    {
      id: 'current',
      icon: Calendar,
      title: t('delete.options.current.title', { fallback: 'מחק עסקה זו בלבד' }),
      subtitle: t('delete.options.current.subtitle', { fallback: 'השאר את התבנית החוזרת פעילה' }),
      description: t('delete.options.current.description', { fallback: 'מחק רק את העסקה הנוכחית ושמור על העסקאות העתידיות' }),
      impact: 'minimal',
      color: 'green'
    },
    {
      id: 'future',
      icon: Target,
      title: t('delete.options.future.title', { fallback: 'מחק עסקאות עתידיות' }),
      subtitle: t('delete.options.future.subtitle', { fallback: 'עצור את החזרות מהיום' }),
      description: t('delete.options.future.description', { fallback: 'מחק את העסקה הנוכחית ועצור את כל החזרות העתידיות' }),
      impact: 'moderate',
      color: 'orange'
    },
    {
      id: 'all',
      icon: Trash2,
      title: t('delete.options.all.title', { fallback: 'מחק הכל' }),
      subtitle: t('delete.options.all.subtitle', { fallback: 'מחק את כל התבנית החוזרת' }),
      description: t('delete.options.all.description', { fallback: 'מחק את התבנית החוזרת ואת כל העסקאות (עבר, הווה ועתיד)' }),
      impact: 'severe',
      color: 'red'
    }
  ];

  const selectedOptionData = deleteOptions.find(opt => opt.id === selectedOption);

  // ✅ Calculate impact preview
  const impactPreview = useMemo(() => {
    if (!transaction) return null;

    const today = new Date();
    const amount = Math.abs(transaction.amount || 0);
    
    switch (selectedOption) {
      case 'current':
        return {
          transactionsAffected: 1,
          futureTransactions: t('delete.preview.willContinue', { fallback: 'ימשיכו כרגיל' }),
          totalAmount: amount,
          warning: null
        };
      
      case 'future':
        return {
          transactionsAffected: '1+',
          futureTransactions: t('delete.preview.willStop', { fallback: 'יעצרו מהיום' }),
          totalAmount: `${formatCurrency(amount)}+`,
          warning: t('delete.preview.futureWarning', { fallback: 'לא ניתן לשחזר עסקאות עתידיות' })
        };
      
      case 'all':
        return {
          transactionsAffected: t('delete.preview.allTransactions', { fallback: 'כל העסקאות' }),
          futureTransactions: t('delete.preview.templateDeleted', { fallback: 'התבנית תימחק לחלוטין' }),
          totalAmount: t('delete.preview.fullTemplate', { fallback: 'כל התבנית' }),
          warning: t('delete.preview.permanentWarning', { fallback: 'פעולה בלתי הפיכה - לא ניתן לשחזר!' })
        };
      
      default:
        return null;
    }
  }, [selectedOption, transaction, formatCurrency, t]);

  // ✅ Handle delete confirmation
  const handleDelete = useCallback(async () => {
    if (!transaction || !selectedOptionData) return;

    setIsDeleting(true);
    
    try {
      await onDeleteConfirm({
        transactionId: transaction.id,
        templateId: transaction.template_id,
        deleteType: selectedOption,
        transaction
      });
      
      addNotification({
        type: 'success',
        message: t(`delete.success.${selectedOption}`, { 
          fallback: 'העסקה נמחקה בהצלחה' 
        }),
        duration: 3000
      });
      
      onClose?.();
      
    } catch (error) {
      console.error('Delete failed:', error);
      addNotification({
        type: 'error',
        message: error.message || t('delete.error', { fallback: 'מחיקה נכשלה' }),
        duration: 4000
      });
    } finally {
      setIsDeleting(false);
    }
  }, [transaction, selectedOptionData, selectedOption, onDeleteConfirm, addNotification, t, onClose]);

  // ✅ Handle modal close
  const handleClose = useCallback(() => {
    if (isDeleting) return;
    setSelectedOption('current'); // Reset to default
    onClose?.();
  }, [isDeleting, onClose]);

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="2xl"
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
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('delete.modal.title', { fallback: 'מחיקת עסקה חוזרת' })}
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
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                {t('delete.warning.title', { fallback: 'זו עסקה חוזרת!' })}
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t('delete.warning.description', { fallback: 'בחר את אפשרות המחיקה המתאימה לפני המשך' })}
              </p>
            </div>
          </div>
        </div>

        {/* Delete Options */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('delete.selectOption', { fallback: 'בחר אפשרות מחיקה:' })}
          </h3>
          
          <div className="space-y-3">
            {deleteOptions.map((option) => {
              const OptionIcon = option.icon;
              const isSelected = selectedOption === option.id;
              
              return (
                <motion.button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOption(option.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 transition-all duration-200 text-right rtl:text-right",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    isSelected ? [
                      option.color === 'green' 
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30 focus:ring-green-500"
                        : option.color === 'orange'
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 focus:ring-orange-500"
                          : "border-red-500 bg-red-50 dark:bg-red-900/30 focus:ring-red-500"
                    ] : [
                      "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700",
                      "hover:border-gray-300 dark:hover:border-gray-500"
                    ]
                  )}
                >
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      isSelected ? [
                        option.color === 'green'
                          ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300"
                          : option.color === 'orange'
                            ? "bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300"
                            : "bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300"
                      ] : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    )}>
                      <OptionIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 text-right rtl:text-right">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <h4 className={cn(
                            "font-semibold text-base",
                            isSelected ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                          )}>
                            {option.title}
                          </h4>
                          
                          <Badge 
                            variant="outline" 
                            size="xs"
                            className={cn(
                              isSelected ? [
                                option.color === 'green' ? "text-green-700 border-green-300"
                                : option.color === 'orange' ? "text-orange-700 border-orange-300"
                                : "text-red-700 border-red-300"
                              ] : "text-gray-500 border-gray-300"
                            )}
                          >
                            {t(`delete.impact.${option.impact}`, { fallback: option.impact })}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-sm mt-1",
                        isSelected ? [
                          option.color === 'green' ? "text-green-600 dark:text-green-300"
                          : option.color === 'orange' ? "text-orange-600 dark:text-orange-300" 
                          : "text-red-600 dark:text-red-300"
                        ] : "text-gray-500 dark:text-gray-400"
                      )}>
                        {option.subtitle}
                      </p>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Impact Preview */}
        {impactPreview && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <Card className={cn(
              "p-4",
              selectedOptionData?.color === 'green' 
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                : selectedOptionData?.color === 'orange'
                  ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
            )}>
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <Info className={cn(
                  "w-5 h-5 flex-shrink-0 mt-0.5",
                  selectedOptionData?.color === 'green' ? "text-green-600 dark:text-green-400"
                  : selectedOptionData?.color === 'orange' ? "text-orange-600 dark:text-orange-400"
                  : "text-red-600 dark:text-red-400"
                )} />
                
                <div className="flex-1">
                  <h4 className={cn(
                    "font-semibold text-sm mb-2",
                    selectedOptionData?.color === 'green' ? "text-green-800 dark:text-green-200"
                    : selectedOptionData?.color === 'orange' ? "text-orange-800 dark:text-orange-200"
                    : "text-red-800 dark:text-red-200"
                  )}>
                    {t('delete.preview.title', { fallback: 'תצוגה מקדימה של ההשפעה:' })}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('delete.preview.transactionsAffected', { fallback: 'עסקאות מושפעות:' })}
                      </span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {impactPreview.transactionsAffected}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('delete.preview.futureTransactions', { fallback: 'עסקאות עתידיות:' })}
                      </span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {impactPreview.futureTransactions}
                      </div>
                    </div>
                  </div>
                  
                  {impactPreview.warning && (
                    <div className={cn(
                      "mt-3 p-2 rounded text-xs font-medium",
                      selectedOptionData?.color === 'red' 
                        ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                    )}>
                      ⚠️ {impactPreview.warning}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-6 py-2.5"
          >
            <X className="w-4 h-4 mr-2" />
            {t('actions.cancel')}
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isLoading}
            className={cn(
              "min-w-[140px] px-6 py-2.5",
              selectedOptionData?.color === 'green' 
                ? "bg-green-600 hover:bg-green-700"
                : selectedOptionData?.color === 'orange'
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-red-600 hover:bg-red-700"
            )}
          >
            {isDeleting ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                {t('actions.deleting')}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {selectedOptionData?.title || t('actions.delete')}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default RecurringDeleteModal;