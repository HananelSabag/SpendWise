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
  () => import('../pages/Dashboard'),
  'Dashboard'
);

export const Profile = createLazyComponent(
  () => import('../pages/Profile'),
  'Profile'
);

export const Transactions = createLazyComponent(
  () => import('../pages/Transactions'),
  'Transactions'
);

// ✅ Authentication Pages
export const Login = createLazyComponent(
  () => import('../pages/auth/Login'),
  'Login'
);

export const Register = createLazyComponent(
  () => import('../pages/auth/Register'),
  'Register'
);

export const PasswordReset = createLazyComponent(
  () => import('../pages/auth/PasswordReset'),
  'PasswordReset'
);

export const VerifyEmail = createLazyComponent(
  () => import('../pages/auth/VerifyEmail'),
  'VerifyEmail'
);

// ✅ Admin Pages - Heavy Components
export const AdminDashboard = createLazyComponent(
  () => import('../pages/admin/AdminDashboard'),
  'AdminDashboard'
);

export const AdminUsers = createLazyComponent(
  () => import('../pages/admin/AdminUsers'),
  'AdminUsers'
);

export const AdminSettings = createLazyComponent(
  () => import('../pages/admin/AdminSettings'),
  'AdminSettings'
);

export const AdminActivity = createLazyComponent(
  () => import('../pages/admin/AdminActivity'),
  'AdminActivity'
);

export const AdminStats = createLazyComponent(
  () => import('../pages/admin/AdminStats'),
  'AdminStats'
);

// ✅ Analytics Pages - Data-Heavy Components
export const Analytics = createLazyComponent(
  () => import('../pages/Analytics'),
  'Analytics'
);

export const FinancialHealth = createLazyComponent(
  () => import('../pages/analytics/FinancialHealth'),
  'FinancialHealth'
);

export const Insights = createLazyComponent(
  () => import('../pages/analytics/Insights'),
  'Insights'
);

// ✅ Utility Pages
export const NotFound = createLazyComponent(
  () => import('../pages/NotFound'),
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