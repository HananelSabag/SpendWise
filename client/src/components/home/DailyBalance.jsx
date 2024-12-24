import React from 'react';

const DailyBalance = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-teal-500 p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">מאזן יומי</h2>
          <span className="text-sm">{new Date().toLocaleDateString('he-IL')}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <span className="block text-teal-100 text-sm">הכנסות</span>
            <span className="text-2xl font-bold">₪350</span>
          </div>
          <div className="text-center">
            <span className="block text-teal-100 text-sm">הוצאות</span>
            <span className="text-2xl font-bold">-₪150</span>
          </div>
          <div className="text-center">
            <span className="block text-teal-100 text-sm">סה"כ</span>
            <span className="text-2xl font-bold">₪200</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyBalance;