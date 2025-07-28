/**
 * 🎚️ SLIDER COMPONENT
 * Range slider for numeric values
 * Features: Accessible, Smooth dragging, Multi-range support
 */

import React, { useCallback } from 'react';
import { cn } from '../../utils/helpers';

const Slider = ({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  orientation = 'horizontal',
  className = '',
  trackClassName = '',
  rangeClassName = '',
  thumbClassName = '',
  ...props
}) => {
  const currentValue = Array.isArray(value) ? value[0] : value;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleChange = useCallback((e) => {
    if (!disabled && onValueChange) {
      const newValue = parseInt(e.target.value);
      onValueChange([newValue]);
    }
  }, [disabled, onValueChange]);

  return (
    <div
      className={cn(
        'relative flex items-center w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700',
          'slider-thumb:appearance-none slider-thumb:h-4 slider-thumb:w-4 slider-thumb:rounded-full slider-thumb:bg-primary-600 slider-thumb:cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          disabled && 'cursor-not-allowed',
          trackClassName
        )}
        style={{
          background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${percentage}%, rgb(229 231 235) ${percentage}%, rgb(229 231 235) 100%)`
        }}
      />
    </div>
  );
};

export default Slider; 