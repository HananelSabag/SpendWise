import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { useTranslation, useAuthStore } from '../../../stores';
import { Input } from '../../ui';
import AuthStatusDetector from '../auth/AuthStatusDetector';
import { api } from '../../../api';

export const SecurityTab = ({ authToasts }) => {
  const { t }        = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    api.authStatus.getAuthStatus().then(r => r.success && setAuthStatus(r.data));
  }, []);

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirmPassword) { authToasts.passwordMismatch?.(); return; }
    if (form.newPassword.length < 8)               { authToasts.passwordTooShort?.(); return; }
    if (!/[A-Za-z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword)) {
      authToasts.toast?.error?.('Password must include at least one letter and one number'); return;
    }

    setIsLoading(true);
    try {
      const statusCheck = await api.authStatus.getAuthStatus();
      const isGoogleOnly = statusCheck.success && statusCheck.data.authType === 'GOOGLE_ONLY';
      const result = isGoogleOnly
        ? await api.auth.setPassword({ newPassword: form.newPassword })
        : await api.auth.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });

      if (!result.success) throw new Error(result.error?.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await useAuthStore.getState().actions?.getProfile?.();
      const updated = await api.authStatus.getAuthStatus();
      if (updated.success) setAuthStatus(updated.data);
      authToasts.passwordChanged?.();
    } catch (err) {
      authToasts.passwordChangeFailed?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isGoogleOnly = authStatus?.authType === 'GOOGLE_ONLY';

  const eyeBtn = (show, toggle, label) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 cursor-pointer"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <AuthStatusDetector />
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {isGoogleOnly
            ? (t('security.setPassword')    || 'Set Password')
            : (t('security.password.title') || 'Change Password')}
        </h3>

        {isGoogleOnly && (
          <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 text-sm text-indigo-700 dark:text-indigo-300">
            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{t('security.googleSignInNote') || 'You signed in with Google. You can add a password to also sign in with email.'}</span>
          </div>
        )}

        <div className="space-y-3">
          {!isGoogleOnly && (
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                placeholder={t('security.currentPasswordPlaceholder') || 'Current password'}
                value={form.currentPassword}
                onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
                className="pe-10"
              />
              {eyeBtn(showCurrent, () => setShowCurrent(s => !s), showCurrent ? 'Hide current password' : 'Show current password')}
            </div>
          )}
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              placeholder={t('security.newPasswordPlaceholder') || 'New password (min. 8 chars, letter + number)'}
              value={form.newPassword}
              onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
              className="pe-10"
            />
            {eyeBtn(showNew, () => setShowNew(s => !s), showNew ? 'Hide new password' : 'Show new password')}
          </div>
          <Input
            type="password"
            placeholder={t('security.confirmPasswordPlaceholder') || 'Confirm new password'}
            value={form.confirmPassword}
            onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="h-11 px-6 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isGoogleOnly
            ? (t('security.setPassword')    || 'Set Password')
            : (t('security.updatePassword') || 'Update Password')}
        </button>
      </div>
    </div>
  );
};

export default SecurityTab;
