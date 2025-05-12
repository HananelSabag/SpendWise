// pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, Languages, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { validateRegistration, validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { authAPI } from '../utils/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Footer from '../components/common/Footer';
import AccessibilityMenu from '../components/common/AccessibilityMenu';
import FloatingMenu from '../components/common/FloatingMenu';
import { useLoadAccessibilitySettings } from '../hooks/useLoadAccessibilitySettings';

const Register = () => {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleCurrency } = useCurrency();
  useLoadAccessibilitySettings(); // Load accessibility settings on every page
  const isHebrew = language === 'he';

  // Animation state
  const [fadeIn, setFadeIn] = useState(false);

  // Form state management
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Add animation on mount
  useEffect(() => {
    // Slight delay to trigger animation after component mounts
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle input changes with validation
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    let fieldError = null;

    // Field-specific validation
    switch (field) {
      case 'username': {
        const result = validateUsername(value);
        if (!result.isValid) {
          fieldError = isHebrew ? 'שם משתמש לא תקין' : result.error;
        }
        break;
      }

      case 'email': {
        const result = validateEmail(value);
        if (!result.isValid) {
          fieldError = isHebrew ? 'כתובת אימייל לא תקינה' : result.error;
        }
        break;
      }

      case 'password': {
        const result = validatePassword(value);
        if (!result.isValid) {
          fieldError = isHebrew ? 'סיסמה לא תקינה' : result.error;
        }
        break;
      }

      case 'confirmPassword': {
        if (value !== formData.password) {
          fieldError = isHebrew ? 'הסיסמאות אינן תואמות' : 'Passwords do not match';
        }
        break;
      }

      default:
        break;
    }

    // Update errors state
    setErrors(prev => {
      if (fieldError) {
        return { ...prev, [field]: fieldError };
      }
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form before submission
      const validationErrors = validateRegistration(formData, language);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }

      // Call registration API
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      // Handle success
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);

    } catch (err) {
      console.error('Registration failed:', err);
      setErrors({ 
        submit: err.response?.data?.message || t('register.errors.registrationFailed') 
      });
    } finally {
      setLoading(false);
    }
  };

  // Success view
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary dark:bg-gray-900">
        <div className="card p-8 text-center dark:bg-gray-800 dark:text-white">
          <div className="w-16 h-16 bg-success-light dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-10 w-10 text-success dark:text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('register.success.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('register.success.message')}
          </p>
        </div>
      </div>
    );
  }

  // Main registration form
  return (
    <div className="min-h-screen gradient-primary dark:bg-gray-900 flex flex-col">
      {/* Floating Menu for language/currency */}
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          },
          {
            label: t('floatingMenu.switchCurrency'),
            icon: UserPlus,
            onClick: toggleCurrency,
          }
        ]}
      />

      {/* Accessibility Menu */}
      <AccessibilityMenu />

      {/* Mobile Branding (shows only on small screens) */}
      <div className={`block lg:hidden flex-0 px-8 pt-8 transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-2xl text-white font-bold">S</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">SpendWise</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {t('register.features.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('register.features.description')}
          </p>
        </div>
      </div>

      <div className={`flex flex-1 flex-col lg:flex-row transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Branding section */}
        <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl text-white font-bold">S</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white">SpendWise</h1>
            </div>

            {/* Features */}
            <div dir={isHebrew ? 'rtl' : 'ltr'}>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
                {t('register.features.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                {t('register.features.description')}
              </p>
            </div>

            {/* Feature list */}
            <div className="card p-6 dark:bg-gray-800 dark:border dark:border-gray-700">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center text-primary-500 dark:text-primary-400 mb-4 last:mb-0">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-lg">✓</span>
                  </div>
                  <span className="font-medium">{t(`register.features.feature${num}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Registration form section */}
        <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 ${isHebrew ? 'rtl' : 'ltr'}`}>
          <div className="w-full max-w-md">
            <div className="card p-8 dark:bg-gray-800 dark:text-white">
              {/* Form header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {t('register.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {t('register.subtitle')}
                </p>
              </div>

              {/* Registration form */}
              <form className="space-y-6" onSubmit={handleSubmit} dir={isHebrew ? 'rtl' : 'ltr'}>
                <Input
                  type="text"
                  label={t('register.username')}
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  icon={User}
                  error={errors.username}
                  placeholder={t('register.usernamePlaceholder')}
                />

                <Input
                  type="email"
                  label={t('register.email')}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  icon={Mail}
                  error={errors.email}
                  placeholder={t('register.emailPlaceholder')}
                  dir={isHebrew ? 'rtl' : 'ltr'}
                />

                <Input
                  type="password"
                  label={t('register.password')}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  icon={Lock}
                  error={errors.password}
                  placeholder={t('register.passwordPlaceholder')}
                  dir={isHebrew ? 'rtl' : 'ltr'}
                />

                <Input
                  type="password"
                  label={t('register.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  icon={Lock}
                  error={errors.confirmPassword}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  dir={isHebrew ? 'rtl' : 'ltr'}
                />

                {/* Submit button */}
                <Button 
                  className='bg-primary-400 text-black'
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? t('register.creatingAccount') : t('register.createAccount')}
                </Button>

                {/* Error message */}
                {errors.submit && (
                  <div className="p-4 bg-error-light dark:bg-red-900/30 rounded-xl border border-error flex items-center">
                    <AlertCircle className="h-5 w-5 text-error dark:text-red-500 mr-2" />
                    <span className="text-error dark:text-red-500">{errors.submit}</span>
                  </div>
                )}
              </form>

              {/* Login link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {t('register.alreadyHaveAccount')}{' '}
                  <Link to="/login" className="text-primary-500 hover:text-primary-600 dark:text-primary-400 font-medium inline-flex items-center gap-1 group">
                    {t('register.signInInstead')}
                    <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isHebrew ? 'rotate-180' : ''}`} />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Register;