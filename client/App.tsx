import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LandingHero from './components/LandingHero';
import OrderPage from './pages/OrderPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import TrackOrder from './components/TrackOrder';
import PaymentSuccess from './components/PaymentSuccess';

const AppContent = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={
        <LandingHero 
            onBookWash={() => navigate('/order')}
            onTrackOrder={() => navigate('/track')}
            onShowPrivacy={() => navigate('/privacy')}
            onShowTerms={() => navigate('/terms')}
        />
      } />
      <Route path="/order" element={<OrderPage />} />
      <Route path="/track" element={<TrackOrder onBack={() => navigate('/')} />} />
      <Route path="/privacy" element={<PrivacyPolicy onBack={() => navigate('/')} />} />
      <Route path="/terms" element={<TermsOfUse onBack={() => navigate('/')} />} />
      <Route path="/track-order/:phone/:code" element={<TrackOrder onBack={() => navigate('/')} />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
