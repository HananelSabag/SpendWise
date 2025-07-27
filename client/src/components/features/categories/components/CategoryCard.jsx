/**
 * 🏷️ CATEGORY CARD - Individual Category Display
 * Extracted from massive CategoryManager.jsx for reusability
 * Features: Analytics, Actions, Drag & Drop, Mobile-first
 * @version 3.0.0 - EXTRACTED & ENHANCED
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit3, Trash2, Copy, MoreVertical, Eye, EyeOff, 
  Pin, PinOff, TrendingUp, TrendingDown, DollarSign,
  Calendar, Activity, Star, Archive, Move
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useTranslation, 
  useCurrency, 
  useNotifications 
} from '../../../../stores';

import { Button, Badge, Dropdown, Tooltip } from '../../../ui';
import { getIconComponent } from '../../../../config/categoryIcons';
import { getCategoryTypeInfo } from '../forms/CategoryHelpers';
import { cn } from '../../../../utils/helpers';

/**
 * 🏷️ Category Card Component
 */
const CategoryCard = ({
  category,
  analytics = null,
  selected = false,
  draggable = false,
  viewMode = 'grid', // grid, list, compact
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePin,
  onToggleVisibility,
  className = '',
  ...dragProps
}) => {
  const { t } = useTranslation('categories');
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  
  const [isHovered, setIsHovered] = useState(false);

  // ✅ Get category icon component
  const IconComponent = getIconComponent(category.icon);
  const typeInfo = getCategoryTypeInfo(category.type);
  
  // ✅ Analytics data
  const stats = useMemo(() => {
    if (!analytics) return null;
    
    return {
      transactionCount: analytics.transactionCount || 0,
      totalAmount: analytics.totalAmount || 0,
      averageAmount: analytics.averageAmount || 0,
      trend: analytics.trend || 0,
      lastUsed: analytics.lastUsed || null
    };
  }, [analytics]);

  // ✅ Action menu items
  const actionMenuItems = useMemo(() => [
    {
      label: t('actions.edit'),
      icon: Edit3,
      onClick: () => onEdit?.(category),
      variant: 'default'
    },
    {
      label: t('actions.duplicate'),
      icon: Copy,
      onClick: () => onDuplicate?.(category),
      variant: 'default'
    },
    {
      label: category.isPinned ? t('actions.unpin') : t('actions.pin'),
      icon: category.isPinned ? PinOff : Pin,
      onClick: () => onTogglePin?.(category),
      variant: 'default'
    },
    {
      label: category.isHidden ? t('actions.show') : t('actions.hide'),
      icon: category.isHidden ? Eye : EyeOff,
      onClick: () => onToggleVisibility?.(category),
      variant: 'default'
    },
    {
      label: t('actions.delete'),
      icon: Trash2,
      onClick: () => onDelete?.(category),
      variant: 'danger'
    }
  ], [category, onEdit, onDuplicate, onTogglePin, onToggleVisibility, onDelete, t]);

  // ✅ Handle card click
  const handleCardClick = useCallback((e) => {
    if (e.target.closest('[data-action-button]')) return;
    onSelect?.(category.id, !selected);
  }, [category.id, selected, onSelect]);

  // ✅ Render analytics
  const renderAnalytics = () => {
    if (!stats || viewMode === 'compact') return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            {t('analytics.transactions')}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {stats.transactionCount}
          </span>
        </div>
        
        {stats.totalAmount !== 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {t('analytics.total')}
            </span>
            <span className={cn(
              "font-medium",
              stats.totalAmount > 0 
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}>
              {formatCurrency(Math.abs(stats.totalAmount))}
            </span>
          </div>
        )}

        {stats.trend !== 0 && (
          <div className="flex items-center space-x-1 text-xs">
            {stats.trend > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className={cn(
              "font-medium",
              stats.trend > 0 ? "text-green-600" : "text-red-600"
            )}>
              {Math.abs(stats.trend)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  // ✅ Render compact view
  if (viewMode === 'compact') {
    return (
      <motion.div
        layout
        whileHover={{ scale: 1.02 }}
        onClick={handleCardClick}
        className={cn(
          "flex items-center space-x-3 p-2 rounded-lg border cursor-pointer transition-all",
          selected 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
          category.isHidden && "opacity-60",
          className
        )}
        {...dragProps}
      >
        {/* Icon */}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: category.color }}
        >
          <IconComponent className="w-4 h-4 text-white" />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {category.name}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stats.transactionCount}
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center space-x-1">
          {category.isPinned && <Pin className="w-3 h-3 text-yellow-500" />}
          <Badge variant="outline" size="sm">
            {t(`types.${category.type}`)}
          </Badge>
        </div>
      </motion.div>
    );
  }

  // ✅ Render list view
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        whileHover={{ scale: 1.01 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleCardClick}
        className={cn(
          "flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-all",
          selected 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
          category.isHidden && "opacity-60",
          className
        )}
        {...dragProps}
      >
        {/* Icon */}
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: category.color }}
        >
          <IconComponent className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {category.name}
            </h3>
            {category.isPinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
            {category.isHidden && <EyeOff className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </div>
          
          {category.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {category.description}
            </p>
          )}
          
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="outline" size="sm">
              {t(`types.${category.type}`)}
            </Badge>
            
            {stats && (
              <>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <Activity className="w-3 h-3" />
                  <span>{stats.transactionCount} {t('analytics.transactions')}</span>
                </div>
                
                {stats.totalAmount !== 0 && (
                  <div className="flex items-center space-x-1 text-xs">
                    <DollarSign className="w-3 h-3" />
                    <span className={cn(
                      stats.totalAmount > 0 
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {formatCurrency(Math.abs(stats.totalAmount))}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-1"
            >
              <Tooltip content={t('actions.edit')}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(category);
                  }}
                  className="p-2"
                  data-action-button
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </Tooltip>
            </motion.div>
          )}
          
          <Dropdown
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                data-action-button
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            }
            items={actionMenuItems}
          />
        </div>
      </motion.div>
    );
  }

  // ✅ Render grid view (default)
  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleCardClick}
      className={cn(
        "relative p-4 rounded-lg border cursor-pointer transition-all group",
        selected 
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md",
        category.isHidden && "opacity-60",
        draggable && "cursor-move",
        className
      )}
      {...dragProps}
    >
      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-3 h-3 bg-white rounded-full"
          />
        </motion.div>
      )}

      {/* Drag handle */}
      {draggable && isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-2 right-2"
        >
          <Move className="w-4 h-4 text-gray-400" />
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: category.color }}
        >
          <IconComponent className="w-6 h-6 text-white" />
        </div>

        {/* Quick actions */}
        <div className="flex items-center space-x-1">
          {category.isPinned && (
            <Tooltip content={t('status.pinned')}>
              <Pin className="w-4 h-4 text-yellow-500" />
            </Tooltip>
          )}
          
          {category.isHidden && (
            <Tooltip content={t('status.hidden')}>
              <EyeOff className="w-4 h-4 text-gray-400" />
            </Tooltip>
          )}

          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Dropdown
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    data-action-button
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                }
                items={actionMenuItems}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Name and Type */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {category.name}
          </h3>
          
          {category.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
              {category.description}
            </p>
          )}
        </div>

        {/* Type Badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            size="sm"
            className={cn(
              "border-current",
              category.type === 'income' && "text-green-600 border-green-600",
              category.type === 'expense' && "text-red-600 border-red-600",
              category.type === 'both' && "text-blue-600 border-blue-600"
            )}
          >
            {t(`types.${category.type}`)}
          </Badge>

          {stats && stats.transactionCount > 0 && (
            <Tooltip content={t('analytics.recentActivity')}>
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <Activity className="w-3 h-3" />
                <span>{stats.transactionCount}</span>
              </div>
            </Tooltip>
          )}
        </div>

        {/* Analytics */}
        {renderAnalytics()}
      </div>

      {/* Color bar at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg"
        style={{ backgroundColor: category.color }}
      />
    </motion.div>
  );
};

export default CategoryCard; 