import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken } from '../utils/helpers';
import { login, refreshToken, logout } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          await refreshToken();
          // Get user profile if needed
        } catch (error) {
          console.error('Auth initialization failed:', error);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};