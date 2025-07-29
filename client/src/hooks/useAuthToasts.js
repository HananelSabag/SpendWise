/**
 * 🍞 AUTH TOASTS HOOK
 * Provides authentication-specific toast notifications with translations
 * @version 1.0.0
 */

import { useToast } from './useToast';
import { useTranslation } from '../stores';

export const useAuthToasts = () => {
  const toast = useToast();
  const { t } = useTranslation('toast');

  return {
    // ✅ Login Toasts
    loginSuccess: (user) => {
      const message = user?.first_name 
        ? t('auth.loginSuccess', 'Welcome back!') + ` ${user.first_name}!`
        : t('auth.loginSuccess', 'Welcome back!');
      toast.success(message);
    },

    loginFailed: (error) => {
      const message = error?.code === 'INVALID_CREDENTIALS'
        ? t('auth.invalidCredentials', 'Invalid email or password. Please try again.')
        : t('auth.loginFailed', 'Login failed. Please check your credentials.');
      toast.error(message);
    },

    googleLoginSuccess: (user) => {
      const message = user?.first_name
        ? t('auth.googleLoginSuccess', 'Signed in with Google successfully!') + ` Welcome ${user.first_name}!`
        : t('auth.googleLoginSuccess', 'Signed in with Google successfully!');
      toast.success(message);
    },

    googleLoginFailed: () => {
      toast.error(t('auth.googleLoginFailed', 'Google sign-in failed. Please try again.'));
    },

    // ✅ Logout Toasts
    logoutSuccess: () => {
      toast.success(t('auth.logoutSuccess', "You've been signed out successfully"));
    },

    logoutFailed: () => {
      toast.error(t('auth.logoutFailed', 'Failed to sign out. Please try again.'));
    },

    // ✅ Registration Toasts
    registrationSuccess: () => {
      toast.success(t('auth.registrationSuccess', 'Account created successfully! Please check your email for verification.'));
    },

    registrationFailed: (error) => {
      const message = error?.code === 'EMAIL_EXISTS'
        ? 'An account with this email already exists'
        : t('auth.registrationFailed', 'Registration failed. Please try again.');
      toast.error(message);
    },

    googleRegistrationSuccess: (user) => {
      const message = user?.first_name
        ? `Welcome to SpendWise, ${user.first_name}!`
        : t('auth.registrationSuccess', 'Account created successfully!');
      toast.success(message);
    },

    // ✅ Password & Verification Toasts
    passwordResetSent: () => {
      toast.success(t('auth.passwordResetSent', 'Password reset instructions sent to your email'));
    },

    passwordResetSuccess: () => {
      toast.success(t('auth.passwordResetSuccess', 'Password reset successfully!'));
    },

    passwordResetFailed: () => {
      toast.error(t('auth.passwordResetFailed', 'Password reset failed. Please try again.'));
    },

    emailVerified: () => {
      toast.success(t('auth.emailVerified', 'Email verified successfully!'));
    },

    emailVerificationFailed: () => {
      toast.error(t('auth.emailVerificationFailed', 'Email verification failed. Please try again.'));
    },

    // ✅ Session & Security Toasts
    sessionExpired: () => {
      toast.error(t('auth.sessionExpired', 'Your session has expired. Please sign in again.'));
    },

    sessionExpiring: () => {
      toast.warning('Your session will expire in 5 minutes. Click to extend.');
    },

    unauthorizedAccess: () => {
      toast.error(t('auth.unauthorizedAccess', 'Access denied. Please sign in to continue.'));
    },

    accountLocked: () => {
      toast.error(t('auth.accountLocked', 'Account temporarily locked due to security reasons.'));
    },

    networkError: () => {
      toast.error(t('auth.networkError', 'Network error. Please check your connection and try again.'));
    },

    // ✅ Profile Update Toasts
    profileUpdated: () => {
      toast.success(t('profile.profileUpdated', 'Profile updated successfully!'));
    },

    profileUpdateFailed: () => {
      toast.error(t('profile.profileUpdateFailed', 'Failed to update profile. Please try again.'));
    },

    avatarUploaded: () => {
      toast.success(t('profile.avatarUploaded', 'Profile picture updated successfully!'));
    },

    avatarUploadFailed: () => {
      toast.error(t('profile.avatarUploadFailed', 'Failed to upload profile picture. Please try again.'));
    },

    avatarTooLarge: () => {
      toast.error(t('profile.avatarTooLarge', 'Profile picture must be less than 5MB'));
    },

    preferencesUpdated: () => {
      toast.success(t('profile.preferencesUpdated', 'Preferences updated successfully!'));
    },

    passwordChanged: () => {
      toast.success(t('profile.passwordChanged', 'Password changed successfully!'));
    },

    passwordChangeFailed: (error) => {
      const message = error?.code === 'CURRENT_PASSWORD_WRONG'
        ? t('profile.currentPasswordWrong', 'Current password is incorrect')
        : t('profile.passwordChangeFailed', 'Failed to change password. Please try again.');
      toast.error(message);
    },

    // ✅ Validation Toasts
    passwordMismatch: () => {
      toast.error(t('profile.passwordMismatch', 'Passwords do not match'));
    },

    passwordTooShort: () => {
      toast.error(t('profile.passwordTooShort', 'Password must be at least 8 characters'));
    },

    requiredFieldsMissing: () => {
      toast.error(t('profile.requiredFieldsMissing', 'Please fill in all required fields'));
    },

    invalidEmail: () => {
      toast.error(t('validation.invalidEmail', 'Please enter a valid email address'));
    },

    // ✅ Loading Toasts (for long operations)
    signingIn: () => {
      return toast.loading(t('loading.connecting', 'Connecting...'));
    },

    signingUp: () => {
      return toast.loading(t('loading.processing', 'Creating your account...'));
    },

    signingOut: () => {
      return toast.loading(t('loading.processing', 'Signing out...'));
    },

    uploadingAvatar: () => {
      return toast.loading(t('loading.uploading', 'Uploading profile picture...'));
    },

    updatingProfile: () => {
      return toast.loading(t('loading.saving', 'Saving changes...'));
    }
  };
}; 