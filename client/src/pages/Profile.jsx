import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { User, Lock, Edit, Save, Activity, Languages } from 'lucide-react';
import Header from "../components/common/Header";
import FloatingMenu from '../components/common/FloatingMenu';

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { balances } = useTransactions();
  const { formatAmount } = useCurrency();
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

  const handleSave = async (field) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (field === 'password') {
        if (formData.newPassword.length < 8) {
          setError(t('register.errors.passwordLength')); // "Password must be at least 8 characters"
          setLoading(false);
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          setError(t('profile.passwordMismatch'));
          setLoading(false);
          return;
        }

        await updateProfile({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
      } else if (field === 'username') {
        if (formData.username.length < 3) {
          setError(t('register.errors.usernameLength')); // "Username must be at least 3 characters"
          setLoading(false);
          return;
        }

        await updateProfile({
          username: formData.username
        });
      }

      setSuccess(t('profile.updateSuccess'));
      setEditField(null);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.message || t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const dailyBalance = balances.daily || { income: 0, expenses: 0, balance: 0 };
  return (
    <div className="min-h-screen gradient-primary">
      {/* Header Section */}
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} title={t('profile.title')} />
  
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8" dir={isHebrew ? 'rtl' : 'ltr'}>
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Username Section */}
          <div className="relative mb-4">
            <Input
              icon={User}
              label={t('profile.username')}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={editField !== 'username'}
            />
            {editField !== 'username' && (
              <Edit
                className={`absolute ${isHebrew ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-primary-500 cursor-pointer`}
                onClick={() => setEditField('username')}
              />
            )}
            {editField === 'username' && (
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditField(null);
                    setFormData(prev => ({ ...prev, username: user?.username || '' }));
                    setError('');
                  }}
                >
                  {t('profile.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleSave('username')}
                  disabled={loading}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? t('common.loading') : t('profile.save')}
                </Button>
              </div>
            )}
          </div>
  
          {/* Password Section */}
          <div className="relative mb-4">
            <Input
              icon={Lock}
              label={t('profile.currentPassword')}
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              disabled={editField !== 'password'}
              placeholder={editField === 'password' ? '' : '********'}
            />
            {editField === 'password' && (
              <>
                <Input
                  icon={Lock}
                  label={t('profile.newPassword')}
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
                <Input
                  icon={Lock}
                  label={t('profile.confirmPassword')}
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </>
            )}
            {editField !== 'password' && (
              <Edit
                className={`absolute ${isHebrew ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-primary-500 cursor-pointer`}
                onClick={() => setEditField('password')}
              />
            )}
            {editField === 'password' && (
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditField(null);
                    setFormData(prev => ({
                      ...prev,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    }));
                    setError('');
                  }}
                >
                  {t('profile.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleSave('password')}
                  disabled={loading}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? t('common.loading') : t('profile.save')}
                </Button>
              </div>
            )}
          </div>
  
          {/* Error/Success Messages */}
          {error && <div className="mt-4 text-error">{error}</div>}
          {success && <div className="mt-4 text-success">{success}</div>}
        </div>
  
        {/* Daily Balance */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6 w-full max-w-lg mx-auto">
          <h2 className="text-lg font-medium">{t('profile.dailyBalance')}</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t('home.balance.total')}</span>
            <div className="text-2xl font-bold text-primary-500">
              {formatAmount(dailyBalance.balance)}
            </div>
            <Activity className="text-primary-500 w-6 h-6" />
          </div>
        </div>
      </main>
  
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
    </div>
  );
  
};

export default ProfilePage;