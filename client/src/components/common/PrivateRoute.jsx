// components/common/PrivateRoute.jsx
// Enhanced private route with loading states and better error handling

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
* Protected route component with enhanced authentication checks
* Handles loading states and maintains navigation history
*/
const PrivateRoute = ({ children }) => {
 const { user, loading } = useAuth();
 const location = useLocation();

 // Show loading state
 if (loading) {
   return (
     <div className="flex items-center justify-center min-h-screen">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
     </div>
   );
 }

 // Check auth status and token
 const token = localStorage.getItem('token');
 const isAuthenticated = user || token;

 if (!isAuthenticated) {
   // Save attempted route for redirect after login
   sessionStorage.setItem('redirectPath', location.pathname);
   return <Navigate to="/login" replace />;
 }

 // If authenticated, render children
 return children;
};

export default PrivateRoute;