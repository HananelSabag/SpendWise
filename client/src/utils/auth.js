import api from './api';
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/helpers';

/**
 * Handles user login by authenticating credentials and storing token.
 *
 * @param {Object} credentials - User credentials (email, password).
 * @returns {Object} Authenticated user data.
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/users/login', credentials);
    setStoredToken(response.data.token); // Store token securely
    return response.data; // Return user data to caller
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

/**
 * Registers a new user.
 *
 * @param {Object} userData - New user information.
 * @returns {Object} Response data.
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Refreshes authentication token.
 *
 * @returns {Object} Updated token data.
 */
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

/**
 * Logs out the user by clearing the stored token.
 */
export const logout = () => {
  removeStoredToken();
};
