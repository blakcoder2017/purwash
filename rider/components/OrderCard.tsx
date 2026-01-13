
import React from 'react';
import { Order } from '../types';
import { PhoneIcon, MapIcon } from './icons/ActionIcons';

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const mapLink = `https://www.google.com/maps/dir/?api=1&destination=${order.client.location.coordinates.lat},${order.client.location.coordinates.lng}`;
  const telLink = `tel:${order.client.phone}`;

  return (
    <div className="bg-white rounded-lg shadow-lg p-5 m-4 text-primary border-l-4 border-primary">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Order #{order.friendlyId}</h2>
        <span className="text-sm font-semibold text-gray-600">{new Date(order.createdAt).toLocaleTimeString()}</span>
      </div>

      <div className="space-y-3 text-lg">
        <div>
          <p className="font-bold">Client Address:</p>
          <p className="text-gray-700">{order.client.location.addressName}</p>
        </div>
        <div>
          <p className="font-bold">Client Contact:</p>
          <p className="text-gray-700">{order.client.phone}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-between space-x-3">
        <a 
          href={telLink} 
          className="flex-1 flex items-center justify-center p-3 bg-green-500 text-white rounded-lg font-bold text-center active:scale-95 transition-transform"
        >
          <PhoneIcon />
          <span className="ml-2">Call Client</span>
        </a>
        <a 
          href={mapLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex-1 flex items-center justify-center p-3 bg-blue-500 text-white rounded-lg font-bold text-center active:scale-95 transition-transform"
        >
          <MapIcon />
          <span className="ml-2">Directions</span>
        </a>
      </div>
    </div>
  );
};

export default OrderCard;
