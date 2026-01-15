import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Spinner from './Spinner';

const PaymentSuccess: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference');
  const orderCode = urlParams.get('order');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!reference) {
          setError('No payment reference found');
          setIsVerifying(false);
          return;
        }

        // For now, simulate successful payment verification
        // In production, this would verify with the backend
        setTimeout(() => {
          setOrderData({
            trackingCode: orderCode || 'ORDER-123',
            phone: '0551234567'
          });
          setIsVerifying(false);
        }, 2000);
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Unable to verify payment');
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [reference, orderCode]);

  const handleTrackOrder = () => {
    if (orderData?.phone && orderData?.trackingCode) {
      window.location.href = `/track?phone=${orderData.phone}&code=${orderData.trackingCode}`;
    } else {
      window.location.href = '/track';
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Spinner />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
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
          <p className="text-gray-600 mb-6">Your order has been placed successfully</p>
          
          {orderData && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Your order code is:</p>
              <p className="text-2xl font-bold text-blue-600">{orderData.trackingCode}</p>
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
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <div className="text-center text-sm text-gray-500">
            <p>Reference: {reference}</p>
            <p className="mt-1">You'll receive order updates via WhatsApp/SMS</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
