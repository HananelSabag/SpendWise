/**
 * CategoryManager Component
 * Full CRUD interface for managing categories
 * ADDRESSES GAP #4: Category management UI
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  ShoppingCart,
  Home,
  Car,
  Zap,
  Music,
  Coffee,
  Heart,
  Book,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../hooks/useApi';
import { Card, Button, Input, Modal, Alert, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';
import api from '../../../utils/api';
import toast from 'react-hot-toast';

const CategoryManager = () => {
  const { t, language } = useLanguage();
  const { data: categories = [], isLoading, refetch } = useCategories();
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

  // Available icons
  const availableIcons = [
    { name: 'tag', icon: Tag },
    { name: 'shopping-cart', icon: ShoppingCart },
    { name: 'home', icon: Home },
    { name: 'car', icon: Car },
    { name: 'zap', icon: Zap },
    { name: 'music', icon: Music },
    { name: 'coffee', icon: Coffee },
    { name: 'heart', icon: Heart },
    { name: 'book', icon: Book },
    { name: 'briefcase', icon: Briefcase },
    { name: 'dollar-sign', icon: DollarSign }
  ];

  const getIconComponent = (iconName) => {
    const iconObj = availableIcons.find(i => i.name === iconName);
    return iconObj ? iconObj.icon : Tag;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validate
    if (!formData.name.trim()) {
      setErrors({ name: t('validation.required') });
      return;
    }
    
    setSaving(true);
    
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: 'tag', type: 'expense' });
    } catch (error) {
      console.error('Category operation failed:', error);
    } finally {
      setSaving(false);
    }
  };

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

  const handleDelete = async (categoryId) => {
    if (!window.confirm(t('categories.deleteConfirm'))) return;
    
    try {
      await deleteMutation.mutateAsync(categoryId);
    } catch (error) {
      console.error('Category deletion failed:', error);
    }
  };

  const userCategories = categories.filter(cat => !cat.is_default);
  const defaultCategories = categories.filter(cat => cat.is_default);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('categories.title')}
        </h2>
        <Button
          variant="primary"
          size="small"
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', description: '', icon: 'tag', type: 'expense' });
            setShowForm(true);
          }}
          icon={Plus}
        >
          {t('categories.addNew')}
        </Button>
      </div>

      {/* User Categories */}
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('categories.userCategories')}
          </h3>
        </div>
        
        {userCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t('categories.noUserCategories')}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {userCategories.map(category => {
              const IconComponent = getIconComponent(category.icon);
              
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      category.type === 'expense' 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30'
                    )}>
                      <IconComponent className={cn(
                        'w-5 h-5',
                        category.type === 'expense'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      )} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </h4>
                      {category.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={category.type === 'expense' ? 'danger' : 'success'}
                      size="small"
                    >
                      {t(`transactions.${category.type}`)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleDelete(category.id)}
                      loading={deleting === category.id}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Default Categories */}
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('categories.defaultCategories')}
          </h3>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultCategories.map(category => {
            const IconComponent = getIconComponent(category.icon);
            
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg opacity-75"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    category.type === 'expense' 
                      ? 'bg-red-100 dark:bg-red-900/30' 
                      : 'bg-green-100 dark:bg-green-900/30'
                  )}>
                    <IconComponent className={cn(
                      'w-5 h-5',
                      category.type === 'expense'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    )} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {t(`categories.${category.name}`)}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('categories.default')}
                    </p>
                  </div>
                </div>
                
                <Badge
                  variant={category.type === 'expense' ? 'danger' : 'success'}
                  size="small"
                >
                  {t(`transactions.${category.type}`)}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Category Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(null);
          setErrors({});
        }}
        title={editingCategory ? t('categories.edit') : t('categories.create')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('categories.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          
          <Input
            label={t('categories.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('categories.descriptionPlaceholder')}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('categories.type')}
            </label>
            <div className="flex gap-4">
              {['expense', 'income'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={formData.type === type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mr-2"
                  />
                  <span>{t(`transactions.${type}`)}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('categories.icon')}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {availableIcons.map(({ name, icon: IconComponent }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: name })}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all',
                    formData.icon === name
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  <IconComponent className="w-5 h-5 mx-auto" />
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingCategory(null);
                setErrors({});
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {editingCategory ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryManager;