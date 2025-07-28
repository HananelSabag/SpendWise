/**
 * 🎚️ SLIDER COMPONENT
 * Range slider for numeric values
 * Features: Accessible, Smooth animations, Mobile-friendly
 */

import React, { useCallback } from 'react';
import { cn } from '../../utils/helpers';

console.log('🎚️ Slider component loading...');

const Slider = ({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
  ...props
}) => {
  console.log('🎚️ Slider render:', { value, min, max, step, disabled, hasOnChange: !!onValueChange });

  const currentValue = Array.isArray(value) ? value[0] : value;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const handleChange = useCallback((e) => {
    console.log('🎚️ Slider handleChange:', { disabled, hasOnChange: !!onValueChange, eventType: e?.type });
    if (!disabled && onValueChange) {
      try {
        const newValue = parseFloat(e.target.value);
        console.log('🎚️ Slider calling onValueChange with:', newValue);
        onValueChange([newValue]);
      } catch (error) {
        console.error('🎚️ Slider onValueChange error:', error);
      }
    }
  }, [disabled, onValueChange]);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Track */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
        {/* Progress */}
        <div 
          className="absolute h-2 bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Thumb */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-200"
          style={{ left: `${percentage}%` }}
        >
          <div className={cn(
            'w-4 h-4 bg-white border-2 border-blue-600 dark:border-blue-500 rounded-full shadow-lg',
            'hover:scale-110 focus:scale-110 transition-transform duration-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )} />
        </div>
      </div>

      {/* Hidden input for accessibility and functionality */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        {...props}
      />
    </div>
  );
};

export default Slider; 