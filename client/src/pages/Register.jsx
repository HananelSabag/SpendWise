import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { validateRegistration, validateField } from '../utils/validation';
import Input from '../components/common/Input';
import Button from '../components/common/Button'
import FloatingMenu from '../components/common/FloatingMenu';


const Register = () => {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const isHebrew = language === 'he';

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Input change handler with validation
  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Validate field and set error if needed
    const fieldError = validateField(
      field,
      value,
      language,
      field === 'confirmPassword' ? formData.password : undefined
    );

    if (fieldError) {
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run validation
    const validationErrors = validateRegistration(formData, language);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);

    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('register.success.title')}
          </h2>
          <p className="text-gray-600">
            {t('register.success.message')}
          </p>
        </div>
      </div>
    );
  }

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
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center" >
        <div className="max-w-lg">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl text-white font-bold">S</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">SpendWise</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6" dir={isHebrew ? 'rtl' : 'ltr'} >
            {t('register.features.title')}
          </h2>
          <p className="text-lg text-gray-600 mb-8" dir={isHebrew ? 'rtl' : 'ltr'}>
            {t('register.features.description')}
          </p>
          <div className="card p-6" dir={isHebrew ? 'rtl' : 'ltr'}>
            <div className="flex items-center text-primary-500 mb-4">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">✓</span>
              </div>
              <span className="font-medium">{t('register.features.feature1')}</span>
            </div>
            <div className="flex items-center text-primary-500 mb-4">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">✓</span>
              </div>
              <span className="font-medium">{t('register.features.feature2')}</span>
            </div>
            <div className="flex items-center text-primary-500">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">✓</span>
              </div>
              <span className="font-medium">{t('register.features.feature3')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 ${isHebrew ? 'rtl' : 'ltr'}`}>
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                {t('register.title')}
              </h2>
              <p className="text-gray-600 mt-2">
                {t('register.subtitle')}
              </p>
            </div>

            {/* Form area */}
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

              <Button className='bg-primary-400 text-black'
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading || Object.keys(errors).length > 0}
              >
                {loading ? t('register.creatingAccount') : t('register.createAccount')}
              </Button>

              {errors.submit && (
                <div className="p-4 bg-error-light rounded-xl border border-error flex items-center">
                  <AlertCircle className="h-5 w-5 text-error mr-2" />
                  <span className="text-error">{errors.submit}</span>
                </div>
              )}
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {t('register.alreadyHaveAccount')}{' '}
                <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
                  {t('register.signInInstead')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;