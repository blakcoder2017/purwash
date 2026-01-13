
import React, { useState } from 'react';

const DutyToggle: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <span className={`text-lg font-bold ${isOnline ? 'text-primary' : 'text-gray-500'}`}>
        Duty Status
      </span>
      <button
        onClick={() => setIsOnline(!isOnline)}
        className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 focus:outline-none ${
          isOnline ? 'bg-accent' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
            isOnline ? 'translate-x-8' : ''
          }`}
        />
        <span className="absolute left-3 text-white text-xs font-bold">{isOnline ? 'ON' : ''}</span>
        <span className="absolute right-2 text-gray-600 text-xs font-bold">{!isOnline ? 'OFF' : ''}</span>
      </button>
    </div>
  );
};

export default DutyToggle;
