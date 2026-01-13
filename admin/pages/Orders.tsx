import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import adminApi from '../api/client';
import type { Order } from '../types';
import AssignmentModal from '../components/orders/AssignmentModal';
import Modal from '../components/ui/Modal';

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    
    // State for Assignment Modal
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<Order | null>(null);

    // State for Force Confirm Modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [orderToConfirm, setOrderToConfirm] = useState<Order | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const fetchOrders = async () => {
        setIsLoading(true);
        setError('');
        try {
            const url = query
                ? `/admin/search/orders?q=${encodeURIComponent(query)}`
                : '/admin/search/orders?status=pending';
            const response = await adminApi.get<Order[]>(url);
            setOrders(response.data);
        } catch (err) {
            setError('Failed to fetch orders. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [searchParams]);

    const handleOpenAssignModal = (order: Order) => {
        setSelectedOrderForAssign(order);
        setIsAssignModalOpen(true);
    };

    const handleCloseAssignModal = () => {
        setIsAssignModalOpen(false);
        setSelectedOrderForAssign(null);
    };
    
    const handleAssignSuccess = () => {
        alert(`Order ${selectedOrderForAssign?.friendlyId} assigned successfully!`);
        fetchOrders(); // Refresh the list
    };

    const handleOpenConfirmModal = (order: Order) => {
        setOrderToConfirm(order);
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => {
        setOrderToConfirm(null);
        setIsConfirmModalOpen(false);
    };

    const handleForceConfirm = async () => {
        if (!orderToConfirm) return;
        setIsConfirming(true);
        try {
            await adminApi.patch(`/admin/force-confirm/${orderToConfirm._id}`);
            alert(`Forced confirmation for order ${orderToConfirm.friendlyId} was successful.`);
            handleCloseConfirmModal();
            fetchOrders(); // Refresh list
        } catch (err) {
            alert('Failed to force confirm order.');
            console.error(err);
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <>
            <PageHeader
                title={query ? `Search Results for "${query}"` : "Order Queue"}
                subtitle={query ? "Displaying orders matching your search term." : "View, manage, and assign incoming laundry orders."}
            />
            <Card className='!p-0'>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-w-text-body">
                        <thead className="text-xs text-w-text-main uppercase bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Order ID</th>
                                <th scope="col" className="px-6 py-3">Customer</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Items</th>
                                <th scope="col" className="px-6 py-3">Value</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center p-6">Loading orders...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={7} className="text-center p-6 text-red-500">{error}</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={7} className="text-center p-6">No orders found.</td></tr>
                            ) : (
                                orders.map((order, index) => (
                                    <tr key={order._id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="px-6 py-4 font-medium text-w-text-main whitespace-nowrap">{order.friendlyId}</td>
                                        <td className="px-6 py-4">{order.customer.name}</td>
                                        <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{order.itemCount}</td>
                                        <td className="px-6 py-4">${order.totalValue.toFixed(2)}</td>
                                        <td className="px-6 py-4"><Badge status={order.status} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                {order.status === 'created' && (
                                                    <Button onClick={() => handleOpenAssignModal(order)}>Assign</Button>
                                                )}
                                                {(order.status === 'assigned' || order.status === 'in_progress') && (
                                                     <Button variant="secondary" onClick={() => handleOpenConfirmModal(order)}>Force Confirm</Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            <AssignmentModal 
                isOpen={isAssignModalOpen}
                onClose={handleCloseAssignModal}
                order={selectedOrderForAssign}
                onAssignSuccess={handleAssignSuccess}
            />
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                title="Force Confirm Delivery"
            >
                <div className="space-y-4">
                    <p>
                        This will immediately mark order <span className="font-bold">{orderToConfirm?.friendlyId}</span> as delivered, overriding the standard 2-hour customer confirmation window. This action is logged and cannot be undone.
                    </p>
                    <p className="font-medium">Are you sure you want to proceed?</p>
                    <div className="pt-4 flex justify-end space-x-2">
                        <Button variant="secondary" onClick={handleCloseConfirmModal} disabled={isConfirming}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleForceConfirm} disabled={isConfirming}>
                            {isConfirming ? 'Confirming...' : 'Yes, Force Confirm'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Orders;