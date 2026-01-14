import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePaystackPayment } from 'react-paystack';
import { api } from '../services/api';
import type { OrderItem, Coordinates, LaundryItem, LocationPayload, CalculatePriceResponseData } from '../types';
import Spinner from './Spinner';
import LocationPicker from './LocationPicker';

interface OrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: () => void;
}

const OrderSheet: React.FC<OrderSheetProps> = ({ isOpen, onClose, onTrackOrder }) => {
  const [laundryItems, setLaundryItems] = useState<LaundryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>('clothing');
  
  const [phone, setPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isGpsLocation, setIsGpsLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo'>('momo');
  const [pickupTime, setPickupTime] = useState<string>('');
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [pricingBreakdown, setPricingBreakdown] = useState<CalculatePriceResponseData | null>(null);
  const [isItemsLoading, setIsItemsLoading] = useState(true);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [existingClient, setExistingClient] = useState<any>(null);
  const [paystackPublicKey, setPaystackPublicKey] = useState<string>('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setError(null);
        setIsItemsLoading(true);
        const response = await api.getLaundryItems();
        setLaundryItems(response.data || []);
      } catch (err) {
        console.error("Failed to fetch laundry items:", err);
        setError('Could not load laundry items. Please refresh the page.');
      } finally {
        setIsItemsLoading(false);
      }
    };
    
    const fetchPaystackConfig = async () => {
      try {
        const config = await api.getPaystackConfig();
        if (config.success) {
          setPaystackPublicKey(config.data.publicKey);
        }
      } catch (err) {
        console.error("Failed to fetch Paystack config:", err);
        // Fallback to a default key (should match backend .env)
        setPaystackPublicKey('pk_test_d89784309f0d8ce5fefdae351b531cecc1c9fa6d');
      }
    };
    
    if (isOpen) {
      fetchItems();
      fetchPaystackConfig();
      // Set default pickup time to 2 hours from now
      const defaultTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      setPickupTime(defaultTime.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  // Group items by category for tabs
  const categorizedItems = useMemo(() => {
    const categories: Record<string, LaundryItem[]> = {
      clothing: [],
      bedding: [],
      household: [],
      specialty: [],
      accessories: []
    };
    
    laundryItems.forEach(item => {
      if (categories[item.category]) {
        categories[item.category].push(item);
      }
    });
    
    return categories;
  }, [laundryItems]);

  const tabs = [
    { id: 'clothing', label: 'Clothing', icon: '👕' },
    { id: 'bedding', label: 'Bedding', icon: '🛏️' },
    { id: 'household', label: 'Household', icon: '🏠' },
    { id: 'specialty', label: 'Specialty', icon: '✨' },
    { id: 'accessories', label: 'Accessories', icon: '🎒' }
  ];

  const itemsForApi = useMemo(() => {
    return Object.entries(selectedItems)
      .filter(([_, quantity]) => (quantity as number) > 0)
      .map(([itemId, quantity]) => {
        const item = laundryItems.find(i => i._id === itemId);
        return {
          name: item?.name || '',
          price: (item?.pricing?.clientPrice || 0) as number,
          quantity
        };
      });
  }, [selectedItems, laundryItems]);

  const calculateTotal = useCallback(async () => {
    if (itemsForApi.length === 0) {
      setTotalAmount(0);
      setPricingBreakdown(null);
      return;
    }
    setError(null);
    setIsCalculatingPrice(true);
    
    try {
      const response = await api.calculatePrice(itemsForApi);
      setTotalAmount(response.data.totalAmount);
      setPricingBreakdown(response.data);
    } catch (error) {
      console.error('Price calculation failed:', error);
      setError('Could not calculate price. Please check your connection.');
      setPricingBreakdown(null);
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [itemsForApi]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const handlePhoneBlur = async () => {
    if (!phone || phone.length < 10) return;
    
    setIsCheckingPhone(true);
    try {
      // Only check for existing client, don't create
      const response = await api.getClient(phone);
      if (response.success) {
        setExistingClient(response.data);
        setClientName(response.data.name || '');
        console.log('Existing client found:', response.data);
      } else {
        setExistingClient(null);
        console.log('New client - will be created during order placement');
      }
    } catch (error) {
      setExistingClient(null);
      console.log('Client lookup failed, will create during order placement');
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null);
    setClientName(e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null);
    setPhone(e.target.value);
  };

  const handleCreateOrder = async () => {
    setError(null);
    setIsCreatingOrder(true);
    
    try {
      const locationPayload: LocationPayload = {
        addressName: location,
        coordinates: coordinates || { lat: 0, lng: 0 }
      };

      const orderPayload = {
        items: itemsForApi,
        phone,
        clientName,
        location: locationPayload,
        paymentMethod,
        pickupTime: pickupTime ? new Date(pickupTime) : undefined
      };

      const response = await api.createOrder(orderPayload);
      if (response.success) {
        setOrderCode(response.data.trackingCode);
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setSelectedItems({});
          setPhone('');
          setClientName('');
          setLocation('');
          setIsGpsLocation(false);
          setPricingBreakdown(null);
          setExistingClient(null);
          setOrderCode('');
          onTrackOrder();
        }, 5000); // Longer delay to show order code
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      setError('Your order could not be placed. Please contact support for assistance.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const config = {
    reference: new Date().getTime().toString(),
    email: `${phone}@purwash.com`,
    amount: Math.round(totalAmount * 100), // Amount in pesewas, ensure it's an integer
    publicKey: paystackPublicKey,
  };

  const initializePayment = usePaystackPayment(config);

  const handlePaymentSuccess = async (reference: { reference: string }) => {
    setError(null);
    setIsCreatingOrder(true);
    try {
      const locationPayload: LocationPayload = {
        addressName: location,
        coordinates: coordinates || { lat: 0, lng: 0 }
      };

      const orderPayload = {
        items: itemsForApi,
        phone,
        clientName,
        location: locationPayload,
        paystackReference: reference.reference
      };

      const response = await api.createOrder(orderPayload);
      if (response.success) {
        setOrderCode(response.data.trackingCode);
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setSelectedItems({});
          setPhone('');
          setClientName('');
          setLocation('');
          setIsGpsLocation(false);
          setPricingBreakdown(null);
          setExistingClient(null);
          setOrderCode('');
          onTrackOrder();
        }, 5000); // Longer delay to show order code
      }
    } catch (error) {
      console.error('Order creation failed:', error);
      setError('Your order could not be placed. Please contact support for assistance.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentClose = () => console.log('Payment window closed.');

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedItems };
      delete newSelected[itemId];
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
    }
  };

  const isFormValid = phone && clientName && location && itemsForApi.length > 0 && totalAmount > 0;
  const totalItems = useMemo(() => Object.values(selectedItems).reduce((acc, qty) => acc + qty, 0), [selectedItems]);

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end justify-center">
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white w-full max-w-lg rounded-t-2xl p-6 h-1/2 flex flex-col items-center justify-center text-center"
        >
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Your order code is:</p>
            <p className="text-2xl font-bold text-blue-600">{orderCode}</p>
          </div>
          <p className="text-gray-600 mb-2">Save this code to track your order</p>
          <p className="text-sm text-gray-500">You'll receive updates via WhatsApp/SMS</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end justify-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white w-full max-w-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Place Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Client Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Client Information</h3>
            
            {existingClient && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <p className="font-medium">Welcome back, {existingClient.name}!</p>
                <p className="text-sm">Found your account. Orders: {existingClient.totalOrders || 0}</p>
                {existingClient.recentOrders && existingClient.recentOrders.length > 0 && (
                  <p className="text-sm">Recent orders: {existingClient.recentOrders.map((o: any) => o.friendlyId).join(', ')}</p>
                )}
              </div>
            )}

            {!existingClient && phone && phone.length >= 10 && !isCheckingPhone && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <p className="font-medium">New Customer</p>
                <p className="text-sm">Account will be created automatically when you place your order</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  placeholder="0551234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {isCheckingPhone && <p className="text-sm text-blue-600 mt-1">Checking...</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={handleNameChange}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <LocationPicker
                onLocationSelect={(address, coords) => {
                  setLocation(address);
                  setCoordinates(coords);
                  setIsGpsLocation(false);
                }}
                initialAddress={location}
                initialCoordinates={coordinates || undefined}
              />
            </div>
          </div>

          {/* Item Selection with Tabs */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Select Items</h3>
            
            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            {isItemsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categorizedItems[activeTab]?.map(item => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.serviceType?.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₵{item.pricing?.clientPrice || 0}</p>
                        <p className="text-xs text-gray-500">{item.estimatedProcessingHours}h</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item._id, (selectedItems[item._id] || 0) - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{selectedItems[item._id] || 0}</span>
                      <button
                        onClick={() => updateQuantity(item._id, (selectedItems[item._id] || 0) + 1)}
                        className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Breakdown */}
          {pricingBreakdown && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-gray-600">
                  <span>{totalItems} Item{totalItems !== 1 ? 's' : ''}</span>
                  <span>₵{pricingBreakdown.baseCost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Delivery Fee</span>
                  <span>₵{pricingBreakdown.deliveryFee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Platform Fee ({pricingBreakdown.config?.platformFeePercentage || 0}%)</span>
                  <span>₵{pricingBreakdown.platformPercentageFee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t border-gray-300 my-2"></div>
                <div className="flex justify-between items-center font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span>₵{pricingBreakdown.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₵{totalAmount.toFixed(2)}</p>
            </div>
            <button
              onClick={() => {
                if (paymentMethod === 'momo') {
                  initializePayment(handlePaymentSuccess, handlePaymentClose);
                } else {
                  handleCreateOrder();
                }
              }}
              disabled={!isFormValid || isCreatingOrder || isCalculatingPrice}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {(isCreatingOrder || isCalculatingPrice) && <Spinner />}
              <span>{isCreatingOrder ? 'Processing...' : paymentMethod === 'momo' ? 'Pay Now' : 'Place Order'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSheet;