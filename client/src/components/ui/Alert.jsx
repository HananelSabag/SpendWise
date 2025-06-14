// components/ui/Alert.jsx
import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

const Alert = ({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
  ...props
}) => {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle
  };

  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex',
        styles[type],
        isRTL && 'flex-row-reverse',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className={cn(
        "flex-1",
        isRTL ? "mr-3 text-right" : "ml-3 text-left"
      )}>
        {title && (
          <h4 className="font-medium mb-1">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className={cn(
            "p-1 rounded-lg hover:bg-black/10 transition-colors -mt-1",
            isRTL ? "mr-3 -ml-1" : "ml-3 -mr-1"
          )}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;