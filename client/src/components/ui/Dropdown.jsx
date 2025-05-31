// components/ui/Dropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

const Dropdown = ({
  trigger,
  children,
  align = 'left',
  className = '',
  triggerClassName = '',
  contentClassName = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { language } = useLanguage();
  const isRTL = language === 'he';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignments = {
    left: isRTL ? 'right-0' : 'left-0',
    right: isRTL ? 'left-0' : 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)} {...props}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn('cursor-pointer', triggerClassName)}
      >
        {trigger || (
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Options
            <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-10 mt-2 min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200',
            'dark:bg-gray-800 dark:border-gray-700',
            alignments[align],
            contentClassName
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {children}
        </div>
      )}
    </div>
  );
};

Dropdown.Item = ({ children, onClick, className = '', ...props }) => (
  <button
    onClick={(e) => {
      onClick?.(e);
    }}
    className={cn(
      'w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100',
      'dark:text-gray-300 dark:hover:bg-gray-700',
      'transition-colors first:rounded-t-lg last:rounded-b-lg',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

Dropdown.Divider = () => (
  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
);

export default Dropdown;