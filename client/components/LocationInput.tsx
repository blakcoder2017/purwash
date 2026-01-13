import React, { useState } from 'react';
import { Coordinates } from '../types';

interface LocationInputProps {
  onLocationChange: (addressName: string, coordinates: Coordinates | null) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  initialAddress?: string;
  initialPhone?: string;
  isLoading?: boolean;
}

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2a9.75 9.75 0 006.75-2.25V21A.75.75 0 0021 20.25h-2c-5.385 0-9.75-4.365-9.75-9.75V6.75z" />
  </svg>
);

const LocationInput: React.FC<LocationInputProps> = ({
  onLocationChange,
  phone,
  onPhoneChange,
  initialAddress = '',
  initialPhone = '',
  isLoading = false
}) => {
  const [addressName, setAddressName] = useState(initialAddress);
  const [locationError, setLocationError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const validatePhone = (phoneNum: string) => {
    const phoneRegex = /^(\+233|0)[0-9]{9}$/;
    return phoneRegex.test(phoneNum);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    onPhoneChange(newPhone);
    
    if (newPhone && !validatePhone(newPhone)) {
      setPhoneError('Please enter a valid Ghanaian phone number');
    } else {
      setPhoneError('');
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = { lat: latitude, lng: longitude };
        
        // Get address from coordinates (reverse geocoding)
        // For now, we'll use a placeholder
        const address = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        
        setAddressName(address);
        onLocationChange(address, coordinates);
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError('Unable to get your location. Please enter address manually.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAddress = e.target.value;
    setAddressName(newAddress);
    
    // For now, we'll set coordinates to null when manually entering address
    // In a real app, you'd use geocoding API to convert address to coordinates
    onLocationChange(newAddress, null);
  };

  return (
    <div className="space-y-6">
      {/* Location Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delivery Location
        </label>
        
        <div className="space-y-3">
          {/* Get Current Location Button */}
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation || isLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LocationIcon />
            <span className="text-sm font-medium">
              {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
            </span>
          </button>

          {/* Manual Address Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 pt-2">
              <LocationIcon />
            </div>
            <textarea
              value={addressName}
              onChange={handleAddressChange}
              placeholder="Enter delivery address (e.g., Near Tamale Teaching Hospital, opposite the main gate)"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {locationError && (
            <p className="text-sm text-red-600">{locationError}</p>
          )}
        </div>
      </div>

      {/* Phone Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 pt-2">
            <PhoneIcon />
          </div>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="+233241234567 or 0241234567"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {phoneError && (
          <p className="mt-1 text-sm text-red-600">{phoneError}</p>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          We'll use this to contact you about your order
        </p>
      </div>

      {/* Delivery Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Delivery Information</p>
            <ul className="space-y-1">
              <li>• Delivery fee: ₵10 (flat rate)</li>
              <li>• Estimated delivery: 24-48 hours</li>
              <li>• We'll call you when on the way</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationInput;
