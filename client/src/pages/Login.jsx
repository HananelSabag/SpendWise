import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { validateLoginField } from '../utils/validation';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const isHebrew = language === 'he';
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    const fieldError = validateLoginField(field, value, language);
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
    
    const emailError = validateLoginField('email', formData.email, language);
    const passwordError = validateLoginField('password', formData.password, language);
    
    if (emailError || passwordError) {
      setErrors({
        ...(emailError && { email: emailError }),
        ...(passwordError && { password: passwordError })
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(t('login.invalidCredentials'));
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message }));
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
            {t('login.features.title')}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {t('login.features.description')}
          </p>
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <div className="flex items-center text-teal-600 mb-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">✓</span>
              </div>
              <span className="font-medium">{t('login.features.feature1')}</span>
            </div>
            <div className="flex items-center text-teal-600 mb-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-lg">✓</span>
              </div>
              <span className="font-medium">{t('login.features.feature2')}</span>
            </div>
            <div className="flex items-center text-teal-600">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
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
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                {t('login.title')}
              </h2>
              <p className="text-gray-600 mt-2">
                {t('login.subtitle')}
              </p>
            </div>

            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-600">{errors.submit}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('login.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-teal-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200`}
                    placeholder={t('login.emailPlaceholder')}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-teal-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200`}
                    placeholder={t('login.passwordPlaceholder')}
                    dir="ltr"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-teal-500 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    {t('login.rememberMe')}
                  </label>
                </div>

                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-teal-500 hover:text-teal-600">
                    {t('login.forgotPassword')}
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('login.signingIn') : t('login.signIn')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {t('login.noAccount')}{' '}
                <a href="/register" className="text-teal-500 hover:text-teal-600 font-medium">
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