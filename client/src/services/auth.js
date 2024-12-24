import api from './api';
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/helpers';

export const login = async (credentials) => {
  try {
    const response = await api.post('/users/login', credentials);
    localStorage.setItem('token', response.data.token);
    window.location.href = '/';  
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const token = getStoredToken();
    const response = await api.post('/users/refresh-token', { token });
    if (response.data.token) {
      setStoredToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    removeStoredToken();
    throw error;
  }
};

export const logout = () => {
  removeStoredToken();
};