/**
 * Token management functions
 */
export const getStoredToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};


export const setStoredToken = (token, key = 'accessToken') => 
  localStorage.setItem(key, token);

export const removeStoredToken = (key = 'accessToken') => 
  localStorage.removeItem(key);

/**
 * Formatting functions
 */
export const formatCurrency = (amount, currency = 'ILS') => {
  return new Intl.NumberFormat(
    currency === 'ILS' ? 'he-IL' : 'en-US',
    {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  ).format(amount);
};

export const formatDate = (date, language = 'he') => {
  return new Date(date).toLocaleDateString(
    language === 'he' ? 'he-IL' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );
};