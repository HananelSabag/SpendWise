import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { resolveAuthReturnPath } from '../../utils/authReturnPath';

// Used only at /login and /register for admin deep-links
export const SmartRedirect = () => {
  const location = useLocation();

  const returnPath = resolveAuthReturnPath(location.state?.from);
  // Preserve any safe protected deep-link, for admins and regular users alike.
  if (returnPath !== '/') {
    return <Navigate to={returnPath} replace />;
  }

  // Everything else goes to "/" which handles home preference logic
  return <Navigate to="/" replace />;
};

export default SmartRedirect;
