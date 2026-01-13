import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import CreateOrderPage from './pages/CreateOrderPage';
import TrackOrderPage from './pages/TrackOrderPage';
import AuthPage from './components/AuthPage';
import { OrderProvider } from './context/OrderContext';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

// Public route component (redirects to home if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateOrderPage /></ProtectedRoute>} />
      <Route path="/track" element={<ProtectedRoute><TrackOrderPage /></ProtectedRoute>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

// FIX: Refactored App to be a const of type React.FC. This can help with type inference.
const App: React.FC = () => {
  return (
    <AuthProvider>
      <OrderProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </OrderProvider>
    </AuthProvider>
  );
}

export default App;
