import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Show loading state while checking authentication
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