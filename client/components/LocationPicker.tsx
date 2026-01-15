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
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGpsError(null); // Clear previous errors
    
    try {
      // Use Nominatim (OpenStreetMap) for geocoding
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
        const ghanaLocations: Record<string, { lat: number; lng: number }> = {
          'accra': { lat: 5.6037, lng: -0.1870 },
          'kumasi': { lat: 6.6885, lng: -1.6244 },
          'tamale': { lat: 9.4038, lng: -0.8393 },
          'takoradi': { lat: 4.9279, lng: -1.7616 },
          'cape coast': { lat: 5.1054, lng: -1.2866 }
        };
        
        const searchLower = searchQuery.toLowerCase();
        const locationKey = Object.keys(ghanaLocations).find(key => 
          searchLower.includes(key)
        );
        
        if (locationKey) {
          const coords = ghanaLocations[locationKey];
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
      // Fallback to Accra on network error
      const defaultCoords = { lat: 5.6037, lng: -0.1870 };
      const fallbackAddress = `${searchQuery}, Accra, Ghana`;
      setAddress(fallbackAddress);
      onLocationSelect(fallbackAddress, defaultCoords);
    } finally {
      setIsSearching(false);
    }
  };

  // FIXED: Robust Geolocation Handler
  const handleGetLocation = () => {
    setIsLoadingLocation(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoadingLocation(false);
        const { latitude, longitude } = position.coords;
        // Success!
        const locationAddress = `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
        setAddress(locationAddress);
        onLocationSelect(locationAddress, { lat: latitude, lng: longitude });
      },
      (error) => {
        setIsLoadingLocation(false);
        console.error('Error getting location:', error);
        
        let errorMessage = 'Could not get your location.';
        // Handle specific error codes
        switch(error.code) {
            case 1: errorMessage = 'Location permission denied. Please allow access.'; break;
            case 2: errorMessage = 'Location unavailable. Please type address manually.'; break; // This was your specific error
            case 3: errorMessage = 'Location timed out. Please type address manually.'; break;
        }
        setGpsError(errorMessage);
        
        // Optional: Fallback to Accra if strictly necessary, but better to let user know it failed
        // const defaultCoords = { lat: 5.6037, lng: -0.1870 };
        // setAddress('Accra, Ghana (Default)');
        // onLocationSelect('Accra, Ghana', defaultCoords);
      },
      // UPDATED OPTIONS: Crucial for fixing "Position Unavailable" errors
      { 
        enableHighAccuracy: false, // Use WiFi/Cell instead of GPS (Faster, works indoors)
        timeout: 15000,            // Wait up to 15s
        maximumAge: 60000          // Reuse position from last 1 min
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search location (e.g., Tamale)..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSearching || isLoadingLocation}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || isLoadingLocation || !searchQuery.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {isSearching ? '...' : 'Search'}
        </button>
        <button
          onClick={handleGetLocation}
          disabled={isLoadingLocation}
          className={`px-3 py-2 text-white rounded-lg hover:bg-slate-700 transition-colors ${isLoadingLocation ? 'bg-slate-400' : 'bg-slate-600'}`}
          title="Use current location"
        >
          {isLoadingLocation ? <span className="animate-spin inline-block">↻</span> : '📍'}
        </button>
      </div>

      {/* Error Message */}
      {gpsError && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
          ⚠️ {gpsError}
        </div>
      )}

      {/* Current Address Display */}
      {address && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Selected:</p>
          <p className="font-medium text-gray-900 text-sm truncate">{address}</p>
        </div>
      )}

    </div>
  );
};

export default LocationPicker;