/**
 * 🏷️ CATEGORY SELECTOR — Compact dropdown with search and inline creation
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Plus, Check, AlertCircle, Tag, X } from 'lucide-react';
import { useTranslation } from '../../../../stores';
import { useCategory } from '../../../../hooks/useCategory';
import { Button } from '../../../ui';
import { cn } from '../../../../utils/helpers';
import { getIconComponent } from '../../../../config/categoryIcons';

const CategorySelector = ({
  value = '',
  onChange,
  transactionType = 'expense',
  error = null,
  required = false,
  disabled = false,
  placeholder,
  className = '',
}) => {
  const { t, currentLanguage } = useTranslation('transactions');
  const { categories, createCategory, isLoading } = useCategory();

  const [isOpen, setIsOpen]               = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [showCreate, setShowCreate]       = useState(false);
  const [newName, setNewName]             = useState('');
  const [newIcon, setNewIcon]             = useState('Tag');
  const [newColor, setNewColor]           = useState('#3B82F6');

  const dropdownRef   = useRef(null);
  const searchRef     = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowCreate(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) setTimeout(() => searchRef.current?.focus(), 80);
  }, [isOpen]);

  // Filtered categories
  const filtered = useMemo(() => {
    if (!categories) return [];
    const detectLang = (name) => /[\u0590-\u05FF]/.test(name) ? 'he' : 'en';
    return categories
      .filter(cat => {
        if (cat.type && cat.type !== transactionType) return false;
        const lang = cat.language || detectLang(cat.name || '');
        if (lang !== currentLanguage) return false;
        if (searchQuery) {
          const name = cat.localized_name?.[currentLanguage] || cat.name || '';
          return name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .map(cat => ({ ...cat, displayName: cat.localized_name?.[currentLanguage] || cat.name }));
  }, [categories, transactionType, searchQuery, currentLanguage]);

  const selected = useMemo(() => categories?.find(c => c.id === value), [categories, value]);

  const handleSelect = useCallback((id) => {
    onChange?.(id);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      const cat = await createCategory({ name: newName.trim(), icon: newIcon, color: newColor, type: transactionType });
      onChange?.(cat.id);
      setShowCreate(false);
      setIsOpen(false);
      setNewName('');
    } catch {}
  }, [newName, newIcon, newColor, transactionType, createCategory, onChange]);

  const colorOptions = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316'];
  const iconOptions  = ['Tag','Home','Car','Coffee','Gift','Heart','Music','Book','Plane','Smartphone'];

  return (
    <div className={cn('relative space-y-1.5', className)} ref={dropdownRef}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t('fields.category.label', 'Category')}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(v => !v)}
        disabled={disabled}
        className={cn(
          'w-full flex h-11 items-center gap-2.5 rounded-xl border px-3 text-left transition-all',
          'bg-white dark:bg-gray-800',
          isOpen ? 'ring-2 ring-blue-400/20 border-blue-400 dark:border-blue-500' : '',
          error
            ? 'border-red-300 dark:border-red-600'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {selected ? (
          <>
            <div className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: selected.color }}>
              {React.createElement(getIconComponent(selected.icon), { className: 'w-3.5 h-3.5 text-white' })}
            </div>
            <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
              {selected.localized_name?.[currentLanguage] || selected.name}
            </span>
          </>
        ) : (
          <>
            <div className="w-7 h-7 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="flex-1 truncate text-sm text-gray-400 dark:text-gray-500">
              {placeholder || t('fields.category.placeholder', 'Select a category')}
            </span>
          </>
        )}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <div className="fixed inset-0 z-40 sm:hidden bg-black/40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden',
                // Mobile: centered modal
                'fixed inset-x-4 top-[15%] bottom-[15%] sm:inset-auto',
                // Desktop: dropdown below button
                'sm:absolute sm:left-0 sm:w-full sm:top-[calc(100%+4px)] sm:max-h-72 sm:bottom-auto'
              )}
            >
              {!showCreate ? (
                <div className="flex flex-col h-full">
                  {/* Mobile header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 sm:hidden">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t('fields.category.label', 'Category')}
                    </span>
                    <button type="button" onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        ref={searchRef}
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t('fields.category.search', 'Search...')}
                        className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto py-1">
                    {filtered.length > 0 ? (
                      filtered.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelect(cat.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                            value === cat.id
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          )}
                        >
                          <div className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color }}>
                            {React.createElement(getIconComponent(cat.icon), { className: 'w-3.5 h-3.5 text-white' })}
                          </div>
                          <span className={cn(
                            'flex-1 truncate text-sm font-medium',
                            value === cat.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                          )}>
                            {cat.displayName}
                          </span>
                          {value === cat.id && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-sm text-gray-400">
                        {searchQuery ? t('fields.category.noResults', 'No results') : t('fields.category.empty', 'No categories')}
                      </div>
                    )}
                  </div>

                  {/* Create new */}
                  <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                    <button
                      type="button"
                      onClick={() => setShowCreate(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('fields.category.createNew', 'Create new category')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Create form */
                <div className="p-4 space-y-4 overflow-y-auto max-h-full">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t('fields.category.newCategory', 'New Category')}
                    </span>
                    <button type="button" onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder={t('fields.category.namePlaceholder', 'Category name')}
                    autoFocus
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400"
                  />

                  {/* Color */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('fields.category.color', 'Color')}</p>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewColor(c)}
                          className={cn('w-7 h-7 rounded-lg border-2 transition-all', newColor === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent hover:scale-105')}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Icon */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('fields.category.icon', 'Icon')}</p>
                    <div className="grid grid-cols-5 gap-2">
                      {iconOptions.map(ic => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setNewIcon(ic)}
                          className={cn(
                            'h-9 w-full rounded-lg border-2 flex items-center justify-center transition-all',
                            newIcon === ic
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          )}
                        >
                          {React.createElement(getIconComponent(ic), { className: 'w-4 h-4 text-gray-600 dark:text-gray-400' })}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 h-9 text-sm">
                      {t('actions.cancel', 'Cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCreate}
                      disabled={!newName.trim() || isLoading}
                      className="flex-1 h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? t('actions.creating', 'Creating...') : t('actions.create', 'Create')}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />{error}
        </p>
      )}
    </div>
  );
};

export default CategorySelector;
