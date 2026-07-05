import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, useTranslation } from '../../stores';
import TopProgressBar from '../common/TopProgressBar.jsx';

export const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { isAuthenticated, isLoading, user, isAdmin, isSuperAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Loading state: keep route area light and non-blocking
  if (isLoading) {
    return (
      <>
        <TopProgressBar visible={true} />
        <div className="min-h-[40vh]" />
      </>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check super admin permission
  if (superAdminOnly && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-2">{t('errors.superAdminRequired') || 'Super Admin Access Required'}</h3>
          <p className="text-gray-600 mb-4">{t('errors.noPermission') || "You don't have permission to access this page."}</p>
          <p className="text-sm text-gray-500 mb-4">
            {t('errors.roleRequired', { role: user?.role || '?', required: 'super_admin' }) || `Current role: ${user?.role || '?'} | Required: super_admin`}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
          >
            {t('actions.back') || 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  // Check admin permission
  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-2">{t('errors.adminRequired') || 'Admin Access Required'}</h3>
          <p className="text-gray-600 mb-4">{t('errors.noPermission') || "You don't have permission to access this page."}</p>
          <p className="text-sm text-gray-500 mb-4">
            {t('errors.roleRequired', { role: user?.role || '?', required: 'admin / super_admin' }) || `Current role: ${user?.role || '?'} | Required: admin or super_admin`}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
          >
            {t('actions.back') || 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  // If blocked user somehow passed auth middleware (e.g., cached token), route to blocked page
  if (user?.isBlocked || (Array.isArray(user?.restrictions) && user.restrictions.some(r => r.restriction_type === 'blocked'))) {
    return <Navigate to="/blocked" replace state={{ reason: user?.restrictions?.[0]?.reason }} />;
  }

  return children;
};

export default ProtectedRoute;
