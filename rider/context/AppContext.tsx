
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Order } from '../types';
import { API_BASE_URL } from '../constants';
import { riderApi } from '../services/api';

interface AppContextType {
  user: User | null;
  orders: Order[];
  activeOrder: Order | null;
  loading: boolean;
  error: string | null;
  notification: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  fetchOrder: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  clearNotification: () => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start with loading true to check auth
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'rider/context/AppContext.tsx:34',
      message: 'app_context_render',
      data: {
        userId: user?._id || null,
        hasSocket: Boolean(socketRef.current),
        loading
      },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion

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
    const userId = user?._id;
    const prevUserId = lastUserIdRef.current;
    lastUserIdRef.current = userId || null;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H2',
        location: 'rider/context/AppContext.tsx:74',
        message: 'socket_effect_run',
        data: {
          userId,
          prevUserId,
          hasSocket: Boolean(socketRef.current)
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    if (userId && !socketRef.current) {
      console.log('User logged in. Initializing WebSocket connection...');
      const socket = io(API_BASE_URL, {
        reconnectionAttempts: 5,
        query: { userId }
      });
      socketRef.current = socket;

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H3',
          location: 'rider/context/AppContext.tsx:92',
          message: 'socket_created',
          data: {
            userId,
            apiBase: API_BASE_URL
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion

      socket.emit('authenticate', {
        userId,
        role: user?.role || 'rider'
      });

      socket.on('connect', () => {
        console.log(`WebSocket connected successfully with ID: ${socket.id}`);
      });
      
      socket.on('new_order', (orderData: Order) => {
        console.log('Received "new_order" event from server:', orderData);
        setOrders(prev => [orderData, ...prev.filter(order => order._id !== orderData._id)]);
        setActiveOrder(orderData);
        setNotification(`New mission assigned! Order #${orderData.friendlyId}`);
      });

      socket.on('order_status_update', (data: any) => {
        console.log('Order status updated:', data);
        setOrders(prev => prev.map(order => order._id === data.orderId ? { ...order, status: data.status } : order));
        if (activeOrder && activeOrder._id === data.orderId) {
          setActiveOrder(prev => prev ? { ...prev, status: data.status } : null);
        }
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected.');
      });
    }

    if (!userId && socketRef.current) {
      console.log('Cleaning up WebSocket connection.');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H4',
          location: 'rider/context/AppContext.tsx:118',
          message: 'socket_cleanup_no_user',
          data: {
            userId,
            hasSocket: Boolean(socketRef.current)
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [user?._id]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'pre-fix',
            hypothesisId: 'H5',
            location: 'rider/context/AppContext.tsx:131',
            message: 'socket_cleanup_unmount',
            data: {
              userId: user?._id || null
            },
            timestamp: Date.now()
          })
        }).catch(() => {});
        // #endregion
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('PurWashRiderToken', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('PurWashRiderToken');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('PurWashRiderUser', JSON.stringify(userData));
  };

  const clearNotification = () => setNotification(null);

  const clearError = () => setError(null);

  const fetchOrder = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const orders = await riderApi.getPendingOrders();
      const assignedOrders = Array.isArray(orders) ? orders : [];
      setOrders(assignedOrders);
      setActiveOrder(assignedOrders.length > 0 ? assignedOrders[0] : null);
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
        setOrders(prev => {
          if (status === 'delivered') {
            return prev.filter(order => order._id !== orderId);
          }
          return prev.map(order => order._id === orderId ? { ...order, status } : order);
        });
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
    <AppContext.Provider value={{ user, orders, activeOrder, loading, error, notification, login, logout, updateUser, fetchOrder, updateOrderStatus, clearNotification, clearError }}>
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
