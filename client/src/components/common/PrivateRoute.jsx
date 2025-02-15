import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protects routes that require authentication.
 *
 * @param {Object} children - Child components to render if authenticated.
 * @returns {JSX.Element} Protected route or redirect.
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading state while authentication status is being determined
  if (loading) {
    return <div>Loading...</div>;
  }

  // Check for token as fallback if user object is not available
  const token = localStorage.getItem('token');

  if (!user && !token) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
