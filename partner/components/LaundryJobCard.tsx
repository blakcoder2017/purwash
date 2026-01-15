import React, { useMemo } from 'react';
import { Order, OrderStatus } from '../types';

interface LaundryJobCardProps {
    order: Order;
    onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
    onSelectOrder: (order: Order) => void;
}

const statusStyles: Record<OrderStatus, { bg: string, text: string, label: string }> = {
    assigned: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Incoming' },
    dropped_at_laundry: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Shop' },
    washing: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Washing' },
    ready_for_pick: { bg: 'bg-green-50', text: 'text-green-700', label: 'Ready' },
};

const LaundryJobCard: React.FC<LaundryJobCardProps> = ({ order, onStatusUpdate, onSelectOrder }) => {
    const totalItems = useMemo(() => order.items.reduce((acc, item) => acc + item.quantity, 0), [order.items]);

    const handleStatusChange = (e: React.MouseEvent, newStatus: OrderStatus) => {
        e.stopPropagation(); // Prevent card click when clicking the button
        onStatusUpdate(order._id, newStatus);
    };

    const style = statusStyles[order.status];

    return (
        <div 
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:border-primary transition-all"
            onClick={() => onSelectOrder(order)}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-primary font-black text-lg">Order #{order.friendlyId}</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase">{totalItems} Items</p>
                </div>
                <span className={`${style.bg} ${style.text} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                    {style.label}
                </span>
            </div>
            
            {/* Action Button */}
            {order.status === 'assigned' && (
                <button 
                    onClick={(e) => handleStatusChange(e, 'dropped_at_laundry')}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-opacity-90 transition-all"
                >
                    Confirm Received
                </button>
            )}

            {order.status === 'dropped_at_laundry' && (
                <button 
                    onClick={(e) => handleStatusChange(e, 'washing')}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-opacity-90 transition-all"
                >
                    Start Washing
                </button>
            )}
            
            {order.status === 'washing' && (
                <button 
                    onClick={(e) => handleStatusChange(e, 'ready_for_pick')}
                    className="w-full bg-accent text-primary py-4 rounded-xl font-bold shadow-lg shadow-yellow-100 hover:bg-opacity-90 transition-all"
                >
                    Mark as Ready
                </button>
            )}
        </div>
    );
};

export default LaundryJobCard;
