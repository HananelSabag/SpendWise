/**
 * ⏳ LOADING SPINNER COMPONENT - Mobile-First Loading States
 * Features: Zustand stores, Multiple variants, Responsive sizing
 * @version 2.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

const LoadingSpinner = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className = '',
  color = 'primary',
  ...props
}) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t } = useTranslation();

  // ✅ Size configurations
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
    '2xl': 'w-12 h-12'
  };

  // ✅ Color configurations
  const colors = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    white: 'text-white',
    success: 'text-green-600 dark:text-green-400',
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400'
  };

  // ✅ Animation variants
  const spinnerVariants = {
    initial: { rotate: 0 },
    animate: { 
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  const pulseVariants = {
    initial: { opacity: 0.5, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }
    }
  };

  const dotsVariants = {
    initial: { opacity: 0.3 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
      }
    }
  };

  // ✅ Render different spinner variants
  const renderSpinner = () => {
    const spinnerClass = cn(sizes[size], colors[color], className);

    switch (variant) {
      case 'spinner':
        return (
          <motion.div
            variants={spinnerVariants}
            initial="initial"
            animate="animate"
          >
            <Loader2 className={spinnerClass} />
          </motion.div>
        );

      case 'refresh':
        return (
          <motion.div
            variants={spinnerVariants}
            initial="initial"
            animate="animate"
          >
            <RefreshCw className={spinnerClass} />
          </motion.div>
        );

      case 'pulse':
        return (
          <motion.div
            variants={pulseVariants}
            initial="initial"
            animate="animate"
            className={cn(
              'rounded-full border-2 border-current',
              spinnerClass
            )}
          />
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                variants={dotsVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.2 }}
                className={cn(
                  'w-2 h-2 rounded-full bg-current',
                  colors[color]
                )}
              />
            ))}
          </div>
        );

      case 'bars':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((index) => (
              <motion.div
                key={index}
                initial={{ scaleY: 0.5 }}
                animate={{
                  scaleY: [0.5, 1, 0.5],
                  transition: {
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.1,
                    ease: 'easeInOut'
                  }
                }}
                className={cn(
                  'w-1 h-6 bg-current origin-bottom',
                  colors[color],
                  size === 'sm' && 'h-4',
                  size === 'lg' && 'h-8',
                  size === 'xl' && 'h-10'
                )}
              />
            ))}
          </div>
        );

      default:
        return (
          <motion.div
            variants={spinnerVariants}
            initial="initial"
            animate="animate"
          >
            <Loader2 className={spinnerClass} />
          </motion.div>
        );
    }
  };

  // ✅ Content wrapper
  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-3',
      fullScreen && 'min-h-screen',
      !fullScreen && 'p-4'
    )}>
      {renderSpinner()}
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'text-sm font-medium',
            colors[color],
            'text-center max-w-xs'
          )}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  // ✅ Full screen overlay
  if (fullScreen) {
    return (
      <div className={cn(
        'fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
        'flex items-center justify-center'
      )}>
        {content}
      </div>
    );
  }

  return content;
};

// ✅ Preset loading states
export const PageLoader = ({ text, ...props }) => (
  <LoadingSpinner
    size="lg"
    text={text}
    fullScreen
    {...props}
  />
);

export const ButtonLoader = ({ size = 'sm', ...props }) => (
  <LoadingSpinner
    size={size}
    color="white"
    variant="spinner"
    {...props}
  />
);

export const InlineLoader = ({ text, ...props }) => (
  <LoadingSpinner
    size="sm"
    text={text}
    variant="dots"
    {...props}
  />
);

export const RefreshLoader = ({ ...props }) => (
  <LoadingSpinner
    variant="refresh"
    size="md"
    {...props}
  />
);

export default LoadingSpinner;