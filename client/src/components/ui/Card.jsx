// components/ui/Card.jsx
import React from 'react';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  footer,
  variant = 'default',
  state = null, // NEW: success, warning, error, info
  padding = 'default',
  hoverable = false,
  clickable = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  onClick,
  ...props
}) => {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  
  const variants = {
    // 🔄 EXISTING VARIANTS (keep unchanged)
    default: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
    outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
    elevated: 'bg-white shadow-lg dark:bg-gray-800',
    filled: 'bg-gray-50 dark:bg-gray-900',
    
    // 🚀 NEW DESIGN SYSTEM VARIANTS
    // KPI cards - for key metrics only
    kpi: 'bg-gradient-to-br from-primary-500 to-primary-700 text-white border-0 shadow-lg',
    kpiSuccess: 'bg-gradient-to-br from-success to-success-dark text-white border-0 shadow-lg',
    kpiError: 'bg-gradient-to-br from-error to-error-dark text-white border-0 shadow-lg',
    
    // 🎨 UNIFIED DESIGN SYSTEM VARIANTS - Enterprise grade
    gradient: 'gradient-hero-primary text-white border-0 shadow-premium',
    gradientSecondary: 'gradient-hero-secondary text-white border-0 shadow-premium',
    gradientAccent: 'gradient-hero-accent text-white border-0 shadow-premium',
    
    // Highlight cards - subtle section emphasis
    highlight: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-l-4 border-primary-500',
    highlightSuccess: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500',
    highlightError: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-l-4 border-red-500',
    
    // Clean cards - primary content areas
    clean: 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm',
    
    // Modal system
    modal: 'bg-white dark:bg-gray-800 border-0 shadow-2xl',
    modalHeader: 'bg-gradient-to-r from-primary-500 to-primary-700 text-white border-0',
    
    // 🎨 PHASE 15: NEW STATE VARIANTS
    'state-success': 'card-state-success interaction-enhanced',
    'state-warning': 'card-state-warning interaction-enhanced',
    'state-error': 'card-state-error interaction-enhanced',
    'state-info': 'card-state-info interaction-enhanced'
  };

  const paddings = {
    none: '',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8',
    compact: 'p-3',      // ADD
    adaptive: 'adaptive-card'  // ADD
  };

  // 🎯 PHASE 15: State-aware variant selection
  const getVariant = () => {
    if (state) {
      return `state-${state}`;
    }
    return variant;
  };

  const cardStyles = cn(
    'rounded-xl transition-all duration-200',
    variants[getVariant()],
    hoverable && 'hover:shadow-lg hover:-translate-y-0.5 card-interactive',
    clickable && 'cursor-pointer card-premium micro-scale',
    className
  );

  const content = (
    <>
      {(title || subtitle || actions) && (
        <div className={cn(
          'border-b border-gray-100 dark:border-gray-700',
          (variant.includes('kpi') || variant.includes('modal') || state) && 'border-none',
          padding !== 'none' && paddings[padding],
          headerClassName
        )}>
          <div className={cn(
            "flex items-start justify-between",
            isRTL && "flex-row-reverse"
          )}>
            <div className={cn(
              "flex-1",
              isRTL && "text-right"
            )}>
              {title && (
                <h3 className={cn(
                  "text-lg font-semibold",
                  state ? "text-inherit" : "text-gray-900 dark:text-white"
                )}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={cn(
                  "mt-1 text-sm",
                  state ? "text-inherit opacity-80" : "text-gray-500 dark:text-gray-400"
                )}>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className={isRTL ? "mr-4" : "ml-4"}>
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={cn(
        padding !== 'none' && paddings[padding],
        bodyClassName
      )}>
        {children}
      </div>
      
      {footer && (
        <div className={cn(
          'border-t border-gray-100 dark:border-gray-700',
          (state) && 'border-none',
          padding !== 'none' && paddings[padding],
          footerClassName
        )}>
          {footer}
        </div>
      )}
    </>
  );

  if (clickable && onClick) {
    return (
      <div
        onClick={onClick}
        className={cardStyles}
        dir={isRTL ? 'rtl' : 'ltr'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        {...props}
      >
        {content}
      </div>
    );
  }

  return (
    <div 
      className={cardStyles} 
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    >
      {content}
    </div>
  );
};

export default Card;