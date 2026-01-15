
import React from 'react';
import { Order } from '../types';
import { STATUS_PROGRESSION, STATUS_TEXT, STATUS_COLOR } from '../constants';
import { useAppContext } from '../context/AppContext';

interface StatusButtonProps {
  order: Order;
  inline?: boolean;
}

const StatusButton: React.FC<StatusButtonProps> = ({ order, inline = false }) => {
  const { updateOrderStatus, loading } = useAppContext();
  const nextStatus = STATUS_PROGRESSION[order.status];
  const buttonText = STATUS_TEXT[order.status];
  const buttonColor = STATUS_COLOR[order.status];

  const handleUpdate = () => {
    if (nextStatus) {
      updateOrderStatus(order._id, nextStatus);
    }
  };

  const isClickable = !!nextStatus && !loading;

  if (inline) {
    return (
      <div className="px-4">
        <button
          onClick={handleUpdate}
          disabled={!isClickable}
          className={`w-full h-14 text-white font-bold text-lg rounded-lg shadow transition-all duration-200 active:scale-95 flex items-center justify-center
            ${isClickable ? `${buttonColor} hover:opacity-90` : 'bg-gray-400 cursor-not-allowed'}`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            buttonText
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 p-4 bg-secondary-bg">
      <button
        onClick={handleUpdate}
        disabled={!isClickable}
        className={`w-full h-20 text-white font-bold text-2xl rounded-lg shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center
          ${isClickable ? `${buttonColor} hover:opacity-90` : 'bg-gray-400 cursor-not-allowed'}`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
};

export default StatusButton;
