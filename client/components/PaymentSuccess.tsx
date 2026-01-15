import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import sbpBadge from '../images/SBP - Badge - White.png';

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const reference = urlParams.get('reference');
  const orderCode = urlParams.get('order');
  const phone = urlParams.get('phone');

  const handleTrackOrder = () => {
    if (phone && orderCode) {
      navigate(`/track-order/${phone}/${orderCode}`);
    } else {
      navigate('/track');
    }
  };

  if (!orderCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-4">Order details are missing. Please track your order manually.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-4xl">✅</span>
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Chaley, you dey form!!!</p>
          
          {orderCode && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Your order code is:</p>
              <p className="text-2xl font-bold text-blue-600">{orderCode}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={handleTrackOrder}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Track Your Order
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <div className="flex justify-center mb-4">
            <img
              src={sbpBadge}
              alt="Secured by Paystack"
              className="h-7 w-auto opacity-90"
              loading="lazy"
            />
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>Reference: {reference || 'N/A'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
