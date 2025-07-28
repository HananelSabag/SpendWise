/**
 * 🔧 NAVIGATION FIX - Handles Authentication Redirects
 * Prevents "Not Found" pages after OAuth login/logout
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores';

const NavigationFix = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Skip if still loading authentication state
    if (isLoading) return;

    const currentPath = location.pathname;
    console.log('🔧 NavigationFix - Current path:', currentPath, 'Authenticated:', isAuthenticated);

    // ✅ Fix common problematic paths
    const authPaths = ['/auth/login', '/auth/register', '/auth/logout'];
    const isAuthPath = authPaths.some(path => currentPath.startsWith(path));

    if (isAuthPath) {
      if (isAuthenticated) {
        // Authenticated user on auth page - redirect to dashboard
        console.log('🔧 NavigationFix - Redirecting authenticated user from auth page to dashboard');
        navigate('/', { replace: true });
      } else {
        // Non-authenticated user on auth page - redirect to correct auth page
        if (currentPath.startsWith('/auth/login')) {
          console.log('🔧 NavigationFix - Redirecting /auth/login to /login');
          navigate('/login', { replace: true });
        } else if (currentPath.startsWith('/auth/register')) {
          console.log('🔧 NavigationFix - Redirecting /auth/register to /register');
          navigate('/register', { replace: true });
        } else if (currentPath.startsWith('/auth/logout')) {
          console.log('🔧 NavigationFix - Redirecting /auth/logout to /login');
          navigate('/login', { replace: true });
        }
      }
    }

    // ✅ Fix other problematic paths
    if (currentPath === '/dashboard') {
      console.log('🔧 NavigationFix - Redirecting /dashboard to /');
      navigate('/', { replace: true });
    }

    // ✅ Handle onboarding redirect (non-existent route)
    if (currentPath === '/onboarding') {
      console.log('🔧 NavigationFix - Redirecting /onboarding to / (onboarding will show as popup)');
      navigate('/', { replace: true });
    }

  }, [location.pathname, isAuthenticated, isLoading, navigate]);

  return null; // This component doesn't render anything
};

export default NavigationFix; 