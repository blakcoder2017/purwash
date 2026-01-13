
import React, { useState } from 'react';
import { useOrder } from '../../hooks/useOrder';
import Header from '../../components/Header';
import OrderSummary from '../../components/OrderSummary';
import PaymentProcessing from '../../components/PaymentProcessing';
import Loading from '../../components/Loading';
import ErrorDisplay from '../../components/ErrorDisplay';
import { api } from '../../services/api';

interface ReviewStepProps {
  onBack: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ onBack }) => {
  const { order, pricingPreview, catalog } = useOrder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handlePayment = async () => {
    if (!order.landmark || !order.coordinates || !order.phone) {
      setError('Please complete all order details');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const orderItemsPayload = order.items.map(orderItem => {
        const catalogItem = catalog.find(ci => ci._id === orderItem.itemId);
        return {
          name: catalogItem?.name || 'Unknown Item',
          price: catalogItem?.pricing.clientPrice || 0,
          quantity: orderItem.quantity,
        };
      });

      const createOrderPayload = {
        client: {
          phone: order.phone,
          location: {
            addressName: order.landmark,
            coordinates: order.coordinates,
          },
        },
        items: orderItemsPayload,
      };

      const createdOrder = await api.createOrder(createOrderPayload);
      setOrderId(createdOrder._id);
      setShowPayment(true);

    } catch (err) {
      console.error("Order creation failed", err);
      setError(err instanceof Error ? err.message : 'Failed to create order');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = (reference: string) => {
    // Store order reference for tracking
    localStorage.setItem('wewash_id', orderId || '');
    // Redirect to tracking page
    window.location.hash = '/track';
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setShowPayment(false);
    setIsProcessing(false);
  };

  if (!pricingPreview) {
    return (
      <div>
        <Header title="Review & Pay" onBack={onBack} />
        <Loading message="Finalizing your total..." />
      </div>
    );
  }

  if (showPayment && orderId) {
    return (
      <div>
        <Header title="Complete Payment" onBack={() => setShowPayment(false)} />
        <div className="p-4">
          <PaymentProcessing
            orderId={orderId}
            totalAmount={pricingPreview.pricing.totalAmount}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Review & Pay" onBack={onBack} />
      
      <div className="p-4 pb-32">
        {/* Order Summary */}
        <OrderSummary
          pricing={pricingPreview}
          isLoading={isProcessing}
          itemCount={order.items.reduce((sum, item) => sum + item.quantity, 0)}
        />

        {/* Delivery Information */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Delivery Information</h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Pickup Location</p>
                <p className="text-sm text-gray-600">{order.landmark}</p>
              </div>
            </div>

            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Contact Phone</p>
                <p className="text-sm text-gray-600">{order.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Timeline */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Estimated Timeline</p>
              <ul className="space-y-1">
                <li>• Pickup: Within 2 hours</li>
                <li>• Processing: 24-48 hours</li>
                <li>• Delivery: After processing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <ErrorDisplay 
            message={error} 
            onRetry={() => setError(null)}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-primary text-white font-semibold py-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Order...</span>
            </>
          ) : (
            <>
              <span>Pay ₵{pricingPreview.pricing.totalAmount.toFixed(2)}</span>
            </>
          )}
        </button>

        {/* Security Note */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 12v6a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Secured by Paystack
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
