import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { updateOnlineStatus } from '../services/api';

const OnlineStatusToggle: React.FC = () => {
  const { user, updateUser } = useAppContext();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when user changes
  useEffect(() => {
    setIsOnline(user?.isOnline || false);
  }, [user?.isOnline]);

  const toggleOnlineStatus = async () => {
    setIsLoading(true);
    
    try {
      const data = await updateOnlineStatus(!isOnline);
      setIsOnline(data.isOnline);
      if (user) {
        updateUser({ ...user, isOnline: data.isOnline });
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div>
        <span className={`text-lg font-bold ${isOnline ? 'text-primary' : 'text-gray-500'}`}>
          Online Status
        </span>
        <p className="text-sm text-gray-500">
          {isOnline ? 'Accepting new orders' : 'Not accepting orders'}
        </p>
      </div>
      <button
        onClick={toggleOnlineStatus}
        disabled={isLoading}
        className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 focus:outline-none ${
          isOnline ? 'bg-green-500' : 'bg-gray-300'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

export default OnlineStatusToggle;
