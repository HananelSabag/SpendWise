import React, { Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { RouteLoadingFallback } from './RouteLoadingFallback';
import { ProtectedRoute } from './ProtectedRoute';
import { SmartRedirect } from './SmartRedirect';
import { HomeRoute } from './HomeRoute';
import * as LazyComponents from '../LazyComponents';

export const AppRoutes = ({ isAuthenticated }) => (
  <Routes>
    {/* ✅ Public Routes */}
    <Route path="/login" element={
      !isAuthenticated ? (
        <RouteErrorBoundary routeName="Login">
          <Suspense fallback={<RouteLoadingFallback route="login" />}>
            <LazyComponents.Login />
          </Suspense>
        </RouteErrorBoundary>
      ) : <SmartRedirect />
    } />

    <Route path="/register" element={
      !isAuthenticated ? (
        <RouteErrorBoundary routeName="Register">
          <Suspense fallback={<RouteLoadingFallback route="registration" />}>
            <LazyComponents.Register />
          </Suspense>
        </RouteErrorBoundary>
      ) : <SmartRedirect />
    } />

    <Route path="/forgot-password" element={
      !isAuthenticated ? (
        <RouteErrorBoundary routeName="PasswordReset">
          <Suspense fallback={<RouteLoadingFallback route="password reset" />}>
            <LazyComponents.PasswordReset />
          </Suspense>
        </RouteErrorBoundary>
      ) : <SmartRedirect />
    } />

    <Route path="/verify-email/:token" element={
      !isAuthenticated ? (
        <RouteErrorBoundary routeName="VerifyEmail">
          <Suspense fallback={<RouteLoadingFallback route="email verification" />}>
            <LazyComponents.VerifyEmail />
          </Suspense>
        </RouteErrorBoundary>
      ) : <SmartRedirect />
    } />

    {/* ✅ Protected User Routes */}
    <Route path="/" element={
      <ProtectedRoute>
        <HomeRoute />
      </ProtectedRoute>
    } />

    {/* ✅ Blocked route (public, for redirected blocked users) */}
    <Route path="/blocked" element={
      <RouteErrorBoundary routeName="Blocked">
        <Suspense fallback={<RouteLoadingFallback route="blocked" />}>
          <LazyComponents.Blocked />
        </Suspense>
      </RouteErrorBoundary>
    } />

    <Route path="/transactions" element={
      <ProtectedRoute>
        <RouteErrorBoundary routeName="Transactions">
          <Suspense fallback={<RouteLoadingFallback route="transactions" />}>
            <LazyComponents.Transactions />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    <Route path="/financial-cycle" element={
      <ProtectedRoute>
        <RouteErrorBoundary routeName="Financial Cycle">
          <Suspense fallback={<RouteLoadingFallback route="financial cycle" />}>
            <LazyComponents.InsightsPage />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    <Route path="/insights" element={
      <ProtectedRoute>
        <Navigate replace to="/financial-cycle" />
      </ProtectedRoute>
    } />

    <Route path="/profile" element={
      <ProtectedRoute>
        <RouteErrorBoundary routeName="Profile">
          <Suspense fallback={<RouteLoadingFallback route="profile" />}>
            <LazyComponents.Profile />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    {/* ✅ Shopping Wishlist Route */}
    <Route path="/shopping" element={
      <ProtectedRoute>
        <RouteErrorBoundary routeName="Shopping">
          <Suspense fallback={<RouteLoadingFallback route="shopping" />}>
            <LazyComponents.ShoppingWishlistPage />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    {/* ✅ Bank Sync Route */}
    <Route path="/bank-sync" element={
      <ProtectedRoute>
        <RouteErrorBoundary routeName="BankSync">
          <Suspense fallback={<RouteLoadingFallback route="bank sync" />}>
            <LazyComponents.BankSyncPage />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    {/* ✅ Quick Expense Route */}
    <Route path="/quick-expense" element={
      <ProtectedRoute>
        <RouteErrorBoundary routeName="QuickExpense">
          <Suspense fallback={<RouteLoadingFallback route="quick expense" />}>
            <LazyComponents.QuickExpensePage />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    {/* ✅ Admin Routes */}
    <Route path="/admin" element={
      <ProtectedRoute adminOnly={true}>
        <RouteErrorBoundary routeName="AdminDashboard">
          <Suspense fallback={<RouteLoadingFallback route="admin dashboard" />}>
            <LazyComponents.AdminDashboard />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    <Route path="/admin/users" element={
      <ProtectedRoute adminOnly={true}>
        <RouteErrorBoundary routeName="AdminUsers">
          <Suspense fallback={<RouteLoadingFallback route="user management" />}>
            <LazyComponents.AdminUsers />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    <Route path="/admin/settings" element={
      <ProtectedRoute superAdminOnly={true}>
        <RouteErrorBoundary routeName="AdminSettings">
          <Suspense fallback={<RouteLoadingFallback route="admin settings" />}>
            <LazyComponents.AdminSettings />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    <Route path="/admin/activity" element={
      <ProtectedRoute adminOnly={true}>
        <RouteErrorBoundary routeName="AdminActivity">
          <Suspense fallback={<RouteLoadingFallback route="activity log" />}>
            <LazyComponents.AdminActivity />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    <Route path="/admin/stats" element={
      <ProtectedRoute adminOnly={true}>
        <RouteErrorBoundary routeName="AdminStats">
          <Suspense fallback={<RouteLoadingFallback route="system statistics" />}>
            <LazyComponents.AdminStats />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    <Route path="/admin/sync" element={
      <ProtectedRoute adminOnly={true}>
        <RouteErrorBoundary routeName="AdminSync">
          <Suspense fallback={<RouteLoadingFallback route="bank sync" />}>
            <LazyComponents.AdminSync />
          </Suspense>
        </RouteErrorBoundary>
      </ProtectedRoute>
    } />

    {/* ✅ Maintenance Route */}
    <Route path="/maintenance" element={
      <RouteErrorBoundary routeName="Maintenance">
        <Suspense fallback={<RouteLoadingFallback route="maintenance" />}>
          <LazyComponents.Maintenance />
        </Suspense>
      </RouteErrorBoundary>
    } />

    {/* ✅ Server Waking Route */}
    <Route path="/server-waking" element={
      <RouteErrorBoundary routeName="ServerWaking">
        <Suspense fallback={<RouteLoadingFallback route="server waking" />}>
          <LazyComponents.ServerWaking />
        </Suspense>
      </RouteErrorBoundary>
    } />

    {/* ✅ 404 Route */}
    <Route path="*" element={
      <RouteErrorBoundary routeName="NotFound">
        <Suspense fallback={<RouteLoadingFallback route="page" />}>
          <LazyComponents.NotFound />
        </Suspense>
      </RouteErrorBoundary>
    } />
  </Routes>
);

export default AppRoutes;
