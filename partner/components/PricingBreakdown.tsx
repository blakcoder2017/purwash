import React from 'react';
import { Order } from '../types';

interface PricingBreakdownProps {
  order: Order;
  userType: 'rider' | 'partner';
}

const PricingBreakdown: React.FC<PricingBreakdownProps> = ({ order, userType }) => {
  const { pricing } = order;

  if (userType === 'rider') {
    // Rider sees: Items subtotal + Delivery fee (their earnings)
    return (
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-primary mb-3">Pricing Breakdown</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Items Subtotal:</span>
            <span className="font-medium">₵{pricing.itemsSubtotal?.toFixed(2) || '0.00'}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service Fee (9%):</span>
            <span className="font-medium">₵{pricing.serviceFee?.toFixed(2) || '0.00'}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">System Fee:</span>
            <span className="font-medium">₵{pricing.systemFee?.toFixed(2) || '0.00'}</span>
          </div>
          
          <div className="flex justify-between text-sm font-bold text-green-600 bg-green-50 p-2 rounded">
            <span>Your Delivery Fee:</span>
            <span>₵{pricing.deliveryFee?.toFixed(2) || '0.00'}</span>
          </div>
          
          <div className="border-t pt-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Total Paid by Client:</span>
              <span>₵{pricing.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userType === 'partner') {
    // Partner sees: Items subtotal - fees (their earnings)
    const partnerEarnings = (pricing.itemsSubtotal || 0) - (pricing.serviceFee || 0) - (pricing.systemFee || 0);
    
    return (
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-bold text-primary mb-3">Pricing Breakdown</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Items Subtotal:</span>
            <span className="font-medium">₵{pricing.itemsSubtotal?.toFixed(2) || '0.00'}</span>
          </div>
          
          <div className="flex justify-between text-sm text-red-600">
            <span>Platform Service Fee (9%):</span>
            <span className="font-medium">-₵{pricing.serviceFee?.toFixed(2) || '0.00'}</span>
          </div>
          
          <div className="flex justify-between text-sm text-red-600">
            <span>Platform System Fee:</span>
            <span className="font-medium">-₵{pricing.systemFee?.toFixed(2) || '0.00'}</span>
          </div>
          
          <div className="flex justify-between text-sm font-bold text-green-600 bg-green-50 p-2 rounded">
            <span>Your Laundry Earnings:</span>
            <span>₵{partnerEarnings.toFixed(2)}</span>
          </div>
          
          <div className="border-t pt-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery Fee (Rider):</span>
              <span>₵{pricing.deliveryFee?.toFixed(2) || '0.00'}</span>
            </div>
            
            <div className="flex justify-between text-sm font-bold">
              <span>Total Paid by Client:</span>
              <span>₵{pricing.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PricingBreakdown;
