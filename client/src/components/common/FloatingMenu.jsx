import React, { useState, useRef, useEffect } from 'react';
import { Languages, DollarSign, MoreVertical } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

const FloatingMenu = ({ buttons }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handler for button clicks
  const handleButtonClick = (onClick) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 
                   transition-all duration-200 ease-out
                   active:scale-95"
      >
        <MoreVertical className="h-6 w-6" />
      </button>

      {isOpen && (
        <div 
          className="bg-white rounded-lg shadow-lg absolute bottom-full mb-2
                     transform transition-all duration-200 ease-out
                     animate-fadeIn"
        >
          <div className="p-2 space-y-1">
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={() => handleButtonClick(button.onClick)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg w-full text-left
                           transition-colors duration-150 ease-in-out
                           active:bg-gray-200"
              >
                {button.icon && (
                  <button.icon className="h-5 w-5 text-primary-500" />
                )}
                <span className="whitespace-nowrap">{button.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingMenu;