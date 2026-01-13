
import React, { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/api';
import { OrderStatus } from '../types';
import { ORDER_STATUSES, ORDER_STATUS_MAP } from '../constants';
import Timeline from '../components/Timeline';
import { Link, useSearchParams } from 'react-router-dom';

const TrackOrderPage: React.FC = () => {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    const storedId = localStorage.getItem('wewash_id');
    const idToFetch = idFromUrl || storedId;

    if (idToFetch) {
      fetchStatus(idToFetch);
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchStatus = async (id: string) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getOrderStatus(id);
      setOrderStatus(data);
      localStorage.setItem('wewash_id', id);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order status.');
      setOrderStatus(null);
      localStorage.removeItem('wewash_id');
    }
    setIsLoading(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim().length === 6) {
      fetchStatus(inputValue.trim());
    } else {
      setError('Please enter a valid 6-digit Order ID.');
    }
  };
  
  const clearTracking = () => {
    localStorage.removeItem('wewash_id');
    setOrderStatus(null);
    setInputValue('');
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primary mt-4 font-semibold">Checking your order...</p>
      </div>
    );
  }

  if (!orderStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-4 text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Track Your Order</h1>
        <p className="text-slate-600 mb-8">Enter the 6-digit ID to see your laundry's progress.</p>
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g., 123456"
            maxLength={6}
            className="w-full p-4 text-2xl tracking-[0.5em] text-center font-bold border-2 border-slate-300 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <button type="submit" className="w-full bg-primary text-white font-bold py-4 mt-4 rounded-2xl text-lg h-[56px] active:scale-95 transition-transform">
            Find My Laundry
          </button>
        </form>
         <Link to="/" className="text-primary font-semibold mt-8">Go back home</Link>
      </div>
    );
  }

  const itemCount = orderStatus.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
  const currentStatusLabel = ORDER_STATUS_MAP[orderStatus.status] || "Unknown Status";

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen p-4">
      <h1 className="text-3xl font-black text-primary text-center my-4">Order #{orderStatus.friendlyId}</h1>
      <div className="bg-white rounded-2xl p-4 shadow-md mb-6">
        <p className="text-primary font-bold text-lg">{itemCount} {itemCount === 1 ? 'Item' : 'Items'} in your order</p>
         <p className="text-slate-600">Status: <span className="font-semibold">{currentStatusLabel}</span></p>
      </div>
      <Timeline statuses={ORDER_STATUSES} currentStatus={currentStatusLabel} />
      <div className="text-center mt-8">
        <button onClick={clearTracking} className="text-slate-500 text-sm">Not your order? Track a different one.</button>
      </div>
    </div>
  );
};

export default TrackOrderPage;
