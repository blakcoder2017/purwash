import React, { useState } from 'react';

interface LocationPickerProps {
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  initialAddress?: string;
  initialCoordinates?: { lat: number; lng: number };
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  onLocationSelect, 
  initialAddress = '', 
  initialCoordinates 
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Use Nominatim (OpenStreetMap) for geocoding - free and no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}, Ghana&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        const formattedAddress = result.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddress(formattedAddress);
        onLocationSelect(formattedAddress, { lat, lng });
      } else {
        // Fallback for Ghana locations
        const ghanaLocations = {
          'accra': { lat: 5.6037, lng: -0.1870 },
          'kumasi': { lat: 6.6885, lng: -1.6244 },
          'tamale': { lat: 9.4038, lng: -0.8393 },
          'takoradi': { lat: 4.9279, lng: -1.7616 },
          'cape coast': { lat: 5.1054, lng: -1.2866 }
        };
        
        const searchLower = searchQuery.toLowerCase();
        const location = Object.keys(ghanaLocations).find(key => 
          searchLower.includes(key)
        );
        
        if (location) {
          const coords = ghanaLocations[location];
          const formattedAddress = `${searchQuery}, Ghana`;
          setAddress(formattedAddress);
          onLocationSelect(formattedAddress, coords);
        } else {
          // Default to Accra if not found
          const defaultCoords = { lat: 5.6037, lng: -0.1870 };
          const fallbackAddress = `${searchQuery}, Accra, Ghana`;
          setAddress(fallbackAddress);
          onLocationSelect(fallbackAddress, defaultCoords);
        }
      }
    } catch (error) {
      console.error('Error searching location:', error);
      // Fallback to Accra
      const defaultCoords = { lat: 5.6037, lng: -0.1870 };
      const fallbackAddress = `${searchQuery}, Accra, Ghana`;
      setAddress(fallbackAddress);
      onLocationSelect(fallbackAddress, defaultCoords);
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationAddress = `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
          setAddress(locationAddress);
          onLocationSelect(locationAddress, { lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting current location:', error);
          // Fallback to Accra
          const defaultCoords = { lat: 5.6037, lng: -0.1870 };
          const fallbackAddress = 'Accra, Ghana';
          setAddress(fallbackAddress);
          onLocationSelect(fallbackAddress, defaultCoords);
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for a location (e.g., Accra, Kumasi)..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSearching}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? '...' : 'Search'}
        </button>
        <button
          onClick={getCurrentLocation}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          title="Use current location"
        >
          📍
        </button>
      </div>

      {/* Current Address Display */}
      {address && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Selected Location:</p>
          <p className="font-medium text-gray-900">{address}</p>
        </div>
      )}

      {/* Quick Location Buttons */}
      <div>
        <p className="text-sm text-gray-600 mb-2">Quick locations:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Accra', coords: { lat: 5.6037, lng: -0.1870 } },
            { name: 'Kumasi', coords: { lat: 6.6885, lng: -1.6244 } },
            { name: 'Tamale', coords: { lat: 9.4038, lng: -0.8393 } },
            { name: 'Takoradi', coords: { lat: 4.9279, lng: -1.7616 } }
          ].map((location) => (
            <button
              key={location.name}
              onClick={() => {
                const address = `${location.name}, Ghana`;
                setAddress(address);
                onLocationSelect(address, location.coords);
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
