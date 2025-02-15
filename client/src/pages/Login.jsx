import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Languages, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { validateLoginField } from '../utils/validation';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import FloatingMenu from '../components/common/FloatingMenu';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const isHebrew = language === 'he';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset errors when input changes
  const resetErrorOnInputChange = (field) => {
    setErrors((prev) => {
      const updatedErrors = { ...prev };
      delete updatedErrors[field];
      delete updatedErrors.submit; // Clear submit error
      return updatedErrors;
    });
  };

  // Handle input change with validation
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    const fieldError = validateLoginField(field, value, language);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    } else {
      resetErrorOnInputChange(field); // Reset error on valid input
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors before validation
    setErrors({});

    // Validate inputs
    const emailError = validateLoginField('email', formData.email, language);
    const passwordError = validateLoginField('password', formData.password, language);

    if (emailError || passwordError) {
      setErrors({
        ...(emailError && { email: emailError }),
        ...(passwordError && { password: passwordError }),
      });
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/');
      } else {
        setErrors({ submit: t('login.invalidCredentials') });
      }
    } catch (err) {
      setErrors({ submit: err.message || t('login.invalidCredentials') });
    } finally {
      // Ensure loading is reset
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex">
      {/* Language and Currency Controls */}
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          },
        ]}
      />
      {/* Left side branding */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center" dir={isHebrew ? 'rtl' : 'ltr'}>
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
          <div className="card">
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

      {/* Right side form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 ${isHebrew ? 'rtl' : 'ltr'}`}>
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                {t('login.title')}
              </h2>
              <p className="text-gray-600 mt-2">{t('login.subtitle')}</p>
            </div>

            {errors.submit && (
              <div className="mb-6 p-4 bg-error-light rounded-xl border border-error-light flex items-center"
              dir={isHebrew ? 'rtl' : 'ltr'}>
                <AlertCircle className="h-5 w-5 text-error mr-2" />
                <span className="text-error">{errors.submit}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit} dir={isHebrew ? 'rtl' : 'ltr'}>
              <Input
                type="email"
                label={t('login.email')}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                icon={Mail}
                error={errors.email}
                placeholder={t('login.emailPlaceholder')}
                dir={isHebrew ? 'rtl' : 'ltr'}
              />

              <Input
                type="password"
                label={t('login.password')}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                icon={Lock}
                error={errors.password}
                placeholder={t('login.passwordPlaceholder')}
                dir={isHebrew ? 'rtl' : 'ltr'}
              />

              <div className="flex items-center justify-between">

                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-primary-500 hover:text-primary-600">
                    {t('login.forgotPassword')}
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading}
                className="bg-primary-400 text-black"
              >
                {loading ? t('login.signingIn') : t('login.signIn')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {t('login.noAccount')}{' '}
                <a href="/register" className="text-primary-500 hover:text-primary-600 font-medium">
                  {t('login.createAccount')}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
