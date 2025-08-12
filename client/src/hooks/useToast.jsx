/**
 * 🍞 useToast Hook - ZUSTAND COMPATIBLE VERSION
 * Beautiful Modern Toast Notification System with i18n support
 * NOW USES ZUSTAND STORES! 🎉
 * 
 * Features:
 * ✅ Full i18n support (Hebrew/English) via Zustand
 * ✅ Modern glassmorphism design with beautiful animations
 * ✅ Custom SVG icons instead of emojis
 * ✅ Enhanced typography with modern font stack
 * ✅ Loading states with progress
 * ✅ Rich toast types (success, error, warning, info, loading)
 * ✅ Beautiful gradients and shadows
 * ✅ Server error handling
 * ✅ Automatic message fallbacks
 * @version 2.0.0
 */

import React, { useCallback, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// ✅ NEW: Import from Zustand stores instead of Context
import { useTranslation } from '../stores';

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

  const color = getIconColor(type);

  const icons = {
    success: (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path
          d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M13 8L9 12L7 10"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    error: (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path
          d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M12 8L8 12M8 8L12 12"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    warning: (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path
          d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M10 6V10M10 14H10.01"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    info: (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path
          d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M10 10V14M10 6H10.01"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    loading: (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2V6M10 14V18M18 10H14M6 10H2M15.657 4.343L12.829 7.171M7.171 12.829L4.343 15.657M15.657 15.657L12.829 12.829M7.171 7.171L4.343 4.343"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-spin"
          style={{ transformOrigin: '50% 50%' }}
        />
      </svg>
    )
  };

  return icons[type] || icons.info;
};

// ✅ ENHANCED: Toast notification component with close button
const ToastNotification = ({ message, type, icon: customIcon, toastId, onClose }) => {
  // ✅ NEW: Use Zustand translation store
  const { currentLanguage, isRTL } = useTranslation();

  const getTypeStyles = (toastType) => {
    const styles = {
      success: {
        bg: 'from-green-50 via-emerald-50 to-green-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20',
        border: 'border-green-200 dark:border-green-700/50',
        text: 'text-green-900 dark:text-green-100',
        shadow: 'shadow-lg shadow-green-100/50 dark:shadow-green-900/20'
      },
      error: {
        bg: 'from-red-50 via-rose-50 to-red-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-red-900/20',
        border: 'border-red-200 dark:border-red-700/50',
        text: 'text-red-900 dark:text-red-100',
        shadow: 'shadow-lg shadow-red-100/50 dark:shadow-red-900/20'
      },
      warning: {
        bg: 'from-orange-50 via-amber-50 to-orange-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-orange-900/20',
        border: 'border-orange-200 dark:border-orange-700/50',
        text: 'text-orange-900 dark:text-orange-100',
        shadow: 'shadow-lg shadow-orange-100/50 dark:shadow-orange-900/20'
      },
      info: {
        bg: 'from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20',
        border: 'border-blue-200 dark:border-blue-700/50',
        text: 'text-blue-900 dark:text-blue-100',
        shadow: 'shadow-lg shadow-blue-100/50 dark:shadow-blue-900/20'
      },
      loading: {
        bg: 'from-purple-50 via-violet-50 to-purple-50 dark:from-purple-900/20 dark:via-violet-900/20 dark:to-purple-900/20',
        border: 'border-purple-200 dark:border-purple-700/50',
        text: 'text-purple-900 dark:text-purple-100',
        shadow: 'shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20'
      }
    };
    return styles[toastType] || styles.info;
  };

  const typeStyles = getTypeStyles(type);

  return (
    <div
      className={`
        relative flex items-center p-4 rounded-xl backdrop-blur-md
        bg-gradient-to-r ${typeStyles.bg}
        border ${typeStyles.border}
        ${typeStyles.shadow}
        max-w-md w-full
        ${isRTL ? 'text-right' : 'text-left'}
        transition-all duration-200 ease-out
        hover:scale-105 transform
      `}
      style={{
        direction: isRTL ? 'rtl' : 'ltr',
        fontFamily: currentLanguage === 'he' 
          ? '"Heebo", "Noto Sans Hebrew", system-ui, -apple-system, sans-serif'
          : '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`}>
        {customIcon || <ToastIcon type={type} />}
      </div>

      {/* Message */}
      <div className={`flex-1 ${typeStyles.text}`}>
        <p className="text-sm font-medium leading-5 tracking-tight">
          {message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => {
          if (onClose) onClose();
          toast.dismiss(toastId);
        }}
        className={`
          flex-shrink-0 ${isRTL ? 'mr-2' : 'ml-2'} 
          p-1 rounded-lg transition-all duration-200
          hover:bg-black/10 dark:hover:bg-white/10
          focus:outline-none focus:ring-2 focus:ring-current focus:ring-opacity-50
          ${typeStyles.text}
        `}
        aria-label="Close notification"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Gradient border effect */}
      <div 
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent pointer-events-none"
        style={{ 
          background: isRTL 
            ? 'linear-gradient(to left, rgba(255,255,255,0.1), transparent)'
            : 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)'
        }}
      />
    </div>
  );
};

/**
 * ✅ ENHANCED: Main useToast hook with comprehensive translation support
 */
export const useToast = () => {
  // ✅ NEW: Use Zustand translation store with toast namespace
  const { t } = useTranslation('toast');

  // Toast notification functions
  const showToast = useCallback((message, type = 'info', options = {}) => {
    const resolvedMessage = typeof message === 'string' && message.includes('.') 
      ? t(message) || message 
      : message;

    // ✅ Smart positioning: right-top on desktop, top-center on mobile
    const getPosition = () => {
      if (options.position) return options.position;
      const isMobile = window.innerWidth <= 768;
      return isMobile ? 'top-center' : 'top-right';
    };

    return toast.custom(
      (toastData) => (
        <ToastNotification
          message={resolvedMessage}
          type={type}
          icon={options.icon}
          toastId={toastData.id}
          onClose={options.onClose}
        />
      ),
      {
        duration: options.duration || (type === 'loading' ? Infinity : 4000),
        position: getPosition(),
        ...options
      }
    );
  }, [t]);

  const success = useCallback((message, options = {}) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    let errorMessage;

    if (typeof message === 'string') {
      // Treat as translation key only if it matches dot.notation without spaces
      const looksLikeKey = /^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)+$/.test(message);
      if (looksLikeKey) {
        errorMessage = t(message) || message;
      } else {
        // Raw server/user message – use as-is
        errorMessage = message;
      }
    } else {
      errorMessage = message?.message || t('common.error') || 'An error occurred';
    }

    return showToast(errorMessage, 'error', { duration: 6000, ...options });
  }, [showToast, t]);

  const warning = useCallback((message, options = {}) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  const loading = useCallback((message, options = {}) => {
    return showToast(message, 'loading', options);
  }, [showToast]);

  // Promise-based loading toast
  const promise = useCallback((promise, messages, options = {}) => {
    const loadingToast = loading(
      messages.loading || t('common.loading') || 'Loading...', 
      options
    );

    return promise
      .then((result) => {
        toast.dismiss(loadingToast);
        success(
          messages.success || t('common.success') || 'Success!',
          options
        );
        return result;
      })
      .catch((error) => {
        toast.dismiss(loadingToast);
        showToast(
          messages.error || error?.message || t('common.error') || 'Error occurred',
          'error',
          { duration: 6000, ...options }
        );
        throw error;
      });
  }, [loading, success, showToast, t]);

  // Dismiss functions
  const dismiss = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  return useMemo(() => ({
    // Main functions
    success,
    error,
    warning,
    info,
    loading,
    promise,
    
    // Utility functions
    dismiss,
    dismissAll,
    
    // Raw toast function for custom usage
    showToast,
    
    // Backward compatibility
    toast: showToast
  }), [success, error, warning, info, loading, promise, dismiss, dismissAll, showToast]);
};

// ✅ Enhanced Toaster Provider Component with smart positioning
export const ToastProvider = ({ children }) => {
  const { isRTL } = useTranslation();
  
  // ✅ Smart positioning: right-top on desktop, top-center on mobile
  const getDefaultPosition = () => {
    if (typeof window === 'undefined') return 'top-center';
    const isMobile = window.innerWidth <= 768;
    return isMobile ? 'top-center' : 'top-right';
  };
  
  return (
    <>
      {children}
      <Toaster
        position={getDefaultPosition()}
        reverseOrder={isRTL}
        gutter={8}
        containerStyle={{
          zIndex: 9999,
          // ✅ Better spacing from edges
          top: '20px',
          right: '20px',
          left: '20px'
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            margin: 0,
            // ✅ Responsive width
            maxWidth: '100%',
            width: 'auto'
          }
        }}
      />
    </>
  );
};

// ✅ Backward compatibility - export as default
export default useToast; 