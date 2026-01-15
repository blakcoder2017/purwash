
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import OrderCard from '../components/OrderCard';
import StatusButton from '../components/StatusButton';
import { riderApi } from '../services/api';
import { Order } from '../types';

const MissionScreen: React.FC = () => {
  const { orders, activeOrder, loading } = useAppContext();
  const [history, setHistory] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const data = await riderApi.getJobHistory(20);
        setHistory(data);
      } catch (error: any) {
        setHistoryError(error.message || 'Failed to load history.');
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="relative">
        <div className="w-24 h-24 bg-primary/20 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary rounded-full"></div>
      </div>
      <h2 className="mt-8 text-2xl font-bold text-primary">Waiting for orders...</h2>
      <p className="text-gray-600 mt-2">You're all set. We'll notify you when a new mission comes in.</p>
    </div>
  );
  
  const LoadingState = () => (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
    </div>
  );

  return (
    <div className="h-full">
      {loading && orders.length === 0 ? <LoadingState/> : 
        orders.length > 0 ? (
          <div className="space-y-4 pb-6">
            {orders.map(order => (
              <div key={order._id}>
                <OrderCard order={order} />
                <StatusButton order={order} inline />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

      <div className="mt-6 px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-primary">Past Jobs</h3>
        </div>
        {historyLoading ? (
          <div className="text-center text-gray-500 py-4">Loading history...</div>
        ) : historyError ? (
          <div className="text-center text-red-500 py-4">{historyError}</div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No past jobs yet.</div>
        ) : (
          <div className="space-y-3">
            {history.map(item => (
              <div key={item._id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-primary">Order #{item.friendlyId}</p>
                    <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase text-gray-600">{item.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  <span className="font-semibold">Total:</span> ₵{item.pricing?.totalAmount?.toFixed(2) || '0.00'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionScreen;
