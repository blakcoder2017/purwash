import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getPendingOrders, updateOrderStatus } from '../services/api';
import { Order, OrderStatus, FilterStatus } from '../types';
import LaundryJobCard from './LaundryJobCard';
import StatusTabSwitcher from './StatusTabSwitcher';
import OrderDetailsModal from './OrderDetailsModal';

const DashboardScreen: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterStatus>('dropped_at_laundry');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedOrders = await getPendingOrders();
            setOrders(fetchedOrders);
        } catch (err) {
            setError('Failed to fetch orders.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    const handleStatusUpdate = useCallback(async (orderId: string, newStatus: OrderStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === orderId ? { ...order, status: newStatus } : order
                )
            );
        } catch (err: any) {
            alert(err.message || 'Failed to update status.');
        }
    }, []);

    const filteredOrders = useMemo(() => {
        if (filter === 'all') return orders;
        return orders.filter(order => order.status === filter);
    }, [orders, filter]);

    const handleSelectOrder = (order: Order) => {
        setSelectedOrder(order);
    };

    const handleCloseModal = () => {
        setSelectedOrder(null);
    };

    return (
        <div className="p-4">
            <header className="mb-4">
                <h1 className="text-3xl font-black text-primary">Production Dashboard</h1>
                <p className="text-slate-500">Manage your active laundry queue.</p>
            </header>
            
            <StatusTabSwitcher activeFilter={filter} onFilterChange={setFilter} />

            {isLoading && <div className="text-center p-8 text-slate-500">Loading orders...</div>}
            {error && <div className="text-center p-8 text-red-500">{error}</div>}
            
            {!isLoading && !error && (
                <div className="mt-4">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-slate-500">No orders in this category.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map(order => (
                                <LaundryJobCard 
                                    key={order._id} 
                                    order={order} 
                                    onStatusUpdate={handleStatusUpdate}
                                    onSelectOrder={handleSelectOrder}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedOrder && (
                <OrderDetailsModal order={selectedOrder} onClose={handleCloseModal} />
            )}
        </div>
    );
};

export default DashboardScreen;
