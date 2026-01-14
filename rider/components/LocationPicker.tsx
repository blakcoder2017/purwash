import React, { useState, useRef } from 'react';
import './LocationPicker.css';

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(
    initialLocation ? { address: '', lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Search for locations using Mapbox Geocoding API
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const token = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoiem9saWRnaCIsImEiOiJjbWpwNmNxZzgxdHRjM21xeWRyZ2VxY3I1In0.6u_4swBkkfgqbMch7QfNGQ';
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=GH&limit=5&access_token=${token}`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      searchLocations(query);
    }, 300);
  };

  // Handle location selection
  const handleLocationSelect = (suggestion: any) => {
    const [lng, lat] = suggestion.center;
    const address = suggestion.place_name;
    
    const location = { address, lat, lng };
    setSelectedLocation(location);
    setSuggestions([]);
    setSearchQuery(address);
    onLocationSelect(location);
  };

  // Get current location (GPS)
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          try {
            const token = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoiem9saWRnaCIsImEiOiJjbWpwNmNxZzgxdHRjM21xeWRyZ2VxY3I1In0.6u_4swBkkfgqbMch7QfNGQ';
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`
            );
            
            if (response.ok) {
              const data = await response.json();
              const address = data.features[0]?.place_name || 'Current Location';
              
              const location = { address, lat: latitude, lng: longitude };
              setSelectedLocation(location);
              setSearchQuery(address);
              onLocationSelect(location);
            }
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            const location = { address: 'Current Location', lat: latitude, lng: longitude };
            setSelectedLocation(location);
            setSearchQuery(location.address);
            onLocationSelect(location);
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
          alert('Could not get your current location. Please search manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="location-picker">
      <div className="location-search">
        <div className="search-input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for a location in Ghana..."
            className="search-input"
          />
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="gps-button"
            title="Use current location"
          >
            📍
          </button>
        </div>

        {isLoading && (
          <div className="loading-indicator">
            Searching...
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleLocationSelect(suggestion)}
              >
                📍 {suggestion.place_name}
              </div>
            ))}
          </div>
        )}

        {selectedLocation && (
          <div className="selected-location">
            <strong>Selected:</strong> {selectedLocation.address}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;