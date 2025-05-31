// components/common/PrivateRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

const PrivateRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen text={t('common.loading')} />;
  }

  if (!isAuthenticated) {
    // Save attempted route for redirect after login
    sessionStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;