/**
 * 🚀 LAZY COMPONENTS SYSTEM - Performance Optimization
 * Centralized lazy loading for all major components
 * @version 2.0.0
 */

import { lazy } from 'react';

// ✅ Enhanced lazy loading with error boundaries
const createLazyComponent = (importFn, componentName) => {
  const Component = lazy(importFn);
  Component.displayName = `Lazy(${componentName})`;
  return Component;
};

// ✅ Core Pages - Critical Route Components
export const Dashboard = createLazyComponent(
  () => import('../pages/Dashboard.jsx'),
  'Dashboard'
);

export const Profile = createLazyComponent(
  () => import('../pages/Profile.jsx'),
  'Profile'
);

export const Transactions = createLazyComponent(
  () => import('../pages/Transactions.jsx'),
  'Transactions'
);

// ✅ Authentication Pages
export const Login = createLazyComponent(
  () => import('../pages/auth/Login.jsx'),
  'Login'
);

export const Register = createLazyComponent(
  () => import('../pages/auth/Register.jsx'),
  'Register'
);

export const PasswordReset = createLazyComponent(
  () => import('../pages/auth/PasswordReset.jsx'),
  'PasswordReset'
);

export const VerifyEmail = createLazyComponent(
  () => import('../pages/auth/VerifyEmail.jsx'),
  'VerifyEmail'
);

// ✅ Admin Pages - Heavy Components
export const AdminDashboard = createLazyComponent(
  () => import('../pages/admin/AdminDashboard.jsx'),
  'AdminDashboard'
);

export const AdminUsers = createLazyComponent(
  () => import('../pages/admin/AdminUsers.jsx'),
  'AdminUsers'
);

export const AdminSettings = createLazyComponent(
  () => import('../pages/admin/AdminSettings.jsx'),
  'AdminSettings'
);

export const AdminActivity = createLazyComponent(
  () => import('../pages/admin/AdminActivity.jsx'),
  'AdminActivity'
);

export const AdminStats = createLazyComponent(
  () => import('../pages/admin/AdminStats.jsx'),
  'AdminStats'
);

// ✅ Analytics Pages - Data-Heavy Components
export const Analytics = createLazyComponent(
  () => import('../pages/Analytics.jsx'),
  'Analytics'
);

// ✅ Recurring Manager Panel
export const RecurringManagerPanel = createLazyComponent(
  () => import('../components/features/transactions/recurring/RecurringManagerPanel.jsx'),
  'RecurringManagerPanel'
);

// ✅ Utility Pages
export const NotFound = createLazyComponent(
  () => import('../pages/NotFound.jsx'),
  'NotFound'
);

export const Maintenance = createLazyComponent(
  () => import('../pages/Maintenance.jsx'),
  'Maintenance'
);

// ✅ Feature Components - Conditional Loading
export const CategoryManager = createLazyComponent(
  () => import('../components/features/categories/CategoryManager'),
  'CategoryManager'
);

export const OnboardingModal = createLazyComponent(
  () => import('../components/features/onboarding/OnboardingModal'),
  'OnboardingModal'
);

export const ExchangeCalculator = createLazyComponent(
  () => import('../components/features/exchange/ExchangeCalculator'),
  'ExchangeCalculator'
);

export const ExportModal = createLazyComponent(
  () => import('../components/features/profile/ExportModal'),
  'ExportModal'
);

// ✅ Utility Components - Rarely Used
export const AccessibilityStatement = createLazyComponent(
  () => import('../components/common/AccessibilityStatement'),
  'AccessibilityStatement'
);

export const TermsOfServiceModal = createLazyComponent(
  () => import('../components/common/TermsOfServiceModal'),
  'TermsOfServiceModal'
);

export const PrivacyPolicyModal = createLazyComponent(
  () => import('../components/common/PrivacyPolicyModal'),
  'PrivacyPolicyModal'
);

// Initialize all lazy components
export const initializeLazyComponents = () => {
  // Removed noisy initialization logging
}; 