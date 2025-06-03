/**
 * CategoryManager Component
 * Full CRUD interface for managing categories
 * ADDRESSES GAP #4: Category management UI
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Plus, Edit2, Trash2, Save, X, Star, Sparkles,
  ShoppingCart, Home, Car, Zap, Music, Coffee, Heart,
  Book, Briefcase, DollarSign, Utensils, Gamepad2,
  Plane, GraduationCap, Camera, Gift, Palette,
  TrendingUp, TrendingDown, Crown, Shield,
  // ✅ ADD: More useful icons (reasonable amount)
  Smartphone, Laptop, Fuel, Dumbbell, Pill, Baby,
  PawPrint, Bus, CreditCard, Banknote, PiggyBank,
  ShoppingBag, Pizza, Wine, Phone, MapPin
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../hooks/useApi';
import { Card, Button, Input, Badge, Modal, LoadingSpinner } from '../../ui';
import { cn } from '../../../utils/helpers';
import toast from 'react-hot-toast';

/**
 * 🧙‍♂️ WIZARD-LEVEL Category Manager Component
 * Premium UI/UX with magical interactions and smart organization
 */
const CategoryManager = () => {
  const { t, language } = useLanguage();
  const { data: allCategories = [], isLoading, refetch } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const isRTL = language === 'he';
  
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'tag',
    type: 'expense'
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 🎨 IMPROVED ICON COLLECTION - Reasonable amount, well organized
  const iconCategories = {
    general: [
      { name: 'tag', icon: Tag, label: 'General' },
      { name: 'star', icon: Star, label: 'Favorite' },
      { name: 'sparkles', icon: Sparkles, label: 'Special' },
      { name: 'crown', icon: Crown, label: 'Premium' },
      { name: 'gift', icon: Gift, label: 'Gifts' },
      { name: 'heart', icon: Heart, label: 'Love' }
    ],
    shopping: [
      { name: 'shopping-cart', icon: ShoppingCart, label: 'Shopping' },
      { name: 'shopping-bag', icon: ShoppingBag, label: 'Shopping Bag' },
      { name: 'palette', icon: Palette, label: 'Fashion' },
      { name: 'camera', icon: Camera, label: 'Electronics' },
      { name: 'smartphone', icon: Smartphone, label: 'Phone' },
      { name: 'laptop', icon: Laptop, label: 'Computer' }
    ],
    home: [
      { name: 'home', icon: Home, label: 'Home' },
      { name: 'zap', icon: Zap, label: 'Utilities' },
      { name: 'car', icon: Car, label: 'Car' },
      { name: 'fuel', icon: Fuel, label: 'Gas' },
      { name: 'phone', icon: Phone, label: 'Bills' },
      { name: 'map-pin', icon: MapPin, label: 'Location' }
    ],
    food: [
      { name: 'utensils', icon: Utensils, label: 'Restaurant' },
      { name: 'coffee', icon: Coffee, label: 'Coffee' },
      { name: 'pizza', icon: Pizza, label: 'Fast Food' },
      { name: 'wine', icon: Wine, label: 'Drinks' }
    ],
    transport: [
      { name: 'car', icon: Car, label: 'Car' },
      { name: 'bus', icon: Bus, label: 'Public Transport' },
      { name: 'plane', icon: Plane, label: 'Travel' },
      { name: 'fuel', icon: Fuel, label: 'Gas' }
    ],
    work: [
      { name: 'briefcase', icon: Briefcase, label: 'Work' },
      { name: 'book', icon: Book, label: 'Education' },
      { name: 'graduation-cap', icon: GraduationCap, label: 'Learning' },
      { name: 'laptop', icon: Laptop, label: 'Tech' }
    ],
    health: [
      { name: 'heart', icon: Heart, label: 'Health' },
      { name: 'dumbbell', icon: Dumbbell, label: 'Fitness' },
      { name: 'pill', icon: Pill, label: 'Medicine' },
      { name: 'baby', icon: Baby, label: 'Baby' },
      { name: 'paw-print', icon: PawPrint, label: 'Pets' }
    ],
    money: [
      { name: 'dollar-sign', icon: DollarSign, label: 'Money' },
      { name: 'credit-card', icon: CreditCard, label: 'Credit Card' },
      { name: 'banknote', icon: Banknote, label: 'Cash' },
      { name: 'piggy-bank', icon: PiggyBank, label: 'Savings' },
      { name: 'trending-up', icon: TrendingUp, label: 'Investment' },
      { name: 'trending-down', icon: TrendingDown, label: 'Expense' }
    ],
    entertainment: [
      { name: 'music', icon: Music, label: 'Music' },
      { name: 'gamepad2', icon: Gamepad2, label: 'Gaming' }
    ]
  };

  // Flatten all icons for easy lookup
  const allIcons = Object.values(iconCategories).flat();

  const getIconComponent = (iconName) => {
    const iconObj = allIcons.find(i => i.name === iconName);
    return iconObj ? iconObj.icon : Tag;
  };

  // 🔍 SMART FILTERING - Remove duplicates and filter properly
  const processedCategories = React.useMemo(() => {
    if (!Array.isArray(allCategories)) return [];
    
    // Remove duplicates by ID (this fixes the duplicate issue!)
    const uniqueCategories = allCategories.filter((category, index, self) => 
      index === self.findIndex(c => c.id === category.id)
    );
    
    return uniqueCategories.filter(category => {
      // Type filter
      if (filterType !== 'all' && category.type !== filterType) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const name = category.is_default 
          ? t(`categories.${category.name}`) 
          : category.name;
        return name.toLowerCase().includes(searchLower) ||
               (category.description || '').toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  }, [allCategories, filterType, searchTerm, t]);

  const userCategories = processedCategories.filter(cat => !cat.is_default);
  const defaultCategories = processedCategories.filter(cat => cat.is_default);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'tag',
      type: 'expense'
    });
    setEditingCategory(null);
    setErrors({});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validate
    if (!formData.name.trim()) {
      setErrors({ name: t('categories.nameRequired') });
      return;
    }
    
    setSaving(true);
    
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ 
          id: editingCategory.id, 
          data: formData 
        });
        toast.success(t('categories.updated'), {
          icon: '✨',
          duration: 3000
        });
      } else {
        const result = await createMutation.mutateAsync(formData);
        console.log('✅ [CATEGORY] Created:', result); // ✅ ADD: Debug log
        toast.success(t('categories.created'), {
          icon: '🎉',
          duration: 3000
        });
      }
      
      setShowForm(false);
      resetForm();
      
      // ✅ FIX: Force immediate refetch
      await refetch();
      console.log('✅ [CATEGORY] Categories refetched after creation');
      
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(t('categories.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'tag',
      type: category.type || 'expense'
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (categoryId) => {
    if (!window.confirm(t('categories.deleteConfirm'))) return;
    
    setDeleting(categoryId);
    try {
      await deleteMutation.mutateAsync(categoryId);
      toast.success(t('categories.deleted'), {
        icon: '🗑️',
        duration: 3000
      });
      refetch(); // Force refresh
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(t('categories.deleteFailed'));
    } finally {
      setDeleting(null);
    }
  };

  // 🎨 PREMIUM ANIMATIONS
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    hover: { 
      scale: 1.02,
      y: -4,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    }
  };

  if (!showForm) return null;

  return (
    <Modal
      isOpen={showForm}
      onClose={() => {
        setShowForm(false);
        resetForm();
      }}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <span>
            {editingCategory ? t('categories.edit') : t('categories.create')}
          </span>
        </div>
      }
      size="large"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('categories.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
            placeholder="למשל: קפה וארוחות"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('categories.type')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['expense', 'income'].map(type => (
                <Button
                  key={type}
                  type="button"
                  variant={formData.type === type ? "primary" : "outline"}
                  onClick={() => setFormData({ ...formData, type })}
                  className={cn(
                    "justify-center",
                    formData.type === type && "ring-2 ring-primary-500 ring-offset-2"
                  )}
                >
                  {type === 'expense' ? (
                    <>
                      <TrendingDown className="w-4 h-4 mr-2" />
                      {t('transactions.expense')}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {t('transactions.income')}
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('categories.description')} 
            <span className="text-gray-500 text-xs">({t('common.optional')})</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('categories.descriptionPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            {t('categories.icon')}
          </label>
          
          {/* Icon Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(iconCategories).map(categoryKey => (
              <Button
                key={categoryKey}
                type="button"
                variant={selectedIconCategory === categoryKey ? "primary" : "outline"}
                size="small"
                onClick={() => setSelectedIconCategory(categoryKey)}
              >
                {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
              </Button>
            ))}
          </div>
          
          {/* Icon Grid */}
          <div className="grid grid-cols-6 md:grid-cols-8 gap-3 max-h-48 overflow-y-auto p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            {iconCategories[selectedIconCategory].map(({ name, icon: IconComponent, label }) => (
              <motion.button
                key={name}
                type="button"
                onClick={() => setFormData({ ...formData, icon: name })}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all group relative',
                  formData.icon === name
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:scale-105'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={label}
              >
                <IconComponent className={cn(
                  'w-6 h-6 mx-auto transition-colors',
                  formData.icon === name 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-500 group-hover:text-primary-500'
                )} />
                
                {/* Selection indicator */}
                {formData.icon === name && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                  >
                    <Star className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
            disabled={saving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={saving || !formData.name.trim()}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {editingCategory ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 🎴 PREMIUM CATEGORY CARD COMPONENT
const CategoryCard = ({ 
  category, 
  index, 
  onEdit, 
  onDelete, 
  deleting, 
  isDefault, 
  getIconComponent, 
  t 
}) => {
  const IconComponent = getIconComponent(category.icon || 'tag');
  const displayName = category.is_default 
    ? t(`categories.${category.name}`) 
    : category.name;

  const typeColors = {
    income: 'from-green-400 to-emerald-500',
    expense: 'from-red-400 to-rose-500',
    null: 'from-gray-400 to-slate-500'
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.8, y: 20 },
        visible: { 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: {
            delay: index * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 25
          }
        }
      }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <Card className={cn(
        "p-4 cursor-pointer transition-all duration-300 relative overflow-hidden group",
        "hover:shadow-lg border-2",
        isDefault 
          ? "border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600"
      )}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
          <div className={cn(
            "w-full h-full rounded-full bg-gradient-to-br",
            typeColors[category.type] || typeColors.null
          )} />
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br shadow-lg",
              typeColors[category.type] || typeColors.null
            )}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            
            {!isDefault && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(category);
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(category.id);
                  }}
                  disabled={deleting}
                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  {deleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"
                    />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-600" />
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-bold text-gray-900 dark:text-white truncate">
                {displayName}
              </h4>
              {isDefault && (
                <Badge 
                  variant="warning" 
                  size="small" 
                  className="bg-amber-100 text-amber-800 border-amber-300"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {t('categories.default')}
                </Badge>
              )}
            </div>
            
            {category.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {category.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <Badge 
                variant={category.type === 'income' ? 'success' : 'danger'}
                size="small"
              >
                {category.type === 'income' ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {t('transactions.income')}
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {t('transactions.expense')}
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// 📝 PREMIUM FORM COMPONENT
const CategoryForm = ({ 
  formData, 
  setFormData, 
  errors, 
  onSubmit, 
  onCancel, 
  saving, 
  editingCategory, 
  iconCategories, 
  t, 
  isRTL 
}) => {
  const [selectedIconCategory, setSelectedIconCategory] = useState('general');

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('categories.name')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
          placeholder="למשל: קפה וארוחות"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('categories.type')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['expense', 'income'].map(type => (
              <Button
                key={type}
                type="button"
                variant={formData.type === type ? "primary" : "outline"}
                onClick={() => setFormData({ ...formData, type })}
                className={cn(
                  "justify-center",
                  formData.type === type && "ring-2 ring-primary-500 ring-offset-2"
                )}
              >
                {type === 'expense' ? (
                  <>
                    <TrendingDown className="w-4 h-4 mr-2" />
                    {t('transactions.expense')}
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {t('transactions.income')}
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('categories.description')} 
          <span className="text-gray-500 text-xs">({t('common.optional')})</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('categories.descriptionPlaceholder')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          {t('categories.icon')}
        </label>
        
        {/* Icon Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(iconCategories).map(categoryKey => (
            <Button
              key={categoryKey}
              type="button"
              variant={selectedIconCategory === categoryKey ? "primary" : "outline"}
              size="small"
              onClick={() => setSelectedIconCategory(categoryKey)}
            >
              {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
            </Button>
          ))}
        </div>
        
        {/* Icon Grid */}
        <div className="grid grid-cols-6 md:grid-cols-8 gap-3 max-h-48 overflow-y-auto p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          {iconCategories[selectedIconCategory].map(({ name, icon: IconComponent, label }) => (
            <motion.button
              key={name}
              type="button"
              onClick={() => setFormData({ ...formData, icon: name })}
              className={cn(
                'p-3 rounded-xl border-2 transition-all group relative',
                formData.icon === name
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:scale-105'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={label}
            >
              <IconComponent className={cn(
                'w-6 h-6 mx-auto transition-colors',
                formData.icon === name 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-500 group-hover:text-primary-500'
              )} />
              
              {/* Selection indicator */}
              {formData.icon === name && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                >
                  <Star className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={saving}
          disabled={saving || !formData.name.trim()}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {editingCategory ? t('common.save') : t('common.create')}
        </Button>
      </div>
    </form>
  );
};

export default CategoryManager;