
import React from 'react';
import { useAppContext } from '../context/AppContext';
import OrderCard from '../components/OrderCard';
import StatusButton from '../components/StatusButton';

const MissionScreen: React.FC = () => {
  const { activeOrder, loading } = useAppContext();

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
      {loading && !activeOrder ? <LoadingState/> : 
        activeOrder ? (
          <div>
            <OrderCard order={activeOrder} />
            <StatusButton order={activeOrder} />
          </div>
        ) : (
          <EmptyState />
        )}
    </div>
  );
};

export default MissionScreen;
