import { Order, OrderStatus } from '../types';

const BASE_URL = 'http://localhost:5000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An API error occurred');
  }
  return data;
}

function getAuthHeaders() {
  const token = localStorage.getItem('PurWashPartnerToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Fetch pending orders assigned to this laundry
export const getPendingOrders = async (): Promise<Order[]> => {
  return fetch(`${BASE_URL}/v1/manage/orders/pending`, {
    headers: getAuthHeaders()
  }).then(response => handleResponse<Order[]>(response));
};

// Update order status (progress through laundry workflow)
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<{ success: boolean; newStatus: OrderStatus }> => {
  return fetch(`${BASE_URL}/v1/manage/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(response => handleResponse<{ success: boolean; newStatus: OrderStatus }>(response));
};

// Setup Mobile Money for payouts
export const verifyMomo = async (details: {
  momoNumber: string;
  momoNetwork: string;
  businessName: string;
}): Promise<{ success: boolean; user: any }> => {
  return fetch(`${BASE_URL}/users/verify-momo`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  }).then(response => handleResponse<{ success: boolean; user: any }>(response));
};

// Authentication
export const login = async (email: string, password: string): Promise<{ success: boolean; message: string; data: { user: any; token: string } }> => {
  return fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(response => handleResponse<{ success: boolean; message: string; data: { user: any; token: string } }>(response));
};

// Multi-step Registration for Partners
export const partnerApi = {
  stepOne: async (details: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'partner';
  }): Promise<{ success: boolean; message: string; data: { user: any; tempToken: string } }> => {
    return fetch(`${BASE_URL}/partner-registration/step-1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    }).then(response => handleResponse<{ success: boolean; message: string; data: { user: any; tempToken: string } }>(response));
  },

  stepTwo: async (details: {
    businessName: string;
    address: string;
    lat?: number;
    lng?: number;
    bio?: string;
    operatingHours?: {
      open: string;
      close: string;
    };
  }, tempToken: string): Promise<{ success: boolean; message: string; data: { user: any; tempToken: string } }> => {
    return fetch(`${BASE_URL}/partner-registration/step-2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tempToken}` },
      body: JSON.stringify(details),
    }).then(response => handleResponse<{ success: boolean; message: string; data: { user: any; tempToken: string } }>(response));
  },

  stepThree: async (details: {
    momoNumber: string;
    momoNetwork: 'mtn' | 'vod' | 'atl';
    profilePicture?: string;
  }, tempToken: string): Promise<{ success: boolean; message: string; data: { user: any; token: string } }> => {
    const response = await fetch(`${BASE_URL}/partner-registration/step-3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tempToken}` },
      body: JSON.stringify(details),
    });
    
    return handleResponse<{ success: boolean; message: string; data: { user: any; token: string } }>(response);
  }
};
