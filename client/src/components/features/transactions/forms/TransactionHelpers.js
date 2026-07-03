/**
 * 🛠️ TRANSACTION HELPERS - COMMON UTILITIES
 * Shared utilities for all transaction form components
 * Features: Data formatting, Default values, Type conversions, API formatting
 * @version 3.0.0 - NEW CLEAN ARCHITECTURE
 */

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
 * 📝 Get Default Form Data
 */
export const getDefaultFormData = (initialData = null, mode = 'create') => {
  const now = new Date();

  const userTimezone = getUserTimezone();

  const defaults = {
    type: TRANSACTION_TYPES.EXPENSE,
    amount: '',
    description: '',
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().slice(0, 5),
    timezone: userTimezone, // ✅ NEW: Include user's timezone by default
    notes: '',
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
    date: initialData.date ? initialData.date.split('T')[0] : defaults.date,
    time: initialData.date ? new Date(initialData.date).toTimeString().slice(0, 5) : defaults.time,
    notes: initialData.notes || '',
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
 * 🌍 Get User's Timezone
 */
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return 'UTC';
  }
};

/**
 * 🕒 Combine Date and Time with Timezone
 */
export const combineDateTimeWithTimezone = (date, time, timezone = null) => {
  if (!date) return null;
  
  const userTimezone = timezone || getUserTimezone();
  
  try {
    // If time is provided, combine date and time
    if (time) {
      const dateTimeString = `${date}T${time}:00`;
      const dateTime = new Date(dateTimeString);
      
      // Create a proper timezone-aware ISO string
      // Note: This preserves the user's intended local time
      return new Date(dateTime.getTime() - (dateTime.getTimezoneOffset() * 60000)).toISOString();
    }
    
    // If no time provided, use current time
    const now = new Date();
    const dateTimeString = `${date}T${now.toTimeString().slice(0, 8)}`;
    const dateTime = new Date(dateTimeString);
    
    return new Date(dateTime.getTime() - (dateTime.getTimezoneOffset() * 60000)).toISOString();
  } catch (error) {
    return new Date(`${date}T12:00:00`).toISOString(); // Fallback to noon UTC
  }
};

/**
 * 📊 Format Transaction for API - TIMEZONE AWARE VERSION
 */
export const formatTransactionForAPI = (formData, mode = 'create') => {
  const amount = parseFloat(formData.amount);
  // ✅ FIX: Server expects positive amounts for both income and expense
  const finalAmount = Math.abs(amount);

  // ✅ ENHANCED: Timezone-aware transaction formatting with explicit time handling
  const userTimezone = getUserTimezone();
  
  // ✅ CRITICAL: Use form's exact time if provided, otherwise current time
  let transactionDateTime;
  if (formData.transaction_datetime) {
    // Form already provided exact datetime (e.g., from Quick Actions)
    transactionDateTime = formData.transaction_datetime;
  } else if (formData.time && formData.date) {
    // Combine user's selected date and time with timezone
    transactionDateTime = combineDateTimeWithTimezone(formData.date, formData.time, userTimezone);
  } else {
    // Fallback: use current moment in time
    transactionDateTime = new Date().toISOString();
  }

  const apiData = {
    type: formData.type,
    amount: finalAmount,
    description: formData.description?.trim() || 'Transaction', // ✅ FIX: Ensure description is never empty
    date: formData.date, // Keep for backward compatibility
    time: formData.time, // ✅ NEW: User's selected time
    transaction_datetime: transactionDateTime, // ✅ ENHANCED: User's exact intended datetime with timezone
    timezone: formData.timezone || userTimezone, // ✅ NEW: User's timezone for server reference
    notes: formData.notes ? formData.notes.trim() : null
    // ⚠️ DISABLED: tags not supported by current server API
    // tags: formData.tags || []
  };

  // Remove null/undefined values except description which is required
  Object.keys(apiData).forEach(key => {
    if (key !== 'description' && (apiData[key] === null || apiData[key] === undefined || apiData[key] === '')) {
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