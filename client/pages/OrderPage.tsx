import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaystackPayment } from 'react-paystack';
import { api } from '../services/api';
import LocationPicker from '../components/LocationPicker';
import Spinner from '../components/Spinner';
import type { LaundryItem, CalculatePriceResponseData, LocationPayload, Coordinates } from '../types';
import sbpBadge from '../images/SBP - Badge - White.png';

const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [laundryItems, setLaundryItems] = useState<LaundryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>('clothing');
  
  const [phone, setPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [pricingBreakdown, setPricingBreakdown] = useState<CalculatePriceResponseData | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [currentPaymentReference, setCurrentPaymentReference] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paystackPublicKey, setPaystackPublicKey] = useState('pk_test_d89784309f0d8ce5fefdae351b531cecc1c9fa6d');
  const isSubmittingRef = useRef(false);
  const paymentHandledRef = useRef(false);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const init = async () => {
      try {
        const itemsRes = await api.getLaundryItems();
        setLaundryItems(itemsRes.data || []);
        
        const configRes = await api.getPaystackConfig();
        if (configRes.success && configRes.data?.publicKey) {
          setPaystackPublicKey(configRes.data.publicKey);
        }
      } catch (err) {
        console.error("Init failed", err);
      }
    };
    init();
  }, []);

  // --- 2. CATEGORIZED ITEMS ---
  const categorizedItems = useMemo(() => {
    const categories: Record<string, LaundryItem[]> = {
      clothing: [], bedding: [], household: [], specialty: [], accessories: []
    };
    
    laundryItems.forEach(item => {
      if (categories[item.category]) {
        categories[item.category].push(item);
      }
    });
    
    return categories;
  }, [laundryItems]);

  const tabs = [
    { id: 'clothing', label: 'Clothes', icon: '👕' },
    { id: 'bedding', label: 'Bedding', icon: '🛏️' },
    { id: 'household', label: 'House', icon: '🏠' },
    { id: 'specialty', label: 'Special', icon: '✨' },
    { id: 'accessories', label: 'Other', icon: '🎒' }
  ];

  // --- 3. CALCULATE TOTAL ---
  const itemsForApi = useMemo(() => {
    const items = Object.entries(selectedItems)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([id, qty]) => {
        const item = laundryItems.find(i => i._id === id);
        const result = { 
            name: item?.name || '', 
            price: (item?.pricing?.clientPrice || 0), 
            quantity: qty 
        };
        console.log('🔄 Processing item:', { id, qty, item: item?.name, price: result.price });
        return result;
      });
    
    console.log('📦 Final itemsForApi:', items);
    return items;
  }, [selectedItems, laundryItems]);

  const itemsForPreview = useMemo(() => {
    return Object.entries(selectedItems)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([id, qty]) => ({
        itemId: id,
        quantity: qty as number
      }));
  }, [selectedItems]);

  const calculateTotal = useCallback(async () => {
    console.log('🧮 calculateTotal called');
    console.log('📦 itemsForApi:', itemsForApi);
    console.log('🔢 selectedItems:', selectedItems);
    console.log('👕 laundryItems count:', laundryItems.length);
    
    if (itemsForApi.length === 0) {
      console.log('❌ No items, setting total to 0');
      setTotalAmount(0);
      setPricingBreakdown(null);
      return;
    }

    setIsCalculatingPrice(true);
    try {
      // Try API first with timeout
      console.log('📡 Trying API...');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout after 3 seconds')), 3000)
      );
      
      const res = await Promise.race([
        api.calculatePrice(itemsForPreview),
        timeoutPromise
      ]) as any;
      
      if (res.success) {
        console.log('✅ API success:', res.data.totalAmount);
        setTotalAmount(res.data.totalAmount);
        setPricingBreakdown(res.data);
        setError(null);
      }
    } catch (err: any) {
      console.warn("⚠️ API Price failed, using fallback:", err);
      
      // Fallback Logic - Correct Business Logic
      const subtotal = itemsForApi.reduce((acc, item) => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        console.log(`Item: ${item.name}, Price: ${item.price}, Qty: ${item.quantity}, Total: ${itemTotal}`);
        return acc + itemTotal;
      }, 0);
      
      const minOrderAmount = 5;
      const deliveryFee = 10;
      const platformFeePercentage = 9;
      const platformItemFee = 1;
      const itemCount = itemsForApi.reduce((sum, item) => sum + Number(item.quantity), 0);
      const platformPercentageFee = subtotal * (platformFeePercentage / 100);
      const platformItemCommission = itemCount * platformItemFee;
      const total = subtotal + deliveryFee + platformPercentageFee;
      
      console.log('💰 Correct calculation:', {
        subtotal,
        deliveryFee,
        platformPercentageFee,
        platformItemCommission,
        total,
        note: 'After payment: Platform takes 9% + ₵1/item, Rider gets ₵10, Partner gets remainder'
      });
      
      if (subtotal < minOrderAmount) {
        setError(`Minimum order amount is ₵${minOrderAmount}. Current subtotal: ₵${subtotal}`);
        setTotalAmount(0);
        setPricingBreakdown(null);
      } else {
        setTotalAmount(Number(total.toFixed(2)));
        setPricingBreakdown({
          itemsSubtotal: Number(subtotal.toFixed(2)),
          platformPercentageFee: Number(platformPercentageFee.toFixed(2)),
          platformItemCommission: Number(platformItemCommission.toFixed(2)),
          deliveryFee: Number(deliveryFee.toFixed(2)),
          totalAmount: Number(total.toFixed(2)),
          config: {
            platformFeePercentage,
            deliveryFee,
            platformPerItemFee: platformItemFee,
            minOrderAmount
          }
        });
      }
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [itemsForApi, itemsForPreview]);

  useEffect(() => { calculateTotal(); }, [calculateTotal]);

  // --- 4. PAYSTACK SETUP ---
  const config = useMemo(() => ({
    reference: currentPaymentReference || new Date().getTime().toString(),
    email: `${phone}@purwash.com`,
    amount: Math.round(totalAmount * 100),
    publicKey: paystackPublicKey,
    currency: 'GHS',
    channels: ['mobile_money', 'card'],
    metadata: { custom_fields: [{ display_name: "Phone", variable_name: "phone", value: phone }] }
  }), [phone, totalAmount, paystackPublicKey, currentPaymentReference]);
  
  console.log('🔧 Paystack config:', config);
  
  const initializePayment = usePaystackPayment(config);

  const onSuccess = (reference: any) => {
    console.log('💳 Payment Success Callback Triggered!');
    console.log('📋 Paystack Reference:', reference);
    console.log('🔍 Reference object:', JSON.stringify(reference, null, 2));
    
    if (paymentHandledRef.current) {
      console.log('⚠️ Payment already handled, skipping duplicate callback');
      return;
    }

    if (reference && reference.reference) {
      paymentHandledRef.current = true;
      console.log('✅ Valid reference found, proceeding with order creation...');
      handleCreateOrder(reference.reference);
    } else {
      console.error('❌ Invalid reference object:', reference);
      setError('Payment succeeded but reference is missing. Please contact support.');
    }
  };

  const handlePaymentClose = () => {
    console.log('❌ Payment window closed by user');
    setError('Payment was cancelled. Please try again.');
  };

  const handlePaymentClick = () => {
    console.log('💳 Payment Button Clicked');
    console.log('🔍 Form Validation Check:', {
      phone: phone.length,
      clientName: clientName.length,
      location: location.length,
      itemsCount: itemsForApi.length,
      totalAmount,
      isFormValid,
      isPaystackReady: !!(paystackPublicKey && paystackPublicKey.startsWith('pk_'))
    });
    
    if (!isFormValid) {
      console.error('❌ Form validation failed');
      setError('Please fill in all required fields');
      return;
    }
    
    console.log('✅ Form validation passed, initializing payment...');
    paymentHandledRef.current = false;
    
    // Generate and store the reference for this payment
    const paymentReference = new Date().getTime().toString();
    setCurrentPaymentReference(paymentReference);
    console.log('💾 Stored payment reference for manual verification:', paymentReference);
    
    // Start manual verification as fallback
    setTimeout(() => {
      if (!paymentHandledRef.current) {
        console.log('🔄 Starting manual payment verification fallback...');
        verifyPaymentManually(paymentReference);
      }
    }, 10000); // Start checking after 10 seconds
    
    initializePayment({
      onSuccess,
      onClose: handlePaymentClose,
      config: { reference: paymentReference }
    });
  };

  // Manual payment verification fallback
  const verifyPaymentManually = async (reference: string) => {
    if (paymentHandledRef.current) {
      console.log('✅ Payment already handled, skipping manual verification');
      return;
    }
    if (isVerifyingPayment) {
      console.log('⏳ Verification already in progress, skipping...');
      return;
    }
    
    console.log('🔍 Manually verifying payment:', reference);
    setIsVerifyingPayment(true);
    
    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/orders/verify-payment/${reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📨 Manual verification result:', result);
      
      if (result.success && result.data.status === 'success') {
        console.log('✅ Payment verified manually, proceeding with order creation...');
        // Clear any existing error
        setError(null);
        setIsVerifyingPayment(false);
        // Trigger order creation
        handleCreateOrder(reference);
      } else {
        console.log('⏳ Payment not yet verified, checking again...');
        console.log('🔍 Payment status:', result.data?.status);
        // Only retry if payment is still pending
        if (result.data?.status === 'pending' || result.data?.status === 'processing') {
          setIsVerifyingPayment(false);
          // Try again after 5 seconds
          setTimeout(() => verifyPaymentManually(reference), 5000);
        } else {
          console.error('❌ Payment failed or cancelled');
          setIsVerifyingPayment(false);
          setError('Payment failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Manual verification failed:', error);
      setIsVerifyingPayment(false);
      
      if (error.name === 'AbortError') {
        console.log('⏱️ Verification request timed out');
        setError('Verification timed out. Please try again.');
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    }
  };

  const handleCreateOrder = async (ref?: string) => {
    console.log('🚀 Order Creation Started');
    console.log('📞 Phone:', phone);
    console.log('👤 Client Name:', clientName);
    console.log('📍 Location:', location);
    console.log('📦 Items:', itemsForApi);
    console.log('💰 Total Amount:', totalAmount);
    console.log('🔗 Paystack Reference:', ref);
    
    if (isSubmittingRef.current) {
      console.log('⚠️ Order creation already in progress, skipping');
      return;
    }
    isSubmittingRef.current = true;
    setIsCreatingOrder(true);
    setError(null);
    
    try {
        const payload = {
            items: itemsForApi,
            phone,
            clientName,
            location: { addressName: location, coordinates },
            paystackReference: ref,
            paymentMethod: 'momo'
        };
        
        console.log('📤 Sending order payload:', JSON.stringify(payload, null, 2));
        
        const res = await api.createOrder(payload);
        
        console.log('📨 Order API Response:', JSON.stringify(res, null, 2));
        
        if (res.success) {
            console.log('✅ Order created successfully!');
            console.log('🎫 Tracking Code:', res.data.trackingCode);
            console.log('🆔 Order ID:', res.data.orderId);
            
            // Show success message
            setError(null); // Clear any existing errors
            setSuccessMessage(`Order created successfully! Tracking Code: ${res.data.trackingCode}`);
            
            const trackingCode = res.data.trackingCode;
            const paymentSuccessUrl = `/payment-success?reference=${encodeURIComponent(ref || '')}&order=${encodeURIComponent(trackingCode)}&phone=${encodeURIComponent(phone)}`;
            console.log('🔄 Navigating to payment success:', paymentSuccessUrl);
            navigate(paymentSuccessUrl);
        } else {
            console.error('❌ Order creation failed:', res);
            setError(res.message || 'Order creation failed');
        }
    } catch (err: any) {
        console.error('💥 Order creation error:', err);
        console.error('🔍 Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
        });
        
        const errorMessage = err.response?.data?.message || err.message || 'Order creation failed';
        setError(errorMessage);
    } finally {
        console.log('🏁 Order creation process finished');
        setIsCreatingOrder(false);
        isSubmittingRef.current = false;
    }
  };

  // --- 5. ITEM MANAGEMENT ---
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedItems };
      delete newSelected[itemId];
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
    }
  };

  const totalItems = useMemo(() => 
    Object.values(selectedItems).reduce((acc: number, qty: number) => acc + qty, 0), 
  [selectedItems]);

  const isFormValid = phone.length >= 10 && clientName.length > 0 && location.length > 0 && itemsForApi.length > 0 && totalAmount > 0;

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center">
        <button onClick={() => navigate('/')} className="mr-4 text-gray-600 hover:text-gray-900">← Back</button>
        <h1 className="text-xl font-bold">New Order</h1>
      </div>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-10 pb-28">
        <div className="max-w-3xl xl:max-w-4xl mx-auto w-full space-y-6">
        {/* Error and Success Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start">
              <span className="mr-2">✅</span>
              {successMessage}
            </div>
          )}

        {/* Step 1: Contact */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-900 text-base sm:text-lg">1. Contact Info</h2>
          <div className="space-y-3">
            <input 
                type="tel" 
                placeholder="Phone Number (e.g. 0551234567)" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-3 sm:p-4 border border-gray-200 rounded-xl text-base sm:text-lg"
            />
            <input 
                type="text" 
                placeholder="Your Name" 
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full p-3 sm:p-4 border border-gray-200 rounded-xl text-base sm:text-lg"
            />
          </div>
        </section>

        {/* Step 2: Location */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-900 text-base sm:text-lg">2. Pickup Location</h2>
          <LocationPicker 
            onLocationSelect={(addr, coords) => {
                setLocation(addr);
                setCoordinates(coords);
            }} 
          />
        </section>

        {/* Step 3: Items */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-900 text-base sm:text-lg">3. Select Items</h2>
          
          {/* Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categorizedItems[activeTab]?.map(item => (
              <div key={item._id} className={`border rounded-xl p-3 transition-all flex flex-col justify-between min-h-[7.5rem] ${
                selectedItems[item._id] ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2">{item.name}</h4>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <p className="font-bold text-gray-900 text-sm mt-2">₵{item.pricing?.clientPrice}</p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  {selectedItems[item._id] ? (
                    <div className="flex items-center space-x-1 w-full justify-between">
                      <button 
                        onClick={() => updateQuantity(item._id, (selectedItems[item._id] || 0) - 1)} 
                        className="w-5 h-5 rounded bg-white border text-gray-600 flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs">{selectedItems[item._id]}</span>
                      <button 
                        onClick={() => updateQuantity(item._id, (selectedItems[item._id] || 0) + 1)} 
                        className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateQuantity(item._id, 1)} 
                      className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 rounded"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Summary */}
        {pricingBreakdown && totalAmount > 0 && (
          <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 text-xs sm:text-sm uppercase tracking-wider">Order Summary</h3>
            <div className="space-y-2 text-base sm:text-lg">
              <div className="flex justify-between text-gray-600">
                <span>Items ({totalItems})</span>
                <span>₵{pricingBreakdown.itemsSubtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>₵{pricingBreakdown.deliveryFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Platform Fee</span>
                <span>₵{pricingBreakdown.platformPercentageFee?.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 my-2 pt-2"></div>
              <div className="flex justify-between items-center font-bold text-gray-900 text-xl sm:text-2xl">
                <span>Total</span>
                <span>₵{pricingBreakdown.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </section>
        )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white p-4 border-t sticky bottom-0">
        <div className="max-w-5xl mx-auto w-full space-y-2">
          <div className="flex justify-center">
            <img
              src={sbpBadge}
              alt="Secured by Paystack"
              className="h-7 w-auto opacity-90"
              loading="lazy"
              onLoad={(event) => {
                const img = event.currentTarget;
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: 'debug-session',
                    runId: 'pre-fix',
                    hypothesisId: 'H1',
                    location: 'client/pages/OrderPage.tsx:586',
                    message: 'order_badge_loaded',
                    data: {
                      currentSrc: img.currentSrc,
                      naturalWidth: img.naturalWidth,
                      naturalHeight: img.naturalHeight
                    },
                    timestamp: Date.now()
                  })
                }).catch(() => {});
                // #endregion
              }}
              onError={(event) => {
                const img = event.currentTarget;
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: 'debug-session',
                    runId: 'pre-fix',
                    hypothesisId: 'H2',
                    location: 'client/pages/OrderPage.tsx:603',
                    message: 'order_badge_error',
                    data: {
                      currentSrc: img.currentSrc,
                      hasCurrentSrc: Boolean(img.currentSrc)
                    },
                    timestamp: Date.now()
                  })
                }).catch(() => {});
                // #endregion
              }}
            />
          </div>
          <button
              onClick={handlePaymentClick}
              disabled={!isFormValid || isCreatingOrder || isCalculatingPrice}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all shadow-lg"
          >
              {(isCreatingOrder || isCalculatingPrice) && <Spinner className="w-5 h-5 border-white" />}
              <span>{isCreatingOrder ? 'Processing...' : `Pay ₵${totalAmount.toFixed(2)}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
