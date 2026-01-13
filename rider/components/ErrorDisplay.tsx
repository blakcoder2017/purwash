
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ErrorIcon } from './icons/ActionIcons';

const ErrorDisplay: React.FC = () => {
  const { error, clearError } = useAppContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        const clearTimer = setTimeout(() => {
          clearError();
        }, 500); // Match transition duration
        return () => clearTimeout(clearTimer);
      }, 5000); // Display for 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-red-600 text-white p-4 rounded-lg shadow-2xl flex items-center z-50 transition-all duration-500 ease-in-out
        ${visible ? 'top-4 opacity-100' : '-top-full opacity-0'}`
      }
    >
      <ErrorIcon />
      <p className="font-bold">{error}</p>
    </div>
  );
};

export default ErrorDisplay;
