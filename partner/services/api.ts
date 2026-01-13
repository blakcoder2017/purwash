import { Order, OrderStatus } from '../types';

const BASE_URL = 'http://localhost:5000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An API error occurred');
  }
  return data;
}

// Fetch pending orders assigned to this laundry
export const getPendingOrders = async (): Promise<Order[]> => {
  return fetch(`${BASE_URL}/v1/manage/orders/pending`)
    .then(response => handleResponse<Order[]>(response));
};

// Update order status (progress through laundry workflow)
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<{ success: boolean; newStatus: OrderStatus }> => {
  return fetch(`${BASE_URL}/v1/manage/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(response => handleResponse<{ success: boolean; newStatus: OrderStatus }>(response));
};

// Setup Mobile Money for payouts
export const verifyMomo = async (details: {
  userId: string;
  momoNumber: string;
  momoNetwork: string;
  businessName: string;
}): Promise<{ success: boolean; user: any }> => {
  return fetch(`${BASE_URL}/users/verify-momo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  }).then(response => handleResponse<{ success: boolean; user: any }>(response));
};
