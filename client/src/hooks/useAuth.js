/**
 * 🔐 useAuth Hook - SIMPLIFIED 
 * Basic authentication with role-based access
 * @version 2.0.0 - SIMPLIFIED VERSION
 */

import { useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './useToast';

// ✅ Import from Zustand stores
import { 
  useAuthStore,
  useAuthUser, 
  useIsAdmin, 
  useIsSuperAdmin
} from '../stores';

import { api } from '../api';
import { useQuery } from '@tanstack/react-query';

/**
 * 🔐 Simplified Authentication Hook
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toastService = useToast();
  
  // ✅ Use Zustand auth store
  const authStore = useAuthStore();
  const {
    isAuthenticated,
    isLoading,
    initialized,
    user,
    userRole,
    error,
    actions
  } = authStore;
  
  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();

  // ✅ Simple login without AI security
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔑 useAuth login called', { email });
      
      const result = await actions.login(email, password);
      console.log('🔑 useAuth login result:', result);
      
      if (result.success) {
        queryClient.invalidateQueries();
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('🔑 useAuth login error:', error);
      return { success: false, error: { message: error.message } };
    }
  }, [actions, queryClient]);

  // ✅ Simple logout
  const logout = useCallback(async () => {
    try {
      const result = await actions.logout();
      if (result.success) {
        queryClient.clear();
        navigate('/login', { replace: true });
      }
      return result;
    } catch (error) {
      return { success: false, error: { message: error.message } };
    }
  }, [actions, queryClient, navigate]);

  // ✅ Get profile
  const getProfile = useCallback(async () => {
    try {
      return await actions.getProfile();
    } catch (error) {
      return { success: false, error: { message: error.message } };
    }
  }, [actions]);

  // ✅ User profile query
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id || !isAuthenticated) return null;
      const response = await api.auth.getProfile();
      return response.success ? response.user : null;
    },
    enabled: !!user?.id && isAuthenticated,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  return {
    // ✅ State
    isAuthenticated,
    isLoading,
    initialized,
    user: profile || user,
    userRole,
    isAdmin,
    isSuperAdmin,
    error,

    // ✅ Actions
    login,
    logout,
    getProfile,

    // ✅ Utility
    hasRole: useCallback((role) => {
      if (!user) return false;
      if (Array.isArray(role)) {
        return role.includes(userRole);
      }
      return userRole === role;
    }, [userRole, user]),

    hasPermission: useCallback((permission) => {
      if (!user) return false;
      // Super admin has all permissions
      if (isSuperAdmin) return true;
      // Admin has most permissions
      if (isAdmin && ['create', 'read', 'update'].includes(permission)) return true;
      // Regular users have read permission
      if (permission === 'read') return true;
      return false;
    }, [user, isAdmin, isSuperAdmin])
  };
};