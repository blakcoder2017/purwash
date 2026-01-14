import axios from 'axios';
import type { OrderItem, CreateOrderPayload, Client, CalculatePriceResponseData, LaundryItem, TrackOrderResponse } from '../types';

const apiClient = axios.create({
  baseURL: '/api', // Use proxy to backend
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

  getClient: async (phone: string) => {
    // A simple regex to validate phone number format before sending
    if (!/^\d{10}$/.test(phone)) {
        return Promise.reject(new Error("Invalid phone number format."));
    }
    const response = await apiClient.get<{ success: boolean; data: Client }>(`/clients/${phone}`);
    return response.data;
  },
  
  calculatePrice: async (items: OrderItem[]) => {
    const response = await apiClient.post<{ success: boolean; data: CalculatePriceResponseData }>('/orders/calculate', { items });
    return response.data;
  },

  createOrder: async (payload: CreateOrderPayload) => {
    const response = await apiClient.post('/orders', payload);
    return response.data;
  },

  trackOrder: async (phone: string) => {
    const response = await apiClient.get<TrackOrderResponse>(`/orders/track/${phone}`);
    return response.data;
  }
};