import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import { validateUsername, validatePassword } from '../utils/validation';
import { 
  User, 
  Mail, 
  Lock, 
  Edit2, 
  Save, 
  Calendar, 
  Activity, 
  AlertCircle, 
  Shield, 
  LogOut, 
  Languages,
  Sun,
  Moon
} from 'lucide-react';
import Header from "../components/common/Header";
import FloatingMenu from '../components/common/FloatingMenu';
import Footer from '../components/common/Footer';
import AccessibilityMenu from '../components/common/AccessibilityMenu';
import { useLoadAccessibilitySettings } from '../hooks/useLoadAccessibilitySettings';

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { balances } = useTransactions();
  const { formatAmount } = useCurrency();
  useLoadAccessibilitySettings(); // Load accessibility settings on every page
  const isHebrew = language === 'he';
  
  const [editField, setEditField] = useState(null);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Avatar placeholder colors
  const avatarColors = [
    'bg-primary-500',
    'bg-purple-500',
    'bg-indigo-500',
    'bg-blue-500',
    'bg-green-500',
  ];
  const [avatarColor, setAvatarColor] = useState(avatarColors[0]);

  // Generate random color for avatar on load
  useEffect(() => {
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    setAvatarColor(randomColor);
  }, []);

  // Initialize formData when user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || ''
      }));
    }
  }, [user]);

  // Check for dark mode on component mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const validateFields = (field) => {
    const errors = {};
    
    if (field === 'username' || field === 'all') {
      // Username validation using utility
      const usernameResult = validateUsername(formData.username);
      if (!usernameResult.isValid) {
        errors.username = isHebrew ? 'שם משתמש חייב להיות לפחות 3 תווים' : usernameResult.error;
      }
    }
    
    if (field === 'password' || field === 'all') {
      // Current password validation
      if (!formData.currentPassword) {
        errors.currentPassword = isHebrew ? 'סיסמה נוכחית נדרשת' : 'Current password is required';
      }
      
      // New password validation using utility
      const passwordResult = validatePassword(formData.newPassword);
      if (!passwordResult.isValid) {
        errors.newPassword = isHebrew ? 'סיסמה חייבת להיות לפחות 8 תווים ולכלול מספר' : passwordResult.error;
      }
      
      // Confirm password validation
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = isHebrew ? 'הסיסמאות אינן תואמות' : 'Passwords do not match';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user makes changes
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear general error/success
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSave = async (field) => {
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate the specific form section
    if (!validateFields(field)) {
      setLoading(false);
      setError(t('forms.validation.formErrors'));
      return;
    }

    try {
      if (field === 'password') {
        await updateProfile({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
        
        // Reset password fields after successful update
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else if (field === 'username') {
        await updateProfile({
          username: formData.username
        });
      }

      setSuccess(t('profile.updateSuccess'));
      setEditField(null);
    } catch (err) {
      const errorMessage = err.message || t('profile.updateError');
      setError(errorMessage);
      
      // Handle specific backend errors
      if (errorMessage.includes('incorrect')) {
        setValidationErrors(prev => ({
          ...prev,
          currentPassword: isHebrew ? 'סיסמה נוכחית שגויה' : 'Current password is incorrect'
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.username) return '?';
    
    const nameParts = user.username.split(' ');
    if (nameParts.length === 1) return nameParts[0][0]?.toUpperCase() || '?';
    
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const dailyBalance = balances.daily || { income: 0, expenses: 0, balance: 0 };
  const weeklyBalance = balances.weekly || { income: 0, expenses: 0, balance: 0 };
  const monthlyBalance = balances.monthly || { income: 0, expenses: 0, balance: 0 };
  
  // Get member since date
  const formatMemberSince = () => {
    if (!user?.created_at) return '';
    
    const date = new Date(user.created_at);
    return new Intl.DateTimeFormat(isHebrew ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Format a date for last login (mock data)
  const formatLastLogin = () => {
    const date = new Date();
    return new Intl.DateTimeFormat(isHebrew ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col gradient-primary dark:bg-gray-900">
      {/* Header Section */}
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} title={t('profile.title')} />
  
      {/* Accessibility Menu */}
      <AccessibilityMenu />

      {/* Main Content - Using flex-grow to push footer to bottom */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - User profile card */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
              {/* Profile header with avatar */}
              <div className="relative bg-gradient-to-r from-primary-400 to-primary-500 dark:from-primary-700 dark:to-primary-800 h-32 flex items-end">
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold ${avatarColor} border-4 border-white dark:border-gray-800 shadow-md`}>
                    {getUserInitials()}
                  </div>
                </div>
              </div>
              
              {/* Profile details */}
              <div className="pt-16 pb-6 px-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {user?.username || ''}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {user?.email || ''}
                </p>
                
                <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.memberSince')}</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1 mt-1">
                      <Calendar className="w-4 h-4 text-primary-500" />
                      {formatMemberSince() || '2024/01/01'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.lastLogin')}</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1 mt-1">
                      <Calendar className="w-4 h-4 text-primary-500" />
                      {formatLastLogin()}
                    </p>
                  </div>
                </div>
                
                {/* Logout button */}
                <div className="mt-6">
                  <button
                    onClick={handleLogout}
                    className="w-full p-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LogOut className="w-5 h-5" />
                    {t('profile.logout')}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Financial summary card */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                {t('profile.financialSummary')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">{t('home.balance.daily')}</span>
                  <span className={`font-bold ${dailyBalance.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatAmount(dailyBalance.balance)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">{t('home.balance.weekly')}</span>
                  <span className={`font-bold ${weeklyBalance.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatAmount(weeklyBalance.balance)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{t('home.balance.monthly')}</span>
                  <span className={`font-bold ${monthlyBalance.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatAmount(monthlyBalance.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Profile settings tabs */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
              {/* Tabs header */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'general' 
                    ? 'text-primary-600 border-b-2 border-primary-500 dark:text-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('general')}
                >
                  {t('profile.tabs.general')}
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'security' 
                    ? 'text-primary-600 border-b-2 border-primary-500 dark:text-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('security')}
                >
                  {t('profile.tabs.security')}
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === 'preferences' 
                    ? 'text-primary-600 border-b-2 border-primary-500 dark:text-primary-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('preferences')}
                >
                  {t('profile.tabs.preferences')}
                </button>
              </div>
              
              {/* Tab content */}
              <div className="p-6">
                {/* General tab */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                      {t('profile.personalInformation')}
                    </h3>
                    
                    {/* Username field */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('profile.username')}
                      </label>
                      
                      {editField !== 'username' ? (
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                            <User className="w-5 h-5 text-primary-500 mr-3" />
                            <span className="font-medium text-gray-800 dark:text-white">{formData.username}</span>
                          </div>
                          <button
                            onClick={() => setEditField('username')}
                            className="ml-3 p-2 bg-primary-50 dark:bg-gray-700 text-primary-500 rounded-lg hover:bg-primary-100 dark:hover:bg-gray-600 transition-colors transform hover:scale-105"
                            aria-label="Edit username"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={formData.username}
                              onChange={(e) => handleInputChange('username', e.target.value)}
                              className={`w-full pl-10 pr-4 py-3 border ${validationErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600'} rounded-xl focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
                              placeholder={t('register.usernamePlaceholder')}
                            />
                          </div>
                          
                          {validationErrors.username && (
                            <p className="mt-1 text-sm text-red-500 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {validationErrors.username}
                            </p>
                          )}
                          
                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              onClick={() => {
                                setEditField(null);
                                setFormData(prev => ({ ...prev, username: user?.username || '' }));
                                setValidationErrors({});
                                setError('');
                              }}
                            >
                              {t('profile.cancel')}
                            </button>
                            <button
                              className={`px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                              onClick={() => handleSave('username')}
                              disabled={loading}
                            >
                              {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                              ) : (
                                <Save className="w-5 h-5" />
                              )}
                              {loading ? t('common.loading') : t('profile.save')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Email address field (non-editable) */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('register.email')}
                      </label>
                      <div className="flex items-center mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                        <Mail className="w-5 h-5 text-primary-500 mr-3" />
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">{user?.email || ''}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('profile.emailNotEditable')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Last active info */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            {t('profile.accountActivity')}
                          </h3>
                          <div className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                            <p>{t('profile.lastLoginInfo')}: {formatLastLogin()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Error/success messages */}
                    {error && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    {success && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{success}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Security tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                      {t('profile.securitySettings')}
                    </h3>
                    
                    {/* Password change section */}
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('profile.changePassword')}
                      </label>
                      
                      {editField !== 'password' ? (
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                            <Lock className="w-5 h-5 text-primary-500 mr-3" />
                            <span className="font-medium text-gray-800 dark:text-white">••••••••</span>
                          </div>
                          <button
                            onClick={() => setEditField('password')}
                            className="ml-3 p-2 bg-primary-50 dark:bg-gray-700 text-primary-500 rounded-lg hover:bg-primary-100 dark:hover:bg-gray-600 transition-colors transform hover:scale-105"
                            aria-label="Change password"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 space-y-4">
                          {/* Current password */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="password"
                              value={formData.currentPassword}
                              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                              className={`w-full pl-10 pr-4 py-3 border ${validationErrors.currentPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600'} rounded-xl focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
                              placeholder={t('profile.currentPassword')}
                            />
                            {validationErrors.currentPassword && (
                              <p className="mt-1 text-sm text-red-500 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.currentPassword}
                              </p>
                            )}
                          </div>
                          
                          {/* New password */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="password"
                              value={formData.newPassword}
                              onChange={(e) => handleInputChange('newPassword', e.target.value)}
                              className={`w-full pl-10 pr-4 py-3 border ${validationErrors.newPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600'} rounded-xl focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
                              placeholder={t('profile.newPassword')}
                            />
                            {validationErrors.newPassword && (
                              <p className="mt-1 text-sm text-red-500 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.newPassword}
                              </p>
                            )}
                          </div>
                          
                          {/* Confirm password */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="password"
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                              className={`w-full pl-10 pr-4 py-3 border ${validationErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600'} rounded-xl focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white`}
                              placeholder={t('profile.confirmPassword')}
                            />
                            {validationErrors.confirmPassword && (
                              <p className="mt-1 text-sm text-red-500 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.confirmPassword}
                              </p>
                            )}
                          </div>
                          
                          {/* Password requirements hint */}
                          <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="flex items-center gap-1 mb-1">
                              <Shield className="w-4 h-4 text-gray-500" />
                              {t('profile.passwordRequirements')}:
                            </p>
                            <ul className="list-disc list-inside ml-1 space-y-1">
                              <li>{t('profile.passwordMinLength')}</li>
                              <li>{t('profile.passwordRequireNumber')}</li>
                            </ul>
                          </div>
                          
                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              onClick={() => {
                                setEditField(null);
                                setFormData(prev => ({
                                  ...prev,
                                  currentPassword: '',
                                  newPassword: '',
                                  confirmPassword: ''
                                }));
                                setValidationErrors({});
                                setError('');
                              }}
                            >
                              {t('profile.cancel')}
                            </button>
                            <button
                              className={`px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                              onClick={() => handleSave('password')}
                              disabled={loading}
                            >
                              {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                              ) : (
                                <Save className="w-5 h-5" />
                              )}
                              {loading ? t('common.loading') : t('profile.save')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Account security info */}
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                            {t('profile.securityTip')}
                          </h3>
                          <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                            <p>{t('profile.securityTipText')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Error/success messages */}
                    {error && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    {success && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{success}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Preferences tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                      {t('profile.appPreferences')}
                    </h3>
                    
                    {/* Language preference */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('profile.language')}
                      </label>
                      <div className="flex items-center space-x-4">
                        <button 
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all ${language === 'en' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          onClick={() => language !== 'en' && toggleLanguage()}
                        >
                          <span>🇺🇸</span>
                          <span>English</span>
                          {language === 'en' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        
                        <button 
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all ${language === 'he' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          onClick={() => language !== 'he' && toggleLanguage()}
                        >
                          <span>🇮🇱</span>
                          <span>עברית</span>
                          {language === 'he' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Dark mode toggle */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('profile.theme')}
                      </label>
                      <div className="flex items-center space-x-4">
                        <button 
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all ${!isDarkMode ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          onClick={() => isDarkMode && toggleDarkMode()}
                        >
                          <Sun className="w-5 h-5" />
                          <span>{t('profile.lightTheme')}</span>
                          {!isDarkMode && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        
                        <button 
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all ${isDarkMode ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                          onClick={() => !isDarkMode && toggleDarkMode()}
                        >
                          <Moon className="w-5 h-5" />
                          <span>{t('profile.darkTheme')}</span>
                          {isDarkMode && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Notification preferences (mock) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('profile.notificationsPreferences')}
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              id="email-notifications"
                              name="email-notifications"
                              type="checkbox"
                              className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                              defaultChecked
                            />
                            <label htmlFor="email-notifications" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                              {t('profile.emailNotifications')}
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              id="login-alerts"
                              name="login-alerts"
                              type="checkbox"
                              className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                              defaultChecked
                            />
                            <label htmlFor="login-alerts" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                              {t('profile.loginAlerts')}
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              id="monthly-summary"
                              name="monthly-summary"
                              type="checkbox"
                              className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                              defaultChecked
                            />
                            <label htmlFor="monthly-summary" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                              {t('profile.monthlySummaries')}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Data management section */}
                    <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white">
                        {t('profile.dataManagement')}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('profile.exportExplanation')}
                      </p>
                      {/* Note: Export feature to be added later */}
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400">
                        {t('profile.exportFeatureComingSoon')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
  
      {/* Language Controls */}
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          },
        ]}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProfilePage;