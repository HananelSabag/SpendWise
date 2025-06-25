/**
 * useToast Hook - Beautiful Modern Toast Notification System
 * 
 * Features:
 * ✅ Full i18n support (Hebrew/English)
 * ✅ Modern glassmorphism design with beautiful animations
 * ✅ Custom SVG icons instead of emojis
 * ✅ Enhanced typography with modern font stack
 * ✅ Loading states with progress
 * ✅ Rich toast types (success, error, warning, info, loading)
 * ✅ Beautiful gradients and shadows
 * ✅ Server error handling
 * ✅ Automatic message fallbacks
 */

import React, { useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

// Modern SVG Icons Component with dynamic colors
const ToastIcon = ({ type, size = 20 }) => {
  const getIconColor = (iconType) => {
    const colors = {
      success: '#16a34a',
      error: '#dc2626', 
      warning: '#ea580c',
      info: '#2563eb',
      loading: '#7c3aed'
    };
    return colors[iconType] || colors.info;
  };

  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: getIconColor(type),
    style: { 
      flexShrink: 0
    }
  };

  const icons = {
    success: (
      <svg {...iconProps}>
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
      </svg>
    ),
    error: (
      <svg {...iconProps}>
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    ),
    warning: (
      <svg {...iconProps}>
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>
    ),
    info: (
      <svg {...iconProps}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
    ),
    loading: (
      <svg {...iconProps} className="animate-spin">
        <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
      </svg>
    )
  };

  return (
    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
      {icons[type] || icons.info}
    </div>
  );
};

// Clean flat toast styling with bubbly font and no 3D effects
const getToastStyle = (type, isRTL) => {
  const baseStyle = {
    borderRadius: '20px',
    fontFamily: '"Comic Neue", "Nunito", "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", sans-serif',
    fontSize: '15px',
    fontWeight: '500',
    padding: '16px 20px',
    maxWidth: '420px',
    minHeight: '56px',
    borderWidth: '2px',
    borderStyle: 'solid',
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.3s ease',
    background: '#ffffff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const styles = {
    success: {
      ...baseStyle,
      borderColor: '#16a34a', // Less greeny, more balanced green
      color: '#15803d',
    },
    error: {
      ...baseStyle,
      borderColor: '#dc2626',
      color: '#dc2626',
    },
    warning: {
      ...baseStyle,
      borderColor: '#ea580c',
      color: '#ea580c',
    },
    info: {
      ...baseStyle,
      borderColor: '#2563eb',
      color: '#2563eb',
    },
    loading: {
      ...baseStyle,
      borderColor: '#7c3aed',
      color: '#7c3aed',
    }
  };

  return styles[type] || styles.info;
};

// Modern React component for toast icons
const getToastIcon = (type) => {
  return <ToastIcon type={type} size={22} />;
};

// Map server error codes to user-friendly messages
const mapServerError = (error, t) => {
  const errorCode = error?.response?.data?.error?.code;
  const errorMessage = error?.response?.data?.error?.message;
  const statusCode = error?.response?.status;

  // Map specific error codes
  const errorMap = {
    // Authentication errors
    'INVALID_CREDENTIALS': t('toast.error.invalidCredentials'),
    'EMAIL_NOT_VERIFIED': t('toast.error.emailNotVerified'),
    'TOKEN_EXPIRED': t('toast.error.tokenExpired'),
    'UNAUTHORIZED': t('toast.error.unauthorized'),
    'FORBIDDEN': t('toast.error.unauthorized'),

    // Validation errors
    'VALIDATION_ERROR': t('toast.error.formErrors'),
    'MISSING_REQUIRED': t('toast.error.formErrors'),
    'INVALID_INPUT': t('toast.error.formErrors'),

    // Category errors
    'CATEGORY_IN_USE': t('toast.error.categoryInUse'),
    'ALREADY_EXISTS': t('toast.error.emailAlreadyExists'),

    // Server errors
    'DB_ERROR': t('toast.error.databaseError'),
    'SQL_ERROR': t('toast.error.databaseError'),
    'CREATE_FAILED': t('toast.error.operationFailed'),
    'UPDATE_FAILED': t('toast.error.operationFailed'),
    'DELETE_FAILED': t('toast.error.operationFailed'),
    'FETCH_FAILED': t('toast.error.operationFailed'),

    // Rate limiting
    'RATE_LIMIT_EXCEEDED': t('toast.error.tooManyRequests'),
    'AUTH_RATE_LIMIT': t('toast.error.tooManyRequests'),
    'TRANSACTION_LIMIT': t('toast.error.tooManyRequests'),

    // Network/Status errors
    'NOT_FOUND': t('toast.error.notFound'),
    'UNKNOWN_ERROR': t('toast.error.unexpectedError')
  };

  // Check for specific error code mapping
  if (errorCode && errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  // Check for HTTP status code mapping
  const statusMap = {
    400: t('toast.error.formErrors'),
    401: t('toast.error.unauthorized'),
    403: t('toast.error.unauthorized'),
    404: t('toast.error.notFound'),
    409: t('toast.error.emailAlreadyExists'),
    429: t('toast.error.tooManyRequests'),
    500: t('toast.error.serverError'),
    502: t('toast.error.serverError'),
    503: t('toast.error.serviceUnavailable'),
    504: t('toast.error.operationTimeout')
  };

  if (statusCode && statusMap[statusCode]) {
    return statusMap[statusCode];
  }

  // Fallback to provided message or generic error
  return errorMessage || t('toast.error.generic');
};

/**
 * Enhanced useToast hook with beautiful design integration
 */
export const useToast = () => {
  const { t, isRTL } = useLanguage();

  // Toast configuration options
  const defaultOptions = useMemo(() => ({
    duration: 4000,
    position: 'top-center',
    reverseOrder: false,
    gutter: 12,
  }), []);

  // Success toast
  const success = useCallback((messageKey, options = {}) => {
    const message = typeof messageKey === 'string' 
      ? (messageKey.startsWith('toast.') ? t(messageKey, options.params) : messageKey)
      : messageKey;

    return toast.success(message, {
      ...defaultOptions,
      duration: options.duration || 3000,
      ...options
    });
  }, [t, isRTL, defaultOptions]);

  // Error toast with automatic server error mapping
  const error = useCallback((messageKeyOrError, options = {}) => {
    let message;

    // Check if it's an error object (from API calls)
    if (messageKeyOrError && typeof messageKeyOrError === 'object' && messageKeyOrError.response) {
      message = mapServerError(messageKeyOrError, t);
    } else if (typeof messageKeyOrError === 'string') {
      // It's a translation key or direct message
      message = messageKeyOrError.startsWith('toast.') 
        ? t(messageKeyOrError, options.params) 
        : messageKeyOrError;
    } else {
      // Fallback for unknown error types
      message = messageKeyOrError?.message || t('toast.error.generic');
    }

    return toast.error(message, {
      ...defaultOptions,
      duration: options.duration || 5000,
      ...options
    });
  }, [t, isRTL, defaultOptions]);

  // Warning toast
  const warning = useCallback((messageKey, options = {}) => {
    const message = typeof messageKey === 'string' 
      ? (messageKey.startsWith('toast.') ? t(messageKey, options.params) : messageKey)
      : messageKey;

    return toast(message, {
      ...defaultOptions,
      duration: options.duration || 4000,
      ...options
    });
  }, [t, isRTL, defaultOptions]);

  // Info toast
  const info = useCallback((messageKey, options = {}) => {
    const message = typeof messageKey === 'string' 
      ? (messageKey.startsWith('toast.') ? t(messageKey, options.params) : messageKey)
      : messageKey;

    return toast(message, {
      ...defaultOptions,
      duration: options.duration || 4000,
      ...options
    });
  }, [t, isRTL, defaultOptions]);

  // Loading toast with optional progress
  const loading = useCallback((messageKey, options = {}) => {
    const message = typeof messageKey === 'string' 
      ? (messageKey.startsWith('toast.') ? t(messageKey, options.params) : messageKey)
      : messageKey;

    return toast.loading(message, {
      ...defaultOptions,
      duration: Infinity, // Loading toasts should be dismissed manually
      ...options
    });
  }, [t, isRTL, defaultOptions]);

  // Promise toast - handles async operations with loading, success, and error states
  const promise = useCallback((promiseFunction, messages = {}, options = {}) => {
    const defaultMessages = {
      loading: t('toast.loading.processingRequest'),
      success: t('toast.success.operationSuccess'),
      error: t('toast.error.operationFailed')
    };

    const finalMessages = {
      loading: messages.loading || defaultMessages.loading,
      success: messages.success || defaultMessages.success,
      error: messages.error || defaultMessages.error
    };

    return toast.promise(promiseFunction, finalMessages, {
      ...defaultOptions,
      loading: {
        duration: Infinity
      },
      success: {
        duration: 3000
      },
      error: {
        duration: 5000
      },
      ...options
    });
  }, [t, isRTL, defaultOptions]);

  // Dismiss specific toast
  const dismiss = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  // Dismiss all toasts
  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  // Custom toast for complex content
  const custom = useCallback((content, options = {}) => {
    return toast.custom(content, {
      ...defaultOptions,
      ...options
    });
  }, [defaultOptions]);

  // Convenience methods for common operations
  const api = useMemo(() => ({
    // Authentication
    loginSuccess: () => success('toast.success.loginSuccess'),
    logoutSuccess: () => success('toast.success.logoutSuccess'),
    registerSuccess: () => success('toast.success.registerSuccess'),
    emailVerified: () => success('toast.success.emailVerified'),
    passwordChanged: () => success('toast.success.passwordChanged'),
    passwordReset: () => success('toast.success.passwordReset'),
    verificationSent: () => success('toast.success.verificationSent'),
    
    // Profile
    profileUpdated: () => success('toast.success.profileUpdated'),
    profilePictureUploaded: () => success('toast.success.profilePictureUploaded'),
    preferencesUpdated: () => success('toast.success.preferencesUpdated'),
    
    // Transactions
    transactionCreated: () => success('toast.success.transactionCreated'),
    transactionUpdated: () => success('toast.success.transactionUpdated'),
    transactionDeleted: () => success('toast.success.transactionDeleted'),
    transactionGenerated: () => success('toast.success.transactionGenerated'),
    templateUpdated: () => success('toast.success.templateUpdated'),
    skipDatesSuccess: () => success('toast.success.skipDatesSuccess'),
    dataRefreshed: () => success('toast.success.dataRefreshed'),
    nextPaymentSkipped: () => success('toast.success.nextPaymentSkipped'),
    
    // Categories
    categoryCreated: () => success('toast.success.categoryCreated'),
    categoryUpdated: () => success('toast.success.categoryUpdated'),
    categoryDeleted: () => success('toast.success.categoryDeleted'),
    
    // Export
    csvExportCompleted: () => success('toast.success.csvExportCompleted'),
    jsonExportCompleted: () => success('toast.success.jsonExportCompleted'),
    
    // Errors - Common ones that are used frequently
    networkError: () => error('toast.error.networkError'),
    serverError: () => error('toast.error.serverError'),
    unauthorized: () => error('toast.error.unauthorized'),
    operationFailed: () => error('toast.error.operationFailed'),
    formErrors: () => error('toast.error.formErrors'),
    
    // Info
    featureComingSoon: () => info('toast.info.featureComingSoon'),
    pdfExportComingSoon: () => info('toast.info.pdfExportComingSoon'),
    dataLoading: () => info('toast.info.dataLoading'),
    
    // Loading
    savingChanges: () => loading('toast.loading.savingChanges'),
    loadingData: () => loading('toast.loading.loadingData'),
    processingRequest: () => loading('toast.loading.processingRequest'),
    preparingExport: (params) => loading('toast.loading.preparingExport', { params })
  }), [success, error, info, loading]);

  return {
    // Core methods
    success,
    error,
    warning,
    info,
    loading,
    promise,
    custom,
    dismiss,
    dismissAll,
    
    // Convenience API methods
    ...api,
    
    // Advanced usage
    mapServerError: (err) => mapServerError(err, t),
    
    // Toast configuration
    configure: (config) => {
      Object.assign(defaultOptions, config);
    }
  };
};

// ✅ FIX: Export as named export to match imports
export { useToast };

// Clean ToastProvider component using default react-hot-toast design
export const ToastProvider = ({ children }) => {
  const { isRTL } = useLanguage();

  return (
    <>
      {children}
      <Toaster
        position={isRTL ? "top-left" : "top-right"}
        reverseOrder={isRTL}
        gutter={8}
        containerStyle={{
          top: 80,
        }}
        toastOptions={{
          duration: 4000,
        }}
      />
    </>
  );
}; 