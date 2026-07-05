import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores';

// Used only at /login and /register for admin deep-links
export const SmartRedirect = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Admin deep-link: if admin was redirected to /login from an admin route, send back there
  if (user?.isAdmin && location.state?.from?.startsWith('/admin')) {
    return <Navigate to={location.state.from} replace />;
  }

  // Everything else goes to "/" which handles home preference logic
  return <Navigate to="/" replace />;
};

export default SmartRedirect;
