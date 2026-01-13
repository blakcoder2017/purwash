
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const Notification: React.FC = () => {
  const { notification, clearNotification } = useAppContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        // Wait for transition to finish before clearing the message from state
        const clearTimer = setTimeout(() => {
          clearNotification();
        }, 500); // This duration should match the transition duration
        return () => clearTimeout(clearTimer);
      }, 4000); // Notification displayed for 4 seconds

      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-primary text-white p-4 rounded-lg shadow-2xl text-center z-50 transition-all duration-500 ease-in-out
        ${visible ? 'top-4 opacity-100' : '-top-full opacity-0'}`
      }
    >
      <p className="font-bold">{notification}</p>
    </div>
  );
};

export default Notification;
