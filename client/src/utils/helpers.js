export const getStoredToken = (key = 'accessToken') => 
  localStorage.getItem(key);

export const setStoredToken = (key, token) => 
  localStorage.setItem(key, token);

export const removeStoredToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const formatCurrency = (amount, currency = 'ILS') => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('he-IL').format(number);
};