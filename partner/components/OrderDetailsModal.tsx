import React from 'react';
import { Order, Item } from '../types';
import MapDisplay from './MapDisplay';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M5.47 5.47a.75.75
 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

const InventoryTable: React.FC<{ items: Item[] }> = ({ items }) => (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="font-bold text-primary mb-2">Inventory List</h3>
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-slate-700">{item.name} {item.serviceType && <span className="text-xs text-slate-400">({item.serviceType})</span>}</span>
                    <span className="font-bold text-primary bg-slate-200 px-2 py-0.5 rounded">{item.quantity}</span>
                </div>
            ))}
        </div>
    </div>
);

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-lg rounded-t-2xl shadow-lg p-6 space-y-4 animate-slide-up"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-primary">Order #{order.friendlyId}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-primary">
                       <CloseIcon />
                    </button>
                </div>
                
                <InventoryTable items={order.items} />

                {order.notes && (
                    <div>
                        <h3 className="font-bold text-primary mb-1">Notes from Client</h3>
                        <p className="text-slate-600 bg-yellow-50 border-l-4 border-accent p-3 rounded-r-lg text-sm">{order.notes}</p>
                    </div>
                )}

                 <div>
                    <h3 className="font-bold text-primary mb-1">Rider Information</h3>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-4">
                        {order.riderLocation && (
                            <MapDisplay latitude={order.riderLocation.lat} longitude={order.riderLocation.lng} />
                        )}
                        {order.riderPhoneNumber ? (
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800">Assigned Rider</p>
                                    <p className="text-sm text-slate-500">{order.riderPhoneNumber.replace("+233", "0")}</p>
                                </div>
                                <button
                                    onClick={() => { window.location.href = `tel:${order.riderPhoneNumber}`; }}
                                    className="bg-primary text-white font-bold py-2 px-4 rounded-lg text-sm"
                                >
                                   Call Rider
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-sm text-slate-500">Rider has not been assigned yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
                    @keyframes slide-up {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                    .animate-slide-up { animation: slide-up 0.3s ease-out; }
                `}</style>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
