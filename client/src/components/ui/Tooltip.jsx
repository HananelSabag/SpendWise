/**
 * Tooltip Component - Accessible and Animated
 * 
 * Features:
 * - Hover and focus support
 * - Configurable delay and positioning
 * - Smooth animations with framer-motion
 * - Keyboard navigation support
 * - Dark/light theme support
 * - Responsive positioning
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';

const Tooltip = ({
  children,
  content,
  delay = 500,
  position = 'top',
  disabled = false,
  className = '',
  maxWidth = 'max-w-xs',
  offset = 8
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [actualPosition, setActualPosition] = useState(position);
  const [tooltipStyles, setTooltipStyles] = useState({});
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    
    const id = setTimeout(() => {
      setIsVisible(true);
      // Update positioning when tooltip becomes visible
      setTimeout(updatePosition, 0);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;
    let styles = {};

    // Calculate position based on trigger element
    switch (position) {
      case 'top':
        styles = {
          left: triggerRect.left + triggerRect.width / 2,
          top: triggerRect.top - offset,
          transform: 'translateX(-50%) translateY(-100%)'
        };
        // Check if tooltip would overflow top
        if (triggerRect.top - 60 < 0) {
          newPosition = 'bottom';
          styles = {
            left: triggerRect.left + triggerRect.width / 2,
            top: triggerRect.bottom + offset,
            transform: 'translateX(-50%)'
          };
        }
        break;
      case 'bottom':
        styles = {
          left: triggerRect.left + triggerRect.width / 2,
          top: triggerRect.bottom + offset,
          transform: 'translateX(-50%)'
        };
        // Check if tooltip would overflow bottom
        if (triggerRect.bottom + 60 > viewport.height) {
          newPosition = 'top';
          styles = {
            left: triggerRect.left + triggerRect.width / 2,
            top: triggerRect.top - offset,
            transform: 'translateX(-50%) translateY(-100%)'
          };
        }
        break;
      case 'left':
        styles = {
          left: triggerRect.left - offset,
          top: triggerRect.top + triggerRect.height / 2,
          transform: 'translateX(-100%) translateY(-50%)'
        };
        break;
      case 'right':
        styles = {
          left: triggerRect.right + offset,
          top: triggerRect.top + triggerRect.height / 2,
          transform: 'translateY(-50%)'
        };
        break;
    }

    // Ensure tooltip doesn't overflow horizontally
    if (styles.left < 10) {
      styles.left = 10;
      styles.transform = styles.transform?.replace('translateX(-50%)', '') || '';
    } else if (styles.left > viewport.width - 200) {
      styles.left = viewport.width - 200;
      styles.transform = styles.transform?.replace('translateX(-50%)', '') || '';
    }

    setActualPosition(newPosition);
    setTooltipStyles(styles);
  };

  const getArrowClasses = () => {
    const arrows = {
      top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1 border-t-gray-900 dark:border-t-gray-100',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1 border-b-gray-900 dark:border-b-gray-100',
      left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1 border-l-gray-900 dark:border-l-gray-100',
      right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1 border-r-gray-900 dark:border-r-gray-100'
    };
    return arrows[actualPosition] || arrows.top;
  };

  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: actualPosition === 'top' ? 5 : actualPosition === 'bottom' ? -5 : 0,
      x: actualPosition === 'left' ? 5 : actualPosition === 'right' ? -5 : 0
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }
    }
  };

  // Clean up timeout on unmount and handle scroll updates
  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        updatePosition();
      }
    };

    if (isVisible) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [timeoutId, isVisible, updatePosition]);

  if (!content || disabled) {
    return children;
  }

  return (
    <div className="relative inline-flex">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-flex"
      >
        {children}
      </div>
      
              <AnimatePresence>
          {isVisible && (
            <motion.div
              ref={tooltipRef}
              variants={tooltipVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed z-[9999] pointer-events-none"
              style={tooltipStyles}
            >
              <div
                className={cn(
                  'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
                  'text-xs font-medium rounded-lg py-2 px-3 shadow-lg',
                  'border border-gray-800 dark:border-gray-200',
                  maxWidth,
                  className
                )}
              >
                {content}
                
                {/* Tooltip Arrow */}
                <div className={cn('absolute', getArrowClasses())}>
                  <div className="border-4 border-transparent" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default Tooltip; 