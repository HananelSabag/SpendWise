import React, { useState } from 'react';
import { Trash2, AlertCircle, X, Clock, Calendar, Repeat, DollarSign } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';

/**
 * DeleteTransaction Component
 * Enhanced dialog for transaction deletion with comprehensive recurring options
 * Now includes full transaction preview and clearer explanation of each delete option
 * 
 * @param {boolean} open - Whether the dialog is open
 * @param {Object} transaction - The transaction to delete with all properties
 * @param {Function} onConfirm - Function called with (transaction, deleteFuture) when confirmed
 * @param {Function} onClose - Function to call when dialog is closed
 */
const DeleteTransaction = ({ open, transaction, onConfirm, onClose }) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [deleteOption, setDeleteOption] = useState('single');
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!open || !transaction) return null;
  
  const isRecurring = transaction.is_recurring;
  const transactionType = transaction.transaction_type;

  // Format recurring interval for display
  const formatInterval = (interval) => {
    switch (interval) {
      case 'daily': return t('actions.frequencies.daily');
      case 'weekly': return t('actions.frequencies.weekly');
      case 'monthly': return t('actions.frequencies.monthly');
      default: return interval;
    }
  };

  const handleConfirm = async () => {
    if (isDeleting) return; // Prevent double deletion
    
    try {
      setIsDeleting(true);
      // Pass the correct parameters to parent
      const deleteFuture = deleteOption === 'future';
      await onConfirm(transaction, deleteFuture);
    } catch (error) {
      console.error('Delete failed:', error);
      // Don't close dialog on error, let user retry
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 mx-4 animate-slideUp"
        dir={language === 'he' ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-error" />
            {t('transactions.deleteConfirm')}
          </h3>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Transaction Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{transaction.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(transaction.date).toLocaleDateString()}
                </span>
                {isRecurring && (
                  <span className="flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    {formatInterval(transaction.recurring_interval)}
                  </span>
                )}
              </div>
            </div>
            <div className={`text-lg font-bold ${
              transaction.transaction_type === 'expense' ? 'text-error' : 'text-success'
            }`}>
              {formatAmount(transaction.amount)}
            </div>
          </div>
        </div>
        
        {/* Delete Options */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-700">
                {isRecurring 
                  ? `This is a recurring ${transactionType}. Please choose how to delete it:` 
                  : `Are you sure you want to delete this ${transactionType}?`
                }
              </p>
            </div>
          </div>
          
          {isRecurring ? (
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="deleteOption"
                  value="single"
                  checked={deleteOption === 'single'}
                  onChange={() => setDeleteOption('single')}
                  className="mt-1 text-primary-500 focus:ring-primary-500"
                  disabled={isDeleting}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Delete only this occurrence</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Remove just this specific transaction on {new Date(transaction.date).toLocaleDateString()}.
                    The recurring pattern will continue for future dates.
                  </div>
                  {transaction.next_recurrence_date && (
                    <div className="text-xs text-primary-600 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Next occurrence: {new Date(transaction.next_recurrence_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </label>
              
              <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="deleteOption"
                  value="future"
                  checked={deleteOption === 'future'}
                  onChange={() => setDeleteOption('future')}
                  className="mt-1 text-primary-500 focus:ring-primary-500"
                  disabled={isDeleting}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">Stop this recurring transaction</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Cancel this transaction from {new Date(transaction.date).toLocaleDateString()} onwards.
                    All future occurrences will be removed.
                  </div>
                  <div className="text-xs text-error mt-2 font-medium">
                    ⚠️ This action cannot be undone
                  </div>
                </div>
              </label>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800 font-medium">This action cannot be undone</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-800 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-error hover:bg-error-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>
                  {isRecurring 
                    ? (deleteOption === 'future' ? 'Stop Recurring' : 'Delete Once')
                    : t('common.delete')
                  }
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTransaction;