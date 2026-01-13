import React from 'react';
import { LaundryItem } from '../types';

interface CatalogItemCardProps {
  item: LaundryItem;
  quantity: number;
  onQuantityChange: (itemId: string, quantity: number) => void;
  isLoading?: boolean;
}

const CatalogItemCard: React.FC<CatalogItemCardProps> = ({ 
  item, 
  quantity, 
  onQuantityChange, 
  isLoading = false 
}) => {
  const handleIncrease = () => {
    if (!isLoading) {
      onQuantityChange(item._id, quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (!isLoading && quantity > 0) {
      onQuantityChange(item._id, quantity - 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
      {/* Item Image Placeholder */}
      <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-2">👔</div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{item.category}</p>
        </div>
      </div>
      
      {/* Item Details */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
        </div>
        
        {/* Service Type Badge */}
        <div className="mb-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
            {item.serviceType.replace('_', ' ')}
          </span>
        </div>
        
        {/* Price and Quantity */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary">₵{item.pricing.clientPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-500">per item</p>
          </div>
          
          {/* Quantity Selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDecrease}
              disabled={quantity === 0 || isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                quantity === 0 || isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-100 text-red-600 hover:bg-red-200 active:scale-95'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            </button>
            
            <span className={`w-8 text-center font-semibold ${
              quantity > 0 ? 'text-primary' : 'text-gray-400'
            }`}>
              {quantity}
            </span>
            
            <button
              onClick={handleIncrease}
              disabled={isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-100 text-green-600 hover:bg-green-200 active:scale-95'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Popular Badge */}
        {item.isPopular && (
          <div className="mt-3 flex items-center text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={0} className="w-4 h-4 mr-1">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-xs font-medium">Popular</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogItemCard;
