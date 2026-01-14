
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Order } from '../types';
import { API_BASE_URL } from '../constants';
import { riderApi } from '../services/api';

interface AppContextType {
  user: User | null;
  activeOrder: Order | null;
  loading: boolean;
  error: string | null;
  notification: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  fetchOrder: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  clearNotification: () => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start with loading true to check auth
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Check for existing token and load user on mount
  useEffect(() => {
    const token = localStorage.getItem('PurWashRiderToken');
    if (token) {
      // Try to get profile with token
      riderApi.getProfile()
        .then(response => {
          if (response.success) {
            setUser(response.data.user);
          } else {
            // Token invalid, clear it
            localStorage.removeItem('PurWashRiderToken');
          }
        })
        .catch(() => {
          localStorage.removeItem('PurWashRiderToken');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('PurWashRiderUser', JSON.stringify(user));
      fetchOrder();
    } else {
      localStorage.removeItem('PurWashRiderUser');
      setActiveOrder(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- PRODUCTION WEBSOCKET IMPLEMENTATION ---
  // This hook manages the WebSocket connection throughout the user's session.
  useEffect(() => {
    // 1. Connect if user is logged in and there's no active connection.
    if (user && !socketRef.current) {
      console.log('User logged in. Initializing WebSocket connection...');
      // Establish connection with the backend.
      const socket = io(API_BASE_URL, {
        reconnectionAttempts: 5,
        query: { userId: user.id },
      });
      socketRef.current = socket;

      // 2. Authenticate with WebSocket server
      socket.emit('authenticate', {
        userId: user.id,
        role: user.role || 'rider' // Default to rider for this app
      });

      // 3. Set up event listeners for the socket.
      socket.on('connect', () => {
        console.log(`WebSocket connected successfully with ID: ${socket.id}`);
      });
      
      // This is the primary listener for real-time order assignments.
      socket.on('new_order', (orderData: Order) => {
        console.log('Received "new_order" event from server:', orderData);
        setActiveOrder(orderData);
        setNotification(`New mission assigned! Order #${orderData.friendlyId}`);
      });

      // Listen for order status updates
      socket.on('order_status_update', (data: any) => {
        console.log('Order status updated:', data);
        // Update local order state if needed
        if (activeOrder && activeOrder.id === data.orderId) {
          setActiveOrder(prev => prev ? { ...prev, status: data.status } : null);
        }
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected.');
      });
    }

    // 3. Cleanup on logout or component unmount.
    // The return function from useEffect is used for cleanup.
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up WebSocket connection.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]); // This effect depends only on the user object.

  const login = (userData: User, token: string) => {
    localStorage.setItem('PurWashRiderToken', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('PurWashRiderToken');
    setUser(null);
  };

  const clearNotification = () => setNotification(null);

  const clearError = () => setError(null);

  const fetchOrder = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      // For now, we don't have an endpoint to get active order for a rider
      // In production, this would be: GET /api/users/:userId/active-order
      // We'll rely on WebSocket for order assignments
      setActiveOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };
  
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setLoading(true);
    setError(null);
    try {
      const response = await riderApi.updateOrderStatus(orderId, status);
      if (response.success) {
        if (activeOrder && activeOrder._id === orderId) {
          if (status === 'delivered') {
            setActiveOrder(null);
            setNotification("Mission Complete! Well done.");
          } else {
            setActiveOrder({ ...activeOrder, status });
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{ user, activeOrder, loading, error, notification, login, logout, fetchOrder, updateOrderStatus, clearNotification, clearError }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
