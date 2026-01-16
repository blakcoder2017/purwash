import axios from 'axios';
import type { OrderItem, CreateOrderPayload, Client, CalculatePriceResponseData, LaundryItem, TrackOrderResponse } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://purwash.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getLaundryItems: async () => {
    const response = await apiClient.get<{ items: LaundryItem[]; pagination: any }>('/catalog/catalog');
    // Transform the response to match expected format
    return {
      success: true,
      data: response.data.items
    };
  },

  getClient: async (phone: string, create?: boolean, name?: string) => {
    // A simple regex to validate phone number format before sending
    if (!/^\d{10}$/.test(phone)) {
        return Promise.reject(new Error("Invalid phone number format."));
    }
    
    const params = new URLSearchParams();
    if (create) params.append('create', 'true');
    if (name) params.append('name', name);
    
    const url = `/clients/${phone}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get<{ success: boolean; data: Client }>(url);
    return response.data;
  },

  getPaystackConfig: async () => {
    const response = await apiClient.get<{ success: boolean; data: { publicKey: string } }>('/config/paystack');
    return response.data;
  },
  
  calculatePrice: async (items: Array<{ itemId: string; quantity: number }>) => {
    const response = await apiClient.post<{ items: any[]; pricing: CalculatePriceResponseData; currency: string }>(
      '/catalog/calculate-preview',
      { items }
    );
    return {
      success: true,
      data: response.data.pricing
    };
  },

  createOrder: async (payload: any) => {
    const response = await apiClient.post('/orders', payload);
    return response.data;
  },

  trackOrder: async (phone: string) => {
    const response = await apiClient.get<TrackOrderResponse>(`/orders/by-phone/${encodeURIComponent(phone)}`, {
      timeout: 10000
    });
    return response.data;
  },

  trackOrderByPhoneAndCode: async (phone: string, code: string) => {
    const response = await apiClient.get(`/orders/track/${encodeURIComponent(phone)}/${encodeURIComponent(code)}`, {
      timeout: 10000
    });
    return response.data;
  }
};