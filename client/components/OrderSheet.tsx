import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePaystackPayment } from 'react-paystack';
import axios from 'axios';
import { api } from '../services/api';
import type { OrderItem, Coordinates, LaundryItem, LocationPayload, CalculatePriceResponseData } from '../types';
import Spinner from './Spinner';

interface OrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: () => void;
}

const OrderSheet: React.FC<OrderSheetProps> = ({ isOpen, onClose, onTrackOrder }) => {
  const [laundryItems, setLaundryItems] = useState<LaundryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  
  const [phone, setPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isGpsLocation, setIsGpsLocation] = useState(false);
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [pricingBreakdown, setPricingBreakdown] = useState<CalculatePriceResponseData | null>(null);
  const [isItemsLoading, setIsItemsLoading] = useState(true);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAYSTACK_PUBLIC_KEY = 'pk_test_d8a22a8101378035ef4507c82a2bb7f16f51cf7c'; // Use your actual test key

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setError(null);
        setIsItemsLoading(true);
        const response = await api.getLaundryItems();
        setLaundryItems(response.data || []);
      } catch (err) {
        console.error("Failed to fetch laundry items:", err);
        setError("Could not load services. Please try again later.");
      } finally {
        setIsItemsLoading(false);
      }
    };
    fetchItems();
  }, []);

  const itemsForApi: OrderItem[] = useMemo(() => {
    return Object.entries(selectedItems)
      .map(([itemId, quantity]) => {
        const itemDetails = laundryItems.find(item => item._id === itemId);
        if (!itemDetails || quantity <= 0) return null;
        return {
          name: itemDetails.name,
          price: itemDetails.pricing.clientPrice,
          quantity,
        };
      })
      .filter((item): item is OrderItem => item !== null);
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

  const handleQuantityChange = (itemId: string, change: number) => {
    setError(null);
    setSelectedItems(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + change);
      const newSelected = { ...prev };
      if (newQty === 0) {
        delete newSelected[itemId];
      } else {
        newSelected[itemId] = newQty;
      }
      return newSelected;
    });
  };

  const handlePhoneBlur = async () => {
    if (phone.length < 10) return;
    setError(null);
    setIsCheckingPhone(true);
    try {
      const response = await api.getClient(phone);
      if (response.success && response.data) {
        setClientName(response.data.name);
        setLocation(response.data.savedLocations?.[0]?.address || '');
        if (response.data.savedLocations?.[0]?.coordinates) {
          setCoordinates(response.data.savedLocations[0].coordinates);
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.info('Client not found, new client.');
        setClientName('');
        setLocation('');
        setCoordinates(null);
      } else {
        console.error('Error fetching client data:', error);
        setError("We couldn't check your phone number. Please try again.");
      }
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleGPS = () => {
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation('Current Location');
          setCoordinates({ lat: latitude, lng: longitude });
          setIsGpsLocation(true);
        },
        (err) => {
          setError('Could not get location. Please enter it manually.');
          console.error('Geolocation error:', err);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const config = {
    reference: new Date().getTime().toString(),
    email: `${phone}@purwash.com`,
    amount: totalAmount * 100, // Amount in pesewas
    publicKey: PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  const handlePaymentSuccess = async (reference: { reference: string }) => {
    setError(null);
    setIsCreatingOrder(true);
    try {
      const locationPayload: LocationPayload = {
        addressName: location,
        coordinates,
        ...(isGpsLocation && { saveAsLocation: true, locationLabel: 'Current Location' })
      };

      const response = await api.createOrder({
        items: itemsForApi,
        phone,
        clientName,
        location: locationPayload,
        paystackReference: reference.reference,
      });
      
      // Show success with order details
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
        // Redirect to tracking after successful order
        onTrackOrder();
      }, 3000);
    } catch (error) {
      console.error('Order creation failed:', error);
      setError('Your order could not be placed. Please contact support for assistance.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentClose = () => console.log('Payment window closed.');
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null);
    setPhone(e.target.value);
  };
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null);
    setClientName(e.target.value);
  };
  const handleLocationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (error) setError(null);
    setLocation(e.target.value);
    setIsGpsLocation(false);
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
          <svg className="w-24 h-24 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h2 className="text-2xl font-bold text-slate-900">Order Placed!</h2>
          <p className="text-slate-600 mt-2">Your rider has been dispatched. We'll be in touch shortly.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-white w-full max-w-lg mx-auto rounded-t-2xl p-6 z-50 max-h-[90vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Your Wash Details</h2>
          <button onClick={onTrackOrder} className="text-sm font-semibold text-slate-900 hover:underline">
              Track Order
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Services</label>
          {isItemsLoading ? <div className="flex justify-center p-8"><Spinner /></div> : (
            <div className="space-y-3">
              {laundryItems.map(item => (
                <div key={item._id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                  <div className="flex-1 pr-2">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">₵{item.pricing.clientPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => handleQuantityChange(item._id, -1)} className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold text-lg flex items-center justify-center">-</button>
                    <span className="font-bold text-lg w-8 text-center">{selectedItems[item._id] || 0}</span>
                    <button onClick={() => handleQuantityChange(item._id, 1)} className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-lg flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number</label>
            <div className="relative">
              <input type="tel" id="phone" value={phone} onChange={handlePhoneChange} onBlur={handlePhoneBlur} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm p-3 text-lg focus:ring-slate-900 focus:border-slate-900" placeholder="055 123 4567" />
              {isCheckingPhone && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner /></div>}
            </div>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
            <input type="text" id="name" value={clientName} onChange={handleNameChange} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm p-3 text-lg focus:ring-slate-900 focus:border-slate-900" placeholder="John Doe" />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">Pickup Location</label>
            <textarea id="location" rows={3} value={location} onChange={handleLocationChange} className="block w-full border-slate-300 rounded-md shadow-sm p-3 text-lg focus:ring-slate-900 focus:border-slate-900" placeholder="e.g. Blue gate opposite the fuel station"></textarea>
            <button onClick={handleGPS} className="mt-2 text-sm font-semibold text-slate-900 flex items-center space-x-1">
              <span role="img" aria-label="location pin">📍</span>
              <span>Use current location</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          {pricingBreakdown ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>{totalItems} Item{totalItems !== 1 ? 's' : ''}</span>
                <span>₵{pricingBreakdown.pricing.items.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Delivery</span>
                <span>₵{pricingBreakdown.pricing.delivery.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>System Fee ({pricingBreakdown.config.platformCommission}%)</span>
                <span>₵{pricingBreakdown.pricing.system.split(' ')[1]?.replace(/[()]/g, '') || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Per-Item Fee</span>
                <span>{pricingBreakdown.pricing.perItem}</span>
              </div>
              <div className="border-t border-slate-200 my-2"></div>
              <div className="flex justify-between items-center font-bold text-slate-900 text-lg">
                <span>Total</span>
                <span>{isCalculatingPrice ? <Spinner className="w-4 h-4" /> : `₵${totalAmount.toFixed(2)}`}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center font-bold text-slate-900 text-lg">
              <span>Total</span>
              <span>{isCalculatingPrice ? <Spinner className="w-4 h-4" /> : `₵${totalAmount.toFixed(2)}`}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm text-center" role="alert">
            <p>{error}</p>
          </div>
        )}

        <button 
          onClick={() => initializePayment(handlePaymentSuccess, handlePaymentClose)}
          disabled={!isFormValid || isCalculatingPrice || isCreatingOrder || isItemsLoading}
          className="mt-6 w-full bg-slate-900 text-white font-bold py-4 px-4 rounded-xl text-lg flex items-center justify-center transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isCreatingOrder ? <Spinner /> : `Pay ₵${totalAmount.toFixed(2)}`}
        </button>
      </motion.div>
    </>
  );
};

export default OrderSheet;