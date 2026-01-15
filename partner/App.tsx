import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import PartnerRegistrationScreen from './components/PartnerRegistrationScreen';
import DashboardScreen from './components/DashboardScreen';
import EarningsScreen from './components/EarningsScreen';
import ProfileScreen from './components/ProfileScreen';
import BottomNav from './components/BottomNav';
import { View } from './types';

const AppContent: React.FC = () => {
    const { user, loading } = useAppContext();
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<PartnerRegistrationScreen />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

    // User is logged in - go directly to dashboard
    return (
        <div className="min-h-screen bg-secondary-bg text-slate-800 flex flex-col">
            <main className="flex-grow pb-20">
                {currentView === View.Dashboard && <DashboardScreen />}
                {currentView === View.Earnings && <EarningsScreen />}
                {currentView === View.Profile && <ProfileScreen />}
            </main>
            <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;
