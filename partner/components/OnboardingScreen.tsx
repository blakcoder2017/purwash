import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const OnboardingScreen: React.FC = () => {
    const { user } = useAppContext();

    useEffect(() => {
        // Check if user has completed basic setup
        if (user && 
            user.businessName && 
            user.location && 
            user.location.address && 
            user.momo && 
            user.momo.number && 
            user.momo.network) {
            
            // User is already set up, the parent component will handle the transition
            return;
        }

        // If user doesn't have basic info, redirect to registration
        window.location.href = '/register';
    }, [user]);

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center">
            <div className="text-white text-xl">Setting up your dashboard...</div>
        </div>
    );
};

export default OnboardingScreen;
