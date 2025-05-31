// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth, tokenManager } from '../utils/auth';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);
  
  // User profile query
  const { 
    data: user, 
    isLoading: loading, 
    error,
    refetch: refetchProfile 
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authAPI.getProfile().then(res => res.data.data),
    enabled: !!auth.isAuthenticated(),

    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      if (error.response?.status === 401) {
        tokenManager.clearTokens();
      }
    }
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials) => auth.login(credentials),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(['profile']);
        
        // Check if user needs onboarding
        if (data.user?.needsOnboarding) {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
        
        toast.success('Welcome back!');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Login failed');
    }
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData) => auth.register(userData),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Registration failed');
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => auth.logout(),
    onSuccess: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
    }
  });
  
  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getAccessToken();
      
      if (token && !tokenManager.isTokenExpired(token)) {
        // Token exists and is valid, profile query will run automatically
      } else {
        // No valid token
        tokenManager.clearTokens();
      }
      
      setInitialized(true);
    };
    
    if (!initialized) {
      initAuth();
    }
  }, [initialized]);
  
  // Token refresh effect
  useEffect(() => {
    if (!user) return;
    
    const token = tokenManager.getAccessToken();
    if (!token) return;
    
    // Calculate when to refresh (5 minutes before expiry)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const refreshTime = expiryTime - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime <= 0) {
      // Token already expired or about to expire
      refetchProfile();
      return;
    }
    
    // Schedule refresh
    const timeout = setTimeout(() => {
      refetchProfile();
    }, refreshTime);
    
    return () => clearTimeout(timeout);
  }, [user, refetchProfile]);
  
  // Public methods
  const login = useCallback(async (credentials) => {
    return loginMutation.mutateAsync(credentials);
  }, [loginMutation]);
  
  const register = useCallback(async (userData) => {
    return registerMutation.mutateAsync(userData);
  }, [registerMutation]);
  
  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);
  
  const updateProfile = useCallback(async (data) => {
    return updateProfileMutation.mutateAsync(data);
  }, [updateProfileMutation]);
  
  const value = {
    // User data
    user,
    isAuthenticated: auth.isAuthenticated(),

    
    // Loading states
    loading: loading || !initialized,
    initialized,
    
    // Error state
    error: error?.message || null,
    
    // Auth methods
    login,
    register,
    logout,
    updateProfile,
    refreshToken: refetchProfile,
    
    // Loading states for mutations
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    isUpdatingProfile: updateProfileMutation.isLoading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;