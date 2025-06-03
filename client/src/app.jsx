import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';

// Import core hooks and components
import LoadingSpinner from './components/ui/LoadingSpinner';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AccessibilityMenu from './components/common/AccessibilityMenu';

// Import all providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { DateProvider } from './context/DateContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ThemeProvider } from './context/ThemeContext';
import { TransactionProvider } from './context/TransactionContext';

// Lazy-load pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Transactions = lazy(() => import('./pages/Transactions'));

// Simple 404 component
const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
    <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">404</h1>
    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">הדף שחיפשת לא נמצא</p>
    <a href="/" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
      חזרה לדף הבית
    </a>
  </div>
);

// Separate AppContent component that uses the auth context
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Suppress React Router warnings
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn;
      console.warn = (msg, ...args) => {
        if (msg.includes('React Router Future Flag Warning')) {
          return;
        }
        originalWarn(msg, ...args);
      };
      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  // Show loading screen while authentication state is being determined
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {isAuthenticated && <Header />}
      
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              !isAuthenticated ? <Login /> : <Navigate to="/" replace />
            } />
            <Route path="/register" element={
              !isAuthenticated ? <Register /> : <Navigate to="/" replace />
            } />
            
            {/* Protected Routes */}
            <Route path="/" element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
            } />
            <Route path="/transactions" element={
              isAuthenticated ? <Transactions /> : <Navigate to="/login" replace />
            } />
            <Route path="/profile" element={
              isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
            } />
            
            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      
      {isAuthenticated && <Footer />}
      {isAuthenticated && <AccessibilityMenu />}
      
      {/* Portal container for modals */}
      <div id="portal-root" />
    </div>
  );
};

// Main App component with providers
function App() {
  // Force light mode on document body directly
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    
    // Also clear dark mode setting from localStorage
    localStorage.removeItem('a11y_darkMode');
    
    console.log('🚀 App component mounted at:', new Date().toISOString());
  }, []);

  return (
    <Router 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <ThemeProvider initialMode="light">
          <AccessibilityProvider initialDarkMode={false}>
            <LanguageProvider>
              <DateProvider>
                <TransactionProvider>
                  <CurrencyProvider>
                    <Suspense fallback={
                      <div className="h-screen w-screen flex items-center justify-center">
                        <LoadingSpinner size="large" />
                      </div>
                    }>
                      <AppContent />
                    </Suspense>
                  </CurrencyProvider>
                </TransactionProvider>
              </DateProvider>
            </LanguageProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
