import React, { useState } from 'react';
import { PlusIcon, MinusIcon } from 'lucide-react';

const QuickAdd = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const handleSubmit = (type) => {
    // TODO: Implement transaction submission
    console.log(`Adding ${type}:`, amount);
    setIsOpen(false);
    setAmount('');
  };

  return (
    <div className="fixed bottom-6 right-6">
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-teal-500 text-white rounded-full p-4 shadow-lg hover:bg-teal-600 transition-colors"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-xl p-4 w-72">
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="הכנס סכום"
            className="w-full p-3 border rounded-lg mb-3"
          />
          <div className="flex space-x-2">
            <button 
              onClick={() => handleSubmit('expense')}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
            >
              הוצאה
            </button>
            <button 
              onClick={() => handleSubmit('income')}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
            >
              הכנסה
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAdd;