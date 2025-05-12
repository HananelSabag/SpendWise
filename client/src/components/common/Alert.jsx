// components/common/Alert.jsx
// Alert component with full translation support for all message types
import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Alert Component
 * Displays different types of alerts with appropriate styling and icons
 * Fully translated for Hebrew and English support
 * 
 * @param {string} type - Alert type: 'success', 'error', 'info', 'warning'
 * @param {string} message - Alert message content
 * @param {Function} onDismiss - Optional function to handle dismissal
 * @param {string} className - Additional CSS classes
 * @param {ReactNode} children - Child elements for custom content
 */
const Alert = ({ 
  type = 'info', 
  message, 
  onDismiss = null,
  className = '',
  children
}) => {
  const { t } = useLanguage();
  
  // If no message and no children provided, don't render anything
  if (!message && !children) return null;
  
  // Define styles and configurations based on alert type
  const alertConfigs = {
    success: {
      bg: 'bg-success-light',
      border: 'border-success',
      text: 'text-success-dark',
      icon: CheckCircle,
      dark: 'dark:bg-green-900/30 dark:border-green-700 dark:text-green-400',
      defaultTitle: t('alerts.success.title'),
      defaultMessage: t('alerts.success.defaultMessage')
    },
    error: {
      bg: 'bg-error-light',
      border: 'border-error',
      text: 'text-error-dark',
      icon: AlertCircle,
      dark: 'dark:bg-red-900/30 dark:border-red-700 dark:text-red-400',
      defaultTitle: t('alerts.error.title'),
      defaultMessage: t('alerts.error.defaultMessage')
    },
    info: {
      bg: 'bg-info-light',
      border: 'border-info',
      text: 'text-info-dark',
      icon: Info,
      dark: 'dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400',
      defaultTitle: t('alerts.info.title'),
      defaultMessage: t('alerts.info.defaultMessage')
    },
    warning: {
      bg: 'bg-warning-light',
      border: 'border-warning',
      text: 'text-warning-dark',
      icon: AlertCircle,
      dark: 'dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400',
      defaultTitle: t('alerts.warning.title'),
      defaultMessage: t('alerts.warning.defaultMessage')
    }
  };
  
  // Get configuration for current alert type, fallback to info
  const config = alertConfigs[type] || alertConfigs.info;
  const Icon = config.icon;
  
  // Determine content to display
  const displayMessage = message || config.defaultMessage;
  
  return (
    <div 
      className={`
        p-4 rounded-xl border-l-4 ${config.border} ${config.bg} ${config.dark}
        flex items-center gap-3 animate-slideUp
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Alert icon */}
      <Icon className={`h-5 w-5 ${config.text} flex-shrink-0`} />
      
      {/* Alert content */}
      <div className={`flex-1 ${config.text}`}>
        {children || displayMessage}
      </div>
      
      {/* Dismiss button if handler provided */}
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className={`p-1 rounded-full hover:bg-white/30 transition-colors ${config.text}`}
          aria-label={t('alerts.dismiss')}
          title={t('alerts.dismiss')}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;