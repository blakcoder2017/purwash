import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AppContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('PurWashPartnerToken');
    const storedUser = localStorage.getItem('PurWashPartnerUser');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('PurWashPartnerToken');
        localStorage.removeItem('PurWashPartnerUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('PurWashPartnerToken', authToken);
    localStorage.setItem('PurWashPartnerUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('PurWashPartnerToken');
    localStorage.removeItem('PurWashPartnerUser');
  };

  return (
    <AppContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AppContext.Provider>
  );
};
