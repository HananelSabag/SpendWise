/**
 * ✅ USE CATEGORY SELECTION - Advanced Selection Hook
 * Provides comprehensive category selection and bulk operations
 * Features: Multi-select, Bulk actions, Undo/Redo, Smart selection
 * @version 3.0.0 - CATEGORY REDESIGN
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useNotifications } from '../stores';

/**
 * ✅ Category Selection Hook
 */
export const useCategorySelection = (categories = [], options = {}) => {
  const {
    maxSelection = null,
    allowEmpty = true,
    persistSelection = false,
    enableUndo = true,
    onSelectionChange = null
  } = options;

  const { addNotification } = useNotifications();
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  // ✅ Selected categories
  const selectedCategories = useMemo(() => {
    return categories.filter(cat => selectedIds.has(cat.id));
  }, [categories, selectedIds]);

  // ✅ Selection stats
  const selectionStats = useMemo(() => {
    const selected = selectedCategories;
    return {
      count: selected.length,
      hasSelection: selected.length > 0,
      isMaxReached: maxSelection ? selected.length >= maxSelection : false,
      
      // Type breakdown
      byType: {
        income: selected.filter(cat => cat.type === 'income').length,
        expense: selected.filter(cat => cat.type === 'expense').length
      },
      
      // Status breakdown
      byStatus: {
        pinned: selected.filter(cat => cat.isPinned).length,
        hidden: selected.filter(cat => cat.isHidden).length,
        active: selected.filter(cat => !cat.isHidden).length
      }
    };
  }, [selectedCategories, maxSelection]);

  // ✅ Save state for undo
  const saveUndoState = useCallback(() => {
    if (!enableUndo) return;
    
    undoStack.current.push(new Set(selectedIds));
    if (undoStack.current.length > 50) {
      undoStack.current.shift(); // Keep max 50 states
    }
    redoStack.current = []; // Clear redo stack on new action
  }, [selectedIds, enableUndo]);

  // ✅ Select single category
  const selectCategory = useCallback((categoryId, selected = true) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      
      if (selected) {
        // Check max selection limit
        if (maxSelection && newSet.size >= maxSelection && !newSet.has(categoryId)) {
          addNotification({
            type: 'warning',
            message: `Maximum ${maxSelection} categories can be selected`,
            duration: 2000
          });
          return prev;
        }
        
        newSet.add(categoryId);
      } else {
        newSet.delete(categoryId);
      }
      
      // Check empty selection
      if (!allowEmpty && newSet.size === 0 && prev.size > 0) {
        addNotification({
          type: 'warning',
          message: 'At least one category must be selected',
          duration: 2000
        });
        return prev;
      }
      
      setLastSelectedId(categoryId);
      onSelectionChange?.(Array.from(newSet), categoryId, selected);
      return newSet;
    });
  }, [maxSelection, allowEmpty, addNotification, onSelectionChange]);

  // ✅ Toggle category selection
  const toggleCategory = useCallback((categoryId) => {
    saveUndoState();
    const isSelected = selectedIds.has(categoryId);
    selectCategory(categoryId, !isSelected);
  }, [selectedIds, selectCategory, saveUndoState]);

  // ✅ Select multiple categories
  const selectMultiple = useCallback((categoryIds, selected = true) => {
    saveUndoState();
    
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      
      if (selected) {
        // Add categories up to limit
        const availableSlots = maxSelection ? Math.max(0, maxSelection - newSet.size) : categoryIds.length;
        const toAdd = categoryIds.slice(0, availableSlots);
        
        toAdd.forEach(id => newSet.add(id));
        
        if (maxSelection && categoryIds.length > availableSlots) {
          addNotification({
            type: 'warning',
            message: `Only ${toAdd.length} categories could be selected due to limit`,
            duration: 3000
          });
        }
      } else {
        categoryIds.forEach(id => newSet.delete(id));
        
        // Check empty selection
        if (!allowEmpty && newSet.size === 0) {
          addNotification({
            type: 'warning',
            message: 'At least one category must be selected',
            duration: 2000
          });
          return prev;
        }
      }
      
      onSelectionChange?.(Array.from(newSet), null, selected);
      return newSet;
    });
  }, [maxSelection, allowEmpty, saveUndoState, addNotification, onSelectionChange]);

  // ✅ Select all categories
  const selectAll = useCallback(() => {
    saveUndoState();
    const availableCategories = categories.slice(0, maxSelection || categories.length);
    const categoryIds = availableCategories.map(cat => cat.id);
    selectMultiple(categoryIds, true);
  }, [categories, maxSelection, selectMultiple, saveUndoState]);

  // ✅ Clear selection
  const clearSelection = useCallback(() => {
    if (!allowEmpty && selectedIds.size > 0) {
      addNotification({
        type: 'warning',
        message: 'Cannot clear selection - at least one category must be selected',
        duration: 2000
      });
      return;
    }
    
    saveUndoState();
    setSelectedIds(new Set());
    setLastSelectedId(null);
    onSelectionChange?.([], null, false);
  }, [allowEmpty, selectedIds.size, saveUndoState, addNotification, onSelectionChange]);

  // ✅ Invert selection
  const invertSelection = useCallback(() => {
    saveUndoState();
    const allIds = categories.map(cat => cat.id);
    const newSelection = allIds.filter(id => !selectedIds.has(id));
    
    // Respect max selection limit
    const finalSelection = maxSelection 
      ? newSelection.slice(0, maxSelection)
      : newSelection;
    
    setSelectedIds(new Set(finalSelection));
    onSelectionChange?.(finalSelection, null, true);
  }, [categories, selectedIds, maxSelection, saveUndoState, onSelectionChange]);

  // ✅ Range selection (shift+click)
  const selectRange = useCallback((categoryId) => {
    if (!lastSelectedId) {
      toggleCategory(categoryId);
      return;
    }
    
    const currentIndex = categories.findIndex(cat => cat.id === categoryId);
    const lastIndex = categories.findIndex(cat => cat.id === lastSelectedId);
    
    if (currentIndex === -1 || lastIndex === -1) {
      toggleCategory(categoryId);
      return;
    }
    
    const startIndex = Math.min(currentIndex, lastIndex);
    const endIndex = Math.max(currentIndex, lastIndex);
    const rangeIds = categories.slice(startIndex, endIndex + 1).map(cat => cat.id);
    
    selectMultiple(rangeIds, true);
  }, [categories, lastSelectedId, toggleCategory, selectMultiple]);

  // ✅ Smart selection by criteria
  const selectByCriteria = useCallback((criteria) => {
    saveUndoState();
    
    const matchingCategories = categories.filter(category => {
      if (criteria.type && category.type !== criteria.type) return false;
      if (criteria.pinned !== undefined && category.isPinned !== criteria.pinned) return false;
      if (criteria.hidden !== undefined && category.isHidden !== criteria.hidden) return false;
      if (criteria.namePattern && !category.name.toLowerCase().includes(criteria.namePattern.toLowerCase())) return false;
      return true;
    });
    
    const categoryIds = matchingCategories.map(cat => cat.id);
    selectMultiple(categoryIds, true);
    
    addNotification({
      type: 'success',
      message: `Selected ${categoryIds.length} categories matching criteria`,
      duration: 2000
    });
  }, [categories, selectMultiple, saveUndoState, addNotification]);

  // ✅ Undo selection
  const undoSelection = useCallback(() => {
    if (undoStack.current.length === 0) return;
    
    redoStack.current.push(new Set(selectedIds));
    const previousState = undoStack.current.pop();
    setSelectedIds(previousState);
    onSelectionChange?.(Array.from(previousState), null, true);
  }, [selectedIds, onSelectionChange]);

  // ✅ Redo selection
  const redoSelection = useCallback(() => {
    if (redoStack.current.length === 0) return;
    
    undoStack.current.push(new Set(selectedIds));
    const nextState = redoStack.current.pop();
    setSelectedIds(nextState);
    onSelectionChange?.(Array.from(nextState), null, true);
  }, [selectedIds, onSelectionChange]);

  // ✅ Check if category is selected
  const isSelected = useCallback((categoryId) => {
    return selectedIds.has(categoryId);
  }, [selectedIds]);

  // ✅ Get selection summary
  const getSelectionSummary = useCallback(() => {
    return {
      total: selectionStats.count,
      types: selectionStats.byType,
      status: selectionStats.byStatus,
      categories: selectedCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type
      }))
    };
  }, [selectionStats, selectedCategories]);

  return {
    // Selection state
    selectedIds,
    selectedCategories,
    lastSelectedId,
    selectionStats,
    
    // Selection actions
    selectCategory,
    toggleCategory,
    selectMultiple,
    selectAll,
    clearSelection,
    invertSelection,
    selectRange,
    selectByCriteria,
    
    // Undo/Redo
    undoSelection,
    redoSelection,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    
    // Utilities
    isSelected,
    getSelectionSummary,
    
    // Bulk operations helpers
    getSelectedIds: () => Array.from(selectedIds),
    hasSelection: selectionStats.hasSelection,
    selectionCount: selectionStats.count
  };
}; 