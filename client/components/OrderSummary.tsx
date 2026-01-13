import React from 'react';
import { PricingPreview } from '../types';

interface OrderSummaryProps {
  pricing: PricingPreview | null;
  isLoading?: boolean;
  itemCount?: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  pricing, 
  isLoading = false,
  itemCount = 0 
}) => {
  if (isLoading) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!pricing || itemCount === 0) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🛒</div>
          <p className="text-sm">Your cart is empty</p>
          <p className="text-xs mt-1">Add items to see pricing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Order Summary</h3>
        <span className="text-sm text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </div>

      {/* Items List */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {pricing.items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {item.quantity} × {item.name}
            </span>
            <span className="font-medium">₵{item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-3 space-y-2">
        {/* Pricing Breakdown */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Items Subtotal</span>
            <span>₵{pricing.pricing.itemsSubtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service Fee (9%)</span>
            <span>₵{pricing.pricing.serviceFee.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">System Fees</span>
            <span>₵{pricing.pricing.systemFee.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Fee</span>
            <span>₵{pricing.pricing.deliveryFee.toFixed(2)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-primary">₵{pricing.pricing.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Pricing Information</p>
            <ul className="space-y-1">
              <li>• Service fee covers platform costs</li>
              <li>• System fees are embedded in item prices</li>
              <li>• Fixed delivery fee for all orders</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
