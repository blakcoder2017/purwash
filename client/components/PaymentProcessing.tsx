import React, { useState } from 'react';

interface PaymentProcessingProps {
  orderId: string;
  totalAmount: number;
  onPaymentSuccess: (reference: string) => void;
  onPaymentError: (error: string) => void;
  isLoading?: boolean;
}

const PaymentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 12v6a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const PaymentProcessing: React.FC<PaymentProcessingProps> = ({
  orderId,
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
  isLoading = false
}) => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!email) {
      onPaymentError('Please enter your email address');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment initialization failed');
      }

      setPaymentUrl(data.authorization_url);
      
      // Open payment window
      const popup = window.open(data.authorization_url, 'payment', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      // Listen for popup closure
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // In a real app, you'd verify the payment status
          onPaymentSuccess(data.reference);
        }
      }, 1000);

    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentUrl) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Redirecting to Payment</h3>
        <p className="text-gray-600 mb-4">
          You'll be redirected to Paystack to complete your payment securely.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Amount:</strong> ₵{totalAmount.toFixed(2)}<br />
            <strong>Order ID:</strong> {orderId}<br />
            <strong>Email:</strong> {email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <PaymentIcon />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Payment</h3>
        <p className="text-gray-600">
          Complete your order payment securely with Paystack
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Order Total</span>
          <span className="text-2xl font-bold text-primary">₵{totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Order ID</span>
          <span>{orderId}</span>
        </div>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isProcessing}
        />
        <p className="mt-1 text-xs text-gray-500">
          We'll send your payment receipt to this email
        </p>
      </div>

      {/* Payment Methods */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Methods</h4>
        <div className="space-y-2">
          <div className="flex items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Mobile Money</p>
              <p className="text-xs text-gray-500">MTN, Vodafone, AirtelTigo</p>
            </div>
          </div>
          <div className="flex items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-3">
              <span className="text-white font-bold text-xs">💳</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Card Payment</p>
              <p className="text-xs text-gray-500">Visa, Mastercard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
        <LockIcon />
        <span>Secured by Paystack</span>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || !email || isLoading}
        className="w-full bg-primary text-white font-semibold py-4 px-6 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <span>Pay ₵{totalAmount.toFixed(2)}</span>
          </>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-center text-gray-500">
        By completing this payment, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};

export default PaymentProcessing;
