/**
 * 🛠️ TRANSACTION HELPERS - COMMON UTILITIES
 * Shared utilities for all transaction form components
 * Features: Data formatting, Default values, Type conversions, API formatting
 * @version 3.0.0 - NEW CLEAN ARCHITECTURE
 */

import { dateHelpers } from '../../../../utils/helpers';

/**
 * 📊 Transaction Types Configuration
 */
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

export const TRANSACTION_TYPE_OPTIONS = [
  {
    value: TRANSACTION_TYPES.EXPENSE,
    label: 'expense',
    color: 'red',
    icon: 'TrendingDown'
  },
  {
    value: TRANSACTION_TYPES.INCOME,
    label: 'income', 
    color: 'green',
    icon: 'TrendingUp'
  }
];

/**
 * 🔄 Recurring Frequency Options
 */
export const RECURRING_FREQUENCIES = [
  { value: 'daily', label: 'daily', interval: 1 },
  { value: 'weekly', label: 'weekly', interval: 7 },
  { value: 'monthly', label: 'monthly', interval: 30 },
  { value: 'yearly', label: 'yearly', interval: 365 }
];

/**
 * 📝 Get Default Form Data
 */
export const getDefaultFormData = (initialData = null, mode = 'create') => {
  const now = new Date();
  
  const defaults = {
    type: TRANSACTION_TYPES.EXPENSE,
    amount: '',
    description: '',
    categoryId: '',
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().slice(0, 5),
    tags: [],
    notes: '',
    receiptUrl: null,
    
    // Recurring fields
    isRecurring: false,
    recurringFrequency: 'monthly',
    recurringInterval: 1,
    recurringEndType: 'never', // never, date, occurrences
    recurringEndDate: '',
    recurringMaxOccurrences: 12,
    
    // Advanced fields
    isActive: true,
    priority: 'normal',
    source: 'manual'
  };

  // If no initial data, return defaults
  if (!initialData) {
    return defaults;
  }

  // Handle different modes
  const baseData = {
    ...defaults,
    type: initialData.type || (initialData.amount > 0 ? TRANSACTION_TYPES.INCOME : TRANSACTION_TYPES.EXPENSE),
    amount: initialData.amount ? Math.abs(initialData.amount).toString() : '',
    description: initialData.description || '',
    categoryId: initialData.category_id || initialData.categoryId || '',
    date: initialData.date ? initialData.date.split('T')[0] : defaults.date,
    time: initialData.date ? new Date(initialData.date).toTimeString().slice(0, 5) : defaults.time,
    tags: initialData.tags || [],
    notes: initialData.notes || '',
    receiptUrl: initialData.receipt_url || initialData.receiptUrl,
    
    // Recurring data
    isRecurring: initialData.is_recurring || initialData.isRecurring || false,
    recurringFrequency: initialData.recurring_frequency || initialData.recurringFrequency || 'monthly',
    recurringInterval: initialData.recurring_interval || initialData.recurringInterval || 1,
    recurringEndType: initialData.recurring_end_type || initialData.recurringEndType || 'never',
    recurringEndDate: initialData.recurring_end_date || initialData.recurringEndDate || '',
    recurringMaxOccurrences: initialData.recurring_max_occurrences || initialData.recurringMaxOccurrences || 12,
    
    // Advanced fields
    isActive: initialData.is_active !== undefined ? initialData.is_active : (initialData.isActive !== undefined ? initialData.isActive : true),
    priority: initialData.priority || 'normal',
    source: initialData.source || 'manual'
  };

  // For duplicate mode, clear ID and update description
  if (mode === 'duplicate') {
    baseData.description = `Copy of ${baseData.description}`;
    baseData.date = defaults.date; // Use today's date for duplicates
    baseData.time = defaults.time;
  }

  return baseData;
};

/**
 * 💰 Format Amount for Display
 */
export const formatAmountDisplay = (amount, currency = 'USD') => {
  if (!amount || amount === '') return '';
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

/**
 * 📊 Format Transaction for API
 */
export const formatTransactionForAPI = (formData, mode = 'create') => {
  const amount = parseFloat(formData.amount);
  const finalAmount = formData.type === TRANSACTION_TYPES.EXPENSE ? -Math.abs(amount) : Math.abs(amount);
  
  // Combine date and time
  const combinedDateTime = formData.time 
    ? `${formData.date}T${formData.time}:00`
    : `${formData.date}T12:00:00`;

  const apiData = {
    type: formData.type,
    amount: finalAmount,
    description: formData.description.trim(),
    category_id: formData.categoryId,
    date: combinedDateTime,
    tags: formData.tags,
    notes: formData.notes ? formData.notes.trim() : null,
    receipt_url: formData.receiptUrl,
    
    // Recurring fields
    is_recurring: formData.isRecurring,
    recurring_frequency: formData.isRecurring ? formData.recurringFrequency : null,
    recurring_interval: formData.isRecurring ? parseInt(formData.recurringInterval) : null,
    recurring_end_type: formData.isRecurring ? formData.recurringEndType : null,
    recurring_end_date: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate : null,
    recurring_max_occurrences: formData.isRecurring && formData.recurringEndType === 'occurrences' 
      ? parseInt(formData.recurringMaxOccurrences) : null,
    
    // Advanced fields
    is_active: formData.isActive,
    priority: formData.priority,
    source: formData.source
  };

  // Remove null/undefined values
  Object.keys(apiData).forEach(key => {
    if (apiData[key] === null || apiData[key] === undefined) {
      delete apiData[key];
    }
  });

  return apiData;
};

/**
 * 🏷️ Get Transaction Type Info
 */
export const getTransactionTypeInfo = (type) => {
  return TRANSACTION_TYPE_OPTIONS.find(option => option.value === type) || TRANSACTION_TYPE_OPTIONS[0];
};

/**
 * 🔄 Get Recurring Frequency Info
 */
export const getRecurringFrequencyInfo = (frequency) => {
  return RECURRING_FREQUENCIES.find(freq => freq.value === frequency) || RECURRING_FREQUENCIES[2]; // Default to monthly
};

/**
 * 📅 Calculate Next Recurring Date
 */
export const calculateNextRecurringDate = (startDate, frequency, interval = 1) => {
  const date = new Date(startDate);
  const frequencyInfo = getRecurringFrequencyInfo(frequency);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (interval * 7));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + interval);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + interval);
      break;
    default:
      date.setMonth(date.getMonth() + 1); // Default to monthly
  }
  
  return date;
};

/**
 * 📊 Generate Recurring Preview
 */
export const generateRecurringPreview = (formData, maxPreview = 5) => {
  if (!formData.isRecurring) return [];
  
  const preview = [];
  let currentDate = new Date(formData.date);
  const endDate = formData.recurringEndDate ? new Date(formData.recurringEndDate) : null;
  const maxOccurrences = formData.recurringEndType === 'occurrences' 
    ? parseInt(formData.recurringMaxOccurrences) 
    : maxPreview;
  
  for (let i = 0; i < Math.min(maxPreview, maxOccurrences); i++) {
    if (endDate && currentDate > endDate) break;
    
    preview.push({
      date: new Date(currentDate),
      formattedDate: dateHelpers.format(currentDate, 'MMM dd, yyyy'),
      occurrence: i + 1
    });
    
    currentDate = calculateNextRecurringDate(currentDate, formData.recurringFrequency, parseInt(formData.recurringInterval));
  }
  
  return preview;
};

/**
 * 🎯 Parse Amount Input
 */
export const parseAmountInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove non-numeric characters except decimal point
  const cleaned = input.replace(/[^0-9.]/g, '');
  
  // Handle multiple decimal points
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    return parts[0] + '.' + parts[1].slice(0, 2);
  }
  
  return cleaned;
};

/**
 * 🔍 Search/Filter Helpers
 */
export const filterTransactionsByText = (transactions, searchText) => {
  if (!searchText || searchText.trim() === '') return transactions;
  
  const search = searchText.toLowerCase().trim();
  
  return transactions.filter(transaction => 
    transaction.description?.toLowerCase().includes(search) ||
    transaction.notes?.toLowerCase().includes(search) ||
    transaction.category?.name?.toLowerCase().includes(search) ||
    transaction.tags?.some(tag => tag.toLowerCase().includes(search))
  );
};

/**
 * 📋 Export all utilities
 */
export {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_OPTIONS,
  RECURRING_FREQUENCIES
}; 