/**
 * 🎮 QUICK ACTION CARD - Interactive Action Button Component
 * Extracted from QuickActionsBar.jsx for better performance and maintainability
 * Features: Drag support, Popular badges, Usage tracking, Mobile-first
 * @version 2.0.0
 */

import React from 'react';
import { motion, useDragControls, useMotionValue } from 'framer-motion';
import { Star, Clock } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { Button, Card, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🎮 Quick Action Card Component
 */
const QuickActionCard = ({ 
  action, 
  onClick, 
  isPopular = false, 
  isDragging = false,
  showUsage = true,
  size = 'default', // 'sm', 'default', 'lg'
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');
  const dragControls = useDragControls();
  const x = useMotionValue(0);

  const ActionIcon = action.icon;

  // Size variants
  const sizeConfig = {
    sm: {
      card: 'p-3',
      icon: 'w-8 h-8',
      iconSize: 'w-4 h-4',
      title: 'text-xs',
      description: 'text-xs'
    },
    default: {
      card: 'p-4',
      icon: 'w-12 h-12',
      iconSize: 'w-6 h-6',
      title: 'text-sm',
      description: 'text-xs'
    },
    lg: {
      card: 'p-6',
      icon: 'w-16 h-16',
      iconSize: 'w-8 h-8',
      title: 'text-base',
      description: 'text-sm'
    }
  };

  const config = sizeConfig[size] || sizeConfig.default;

  const handleClick = () => {
    onClick?.(action);
  };

  return (
    <motion.div
      drag="x"
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      style={{ x }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      whileDrag={{ scale: 1.1, rotate: 5 }}
      className={cn(
        "relative group cursor-pointer",
        isDragging && "z-20",
        className
      )}
      onClick={handleClick}
    >
      <Card className={cn(
        "transition-all duration-300",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border border-gray-200 dark:border-gray-700",
        "hover:border-blue-300 dark:hover:border-blue-600",
        "hover:shadow-lg group-hover:shadow-xl",
        isPopular && "ring-2 ring-blue-500/20",
        config.card
      )}>
        {/* Popular badge */}
        {isPopular && (
          <div className="absolute -top-2 -right-2">
            <Badge variant="primary" size="xs" className="flex items-center">
              <Star className="w-3 h-3 mr-1 fill-current" />
              {t('actions.popular')}
            </Badge>
          </div>
        )}

        {/* Action content */}
        <div className="text-center space-y-3">
          {/* Icon with animation */}
          <motion.div
            animate={{ 
              rotate: isPopular ? [0, 5, -5, 0] : 0,
              scale: isPopular ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              duration: 2, 
              repeat: isPopular ? Infinity : 0,
              repeatType: "reverse"
            }}
            className={cn(
              "mx-auto rounded-2xl flex items-center justify-center",
              action.bgColor || "bg-blue-100 dark:bg-blue-900/20",
              config.icon
            )}
          >
            <ActionIcon className={cn(
              action.color || "text-blue-600 dark:text-blue-400",
              config.iconSize
            )} />
          </motion.div>
          
          {/* Text content */}
          <div>
            <h3 className={cn(
              "font-medium text-gray-900 dark:text-white",
              config.title
            )}>
              {action.title}
            </h3>
            
            {action.description && (
              <p className={cn(
                "text-gray-600 dark:text-gray-400 mt-1",
                config.description
              )}>
                {action.description}
              </p>
            )}
          </div>

          {/* Usage stats */}
          {showUsage && action.usage && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 inline mr-1" />
              {t('actions.lastUsed', { time: action.usage })}
            </div>
          )}

          {/* Additional metadata */}
          {action.shortcut && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                {action.shortcut}
              </kbd>
            </div>
          )}
        </div>

        {/* Drag indicator */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Hover effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
      </Card>
    </motion.div>
  );
};

/**
 * 🎯 Compact Action Button (for mobile/small spaces)
 */
const CompactActionButton = ({ 
  action, 
  onClick, 
  isActive = false,
  className = '' 
}) => {
  const ActionIcon = action.icon;

  return (
    <Button
      variant={isActive ? "primary" : "outline"}
      size="sm"
      onClick={() => onClick?.(action)}
      className={cn(
        "flex items-center space-x-2 min-w-0",
        className
      )}
    >
      <ActionIcon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{action.title}</span>
    </Button>
  );
};

/**
 * 🎲 Action Grid Layout
 */
const ActionGrid = ({ 
  actions = [], 
  onActionClick, 
  popularActions = [],
  columns = 'auto',
  size = 'default',
  className = '' 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    auto: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
  };

  return (
    <div className={cn(
      "grid gap-4",
      gridCols[columns] || gridCols.auto,
      className
    )}>
      {actions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <QuickActionCard
            action={action}
            onClick={onActionClick}
            isPopular={popularActions.includes(action.id)}
            size={size}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default QuickActionCard;
export { CompactActionButton, ActionGrid }; 