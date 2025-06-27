/**
 * 🚀 PHASE 16: Advanced Skeleton Component System
 * 
 * Sophisticated loading states with component-specific skeletons
 * ✅ Smart skeleton patterns for BalancePanel, TransactionCard, Dashboard
 * ✅ Progressive loading with staggered animations
 * ✅ Optimistic update feedback
 * ✅ Responsive skeleton layouts
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

/**
 * Base Skeleton Component with variants and animations
 */
const Skeleton = ({ 
  className = "", 
  variant = "default",
  width = "100%",
  height = "1rem",
  rounded = "rounded",
  delay = 0,
  ...props 
}) => {
  const variants = {
    default: "skeleton",
    pulse: "skeleton skeleton-variant-pulse", 
    wave: "skeleton skeleton-variant-wave",
    fade: "skeleton skeleton-variant-fade"
  };

  return (
    <div 
      className={cn(variants[variant], rounded, className)}
      style={{ 
        width,
        height,
        animationDelay: `${delay}ms`
      }}
      {...props}
    />
  );
};

/**
 * 💫 Balance Panel Skeleton - Critical Priority
 */
export const BalancePanelSkeleton = ({ className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("skeleton-balance-panel loading-priority-critical", className)}
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <Skeleton className="skeleton-icon" />
          <div className="space-y-2">
            <Skeleton className="skeleton-title" />
            <Skeleton className="skeleton-subtitle" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="skeleton-button skeleton-stagger-1" />
          <Skeleton className="skeleton-button skeleton-stagger-2" />
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton 
              key={i}
              className={`skeleton-button flex-1 skeleton-stagger-${i}`}
              height="2rem"
            />
          ))}
        </div>
      </div>

      {/* Balance Cards Grid */}
      <div className="skeleton-balance-grid">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="skeleton-card-content"
          >
            <Skeleton className="skeleton-icon mx-auto mb-3" />
            <Skeleton className="skeleton-text-short mx-auto mb-2" />
            <Skeleton className="skeleton-number mx-auto" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * 🎪 Transaction Card Skeleton - High Priority
 */
export const TransactionCardSkeleton = ({ className = "", delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.1 }}
      className={cn("skeleton-transaction-card loading-priority-high p-4", className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="skeleton-icon" />
          <div className="space-y-2">
            <Skeleton className="skeleton-text-medium" width="120px" />
            <Skeleton className="skeleton-text-short" width="80px" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="skeleton-number" width="80px" />
          <Skeleton className="skeleton-text-short" width="60px" />
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 🎯 Transaction List Skeleton
 */
export const TransactionListSkeleton = ({ count = 5, className = "" }) => {
  return (
    <div className={cn("skeleton-transaction-list", className)}>
      {/* Header */}
      <div className="skeleton-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="skeleton-icon" />
            <div className="space-y-2">
              <Skeleton className="skeleton-title" />
              <Skeleton className="skeleton-subtitle" />
            </div>
          </div>
          <Skeleton className="skeleton-button" />
        </div>
      </div>

      {/* Transaction Cards */}
      <div className="skeleton-card-content">
        {Array.from({ length: count }).map((_, i) => (
          <TransactionCardSkeleton 
            key={i} 
            delay={i} 
            className="skeleton-stagger-1"
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 🚀 Dashboard Skeleton - Complete Layout
 */
export const DashboardSkeleton = ({ className = "" }) => {
  return (
    <div className={cn("skeleton-dashboard", className)}>
      {/* Balance Panel */}
      <BalancePanelSkeleton className="loading-progressive loading-progressive-delay-100" />
      
      {/* Quick Actions + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="skeleton-card loading-priority-medium"
        >
          <div className="skeleton-card-content">
            <Skeleton className="skeleton-title mb-4" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton 
                  key={i}
                  className={`skeleton-button skeleton-stagger-${i}`}
                  height="3rem"
                />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="skeleton-card loading-priority-medium"
        >
          <div className="skeleton-card-header">
            <div className="flex items-center justify-between">
              <Skeleton className="skeleton-title" />
              <Skeleton className="skeleton-button" />
            </div>
          </div>
          <div className="skeleton-card-content">
            {[1, 2, 3].map((i) => (
              <TransactionCardSkeleton 
                key={i} 
                delay={i} 
                className="mb-3"
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Stats Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="skeleton-card loading-priority-low"
        style={{ height: '300px' }}
      >
        <div className="skeleton-card-header">
          <Skeleton className="skeleton-title" />
        </div>
        <div className="skeleton-card-content">
          <Skeleton 
            className="skeleton-card" 
            height="200px"
          />
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 💫 Loading Overlay Component
 */
export const LoadingOverlay = ({ 
  variant = "default",
  size = "md", 
  message = "",
  className = ""
}) => {
  const overlayVariants = {
    default: "loading-overlay",
    subtle: "loading-overlay-subtle"
  };

  const spinnerSizes = {
    sm: "loading-spinner-sm",
    md: "loading-spinner-md", 
    lg: "loading-spinner-lg"
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(overlayVariants[variant], className)}
    >
      <div className="text-center">
        <div className={cn("loading-spinner mx-auto mb-3", spinnerSizes[size])} />
        {message && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 🎯 Optimistic Update Feedback
 */
export const OptimisticFeedback = ({ 
  state = "pending", 
  message = "",
  className = "" 
}) => {
  const stateClasses = {
    pending: "optimistic-pending",
    updating: "optimistic-updating",
    success: "optimistic-success",
    error: "optimistic-error"
  };

  const stateIcons = {
    pending: "⏳",
    updating: "🔄", 
    success: "✅",
    error: "❌"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "loading-feedback",
        stateClasses[state],
        className
      )}
    >
      <span className="text-lg">{stateIcons[state]}</span>
      {message && (
        <span className="text-sm font-medium">{message}</span>
      )}
    </motion.div>
  );
};

/**
 * 🎪 Progressive Loading Container
 */
export const ProgressiveLoader = ({ 
  children, 
  isLoading = false,
  fallback = null,
  priority = "medium",
  className = ""
}) => {
  const priorityClasses = {
    critical: "loading-priority-critical",
    high: "loading-priority-high", 
    medium: "loading-priority-medium",
    low: "loading-priority-low"
  };

  if (isLoading) {
    return (
      <div className={cn("loading-progressive", priorityClasses[priority], className)}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn("loading-progressive loaded", className)}>
      {children}
    </div>
  );
};

export default Skeleton; 