import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import PartnerRegistrationScreen from './components/PartnerRegistrationScreen';
import OnboardingScreen from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';
import EarningsScreen from './components/EarningsScreen';
import ProfileScreen from './components/ProfileScreen';
import BottomNav from './components/BottomNav';
import { View } from './types';

const AppContent: React.FC = () => {
    const { user, loading } = useAppContext();
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);

    // Check if user is onboarded (has completed payment setup)
    const isOnboarded = user && 
        user.businessName && 
        user.location && 
        user.momo && 
        user.momo.isVerified && 
        user.paystack && 
        user.paystack.subaccountCode;

    const handleOnboardingComplete = useCallback(() => {
        // This will be called when user completes onboarding
        // The user object will be updated via login, so this just triggers a re-render
    }, []);

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

    if (!isOnboarded) {
        return <OnboardingScreen onOnboardingComplete={handleOnboardingComplete} />;
    }

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
