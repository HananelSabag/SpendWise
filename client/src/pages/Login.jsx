// Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight ,Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { validateLoginField } from '../utils/validation';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Footer from '../components/common/Footer';
import AccessibilityMenu from '../components/common/AccessibilityMenu';
import FloatingMenu from '../components/common/FloatingMenu';
import { useLoadAccessibilitySettings } from '../hooks/useLoadAccessibilitySettings';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  useLoadAccessibilitySettings(); // Load accessibility settings on every page
  
  
  const isRTL = language === 'he';

  // Add animation on mount
  useEffect(() => {
    // Slight delay to trigger animation after component mounts
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Reset errors when input changes
  const resetErrorOnInputChange = (field) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      delete updated.submit;
      return updated;
    });
  };

  // Handle input change with validation
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const fieldError = validateLoginField(field, value, language);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    } else {
      resetErrorOnInputChange(field);
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(formData);
      if (result.success) {
        const redirectPath = sessionStorage.getItem('redirectPath') || '/';
        sessionStorage.removeItem('redirectPath');
        navigate(redirectPath);
      }
    } catch (err) {
      setErrors({ submit: err.message || t('login.invalidCredentials') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex flex-col">
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          },
        ]}
      />
      {/* Accessibility Menu */}
      <AccessibilityMenu />

      {/* --- Mobile Branding (shows only on small screens) --- */}
      <div className={`block lg:hidden flex-0 px-8 pt-8 transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-2xl text-white font-bold">S</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">SpendWise</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {t('login.features.title')}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('login.features.description')}
          </p>
        </div>
      </div>

      <div className={`flex flex-1 flex-col lg:flex-row transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* --- Desktop Branding (מוסתר במובייל) --- */}
        <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center">
          <div className="max-w-lg">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl text-white font-bold">S</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-800">SpendWise</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              {t('login.features.title')}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {t('login.features.description')}
            </p>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center text-primary-500 mb-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-lg">✓</span>
                </div>
                <span className="font-medium">{t('login.features.feature1')}</span>
              </div>
              <div className="flex items-center text-primary-500 mb-4">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-lg">✓</span>
                </div>
                <span className="font-medium">{t('login.features.feature2')}</span>
              </div>
              <div className="flex items-center text-primary-500">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-lg">✓</span>
                </div>
                <span className="font-medium">{t('login.features.feature3')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- The actual form --- */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">{t('login.title')}</h2>
              <p className="text-gray-600 mt-2">{t('login.subtitle')}</p>
            </div>

            {errors.submit && (
              <div className="mb-6 p-4 bg-error-light rounded-xl border border-error-light flex items-center">
                <AlertCircle className="h-5 w-5 text-error mr-2" />
                <span className="text-error">{errors.submit}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} dir={isRTL ? 'rtl' : 'ltr'}>
              <Input
                type="email"
                label={t('login.email')}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                icon={Mail}
                error={errors.email}
                placeholder={t('login.emailPlaceholder')}
                direction={isRTL ? 'rtl' : 'ltr'}
              />

              <Input
                type="password"
                label={t('login.password')}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                icon={Lock}
                error={errors.password}
                placeholder={t('login.passwordPlaceholder')}
                direction={isRTL ? 'rtl' : 'ltr'}
              />

              <div className="flex items-center justify-between text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-500 hover:text-primary-600"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
                className="bg-primary-500 text-white"
              >
                {loading ? t('login.signingIn') : t('login.signIn')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {t('login.noAccount')}{' '}
                <Link
                  to="/register"
                  className="text-primary-500 hover:text-primary-600 font-medium inline-flex items-center gap-1 group"
                >
                  {t('login.createAccount')}
                  <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add the Footer component */}
      <Footer showLanguageToggle={true} />
    </div>
  );
};

export default Login;