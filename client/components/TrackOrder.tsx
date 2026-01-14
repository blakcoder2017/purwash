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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackOrderResponseData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10,}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await api.trackOrder(phone);
      if (response.success) {
        setData(response.data);
        if (response.data.orders.length === 0) {
            setError("No active orders found for this number.");
        }
      } else {
        setError(response.message || "Could not find any orders for this number.");
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
            <p className="text-slate-500 mt-2">Enter your phone number to see your active orders.</p>
        </header>

        <main>
            <form onSubmit={handleSubmit} className="flex items-center space-x-2 max-w-lg mb-8">
                <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-grow border-slate-300 rounded-md shadow-sm p-3 text-lg focus:ring-slate-900 focus:border-slate-900" 
                    placeholder="055 123 4567"
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-slate-900 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-slate-800 transition-colors duration-300 disabled:bg-slate-400 flex items-center justify-center h-[54px] w-[120px]"
                >
                    {isLoading ? <Spinner /> : 'Track'}
                </button>
            </form>

            {error && !data?.orders.length && (
                <div className="mt-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm text-center max-w-lg" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {data && (
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
