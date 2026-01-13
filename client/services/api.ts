
// FIX: Imported `Coordinates` to resolve the 'Cannot find name' error.
import { Order, OrderItem, OrderStatus, LaundryItem, PricingPreview, Coordinates } from '../types';

const BASE_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('wewash_token');
};

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    // If we get a 401, clear the token and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('wewash_token');
      window.location.hash = '/auth';
    }
    throw new Error(data.message || 'An API error occurred');
  }
  return data;
}

// API wrapper that adds authentication headers
const apiRequest = async (url: string, options?: RequestInit) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  return response;
};

export const api = {
  getCatalog: (): Promise<{ items: LaundryItem[] }> => {
    // FIX: Explicitly typed the generic handleResponse function to ensure the correct return type for the promise chain.
    return apiRequest('/catalog/catalog').then(response => handleResponse<{ items: LaundryItem[] }>(response));
  },

  calculatePreview: (items: OrderItem[]): Promise<PricingPreview> => {
    // FIX: Explicitly typed the generic handleResponse function to ensure the correct return type for the promise chain.
    return apiRequest('/catalog/calculate-preview', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }).then(response => handleResponse<PricingPreview>(response));
  },

  createOrder: (order: {
      client: { phone: string; location: { addressName: string, coordinates: Coordinates | null } },
      items: { name: string; price: number; quantity: number }[]
  }): Promise<{ _id: string, friendlyId: string }> => {
      // FIX: Explicitly typed the generic handleResponse function to ensure the correct return type for the promise chain.
      return apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify(order),
      }).then(response => handleResponse<{ _id: string, friendlyId: string }>(response));
  },
  
  initializePayment: (orderId: string, email: string): Promise<{ authorization_url: string }> => {
      // FIX: Explicitly typed the generic handleResponse function to ensure the correct return type for the promise chain.
      return apiRequest('/v1/payments/initialize', {
          method: 'POST',
          body: JSON.stringify({ orderId, email }),
      }).then(response => handleResponse<{ authorization_url: string }>(response));
  },

  getOrderStatus: (friendlyId: string): Promise<OrderStatus> => {
    // FIX: Explicitly typed the generic handleResponse function to ensure the correct return type for the promise chain.
    return apiRequest(`/orders/${friendlyId}`).then(response => handleResponse<OrderStatus>(response));
  },
};
