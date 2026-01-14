import React, { useState } from 'react';
import { api } from '../services/api';
import type { TrackOrderResponseData } from '../types';
import Spinner from './Spinner';

interface TrackOrderProps {
  onBack: () => void;
}

const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const baseClasses = "text-xs font-bold uppercase px-2 py-1 rounded-full";
  const statusStyles: Record<string, string> = {
    created: "bg-blue-100 text-blue-800",
    assigned: "bg-yellow-100 text-yellow-800", 
    on_my_way_to_pick: "bg-orange-100 text-orange-800",
    picked_up: "bg-indigo-100 text-indigo-800",
    washing: "bg-purple-100 text-purple-800",
    ready_for_pick: "bg-teal-100 text-teal-800",
    out_for_delivery: "bg-cyan-100 text-cyan-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    default: "bg-slate-100 text-slate-800",
  };
  const style = statusStyles[status.toLowerCase()] || statusStyles.default;
  return <span className={`${baseClasses} ${style}`}>{status.replace(/_/g, ' ')}</span>;
};


const TrackOrder: React.FC<TrackOrderProps> = ({ onBack }) => {
  const [phone, setPhone] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [useCodeTracking, setUseCodeTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackOrderResponseData | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useCodeTracking) {
      if (!phone || !orderCode) {
        setError("Please enter both phone number and order code.");
        return;
      }
    } else {
      if (!/^\d{10,}$/.test(phone)) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);
    setData(null);
    setTrackingData(null);
    
    try {
      if (useCodeTracking) {
        // New tracking method with phone + code
        const response = await api.trackOrderByPhoneAndCode(phone, orderCode);
        if (response.success) {
          setTrackingData(response.data);
        } else {
          setError(response.message || "Order not found.");
        }
      } else {
        // Legacy tracking method with phone only
        const response = await api.trackOrder(phone);
        if (response.success) {
          setData(response.data);
          if (response.data.orders.length === 0) {
              setError("No active orders found for this number.");
          }
        } else {
          setError(response.message || "Could not find any orders for this number.");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 text-slate-900 animate-fade-in">
        <header className="mb-8">
            <button onClick={onBack} className="text-slate-900 font-semibold mb-4 hover:underline">
            &larr; Back to Home
            </button>
            <h1 className="text-4xl font-extrabold tracking-tight">Track Your Order</h1>
            <p className="text-slate-500 mt-2">Enter your phone number and order code to track your order.</p>
        </header>

        <main>
            {/* Toggle between tracking methods */}
            <div className="mb-6">
                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={() => setUseCodeTracking(false)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            !useCodeTracking 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Track by Phone
                    </button>
                    <button
                        type="button"
                        onClick={() => setUseCodeTracking(true)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            useCodeTracking 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Track by Phone + Code
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mb-8">
                <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-slate-300 rounded-md shadow-sm p-3 text-lg focus:ring-slate-900 focus:border-slate-900" 
                    placeholder="055 123 4567"
                />
                
                {useCodeTracking && (
                    <input 
                        type="text" 
                        value={orderCode}
                        onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                        className="w-full border-slate-300 rounded-md shadow-sm p-3 text-lg focus:ring-slate-900 focus:border-slate-900 uppercase" 
                        placeholder="Order Code (e.g., WASH-1234)"
                    />
                )}
                
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-slate-900 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-slate-800 transition-colors duration-300 disabled:bg-slate-400 flex items-center justify-center"
                >
                    {isLoading ? <Spinner /> : 'Track Order'}
                </button>
            </form>

            {error && !data?.orders.length && !trackingData && (
                <div className="mt-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm text-center max-w-lg" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {/* New tracking data display */}
            {trackingData && (
                <section className="space-y-6 max-w-2xl">
                    <h2 className="text-2xl font-bold">
                        Order {trackingData.order.friendlyId}
                    </h2>

                    {/* Order Status */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-blue-900">Order Status</h3>
                            <OrderStatusBadge status={trackingData.order.status} />
                        </div>
                        <p className="text-blue-700 text-lg mb-2">{trackingData.statusMessage}</p>
                        {trackingData.eta && (
                            <p className="text-sm text-blue-600">
                                Estimated completion: {new Date(trackingData.eta).toLocaleString()}
                            </p>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <p><span className="font-medium">Name:</span> {trackingData.client.name}</p>
                            <p><span className="font-medium">Phone:</span> {trackingData.client.phone}</p>
                            <p><span className="font-medium">Total Orders:</span> {trackingData.client.totalOrders}</p>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <div>
                                <p className="font-medium mb-2">Items:</p>
                                {trackingData.order.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span>{item.name} × {item.quantity}</span>
                                        <span>₵{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-t pt-3">
                                <div className="flex justify-between font-bold">
                                    <span>Total Amount:</span>
                                    <span>₵{trackingData.order.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                                <p><span className="font-medium">Pickup Address:</span> {trackingData.order.location.addressName}</p>
                                <p><span className="font-medium">Order Date:</span> {new Date(trackingData.order.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Rider Info */}
                    {trackingData.rider ? (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Rider Information</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p><span className="font-medium">Name:</span> {trackingData.rider.name}</p>
                                <p><span className="font-medium">Phone:</span> {trackingData.rider.phone}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <p className="text-yellow-800">📋 Rider will be assigned soon</p>
                        </div>
                    )}
                </section>
            )}

            {/* Legacy tracking data display */}
            {data && !trackingData && (
                <section>
                    <h2 className="text-2xl font-bold mb-4">
                        Hello, {data.client.name}!
                    </h2>

                    {data.orders.length > 0 ? (
                        <div className="space-y-4 max-w-lg">
                            {data.orders.map(order => (
                                <div key={order._id} className="bg-white p-4 rounded-lg shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-900">{order.friendlyId}</p>
                                            <p className="text-sm text-slate-500">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <OrderStatusBadge status={order.status} />
                                    </div>
                                    <div className="border-t my-3"></div>
                                    <div className="text-sm text-slate-600 space-y-1">
                                      {order.items.map((item, index) => (
                                        <p key={index}>- {item.quantity}x {item.name}</p>
                                      ))}
                                    </div>
                                    <div className="border-t my-3"></div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-slate-600">Total</p>
                                        <p className="font-bold text-slate-900 text-lg">₵{order.totalAmount.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </section>
            )}

        </main>
    </div>
  );
};

export default TrackOrder;
