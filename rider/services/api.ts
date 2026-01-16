import { User, Order, OrderStatus, MomoNetwork } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://purwash.onrender.com/api';

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An API error occurred');
  }
  return data;
}

function getAuthHeaders() {
  const token = localStorage.getItem('PurWashRiderToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const riderApi = {
  // Authentication
  register: async (details: {
    email: string;
    password: string;
    role: 'rider';
    profile: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  }): Promise<{ success: boolean; message: string; data: { user: User; token: string } }> => {
    return fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    }).then(response => handleResponse<{ success: boolean; message: string; data: { user: User; token: string } }>(response));
  },

  login: async (email: string, password: string): Promise<{ success: boolean; message: string; data: { user: User; token: string } }> => {
    return fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(response => handleResponse<{ success: boolean; message: string; data: { user: User; token: string } }>(response));
  },

  // Multi-step Registration for Riders/Partners
  partnerRegistration: {
    stepOne: async (details: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
      role: 'rider' | 'partner';
    }): Promise<{ success: boolean; message: string; step: number; nextStep: number; data: { user: any; tempToken: string } }> => {
      return fetch(`${BASE_URL}/partner-registration/step-1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      }).then(response => handleResponse<any>(response));
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
    }, token: string): Promise<{ success: boolean; message: string; step: number; nextStep: number; data: { user: any; tempToken: string } }> => {
      return fetch(`${BASE_URL}/partner-registration/step-2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(details),
      }).then(response => handleResponse<any>(response));
    },

    stepThree: async (details: {
      momoNumber: string;
      momoNetwork: 'mtn' | 'vod' | 'atl';
      profilePicture?: string;
    }, token: string): Promise<{ success: boolean; message: string; step: number; isComplete: boolean; data: { user: any; token: string; profileCompleteness: any } }> => {
      return fetch(`${BASE_URL}/partner-registration/step-3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(details),
      }).then(response => handleResponse<any>(response));
    },

    getStatus: async (token: string): Promise<{ success: boolean; data: { currentStep: number; isComplete: boolean; completeness: number; missingFields: any[]; user: any } }> => {
      return fetch(`${BASE_URL}/partner-registration/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }).then(response => handleResponse<any>(response));
    }
  },

  getProfile: async (): Promise<{ success: boolean; data: { user: User } }> => {
    return fetch(`${BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    }).then(response => handleResponse<{ success: boolean; data: { user: User } }>(response));
  },

  updateProfile: async (payload: {
    profile?: { firstName?: string; lastName?: string; phone?: string; avatar?: string };
    businessName?: string;
    bio?: string;
    operatingHours?: { open?: string; close?: string };
    location?: { address?: string; lat?: number; lng?: number };
  }): Promise<{ success: boolean; data: { user: User } }> => {
    return fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(response => handleResponse<{ success: boolean; data: { user: User } }>(response));
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    return fetch(`${BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(response => handleResponse<{ success: boolean; message: string }>(response));
  },

  // Setup Mobile Money for payouts
  verifyMomo: async (details: {
    momoNumber: string;
    momoNetwork: MomoNetwork;
    businessName?: string;
  }): Promise<{ success: boolean; data: { resolvedName: string; subaccountCode: string } }> => {
    return fetch(`${BASE_URL}/auth/verify-momo`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    }).then(response => handleResponse<{ success: boolean; data: { resolvedName: string; subaccountCode: string } }>(response));
  },

  // Get pending orders available for assignment
  getPendingOrders: async (): Promise<Order[]> => {
    return fetch(`${BASE_URL}/v1/manage/orders/pending`, {
      headers: getAuthHeaders(),
    }).then(response => handleResponse<Order[]>(response));
  },

  // Update online status
  updateOnlineStatus: async (isOnline: boolean): Promise<{ success: boolean; isOnline: boolean }> => {
    return fetch(`${BASE_URL}/users/online-status`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOnline }),
    }).then(response => handleResponse<{ success: boolean; isOnline: boolean }>(response));
  },

  getWalletData: async (): Promise<{ success: boolean; data: any }> => {
    return fetch(`${BASE_URL}/wallet`, {
      method: 'GET',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    }).then(response => handleResponse<{ success: boolean; data: any }>(response));
  },

  getWalletTransactions: async (): Promise<{ success: boolean; data: any }> => {
    return fetch(`${BASE_URL}/wallet/transactions`, {
      method: 'GET',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    }).then(response => handleResponse<{ success: boolean; data: any }>(response));
  },

  // Get past jobs (completed or cancelled)
  getJobHistory: async (limit = 20): Promise<Order[]> => {
    return fetch(`${BASE_URL}/v1/manage/orders/history?limit=${limit}`, {
      headers: getAuthHeaders(),
    }).then(response => handleResponse<Order[]>(response));
  },

  // Update order status (progress through workflow)
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<{ success: boolean; newStatus: OrderStatus }> => {
    return fetch(`${BASE_URL}/v1/manage/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(response => handleResponse<{ success: boolean; newStatus: OrderStatus }>(response));
  },

  // Get current active order (if any)
  getActiveOrder: async (riderId: string): Promise<Order | null> => {
    // This endpoint doesn't exist yet - would need to be created
    // For now, return null and rely on WebSocket for order assignments
    return Promise.resolve(null);
  }
};
