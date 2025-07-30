/**
 * 📂 TEMPLATE CATEGORIES - Category Navigation
 * Extracted from massive InitialTemplatesStep.jsx for better organization
 * Features: Category tabs, Active states, Animations, Mobile-first
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React from 'react';
import { motion } from 'framer-motion';

// ✅ Import stores and components
import { useTranslation } from '../../../../../stores';
import { Button, Badge } from '../../../../ui';
import { TEMPLATE_CATEGORIES } from './TemplateLibrary';
import { cn } from '../../../../../utils/helpers';
import { getIconComponent } from '../../../../../config/categoryIcons';

/**
 * 📂 Template Categories Component
 */
const TemplateCategories = ({
  currentCategory = 'popular',
  onCategoryChange,
  templateCounts = {},
  showCounts = true,
  layout = 'tabs', // tabs, grid, list
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const indicatorVariants = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: 1,
      transition: { duration: 0.3 }
    }
  };

  // ✅ Render tabs layout
  const renderTabs = () => (
    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
      {TEMPLATE_CATEGORIES.map((category) => {
        const isActive = currentCategory === category.id;
        const count = templateCounts[category.id] || 0;

        return (
          <motion.div
            key={category.id}
            variants={itemVariants}
            className="relative flex-shrink-0"
          >
            <Button
              variant={isActive ? "primary" : "ghost"}
              size="sm"
              onClick={() => onCategoryChange?.(category.id)}
              className={cn(
                "flex items-center space-x-2 min-w-0 relative overflow-hidden",
                isActive && "shadow-sm"
              )}
            >
              {React.createElement(getIconComponent(category.icon), {
                className: cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-white" : category.color
                )
              })}
              
              <span className="hidden sm:inline truncate">
                {t(category.labelKey)}
              </span>

              {/* Count Badge */}
              {showCounts && count > 0 && (
                <Badge 
                  variant={isActive ? "secondary" : "outline"} 
                  size="sm"
                  className="ml-1 text-xs"
                >
                  {count}
                </Badge>
              )}
            </Button>

            {/* Active Indicator */}
            {isActive && (
              <motion.div
                variants={indicatorVariants}
                initial="hidden"
                animate="visible"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30 rounded-full"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );

  // ✅ Render grid layout
  const renderGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {TEMPLATE_CATEGORIES.map((category) => {
        const isActive = currentCategory === category.id;
        const count = templateCounts[category.id] || 0;

        return (
          <motion.div
            key={category.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => onCategoryChange?.(category.id)}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all text-center",
                isActive 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-2",
                isActive ? "bg-blue-100 dark:bg-blue-800" : category.bgColor
              )}>
                {React.createElement(getIconComponent(category.icon), {
                  className: cn(
                    "w-6 h-6",
                    isActive ? "text-blue-600 dark:text-blue-400" : category.color
                  )
                })}
              </div>

              {/* Label */}
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {t(category.labelKey)}
              </div>

              {/* Count */}
              {showCounts && count > 0 && (
                <Badge variant="outline" size="sm" className="mt-1">
                  {count}
                </Badge>
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );

  // ✅ Render list layout
  const renderList = () => (
    <div className="space-y-2">
      {TEMPLATE_CATEGORIES.map((category) => {
        const isActive = currentCategory === category.id;
        const count = templateCounts[category.id] || 0;

        return (
          <motion.div
            key={category.id}
            variants={itemVariants}
            whileHover={{ x: isRTL ? -4 : 4 }}
          >
            <button
              onClick={() => onCategoryChange?.(category.id)}
              className={cn(
                "w-full flex items-center space-x-3 p-3 rounded-lg transition-all text-left",
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700" 
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                isActive ? "bg-blue-100 dark:bg-blue-800" : category.bgColor
              )}>
                {React.createElement(getIconComponent(category.icon), {
                  className: cn(
                    "w-5 h-5",
                    isActive ? "text-blue-600 dark:text-blue-400" : category.color
                  )
                })}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white">
                  {t(category.labelKey)}
                </div>
                {category.id !== 'custom' && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t(`templates.categories.${category.id}Description`)}
                  </div>
                )}
              </div>

              {/* Count */}
              {showCounts && count > 0 && (
                <Badge 
                  variant={isActive ? "primary" : "outline"} 
                  size="sm"
                >
                  {count}
                </Badge>
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {layout === 'tabs' && renderTabs()}
      {layout === 'grid' && renderGrid()}
      {layout === 'list' && renderList()}
    </motion.div>
  );
};

export default TemplateCategories; 