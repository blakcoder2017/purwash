import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingHero from './components/LandingHero';
import OrderSheet from './components/OrderSheet';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import TrackOrder from './components/TrackOrder';

type View = 'landing' | 'privacy' | 'terms' | 'track';

const App: React.FC = () => {
  const [isOrderSheetOpen, setOrderSheetOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('landing');

  const openOrderSheet = () => setOrderSheetOpen(true);
  const closeOrderSheet = () => setOrderSheetOpen(false);

  const handleTrackOrder = () => {
    closeOrderSheet();
    setCurrentView('track');
  };

  const renderView = () => {
    switch (currentView) {
      case 'privacy':
        return <PrivacyPolicy onBack={() => setCurrentView('landing')} />;
      case 'terms':
        return <TermsOfUse onBack={() => setCurrentView('landing')} />;
      case 'track':
        return <TrackOrder onBack={() => setCurrentView('landing')} />;
      case 'landing':
      default:
        return (
          <LandingHero
            onBookWash={openOrderSheet}
            onTrackOrder={handleTrackOrder}
            onShowPrivacy={() => setCurrentView('privacy')}
            onShowTerms={() => setCurrentView('terms')}
          />
        );
    }
  };

  return (
    <div className="relative min-h-screen w-full font-sans antialiased">
      {renderView()}
      <AnimatePresence>
        {isOrderSheetOpen && <OrderSheet isOpen={isOrderSheetOpen} onClose={closeOrderSheet} onTrackOrder={handleTrackOrder} />}
      </AnimatePresence>
    </div>
  );
};

export default App;
