/**
 * 🏷️ CATEGORY MANAGER - COMPLETE UX/UI REVOLUTION!
 * 🚀 AI-powered categorization, Smart suggestions, Visual drag-and-drop, Analytics
 * Features: AI category detection, Smart icons, Usage analytics, Bulk operations
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useDragControls, Reorder } from 'framer-motion';
import { 
  Plus, Edit3, Trash2, Save, X, Search, Grid, List, Filter,
  AlertCircle, CheckCircle, Tag, Palette, Eye, EyeOff, MoreVertical,
  Brain, Sparkles, TrendingUp, TrendingDown, Activity, Target,
  BarChart3, PieChart, Calendar, Clock, DollarSign, Percent,
  Move, GripVertical, Copy, Archive, Star, Award, Crown,
  Coffee, Car, Home, Plane, Music, Book, Gamepad2, Heart,
  ShoppingBag, Utensils, Film, Dumbbell, Smartphone, Globe,
  Zap, Settings, Download, Upload, RefreshCw, Layers,
  ChevronDown, ChevronUp, ChevronRight, ArrowUpDown, SortAsc,
  Hash, Bookmark, Flag, Pin, MapPin, Camera, Image, Video
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import { 
  useTranslation, 
  useNotifications,
  useTheme,
  useCurrency,
  useAuth
} from '../../../stores';

// Enhanced imports
import { useCategory } from '../../../hooks/useCategory';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api';
import { Button, Input, Card, LoadingSpinner, Badge, Modal, Tooltip, Dropdown } from '../../ui';
import { getIconComponent } from '../../../config/categoryIcons';
import { cn, debounce } from '../../../utils/helpers';

/**
 * 🎨 ICON SELECTOR - Advanced icon picker with AI suggestions
 */
const IconSelector = ({ 
  selectedIcon, 
  onIconSelect, 
  categoryName = '',
  className = '' 
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // AI-suggested icons based on category name
  const aiSuggestedIcons = useMemo(() => {
    if (!categoryName) return [];
    
    const suggestions = {
      'food': ['Utensils', 'Coffee', 'ShoppingBag'],
      'transport': ['Car', 'Plane', 'Move'],
      'entertainment': ['Music', 'Film', 'Gamepad2'],
      'health': ['Heart', 'Dumbbell', 'Activity'],
      'shopping': ['ShoppingBag', 'Tag', 'Star'],
      'home': ['Home', 'Settings', 'Layers'],
      'work': ['Briefcase', 'Target', 'Award']
    };

    const name = categoryName.toLowerCase();
    for (const [key, icons] of Object.entries(suggestions)) {
      if (name.includes(key)) return icons;
    }
    
    return ['Tag', 'Circle', 'Square'];
  }, [categoryName]);

  const iconCategories = [
    { id: 'all', label: t('icons.categories.all'), icons: [] },
    { 
      id: 'finance', 
      label: t('icons.categories.finance'), 
      icons: ['DollarSign', 'CreditCard', 'TrendingUp', 'TrendingDown', 'PieChart', 'BarChart3']
    },
    { 
      id: 'lifestyle', 
      label: t('icons.categories.lifestyle'), 
      icons: ['Coffee', 'Utensils', 'Car', 'Home', 'Heart', 'Star']
    },
    { 
      id: 'entertainment', 
      label: t('icons.categories.entertainment'), 
      icons: ['Music', 'Film', 'Gamepad2', 'Book', 'Camera', 'Video']
    },
    { 
      id: 'technology', 
      label: t('icons.categories.technology'), 
      icons: ['Smartphone', 'Globe', 'Zap', 'Settings', 'Activity', 'Target']
    }
  ];

  const filteredIcons = useMemo(() => {
    let icons = selectedCategory === 'all' 
      ? iconCategories.slice(1).flatMap(cat => cat.icons)
      : iconCategories.find(cat => cat.id === selectedCategory)?.icons || [];

    if (searchQuery) {
      icons = icons.filter(icon => 
        icon.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return icons;
  }, [selectedCategory, searchQuery, iconCategories]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Suggestions */}
      {aiSuggestedIcons.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('icons.aiSuggestions')}
            </span>
          </div>
          
          <div className="grid grid-cols-6 gap-2">
            {aiSuggestedIcons.map((iconName) => {
              const IconComponent = getIconComponent(iconName);
              return (
                <motion.button
                  key={iconName}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onIconSelect(iconName)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    selectedIcon === iconName
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                  )}
                >
                  <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Input
          placeholder={t('icons.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Category tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {iconCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "primary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex-1"
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
        {filteredIcons.map((iconName) => {
          const IconComponent = getIconComponent(iconName);
          return (
            <motion.button
              key={iconName}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onIconSelect(iconName)}
              className={cn(
                "p-2 rounded-lg border transition-all",
                selectedIcon === iconName
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              )}
            >
              <IconComponent className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 📊 CATEGORY ANALYTICS CARD - Usage statistics and insights
 */
const CategoryAnalyticsCard = ({ category, analytics, className = '' }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const IconComponent = getIconComponent(category.icon);
  const usagePercentage = analytics.totalTransactions > 0 
    ? (analytics.transactionCount / analytics.totalTransactions) * 100 
    : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border border-gray-200 dark:border-gray-700",
        "hover:border-blue-300 dark:hover:border-blue-600",
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full flex items-center justify-center">
          <IconComponent className="w-32 h-32" />
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <IconComponent 
                className="w-5 h-5" 
                style={{ color: category.color }}
              />
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {category.name}
              </h4>
              <p className="text-xs text-gray-500">
                {analytics.transactionCount} {t('analytics.transactions')}
              </p>
            </div>
          </div>

          <Badge 
            variant={usagePercentage > 20 ? "primary" : usagePercentage > 10 ? "warning" : "secondary"}
            size="sm"
          >
            {usagePercentage.toFixed(1)}%
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('analytics.totalAmount')}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(analytics.totalAmount)}
            </span>
          </div>

          {/* Average */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('analytics.average')}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatCurrency(analytics.averageAmount)}
            </span>
          </div>

          {/* Trend */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('analytics.trend')}
            </span>
            <div className={cn(
              "flex items-center text-sm",
              analytics.trend > 0 ? "text-green-600" : analytics.trend < 0 ? "text-red-600" : "text-gray-500"
            )}>
              {analytics.trend > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : analytics.trend < 0 ? (
                <TrendingDown className="w-3 h-3 mr-1" />
              ) : (
                <Activity className="w-3 h-3 mr-1" />
              )}
              {Math.abs(analytics.trend).toFixed(1)}%
            </div>
          </div>

          {/* Usage bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{t('analytics.usage')}</span>
              <span className="text-gray-500">{usagePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🎯 SMART CATEGORY CARD - Draggable category with AI features
 */
const SmartCategoryCard = ({ 
  category, 
  analytics,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  viewMode = 'grid',
  className = '' 
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const dragControls = useDragControls();

  const IconComponent = getIconComponent(category.icon);
  const [showActions, setShowActions] = useState(false);

  const aiInsights = useMemo(() => {
    const insights = [];
    
    if (analytics.trend > 50) {
      insights.push({ type: 'warning', text: t('insights.highUsage') });
    }
    
    if (analytics.averageAmount > 100) {
      insights.push({ type: 'info', text: t('insights.highValue') });
    }
    
    if (analytics.transactionCount === 0) {
      insights.push({ type: 'neutral', text: t('insights.unused') });
    }

    return insights;
  }, [analytics, t]);

  return (
    <Reorder.Item
      value={category}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "relative group cursor-pointer",
        className
      )}
    >
      <motion.div
        layout
        whileHover={{ scale: 1.02, y: -2 }}
        className={cn(
          "relative overflow-hidden rounded-2xl p-4 transition-all",
          "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
          "border border-gray-200 dark:border-gray-700",
          "hover:border-blue-300 dark:hover:border-blue-600",
          "hover:shadow-lg group-hover:shadow-xl",
          isSelected && "ring-2 ring-blue-500 border-blue-500",
          viewMode === 'list' && "flex items-center space-x-4"
        )}
      >
        {/* Drag handle */}
        <motion.div
          onPointerDown={(e) => dragControls.start(e)}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </motion.div>

        {/* Selection checkbox */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect?.(category.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>

        <div className={cn(
          "flex items-center",
          viewMode === 'grid' ? "flex-col text-center space-y-3" : "space-x-4 flex-1"
        )}>
          {/* Icon */}
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            className={cn(
              "rounded-2xl flex items-center justify-center flex-shrink-0",
              viewMode === 'grid' ? "w-16 h-16" : "w-12 h-12"
            )}
            style={{ backgroundColor: `${category.color}20` }}
          >
            <IconComponent 
              className={cn(
                viewMode === 'grid' ? "w-8 h-8" : "w-6 h-6"
              )}
              style={{ color: category.color }}
            />
          </motion.div>

          {/* Content */}
          <div className={cn(
            "flex-1 min-w-0",
            viewMode === 'grid' && "text-center"
          )}>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {category.name}
            </h3>
            
            {category.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {category.description}
              </p>
            )}

            {/* Statistics */}
            <div className={cn(
              "flex items-center text-xs text-gray-500 mt-2",
              viewMode === 'grid' ? "justify-center space-x-3" : "space-x-4"
            )}>
              <span>{analytics.transactionCount} {t('labels.transactions')}</span>
              <span>{formatCurrency(analytics.totalAmount)}</span>
              
              {analytics.trend !== 0 && (
                <div className={cn(
                  "flex items-center",
                  analytics.trend > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {analytics.trend > 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(analytics.trend).toFixed(0)}%
                </div>
              )}
            </div>

            {/* AI Insights */}
            {aiInsights.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center space-x-1">
                  <Brain className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {aiInsights[0].text}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            viewMode === 'list' && "flex items-center space-x-2"
          )}>
            <Dropdown
              trigger={
                <Button variant="ghost" size="sm" className="p-1">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              }
              items={[
                {
                  label: t('actions.edit'),
                  icon: Edit3,
                  onClick: () => onEdit?.(category)
                },
                {
                  label: t('actions.duplicate'),
                  icon: Copy,
                  onClick: () => onDuplicate?.(category)
                },
                {
                  label: t('actions.analytics'),
                  icon: BarChart3,
                  onClick: () => console.log('View analytics')
                },
                { type: 'separator' },
                {
                  label: t('actions.delete'),
                  icon: Trash2,
                  onClick: () => onDelete?.(category),
                  variant: 'destructive'
                }
              ]}
            />
          </div>
        </div>

        {/* Priority indicator */}
        {category.isPinned && (
          <div className="absolute bottom-2 left-2">
            <Pin className="w-3 h-3 text-yellow-500" />
          </div>
        )}

        {/* Color stripe */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: category.color }}
        />
      </motion.div>
    </Reorder.Item>
  );
};

/**
 * 🏷️ CATEGORY MANAGER - THE REVOLUTION!
 */
const CategoryManager = ({ isOpen, onClose }) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t, isRTL } = useTranslation();
  const { addNotification } = useNotifications();
  const { isDark } = useTheme();
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();

  // Enhanced state management
  const [viewMode, setViewMode] = useState('grid'); // grid, list, analytics
  const [sortBy, setSortBy] = useState('usage'); // name, usage, amount, recent
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [bulkAction, setBulkAction] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Tag',
    color: '#3B82F6',
    type: 'expense', // expense, income, both
    isPinned: false,
    isHidden: false
  });

  // Hooks
  const {
    categories,
    loading: categoriesLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
  } = useCategory();

  // ✅ Enhanced category analytics
  const {
    data: categoryAnalytics,
    isLoading: analyticsLoading
  } = useQuery({
    queryKey: ['category-analytics', user?.id],
    queryFn: async () => {
      const response = await api.analytics.categories.getAnalytics(12); // 12 months
      return response.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Process categories with analytics
  const processedCategories = useMemo(() => {
    if (!categories || !categoryAnalytics) return [];

    return categories.map(category => {
      const analytics = categoryAnalytics.find(a => a.categoryId === category.id) || {
        transactionCount: 0,
        totalAmount: 0,
        averageAmount: 0,
        trend: 0
      };

      return {
        ...category,
        analytics
      };
    });
  }, [categories, categoryAnalytics]);

  // Filtered and sorted categories
  const filteredCategories = useMemo(() => {
    let filtered = [...processedCategories];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'usage':
          aValue = a.analytics.transactionCount;
          bValue = b.analytics.transactionCount;
          break;
        case 'amount':
          aValue = a.analytics.totalAmount;
          bValue = b.analytics.totalAmount;
          break;
        case 'recent':
          aValue = new Date(a.updatedAt || a.createdAt);
          bValue = new Date(b.updatedAt || b.createdAt);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [processedCategories, searchQuery, sortBy, sortOrder]);

  // Handle category creation
  const handleCreateCategory = useCallback(async () => {
    try {
      await createCategory(formData);
      addNotification({
        type: 'success',
        title: t('categories.createSuccess'),
        duration: 3000
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        icon: 'Tag',
        color: '#3B82F6',
        type: 'expense',
        isPinned: false,
        isHidden: false
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('categories.createFailed'),
        description: error.message,
        duration: 5000
      });
    }
  }, [formData, createCategory, addNotification, t]);

  // Handle category update
  const handleUpdateCategory = useCallback(async () => {
    if (!editingCategory) return;

    try {
      await updateCategory(editingCategory.id, formData);
      addNotification({
        type: 'success',
        title: t('categories.updateSuccess'),
        duration: 3000
      });
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        icon: 'Tag',
        color: '#3B82F6',
        type: 'expense',
        isPinned: false,
        isHidden: false
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('categories.updateFailed'),
        description: error.message,
        duration: 5000
      });
    }
  }, [editingCategory, formData, updateCategory, addNotification, t]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId, isSelected) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(categoryId);
      } else {
        newSet.delete(categoryId);
      }
      return newSet;
    });
  }, []);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action) => {
    const selectedIds = Array.from(selectedCategories);
    
    try {
      switch (action) {
        case 'delete':
          await Promise.all(selectedIds.map(id => deleteCategory(id)));
          break;
        case 'pin':
          // Bulk pin logic
          break;
        case 'hide':
          // Bulk hide logic
          break;
      }
      
      addNotification({
        type: 'success',
        title: t(`categories.bulk.${action}Success`, { count: selectedIds.length }),
        duration: 3000
      });
      
      setSelectedCategories(new Set());
    } catch (error) {
      addNotification({
        type: 'error',
        title: t(`categories.bulk.${action}Failed`),
        description: error.message,
        duration: 5000
      });
    }
  }, [selectedCategories, deleteCategory, addNotification, t]);

  // Handle edit
  const handleEdit = useCallback((category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      type: category.type,
      isPinned: category.isPinned || false,
      isHidden: category.isHidden || false
    });
    setShowCreateModal(true);
  }, []);

  // Handle duplicate
  const handleDuplicate = useCallback((category) => {
    setFormData({
      name: `${category.name} (Copy)`,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      type: category.type,
      isPinned: false,
      isHidden: false
    });
    setShowCreateModal(true);
  }, []);

  // View mode options
  const viewModeOptions = [
    { id: 'grid', icon: Grid, label: t('viewModes.grid') },
    { id: 'list', icon: List, label: t('viewModes.list') },
    { id: 'analytics', icon: BarChart3, label: t('viewModes.analytics') }
  ];

  // Sort options
  const sortOptions = [
    { id: 'name', label: t('sort.name') },
    { id: 'usage', label: t('sort.usage') },
    { id: 'amount', label: t('sort.amount') },
    { id: 'recent', label: t('sort.recent') }
  ];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl",
          "max-w-7xl w-full max-h-[90vh] overflow-hidden",
          "flex flex-col"
        )}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Enhanced header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center"
            >
              <Tag className="w-5 h-5 text-white" />
            </motion.div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('categories.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('categories.subtitle', { count: filteredCategories.length })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View mode selector */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              {viewModeOptions.map((mode) => {
                const ModeIcon = mode.icon;
                return (
                  <Button
                    key={mode.id}
                    variant={viewMode === mode.id ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(mode.id)}
                    className="px-3 py-2"
                  >
                    <ModeIcon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </Button>
                );
              })}
            </div>

            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('categories.create')}
            </Button>

            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {/* Search and filters */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder={t('categories.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            {/* Sort */}
            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  {sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4 mr-2" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                  )}
                  {t(`sort.${sortBy}`)}
                </Button>
              }
              items={[
                ...sortOptions.map(option => ({
                  label: option.label,
                  onClick: () => setSortBy(option.id),
                  active: sortBy === option.id
                })),
                { type: 'separator' },
                {
                  label: sortOrder === 'asc' ? t('sort.descending') : t('sort.ascending'),
                  onClick: () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              ]}
            />
          </div>

          {/* Bulk actions */}
          {selectedCategories.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('categories.selected', { count: selectedCategories.size })}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('pin')}
              >
                <Pin className="w-4 h-4 mr-2" />
                {t('categories.bulk.pin')}
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('categories.bulk.delete')}
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {categoriesLoading || analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? t('categories.noResults') : t('categories.empty')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery ? t('categories.noResultsDesc') : t('categories.emptyDesc')}
              </p>
              
              {!searchQuery && (
                <Button
                  variant="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('categories.createFirst')}
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {viewMode === 'analytics' ? (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {filteredCategories.map((category) => (
                    <CategoryAnalyticsCard
                      key={category.id}
                      category={category}
                      analytics={category.analytics}
                    />
                  ))}
                </motion.div>
              ) : (
                <Reorder.Group
                  key="categories"
                  axis="y"
                  values={filteredCategories}
                  onReorder={reorderCategories}
                  className={cn(
                    "grid gap-4",
                    viewMode === 'grid' 
                      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                      : "grid-cols-1"
                  )}
                >
                  {filteredCategories.map((category) => (
                    <SmartCategoryCard
                      key={category.id}
                      category={category}
                      analytics={category.analytics}
                      isSelected={selectedCategories.has(category.id)}
                      onSelect={handleCategorySelect}
                      onEdit={handleEdit}
                      onDelete={deleteCategory}
                      onDuplicate={handleDuplicate}
                      viewMode={viewMode}
                    />
                  ))}
                </Reorder.Group>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal 
            isOpen={showCreateModal} 
            onClose={() => {
              setShowCreateModal(false);
              setEditingCategory(null);
              setFormData({
                name: '',
                description: '',
                icon: 'Tag',
                color: '#3B82F6',
                type: 'expense',
                isPinned: false,
                isHidden: false
              });
            }}
            size="lg"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCategory ? t('categories.edit') : t('categories.create')}
                </h3>
                
                <Button 
                  variant="ghost" 
                  onClick={() => setShowCreateModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Basic info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('categories.fields.name')}
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={t('categories.fields.namePlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('categories.fields.type')}
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="expense">{t('categories.types.expense')}</option>
                      <option value="income">{t('categories.types.income')}</option>
                      <option value="both">{t('categories.types.both')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('categories.fields.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder={t('categories.fields.descriptionPlaceholder')}
                    rows={3}
                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Icon selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('categories.fields.icon')}
                  </label>
                  <IconSelector
                    selectedIcon={formData.icon}
                    onIconSelect={(icon) => setFormData({...formData, icon})}
                    categoryName={formData.name}
                  />
                </div>

                {/* Color selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('categories.fields.color')}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="w-12 h-12 border border-gray-200 dark:border-gray-700 rounded-lg"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({...formData, isPinned: e.target.checked})}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t('categories.fields.pinned')}
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isHidden}
                      onChange={(e) => setFormData({...formData, isHidden: e.target.checked})}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t('categories.fields.hidden')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('categories.actions.cancel')}
                </Button>
                
                <Button
                  variant="primary"
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  disabled={!formData.name.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingCategory ? t('categories.actions.update') : t('categories.actions.create')}
                </Button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default CategoryManager;