import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';

// Providers (סדר עוטף נכון!)
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
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      {/* Redirect any other route to /login */}
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                  </Suspense>
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
