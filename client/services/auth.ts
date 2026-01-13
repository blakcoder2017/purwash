import { LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

const BASE_URL = 'http://localhost:5000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An API error occurred');
  }
  return data;
}

// Store token in localStorage
const setToken = (token: string) => {
  localStorage.setItem('wewash_token', token);
};

const getToken = (): string | null => {
  return localStorage.getItem('wewash_token');
};

const removeToken = () => {
  localStorage.removeItem('wewash_token');
};

// API calls with automatic token inclusion
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

export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthResponse>(response);
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiRequest('/auth/profile');
    return handleResponse<{ success: boolean; data: { user: any } }>(response);
  },

  // Update profile
  updateProfile: async (profile: any) => {
    const response = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ profile }),
    });
    return handleResponse<{ success: boolean; data: { user: any } }>(response);
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Refresh token
  refreshToken: async () => {
    const response = await apiRequest('/auth/refresh-token', {
      method: 'POST',
    });
    return handleResponse<{ success: boolean; data: { token: string } }>(response);
  },

  // Token utilities
  setToken,
  getToken,
  removeToken,
};
