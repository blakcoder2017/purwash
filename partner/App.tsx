import React, { useState, useCallback } from 'react';
import OnboardingScreen from './components/OnboardingScreen';
import DashboardScreen from './components/DashboardScreen';
import EarningsScreen from './components/EarningsScreen';
import BottomNav from './components/BottomNav';
import { View } from './types';

const App: React.FC = () => {
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);

    const handleOnboardingComplete = useCallback(() => {
        setIsOnboarded(true);
    }, []);

    if (!isOnboarded) {
        return <OnboardingScreen onOnboardingComplete={handleOnboardingComplete} />;
    }

    return (
        <div className="min-h-screen bg-secondary-bg text-slate-800 flex flex-col">
            <main className="flex-grow pb-20">
                {currentView === View.Dashboard && <DashboardScreen />}
                {currentView === View.Earnings && <EarningsScreen />}
            </main>
            <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
        </div>
    );
};

export default App;
