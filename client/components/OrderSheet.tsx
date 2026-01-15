// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { motion } from 'framer-motion';
// import { usePaystackPayment } from 'react-paystack';
// import { api } from '../services/api';
// import type { OrderItem, Coordinates, LaundryItem, LocationPayload, CalculatePriceResponseData } from '../types';
// import Spinner from './Spinner';
// import LocationPicker from './LocationPicker';

// interface OrderSheetProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onTrackOrder: () => void;
// }

// const OrderSheet: React.FC<OrderSheetProps> = ({ isOpen, onClose, onTrackOrder }) => {
//   const [laundryItems, setLaundryItems] = useState<LaundryItem[]>([]);
//   const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
//   const [activeTab, setActiveTab] = useState<string>('clothing');
  
//   const [phone, setPhone] = useState('');
//   const [clientName, setClientName] = useState('');
//   const [email, setEmail] = useState('');
//   const [location, setLocation] = useState('');
//   const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
//   const [isGpsLocation, setIsGpsLocation] = useState(false);
//   const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo'>('momo');
//   const [pickupTime, setPickupTime] = useState<string>('');
  
//   const [totalAmount, setTotalAmount] = useState(0);
//   const [pricingBreakdown, setPricingBreakdown] = useState<CalculatePriceResponseData | null>(null);
//   const [isItemsLoading, setIsItemsLoading] = useState(true);
//   const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
//   const [isCheckingPhone, setIsCheckingPhone] = useState(false);
//   const [isCreatingOrder, setIsCreatingOrder] = useState(false);
//   const [isSuccess, setIsSuccess] = useState(false);
//   const [orderCode, setOrderCode] = useState<string>('');
//   const [error, setError] = useState<string | null>(null);
//   const [existingClient, setExistingClient] = useState<any>(null);
//   const [paystackPublicKey, setPaystackPublicKey] = useState<string>('');

//   useEffect(() => {
//     const fetchItems = async () => {
//       try {
//         setError(null);
//         setIsItemsLoading(true);
//         const response = await api.getLaundryItems();
//         setLaundryItems(response.data || []);
//       } catch (err) {
//         console.error("Failed to fetch laundry items:", err);
//         setError('Could not load laundry items. Please refresh the page.');
//       } finally {
//         setIsItemsLoading(false);
//       }
//     };
    
//     const fetchPaystackConfig = async () => {
//       try {
//         const config = await api.getPaystackConfig();
//         if (config.success) {
//           setPaystackPublicKey(config.data.publicKey);
//         }
//       } catch (err) {
//         console.error("Failed to fetch Paystack config:", err);
//         // Fallback to a default key (should match backend .env)
//         setPaystackPublicKey('pk_test_d89784309f0d8ce5fefdae351b531cecc1c9fa6d');
//       }
//     };
    
//     if (isOpen) {
//       fetchItems();
//       fetchPaystackConfig();
//       // Set default pickup time to 2 hours from now
//       const defaultTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
//       setPickupTime(defaultTime.toISOString().slice(0, 16));
//     }
//   }, [isOpen]);

//   // Group items by category for tabs
//   const categorizedItems = useMemo(() => {
//     const categories: Record<string, LaundryItem[]> = {
//       clothing: [],
//       bedding: [],
//       household: [],
//       specialty: [],
//       accessories: []
//     };
    
//     laundryItems.forEach(item => {
//       if (categories[item.category]) {
//         categories[item.category].push(item);
//       }
//     });
    
//     return categories;
//   }, [laundryItems]);

//   const tabs = [
//     { id: 'clothing', label: 'Clothing', icon: '👕' },
//     { id: 'bedding', label: 'Bedding', icon: '🛏️' },
//     { id: 'household', label: 'Household', icon: '🏠' },
//     { id: 'specialty', label: 'Specialty', icon: '✨' },
//     { id: 'accessories', label: 'Accessories', icon: '🎒' }
//   ];

//   const itemsForApi = useMemo(() => {
//     return Object.entries(selectedItems)
//       .filter(([_, quantity]) => (quantity as number) > 0)
//       .map(([itemId, quantity]) => {
//         const item = laundryItems.find(i => i._id === itemId);
//         return {
//           name: item?.name || '',
//           price: (item?.pricing?.clientPrice || 0) as number,
//           quantity
//         };
//       });
//   }, [selectedItems, laundryItems]);

//   const calculateTotal = useCallback(async () => {
//     if (itemsForApi.length === 0) {
//       setTotalAmount(0);
//       setPricingBreakdown(null);
//       return;
//     }
//     setError(null);
//     setIsCalculatingPrice(true);
    
//     try {
//       const response = await api.calculatePrice(itemsForApi);
//       setTotalAmount(response.data.totalAmount);
//       setPricingBreakdown(response.data);
//     } catch (error) {
//       console.error('Price calculation failed:', error);
//       setError('Could not calculate price. Please check your connection.');
//       setPricingBreakdown(null);
//     } finally {
//       setIsCalculatingPrice(false);
//     }
//   }, [itemsForApi]);

//   useEffect(() => {
//     calculateTotal();
//   }, [calculateTotal]);

//   const handlePhoneBlur = async () => {
//     if (!phone || phone.length < 10) return;
    
//     setIsCheckingPhone(true);
//     try {
//       // Only check for existing client, don't create
//       const response = await api.getClient(phone);
//       if (response.success) {
//         setExistingClient(response.data);
//         setClientName(response.data.name || '');
//         console.log('Existing client found:', response.data);
//       } else {
//         setExistingClient(null);
//         console.log('New client - will be created during order placement');
//       }
//     } catch (error) {
//       setExistingClient(null);
//       console.log('Client lookup failed, will create during order placement');
//     } finally {
//       setIsCheckingPhone(false);
//     }
//   };

//   const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (error) setError(null);
//     setClientName(e.target.value);
//   };

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (error) setError(null);
//     setEmail(e.target.value);
//   };

//   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (error) setError(null);
//     setPhone(e.target.value);
//   };

//   const handleCloseSuccess = () => {
//       onClose();
//       setIsSuccess(false);
//       setSelectedItems({});
//       setPhone('');
//       setClientName('');
//       setEmail('');
//       setLocation('');
//       setIsGpsLocation(false);
//       setPricingBreakdown(null);
//       setExistingClient(null);
//       setOrderCode('');
//       onTrackOrder();
//   };

//   const handleCreateOrder = async () => {
//     setError(null);
//     setIsCreatingOrder(true);
    
//     try {
//       const locationPayload: LocationPayload = {
//         addressName: location,
//         coordinates: coordinates || { lat: 0, lng: 0 }
//       };

//       const orderPayload = {
//         items: itemsForApi,
//         phone,
//         clientName,
//         email: email || null,
//         location: locationPayload,
//         paymentMethod,
//         pickupTime: pickupTime ? new Date(pickupTime) : undefined
//       };

//       const response = await api.createOrder(orderPayload);
//       if (response.success) {
//         setOrderCode(response.data.trackingCode);
//         setIsSuccess(true);
//         // Auto-redirect after 5 seconds
//         setTimeout(() => {
//            handleCloseSuccess();
//         }, 5000);
//       }
//     } catch (error) {
//       console.error('Order creation failed:', error);
//       setError('Your order could not be placed. Please contact support for assistance.');
//     } finally {
//       setIsCreatingOrder(false);
//     }
//   };

//   // UPDATED PAYSTACK CONFIG
//   const paystackConfig = useMemo(() => {
//     return {
//       reference: new Date().getTime().toString(),
//       email: email || `${phone}@purwash.com`, // Use provided email or fallback
//       amount: Math.round(totalAmount * 100), // Amount in pesewas
//       publicKey: paystackPublicKey,
//       currency: 'GHS', // IMPORTANT: Specify currency for Ghana
//       channels: ['mobile_money', 'card'], // Enable relevant channels
//       metadata: {
//         custom_fields: [
//           {
//             display_name: "Client Name",
//             variable_name: "client_name",
//             value: clientName
//           },
//           {
//              display_name: "Phone Number",
//              variable_name: "phone",
//              value: phone
//           }
//         ]
//       }
//     };
//   }, [phone, totalAmount, paystackPublicKey, clientName, email]);

//   const initializePayment = usePaystackPayment(paystackConfig);

//   const handlePaymentSuccess = async (response: any) => {
//     // 1. Log the full response from Paystack
//     console.log("Paystack Payment Success Response:", response);
    
//     // 2. Validate basic success indicators
//     if (response.status !== 'success' && response.message !== 'Approved') {
//         setError('Payment was not completed successfully. Please try again.');
//         return;
//     }

//     setError(null);
//     setIsCreatingOrder(true);
    
//     try {
//       const locationPayload: LocationPayload = {
//         addressName: location,
//         coordinates: coordinates || { lat: 0, lng: 0 }
//       };

//       const orderPayload = {
//         items: itemsForApi,
//         phone,
//         clientName,
//         location: locationPayload,
//         paystackReference: response.reference
//       };

//       const apiResponse = await api.createOrder(orderPayload);
//       if (apiResponse.success) {
//         setOrderCode(apiResponse.data.trackingCode);
//         setIsSuccess(true);
//         // Auto-redirect after 5 seconds
//         setTimeout(() => {
//            handleCloseSuccess();
//         }, 5000);
//       }
//     } catch (error) {
//       console.error('Order creation failed:', error);
//       setError('Payment successful, but order creation failed. Please contact support with Ref: ' + response.reference);
//     } finally {
//       setIsCreatingOrder(false);
//     }
//   };

//   const handlePaymentClose = () => console.log('Payment window closed.');

//   const updateQuantity = (itemId: string, quantity: number) => {
//     if (quantity <= 0) {
//       const newSelected = { ...selectedItems };
//       delete newSelected[itemId];
//       setSelectedItems(newSelected);
//     } else {
//       setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
//     }
//   };

//   // Ensure paystackPublicKey is present before allowing form submission
//   const isFormValid = phone && clientName && location && itemsForApi.length > 0 && totalAmount > 0 && 
//     (paymentMethod === 'cash' || email); // Email required only for mobile money
//   const isPaystackReady = paymentMethod === 'cash' || (paystackPublicKey !== '' && paystackPublicKey.startsWith('pk_')); // Validate key presence
//   const totalItems = useMemo(() => Object.values(selectedItems).reduce((acc, qty) => acc + qty, 0), [selectedItems]);

//   if (isSuccess) {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end justify-center">
//         <motion.div
//           initial={{ y: "100%" }}
//           animate={{ y: 0 }}
//           exit={{ y: "100%" }}
//           transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//           className="bg-white w-full max-w-lg rounded-t-2xl p-6 min-h-[50vh] flex flex-col items-center justify-center text-center"
//         >
//           <div className="text-green-500 text-6xl mb-4">✓</div>
//           <h3 className="text-xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>
//           <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4 w-full">
//             <p className="text-sm text-gray-600 mb-1">Your order code is:</p>
//             <p className="text-3xl font-bold text-blue-600 tracking-wider">{orderCode}</p>
//           </div>
//           <p className="text-gray-600 mb-6">Redirecting to order tracking...</p>
          
//           <button 
//             onClick={handleCloseSuccess}
//             className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             Track Order Now
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end justify-center">
//       <motion.div
//         initial={{ y: "100%" }}
//         animate={{ y: 0 }}
//         exit={{ y: "100%" }}
//         transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//         className="bg-white w-full max-w-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col"
//       >
//         {/* Header */}
//         <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
//           <h2 className="text-xl font-bold text-gray-900">Place Order</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
//           >
//             ×
//           </button>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-6">
//           {/* Error Display */}
//           {error && (
//             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
//               {error}
//             </div>
//           )}

//           {/* Client Info */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-gray-900">Client Information</h3>
            
//             {existingClient && (
//               <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
//                 <p className="font-medium">Welcome back, {existingClient.name}!</p>
//                 <p className="text-sm">Found your account. Orders: {existingClient.totalOrders || 0}</p>
//                 {existingClient.recentOrders && existingClient.recentOrders.length > 0 && (
//                   <p className="text-sm">Recent orders: {existingClient.recentOrders.map((o: any) => o.friendlyId).join(', ')}</p>
//                 )}
//               </div>
//             )}

//             {!existingClient && phone && phone.length >= 10 && !isCheckingPhone && (
//               <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
//                 <p className="font-medium">New Customer</p>
//                 <p className="text-sm">Account will be created automatically when you place your order</p>
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
//                 <input
//                   type="tel"
//                   value={phone}
//                   onChange={handlePhoneChange}
//                   onBlur={handlePhoneBlur}
//                   placeholder="0551234567"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//                 {isCheckingPhone && <p className="text-sm text-blue-600 mt-1">Checking...</p>}
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//                 <input
//                   type="text"
//                   value={clientName}
//                   onChange={handleNameChange}
//                   placeholder="Your Name"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400">(for payment)</span></label>
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={handleEmailChange}
//                   placeholder="your@email.com"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
//               <LocationPicker
//                 onLocationSelect={(address, coords) => {
//                   setLocation(address);
//                   setCoordinates(coords);
//                   setIsGpsLocation(false);
//                 }}
//                 initialAddress={location}
//                 initialCoordinates={coordinates || undefined}
//               />
//             </div>
//           </div>

//           {/* Item Selection with Tabs */}
//           <div className="space-y-4">
//             <h3 className="font-semibold text-gray-900">Select Items</h3>
            
//             {/* Tabs */}
//             <div className="flex space-x-1 border-b border-gray-200">
//               {tabs.map(tab => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
//                     activeTab === tab.id
//                       ? 'border-blue-500 text-blue-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700'
//                   }`}
//                 >
//                   <span className="mr-1">{tab.icon}</span>
//                   {tab.label}
//                 </button>
//               ))}
//             </div>

//             {/* Items Grid */}
//             {isItemsLoading ? (
//               <div className="flex justify-center py-8">
//                 <Spinner />
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {categorizedItems[activeTab]?.map(item => (
//                   <div key={item._id} className="border border-gray-200 rounded-lg p-4">
//                     <div className="flex justify-between items-start mb-2">
//                       <div>
//                         <h4 className="font-medium text-gray-900">{item.name}</h4>
//                         <p className="text-sm text-gray-500">{item.serviceType?.replace('_', ' ')}</p>
//                       </div>
//                       <div className="text-right">
//                         <p className="font-bold text-gray-900">₵{item.pricing?.clientPrice || 0}</p>
//                         <p className="text-xs text-gray-500">{item.estimatedProcessingHours}h</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <button
//                         onClick={() => updateQuantity(item._id, (selectedItems[item._id] || 0) - 1)}
//                         className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
//                       >
//                         -
//                       </button>
//                       <span className="w-8 text-center">{selectedItems[item._id] || 0}</span>
//                       <button
//                         onClick={() => updateQuantity(item._id, (selectedItems[item._id] || 0) + 1)}
//                         className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
//                       >
//                         +
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Pricing Breakdown */}
//           {pricingBreakdown && (
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center text-gray-600">
//                   <span>{totalItems} Item{totalItems !== 1 ? 's' : ''}</span>
//                   <span>₵{pricingBreakdown.baseCost?.toFixed(2) || '0.00'}</span>
//                 </div>
//                 <div className="flex justify-between items-center text-gray-600">
//                   <span>Delivery Fee</span>
//                   <span>₵{pricingBreakdown.deliveryFee?.toFixed(2) || '0.00'}</span>
//                 </div>
//                 <div className="flex justify-between items-center text-gray-600">
//                   <span>Platform Fee ({pricingBreakdown.config?.platformFeePercentage || 0}%)</span>
//                   <span>₵{pricingBreakdown.platformPercentageFee?.toFixed(2) || '0.00'}</span>
//                 </div>
//                 <div className="border-t border-gray-300 my-2"></div>
//                 <div className="flex justify-between items-center font-bold text-gray-900 text-lg">
//                   <span>Total</span>
//                   <span>₵{pricingBreakdown.totalAmount?.toFixed(2) || '0.00'}</span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <p className="text-sm text-gray-600">Total Amount</p>
//               <p className="text-2xl font-bold text-gray-900">₵{totalAmount.toFixed(2)}</p>
//             </div>
//             <button
//               onClick={() => {
//                 if (paymentMethod === 'momo') {
//                   initializePayment(handlePaymentSuccess, handlePaymentClose);
//                 } else {
//                   handleCreateOrder();
//                 }
//               }}
//               disabled={!isFormValid || isCreatingOrder || isCalculatingPrice || !isPaystackReady}
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
//             >
//               {(isCreatingOrder || isCalculatingPrice) && <Spinner />}
//               <span>{isCreatingOrder ? 'Processing...' : paymentMethod === 'momo' ? 'Pay Now' : 'Place Order'}</span>
//             </button>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default OrderSheet;
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
  
  // Default payment method
  const [paymentMethod] = useState<'momo'>('momo');
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
  const [paystackPublicKey, setPaystackPublicKey] = useState<string>('pk_test_d89784309f0d8ce5fefdae351b531cecc1c9fa6d');

  // --- INITIAL DATA FETCHING ---
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setError(null);
        setIsItemsLoading(true);
        const response = await api.getLaundryItems();
        setLaundryItems(response.data || []);
      } catch (err) {
        console.error("Failed to fetch laundry items:", err);
        setError('Could not load laundry items. Please refresh.');
      } finally {
        setIsItemsLoading(false);
      }
    };
    
    const fetchPaystackConfig = async () => {
      try {
        const config = await api.getPaystackConfig();
        if (config.success && config.data.publicKey) {
          setPaystackPublicKey(config.data.publicKey);
        }
      } catch (err) {
        console.warn("Paystack config fetch failed, using default key");
      }
    };
    
    if (isOpen) {
      fetchItems();
      fetchPaystackConfig();
      const defaultTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      setPickupTime(defaultTime.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  // --- MEMOIZED HELPERS ---
  const categorizedItems = useMemo(() => {
    const categories: Record<string, LaundryItem[]> = {
      clothing: [], bedding: [], household: [], specialty: [], accessories: []
    };
    laundryItems.forEach(item => {
      if (categories[item.category]) categories[item.category].push(item);
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

  // --- ROBUST PRICE CALCULATION ---
  const calculateTotal = useCallback(async () => {
    if (itemsForApi.length === 0) {
      setTotalAmount(0);
      setPricingBreakdown(null);
      return;
    }

    setIsCalculatingPrice(true);
    
    try {
      // 1. Try Backend Calculation
      const response = await api.calculatePrice(itemsForApi);
      
      if (response.success && response.data) {
          setTotalAmount(response.data.totalAmount);
          setPricingBreakdown(response.data);
          setError(null);
      } else {
          throw new Error('Invalid API response');
      }
    } catch (error: any) {
      console.warn('⚠️ Backend calculation failed, using Client-Side Fallback:', error);
      
      // 2. CLIENT-SIDE FALLBACK (Keeps app working if backend fails)
      const subtotal = itemsForApi.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = 10; // Default
      // Approx logic: 9% fee + 1 GHS per item
      const itemCount = itemsForApi.reduce((sum, item) => sum + item.quantity, 0);
      const platformFee = (subtotal * 0.09) + (itemCount * 1);
      
      const fallbackTotal = subtotal + deliveryFee + platformFee;
      
      console.log('💰 Client-side fallback calculation:', {
        subtotal,
        deliveryFee,
        itemCount,
        platformFee,
        fallbackTotal
      });
      
      setTotalAmount(fallbackTotal);
      setPricingBreakdown({
          baseCost: subtotal,
          deliveryFee: deliveryFee,
          platformPercentageFee: platformFee, // Lump sum for display
          platformItemCommission: 0,
          totalAmount: fallbackTotal,
          config: { platformFeePercentage: 9, deliveryFee: 10, platformPerItemFee: 1, minOrderAmount: 5 }
      });

      // Only show error if it's a specific validation message (like Min Order)
      const msg = error.response?.data?.message;
      if (msg && msg.includes('Minimum')) {
          setError(msg);
          setTotalAmount(0); // If min order fail, force 0 to disable button
      }
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [itemsForApi]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  // --- HANDLERS ---
  const handlePhoneBlur = async () => {
    if (!phone || phone.length < 10) return;
    setIsCheckingPhone(true);
    try {
      const response = await api.getClient(phone);
      if (response.success) {
        setExistingClient(response.data);
        setClientName(response.data.name || '');
      } else {
        setExistingClient(null);
      }
    } catch (error) {
      setExistingClient(null);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setClientName(e.target.value);
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value);

  const handleCreateOrder = async (paystackRef?: string) => {
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
        pickupTime: pickupTime ? new Date(pickupTime) : undefined,
        paystackReference: paystackRef
      };

      const response = await api.createOrder(orderPayload);
      if (response.success) {
        setOrderCode(response.data.trackingCode);
        setIsSuccess(true);
        setTimeout(() => handleCloseSuccess(), 5000);
      }
    } catch (error: any) {
      console.error('Order creation failed:', error);
      const msg = error.response?.data?.message || 'Order creation failed.';
      if (paystackRef) {
        setError(`PAYMENT SUCCESSFUL, but order system error: ${msg}. Please contact support with Ref: ${paystackRef}`);
      } else {
        setError(msg);
      }
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // --- PAYSTACK CONFIG ---
  const paystackConfig = useMemo(() => {
    return {
      reference: new Date().getTime().toString(),
      email: `${phone}@purwash.com`,
      amount: Math.round(totalAmount * 100),
      publicKey: paystackPublicKey,
      currency: 'GHS',
      channels: ['mobile_money', 'card'],
      metadata: {
        custom_fields: [
          { display_name: "Client Name", variable_name: "client_name", value: clientName },
          { display_name: "Phone Number", variable_name: "phone", value: phone }
        ]
      }
    };
  }, [phone, totalAmount, paystackPublicKey, clientName]);

  const initializePayment = usePaystackPayment(paystackConfig) as (onSuccess?: any, onClose?: any) => void;

  const handlePaymentSuccess = (response: any) => {
    handleCreateOrder(response.reference);
  };
  
  const handlePaymentClose = () => console.log('Payment window closed');

  const handleCloseSuccess = () => {
      onClose();
      onTrackOrder();
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedItems({});
        setPhone('');
        setClientName('');
        setLocation('');
        setIsGpsLocation(false);
        setPricingBreakdown(null);
        setExistingClient(null);
        setOrderCode('');
      }, 500);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedItems };
      delete newSelected[itemId];
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
    }
  };

  // --- VALIDATION & COMPUTED VALUES ---
  const isFormValid = phone.length >= 10 && clientName.length > 0 && location.length > 0 && itemsForApi.length > 0 && totalAmount > 0;
  const isPaystackReady = !!(paystackPublicKey && paystackPublicKey.startsWith('pk_'));
  
  const totalItems = useMemo(() => 
    Object.values(selectedItems).reduce((acc: number, qty: number) => acc + qty, 0), 
  [selectedItems]);

  // Debug logging to help identify validation issues
  console.log('🔍 Form Validation Debug:', {
    phone: phone.length,
    clientName: clientName.length,
    location: location.length,
    itemsForApi: itemsForApi.length,
    totalAmount,
    isFormValid,
    isPaystackReady,
    paystackPublicKey: paystackPublicKey ? `${paystackPublicKey.substring(0, 8)}...` : 'missing'
  });

  const totalServiceFee = useMemo(() => {
    if (!pricingBreakdown) return 0;
    return (pricingBreakdown.platformPercentageFee || 0) + (pricingBreakdown.platformItemCommission || 0);
  }, [pricingBreakdown]);

  // --- RENDER SUCCESS ---
  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-sm rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h3>
          <p className="text-gray-500 mb-6">Your laundry pickup has been scheduled.</p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 w-full">
            <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Order Code</p>
            <p className="text-3xl font-mono font-bold text-blue-700 tracking-wider">{orderCode}</p>
          </div>
          <button onClick={handleCloseSuccess} className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 transition-all transform hover:scale-[1.02] shadow-lg">Track Order Now</button>
        </motion.div>
      </div>
    );
  }

  // --- RENDER FORM ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end justify-center sm:items-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[95vh] overflow-hidden flex flex-col shadow-xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Place Order</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><span className="text-gray-500 text-xl leading-none">×</span></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          )}

          {/* Contact & Location */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                 <h3 className="font-semibold text-gray-900 text-sm">1. Contact Details</h3>
                 <input type="tel" value={phone} onChange={handlePhoneChange} onBlur={handlePhoneBlur} placeholder="Phone (e.g. 0551234567)" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                 {isCheckingPhone && <p className="text-xs text-blue-600">Checking...</p>}
                 <input type="text" value={clientName} onChange={handleNameChange} placeholder="Your Name" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-3">
                 <h3 className="font-semibold text-gray-900 text-sm">2. Pickup Location</h3>
                 <LocationPicker onLocationSelect={(addr, coords) => { setLocation(addr); setCoordinates(coords); setIsGpsLocation(false); }} initialAddress={location} initialCoordinates={coordinates || undefined} />
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Items Selection */}
          <section className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">3. Select Items</h3>
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {isItemsLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {categorizedItems[activeTab]?.map(item => (
                  <div key={item._id} className={`border rounded-lg p-2 transition-all flex flex-col justify-between h-24 ${selectedItems[item._id] ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div>
                      <h4 className="font-medium text-gray-900 text-xs leading-tight line-clamp-2">{item.name}</h4>
                      <p className="font-bold text-gray-900 text-xs mt-1">₵{item.pricing?.clientPrice}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                        {selectedItems[item._id] ? (
                          <div className="flex items-center space-x-1 w-full justify-between">
                             <button onClick={() => updateQuantity(item._id, (selectedItems[item._id] || 0) - 1)} className="w-5 h-5 rounded bg-white border text-gray-600 flex items-center justify-center text-xs">-</button>
                             <span className="font-bold text-xs">{selectedItems[item._id]}</span>
                             <button onClick={() => updateQuantity(item._id, (selectedItems[item._id] || 0) + 1)} className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-xs">+</button>
                          </div>
                        ) : (
                          <button onClick={() => updateQuantity(item._id, 1)} className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 rounded">Add</button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pricing Breakdown */}
          {pricingBreakdown && totalAmount > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
              <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({totalItems})</span>
                  <span>₵{pricingBreakdown.baseCost?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>₵{pricingBreakdown.deliveryFee?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                   <span>Service Fee</span>
                   <span>₵{totalServiceFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 my-2 pt-2"></div>
                <div className="flex justify-between items-center font-bold text-slate-900 text-lg">
                  <span>Total</span>
                  <span>₵{pricingBreakdown.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => {
               initializePayment(handlePaymentSuccess, handlePaymentClose);
            }}
            disabled={!isFormValid || isCreatingOrder || isCalculatingPrice || !isPaystackReady}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-[0.98]"
          >
            {(isCreatingOrder || isCalculatingPrice) && <Spinner className="w-5 h-5 border-white" />}
            <span>
              {isCreatingOrder ? 'Processing...' : `Pay ₵${totalAmount.toFixed(2)} Now`}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSheet;