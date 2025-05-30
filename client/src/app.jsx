import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy, useEffect } from 'react';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const TransactionManagement = lazy(() => import('./components/home/Transactions/TransactionManagement'));
// TODO: Add Onboarding page
// const Onboarding = lazy(() => import('./pages/Onboarding'));

// Components
import PrivateRoute from './components/common/PrivateRoute';
import LoadingScreen from './components/common/LoadingScreen';

// Providers - Organized by dependency order
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { DateProvider } from './context/DateContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ThemeProvider } from './context/ThemeContext'; // NEW

function App() {
  // Suppress React Router warnings in development
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

  return (
    <Router>
      <AccessibilityProvider>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <DateProvider>
                <CurrencyProvider>
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      {/* Protected routes */}
                      <Route
                        path="/"
                        element={
                          <PrivateRoute>
                            <Home />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/transactions"
                        element={
                          <PrivateRoute>
                            <TransactionManagement />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <PrivateRoute>
                            <ProfilePage />
                          </PrivateRoute>
                        }
                      />

                      {/* Catch-all route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>

                  {/* Global toast notifications */}
                  <Toaster
                    position="top-center"
                    reverseOrder={false}
                    gutter={8}
                    toastOptions={{
                      duration: 4000,
                      style: {
                        borderRadius: '0.5rem',
                        background: 'rgb(var(--color-card))',
                        color: 'rgb(var(--color-card-foreground))',
                        boxShadow: '0 10px 15px -3px rgb(var(--color-shadow) / 0.1), 0 4px 6px -4px rgb(var(--color-shadow) / 0.1)',
                      },
                      success: {
                        iconTheme: {
                          primary: 'rgb(var(--color-success))',
                          secondary: 'rgb(var(--color-success-light))',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: 'rgb(var(--color-error))',
                          secondary: 'rgb(var(--color-error-light))',
                        },
                      },
                    }}
                  />
                </CurrencyProvider>
              </DateProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </AccessibilityProvider>
    </Router>
  );
}

export default App;