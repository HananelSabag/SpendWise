/**
 * 📋 TEMPLATE CARD - Individual Template Display
 * Extracted from massive InitialTemplatesStep.jsx for reusability
 * Features: Selection state, Animations, Currency formatting, Mobile-first
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, TrendingUp, TrendingDown } from 'lucide-react';

// ✅ Import stores and components
import { useTranslation, useCurrency } from '../../../../../stores';
import { Badge } from '../../../../ui';
import { cn } from '../../../../../utils/helpers';

/**
 * 📋 Template Card Component
 */
const TemplateCard = ({
  template,
  isSelected = false,
  onToggle,
  showCategory = true,
  showFrequency = true,
  showTags = false,
  size = 'default', // compact, default, large
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');
  const { formatCurrency } = useCurrency();

  // ✅ Resolve template description from translation key
  const description = t(template.descriptionKey, { 
    fallback: template.description || template.descriptionKey 
  });

  // ✅ Get icon component
  const IconComponent = template.icon;

  // ✅ Size configurations
  const sizeConfig = {
    compact: {
      container: 'p-3',
      icon: 'w-8 h-8',
      iconContainer: 'w-10 h-10',
      title: 'text-sm',
      amount: 'text-lg',
      spacing: 'space-y-2'
    },
    default: {
      container: 'p-4',
      icon: 'w-6 h-6',
      iconContainer: 'w-12 h-12',
      title: 'text-base',
      amount: 'text-xl',
      spacing: 'space-y-3'
    },
    large: {
      container: 'p-6',
      icon: 'w-8 h-8',
      iconContainer: 'w-16 h-16',
      title: 'text-lg',
      amount: 'text-2xl',
      spacing: 'space-y-4'
    }
  }[size];

  // ✅ Animation variants
  const cardVariants = {
    idle: { 
      scale: 1,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    },
    hover: { 
      scale: 1.02,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    },
    selected: {
      scale: 1.05,
      boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)',
      transition: { duration: 0.2 }
    }
  };

  const checkmarkVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30 
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="idle"
      whileHover="hover"
      animate={isSelected ? "selected" : "idle"}
      onClick={() => onToggle?.(template)}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 transition-all",
        sizeConfig.container,
        isSelected 
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600",
        className
      )}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          variants={checkmarkVariants}
          initial="hidden"
          animate="visible"
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <Check className="w-4 h-4 text-white" />
        </motion.div>
      )}

      <div className={cn("flex items-start", sizeConfig.spacing)}>
        {/* Icon */}
        <div 
          className={cn(
            "flex-shrink-0 rounded-lg flex items-center justify-center",
            sizeConfig.iconContainer,
            template.bgColor
          )}
        >
          <IconComponent className={cn(sizeConfig.icon, template.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Amount */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-medium text-gray-900 dark:text-white truncate",
                sizeConfig.title
              )}>
                {description}
              </h3>
              
              {/* Category */}
              {showCategory && template.category && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                  {template.category}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="flex-shrink-0 text-right ml-3">
              <div className={cn(
                "font-bold",
                sizeConfig.amount,
                template.type === 'income' 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {template.type === 'income' ? '+' : '-'}
                {formatCurrency(template.amount)}
              </div>
              
              {/* Frequency */}
              {showFrequency && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t(`frequencies.${template.frequency}`)}
                </div>
              )}
            </div>
          </div>

          {/* Type Indicator */}
          <div className="flex items-center space-x-2 mt-2">
            <div className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
              template.type === 'income' 
                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
            )}>
              {template.type === 'income' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{t(`templateTypes.${template.type}`)}</span>
            </div>

            {/* Custom Template Indicator */}
            {template.isCustom && (
              <Badge variant="outline" size="sm">
                {t('templates.custom')}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {showTags && template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                >
                  {tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-blue-50/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
    </motion.div>
  );
};

export default TemplateCard; 