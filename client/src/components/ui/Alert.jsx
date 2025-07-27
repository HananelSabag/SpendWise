/**
 * 🚨 ALERT COMPONENT - MOBILE-FIRST
 * Enhanced alert component with better accessibility
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, XCircle, Info, X,
  Zap, Shield, Bell, Heart
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import { useTranslation, useTheme } from '../../stores';

import Button from './Button';
import { cn } from '../../utils/helpers';

const Alert = ({
  variant = 'info', // success, error, warning, info
  title,
  children,
  onClose,
  dismissible = false,
  autoClose = false,
  autoCloseDelay = 5000,
  icon: CustomIcon,
  className = '',
  size = 'md', // sm, md, lg
  priority = 'normal', // low, normal, high, critical
  actions = [],
  ...props
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('common');
  const { isDark } = useTheme();

  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Auto close functionality
  useEffect(() => {
    if (autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  // Handle close with animation
  const handleClose = () => {
    if (isClosing) return;
    
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  // Variant configurations
  const variantConfig = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      textColor: 'text-green-800 dark:text-green-200',
      titleColor: 'text-green-900 dark:text-green-100'
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      textColor: 'text-red-800 dark:text-red-200',
      titleColor: 'text-red-900 dark:text-red-100'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-700',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      titleColor: 'text-yellow-900 dark:text-yellow-100'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      textColor: 'text-blue-800 dark:text-blue-200',
      titleColor: 'text-blue-900 dark:text-blue-100'
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'p-3',
      iconSize: 'w-4 h-4',
      titleSize: 'text-sm',
      textSize: 'text-xs',
      gap: 'gap-2'
    },
    md: {
      padding: 'p-4',
      iconSize: 'w-5 h-5',
      titleSize: 'text-base',
      textSize: 'text-sm',
      gap: 'gap-3'
    },
    lg: {
      padding: 'p-6',
      iconSize: 'w-6 h-6',
      titleSize: 'text-lg',
      textSize: 'text-base',
      gap: 'gap-4'
    }
  };

  // Priority indicators
  const priorityConfig = {
    low: { pulse: false, glow: false },
    normal: { pulse: false, glow: false },
    high: { pulse: true, glow: false },
    critical: { pulse: true, glow: true }
  };

  const config = variantConfig[variant];
  const sizeConf = sizeConfig[size];
  const priorityConf = priorityConfig[priority];

  const IconComponent = CustomIcon || config.icon;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ 
          opacity: isClosing ? 0 : 1, 
          y: isClosing ? -10 : 0,
          scale: isClosing ? 0.95 : 1
        }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          // Base styles
          "rounded-xl border backdrop-blur-sm",
          config.bgColor,
          config.borderColor,
          sizeConf.padding,
          
          // Priority styles
          priorityConf.pulse && "animate-pulse",
          priorityConf.glow && "shadow-lg",
          
          // RTL support
          isRTL ? "text-right" : "text-left",
          
          className
        )}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        role="alert"
        aria-live={priority === 'critical' ? 'assertive' : 'polite'}
        {...props}
      >
        <div className={cn("flex items-start", sizeConf.gap)}>
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 mt-0.5",
            priorityConf.pulse && "animate-pulse"
          )}>
            <IconComponent className={cn(sizeConf.iconSize, config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            {title && (
              <h4 className={cn(
                "font-semibold mb-1",
                config.titleColor,
                sizeConf.titleSize
              )}>
                {title}
              </h4>
            )}

            {/* Message */}
            {children && (
              <div className={cn(
                "leading-relaxed",
                config.textColor,
                sizeConf.textSize,
                title && "mt-1"
              )}>
                {children}
              </div>
            )}

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || "outline"}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      "text-xs",
                      action.className
                    )}
                  >
                    {action.icon && (
                      <action.icon className="w-3 h-3 mr-1" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          {(dismissible || onClose) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className={cn(
                "flex-shrink-0 p-1 -mt-1",
                isRTL ? "-ml-1" : "-mr-1",
                config.iconColor,
                "hover:bg-black/5 dark:hover:bg-white/5"
              )}
              aria-label={t('actions.close')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && autoCloseDelay > 0 && (
          <motion.div
            className={cn(
              "absolute bottom-0 left-0 h-1 rounded-b-xl",
              config.iconColor.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-')
            )}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: autoCloseDelay / 1000, ease: 'linear' }}
          />
        )}

        {/* Priority indicator */}
        {priority === 'critical' && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Predefined alert variants for common use cases
export const SuccessAlert = (props) => (
  <Alert variant="success" {...props} />
);

export const ErrorAlert = (props) => (
  <Alert variant="error" {...props} />
);

export const WarningAlert = (props) => (
  <Alert variant="warning" {...props} />
);

export const InfoAlert = (props) => (
  <Alert variant="info" {...props} />
);

// Special alert types
export const WelcomeAlert = (props) => (
  <Alert
    variant="info"
    icon={Heart}
    priority="high"
    autoClose
    autoCloseDelay={8000}
    {...props}
  />
);

export const SecurityAlert = (props) => (
  <Alert
    variant="warning"
    icon={Shield}
    priority="high"
    {...props}
  />
);

export const PerformanceAlert = (props) => (
  <Alert
    variant="info"
    icon={Zap}
    size="sm"
    {...props}
  />
);

export const NotificationAlert = (props) => (
  <Alert
    variant="info"
    icon={Bell}
    dismissible
    autoClose
    {...props}
  />
);

export default Alert;