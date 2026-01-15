import { Order, OrderStatus } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

// Fetch past jobs for this laundry
export const getJobHistory = async (limit = 20): Promise<Order[]> => {
  return fetch(`${BASE_URL}/v1/manage/orders/history?limit=${limit}`, {
    headers: getAuthHeaders()
  }).then(response => handleResponse<Order[]>(response));
};

export const getWalletData = async (): Promise<{ success: boolean; data: any }> => {
  return fetch(`${BASE_URL}/wallet`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
  }).then(response => handleResponse<{ success: boolean; data: any }>(response));
};

export const getWalletTransactions = async (): Promise<{ success: boolean; data: any }> => {
  return fetch(`${BASE_URL}/wallet/transactions`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
  }).then(response => handleResponse<{ success: boolean; data: any }>(response));
};

// Update order status (progress through laundry workflow)
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<{ success: boolean; newStatus: OrderStatus }> => {
  return fetch(`${BASE_URL}/v1/manage/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(response => handleResponse<{ success: boolean; newStatus: OrderStatus }>(response));
};

// Update online status
export const updateOnlineStatus = async (isOnline: boolean): Promise<{ success: boolean; isOnline: boolean }> => {
  return fetch(`${BASE_URL}/users/online-status`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ isOnline }),
  }).then(response => handleResponse<{ success: boolean; isOnline: boolean }>(response));
};

// Setup Mobile Money for payouts
export const verifyMomo = async (details: {
  momoNumber: string;
  momoNetwork: string;
  businessName?: string;
}): Promise<{ success: boolean; data: { resolvedName: string; subaccountCode: string } }> => {
  return fetch(`${BASE_URL}/auth/verify-momo`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  }).then(response => handleResponse<{ success: boolean; data: { resolvedName: string; subaccountCode: string } }>(response));
};

export const updateProfile = async (payload: {
  profile?: { firstName?: string; lastName?: string; phone?: string; avatar?: string };
  businessName?: string;
  bio?: string;
  operatingHours?: { open?: string; close?: string };
  location?: { address?: string; lat?: number; lng?: number };
}): Promise<{ success: boolean; data: { user: any } }> => {
  return fetch(`${BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(response => handleResponse<{ success: boolean; data: { user: any } }>(response));
};

export const changePassword = async (payload: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
  return fetch(`${BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(response => handleResponse<{ success: boolean; message: string }>(response));
};

export const getProfile = async (): Promise<{ success: boolean; data: { user: any } }> => {
  return fetch(`${BASE_URL}/auth/profile`, {
    method: 'GET',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
  }).then(response => handleResponse<{ success: boolean; data: { user: any } }>(response));
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
