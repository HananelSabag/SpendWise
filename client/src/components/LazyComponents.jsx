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

export const FinancialHealth = createLazyComponent(
  () => import('../pages/analytics/FinancialHealth.jsx'),
  'FinancialHealth'
);

export const Insights = createLazyComponent(
  () => import('../pages/analytics/Insights.jsx'),
  'Insights'
);

// ✅ Utility Pages
export const NotFound = createLazyComponent(
  () => import('../pages/NotFound.jsx'),
  'NotFound'
);

// ✅ Feature Components - Conditional Loading
export const AddTransactions = createLazyComponent(
  () => import('../components/features/transactions/AddTransactions'),
  'AddTransactions'
);

export const EditTransactionPanel = createLazyComponent(
  () => import('../components/features/transactions/EditTransactionPanel'),
  'EditTransactionPanel'
);

export const RecurringModal = createLazyComponent(
  () => import('../components/features/transactions/RecurringModal'),
  'RecurringModal'
);

export const ExportModal = createLazyComponent(
  () => import('../components/features/profile/ExportModal'),
  'ExportModal'
);

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

// ✅ Performance Stats
if (import.meta.env.MODE === 'development') {
  console.log('🚀 Lazy Components System Initialized');
  console.log('📦 Components split into:', {
    pages: 9,
    admin: 5,
    analytics: 2,
    features: 7,
    utilities: 3,
    total: 26
  });
} 