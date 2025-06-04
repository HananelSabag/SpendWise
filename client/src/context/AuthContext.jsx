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
  
  // ✅ לוג רק פעם אחת בלבד
  useEffect(() => {
    if (!window._authProviderInitialized) {
      console.log(`🔐 [AUTH-PROVIDER] Provider initialized, isAuthenticated: ${auth.isAuthenticated()}`);
      window._authProviderInitialized = true;
    }
  }, []);
  
  // User profile query - Enhanced with better data handling
  const { 
    data: user, 
    isLoading: loading, 
    error,
    refetch: refetchProfile 
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => {
      console.log(`🌐 [AUTH-API] Profile request starting`);
      const startTime = Date.now();
      
      return authAPI.getProfile().then(res => {
        const endTime = Date.now();
        console.log(`✅ [AUTH-API] Profile completed in ${endTime - startTime}ms`);
        
        // Ensure profile picture URL is properly formatted
        const userData = res.data.data;
        if (userData.preferences?.profilePicture && !userData.preferences.profilePicture.startsWith('http')) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          userData.preferences.profilePicture = `${apiUrl}${userData.preferences.profilePicture}`;
        }
        
        return userData;
      }).catch(error => {
        const endTime = Date.now();
        console.error(`❌ [AUTH-API] Profile failed after ${endTime - startTime}ms:`, error);
        throw error;
      });
    },
    enabled: !!auth.isAuthenticated(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // Reduced to 5 minutes for faster image updates
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    onError: (error) => {
      if (error.response?.status === 401) {
        console.log(`🔓 [AUTH-ERROR] 401 error - clearing tokens`);
        tokenManager.clearTokens();
      }
    }
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials) => {
      console.log(`🔑 [LOGIN] 🔥 ATTEMPTING LOGIN 🔥 for user:`, credentials.email);
      const startTime = Date.now();
      
      return auth.login(credentials).then(result => {
        const endTime = Date.now();
        console.log(`✅ [LOGIN] Login completed in ${endTime - startTime}ms`);
        console.log(`✅ [LOGIN] Login result:`, result);
        return result;
      }).catch(error => {
        const endTime = Date.now();
        console.error(`❌ [LOGIN] Login failed after ${endTime - startTime}ms:`, error);
        throw error;
      });
    },
    onSuccess: (data) => {
      console.log(`🎉 [LOGIN-SUCCESS] Login successful, invalidating profile query`);
      if (data.success) {
        queryClient.invalidateQueries(['profile']);
        
        // ✅ FIX: Dispatch auth state change event
        window.dispatchEvent(new Event('authStateChanged'));
        
        // Check if user needs onboarding
        if (data.user?.needsOnboarding) {
          console.log(`🚀 [LOGIN-SUCCESS] User needs onboarding, navigating to /onboarding`);
          navigate('/onboarding');
        } else {
          console.log(`🏠 [LOGIN-SUCCESS] User authenticated, navigating to /`);
          navigate('/');
        }
        
        toast.success('Welcome back!');
      }
    },
    onError: (error) => {
      console.error(`❌ [LOGIN-ERROR] Login mutation error:`, error);
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
      
      // ✅ FIX: Dispatch auth state change event
      window.dispatchEvent(new Event('authStateChanged'));
      
      navigate('/login', { replace: true });
    }
  });
  
  // Update profile mutation - Enhanced
  const updateProfileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (response) => {
      // Properly merge updated data with existing user data
      queryClient.setQueryData(['profile'], (oldData) => {
        const updatedData = response.data.data;
        
        // Preserve profile picture URL formatting
        if (updatedData.preferences?.profilePicture && !updatedData.preferences.profilePicture.startsWith('http')) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          updatedData.preferences.profilePicture = `${apiUrl}${updatedData.preferences.profilePicture}`;
        }
        
        return {
          ...oldData,
          ...updatedData,
          preferences: {
            ...oldData?.preferences,
            ...updatedData.preferences
          }
        };
      });
      
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to update profile';
      toast.error(message);
    }
  });
  
  // Initialize auth state - ✅ לוג רק פעם אחת
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getAccessToken();
      
      if (token && !tokenManager.isTokenExpired(token)) {
        if (!window._authInitLogged) {
          console.log(`✅ [AUTH-INIT] Valid token exists`);
          window._authInitLogged = true;
        }
      } else {
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
    isAuthenticated: !!user && auth.isAuthenticated(),
    
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
    refreshProfile: refetchProfile, // Added to public API
    
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