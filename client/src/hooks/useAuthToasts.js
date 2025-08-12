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
      // ✅ FIX: Handle specific error types and avoid using raw error messages as translation keys
      let message;
      
      if (error?.code === 'INVALID_CREDENTIALS') {
        message = t('auth.invalidCredentials', 'Invalid email or password. Please try again.');
      } else if (error?.message && error.message.includes('Google sign-in')) {
        // Hybrid authentication error - use the server message directly
        message = error.message;
      } else if (error?.message && typeof error.message === 'string') {
        // For other server errors, use the message directly (don't translate)
        message = error.message;
      } else {
        // Default fallback
        message = t('auth.loginFailed', 'Login failed. Please check your credentials.');
      }
      
      toast.error(message);
    },

    googleLoginSuccess: (user) => {
      const message = user?.first_name
        ? t('auth.googleLoginSuccess', 'Signed in with Google successfully!') + ` Welcome ${user.first_name}!`
        : t('auth.googleLoginSuccess', 'Signed in with Google successfully!');
      toast.success(message);
    },

    googleLoginFailed: () => {
      // Use direct translation lookup to avoid fallback conflicts
      const message = t('auth.googleLoginFailed') || 'Google sign-in failed. Please try again.';
      toast.error(message);
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
      // Debounce duplicate session-expired toasts
      const id = 'auth-session-expired';
      toast.dismiss(id);
      toast.error(t('auth.sessionExpired', 'Your session has expired. Please sign in again.'), { id });
    },

    sessionExpiring: () => {
      toast.warning('Your session will expire in 5 minutes. Click to extend.');
    },

    unauthorizedAccess: () => {
      toast.error(t('auth.unauthorizedAccess', 'Access denied. Please sign in to continue.'));
    },

    // ✅ NEW: Connection Recovery Toasts
    connectionIssue: (message) => {
      toast.warning(message || t('auth.connectionIssue', 'Connection issue detected...'));
    },

    connectionRecovering: (message) => {
      // Ensure single loading instance
      const id = 'connection-recovering';
      toast.dismiss(id);
      return toast.loading(
        message || t('auth.connectionRecovering', 'Attempting to reconnect to server...'),
        { id }
      );
    },

    connectionRestored: (message) => {
      toast.success(message || t('auth.connectionRestored', 'Connection to server restored successfully! 🎉'));
    },

    connectionFailed: (message) => {
      toast.dismiss('connection-recovering');
      toast.error(message || t('auth.connectionFailed', 'Failed to connect to server. Please try again.'));
    },

    autoLogout: (reason) => {
      // Dismiss any loading/recovery toasts first to avoid overlap
      try {
        toast.dismiss('connection-recovering');
      } catch (_) {}
      const messages = {
        auth_failure: t('auth.autoLogoutAuthFailure', 'Automatically signed out due to authentication issues'),
        stuck_state: t('auth.autoLogoutStuckState', 'Automatically signed out due to connection issues'),
        recovery_failed: t('auth.autoLogoutRecoveryFailed', 'Automatically signed out - unable to recover connection'),
        multiple_failures: t('auth.autoLogoutMultipleFailures', 'Automatically signed out due to multiple failures')
      };
      toast.error(messages[reason] || t('auth.sessionExpired', 'Your session has expired. Please sign in again.'));
    },

    // Explicit session expired toast (single definition)

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
      return toast.loading(t('loading.signingOut', 'Signing out...'));
    },

    uploadingAvatar: () => {
      return toast.loading(t('loading.uploading', 'Uploading profile picture...'));
    },

    updatingProfile: () => {
      return toast.loading(t('loading.saving', 'Saving changes...'));
    },

    // ✅ Expose toast utilities for dismissing loading toasts
    dismiss: toast.dismiss,
    dismissAll: toast.dismissAll,
    toast: toast // ✅ Direct access to toast methods
  };
}; 