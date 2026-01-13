
import React, { useRef, useEffect, useState } from 'react';
import { useOrder } from '../../hooks/useOrder';
import Header from '../../components/Header';
import LocationInput from '../../components/LocationInput';
import PricingFooter from '../../components/PricingFooter';
import Loading from '../../components/Loading';
import ErrorDisplay from '../../components/ErrorDisplay';
import { api } from '../../services/api';
// mapboxgl is loaded from CDN
declare var mapboxgl: any;

interface LocationStepProps {
  onNext: () => void;
  onBack: () => void;
}

// Set your Mapbox access token here. For security, this should ideally be in an environment variable.
mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2aWRyb2NrIiwiYSI6ImNsbHpyaWp3bjBkdXczZHFxazl3dmtlYjYifQ.23vSDEbKk4eyyCq1o3k8aA';

const LocationStep: React.FC<LocationStepProps> = ({ onNext, onBack }) => {
  const { order, updateLocation, pricingPreview, isCalculatingPrice } = useOrder();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [lng, setLng] = useState(order.coordinates?.lng || -0.2059); // Default to Tamale
  const [lat, setLat] = useState(order.coordinates?.lat || 9.4008);
  const [landmark, setLandmark] = useState(order.landmark || '');
  const [phone, setPhone] = useState(order.phone || '');
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current || !showMap) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15,
    });
    
    map.current.on('move', () => {
      const { lng, lat } = map.current.getCenter();
      setLng(lng);
      setLat(lat);
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);

  const handleLocationChange = (addressName: string, coordinates: any) => {
    setLandmark(addressName);
    if (coordinates) {
      setLat(coordinates.lat);
      setLng(coordinates.lng);
      // Update map center if map is shown
      if (map.current && coordinates) {
        map.current.setCenter([coordinates.lng, coordinates.lat]);
      }
    }
  };

  const handleNext = async () => {
    if (!landmark || !phone) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate phone number
    const phoneRegex = /^(\+233|0)[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid Ghanaian phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create order with location and phone
      const orderData = {
        client: {
          phone,
          location: {
            addressName: landmark,
            coordinates: { lat, lng }
          }
        },
        items: order.items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      const response = await api.createOrder(orderData);
      
      // Store order ID for payment step
      updateLocation({ lat, lng }, landmark);
      
      // Move to next step
      onNext();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header title="Set Pickup Location" onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto">
        {showMap ? (
          <div className="relative flex-grow">
            <div ref={mapContainer} className="absolute top-0 bottom-0 w-full" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary drop-shadow-lg -translate-y-5">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 005.169-4.4c1.58-2.153.99-4.965-.24-6.621a5.25 5.25 0 00-7.394 0c-1.23 1.656-1.82 4.468-.24 6.621a16.975 16.975 0 005.169 4.4zM12 1.5a5.25 5.25 0 00-5.25 5.25c0 3.663 2.986 8.5 5.25 11.664C14.264 15.25 17.25 10.413 17.25 6.75A5.25 5.25 0 0012 1.5zM12 9a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                </svg>
            </div>
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 bg-white rounded-lg p-2 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="p-4">
            <LocationInput
              onLocationChange={handleLocationChange}
              phone={phone}
              onPhoneChange={setPhone}
              initialAddress={landmark}
              initialPhone={phone}
              isLoading={isLoading}
            />
            
            {/* Show Map Button */}
            <button
              onClick={() => setShowMap(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-sm font-medium">Show Map</span>
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4">
          <ErrorDisplay 
            message={error} 
            onRetry={() => setError(null)}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Pricing Footer */}
      <PricingFooter
        total={pricingPreview?.pricing.totalAmount || 0}
        onNext={handleNext}
        disabled={!landmark || !phone || isLoading || isCalculatingPrice}
        buttonText={isLoading ? "Creating Order..." : "Continue to Payment"}
      />
    </div>
  );
};

export default LocationStep;
