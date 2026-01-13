
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import LoginScreen from './screens/LoginScreen';
import MissionScreen from './screens/MissionScreen';
import WalletScreen from './screens/WalletScreen';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav from './components/BottomNav';
import Notification from './components/Notification';
import ErrorDisplay from './components/ErrorDisplay';

const App: React.FC = () => {
  const { user, loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex flex-col justify-center items-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Notification />
        <ErrorDisplay />
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen font-sans">
      <Notification />
      <ErrorDisplay />
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route path="/mission" element={<MissionScreen />} />
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/mission" />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
};

export default App;
