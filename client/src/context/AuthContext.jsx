import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/users/profile');
          setUser(data);
        } catch (error) {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [navigate]);

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/users/login', credentials);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login', { replace: true });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      updateProfile // Add updateProfile to context value
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;