import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { validateRegistration, validateField } from '../utils/validation';

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

      navigate('/login');
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex">
      {/* Language Toggle Button */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <Languages className="h-6 w-6 text-teal-500" />
      </button>

      {/* Left side branding */}
      <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center">
        <div className="max-w-lg">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl text-white font-bold">S</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">SpendWise</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            {t('register.features.title')}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {t('register.features.description')}
          </p>
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="flex items-center text-teal-600 mb-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">✓</span>
              </div>
              <span className="font-medium">{t('register.features.feature1')}</span>
            </div>
            <div className="flex items-center text-teal-600 mb-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">✓</span>
              </div>
              <span className="font-medium">{t('register.features.feature2')}</span>
            </div>
            <div className="flex items-center text-teal-600">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
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
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                {t('register.title')}
              </h2>
              <p className="text-gray-600 mt-2">
                {t('register.subtitle')}
              </p>
            </div>

            {/* Form area */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Username field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register.username')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-teal-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.username ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200`}
                    placeholder={t('register.usernamePlaceholder')}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                  )}
                </div>
              </div>

              {/* Email field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-teal-500" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200`}
                    placeholder={t('register.emailPlaceholder')}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-teal-500" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200`}
                    placeholder={t('register.passwordPlaceholder')}
                    dir="ltr"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register.confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-teal-500" />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200`}
                    placeholder={t('register.confirmPasswordPlaceholder')}
                    dir="ltr"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('register.creatingAccount') : t('register.createAccount')}
              </button>

              {errors.submit && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-600">{errors.submit}</span>
                </div>
              )}
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {t('register.alreadyHaveAccount')}{' '}
                <Link to="/login" className="text-teal-500 hover:text-teal-600 font-medium">
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