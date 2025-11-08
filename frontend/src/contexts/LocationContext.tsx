import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocationData } from '../types/restaurant';

interface LocationContextType {
  location: LocationData | null;
  setLocation: (location: LocationData | null) => void;
  isLocationLoading: boolean;
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
  currentLocation: LocationData | null; // Alias for backward compatibility
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocationState] = useState<LocationData | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  useEffect(() => {
    // Check for existing location on app load
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const locationData = JSON.parse(storedLocation);
        setLocationState(locationData);
      } catch (error) {
        console.error('Error parsing stored location:', error);
        localStorage.removeItem('userLocation');
      }
    }
  }, []);

  const setLocation = (newLocation: LocationData | null) => {
    setLocationState(newLocation);
    if (newLocation) {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
    } else {
      localStorage.removeItem('userLocation');
    }
  };

  const requestLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser.');
    }

    setIsLocationLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout for better accuracy
            maximumAge: 60000 // 1 minute cache
          }
        );
      });

      // Verify location accuracy
      const accuracy = position.coords.accuracy;
      if (accuracy > 1000) { // If accuracy is worse than 1km
        console.warn(`Location accuracy is low: ${accuracy}m`);
      }

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        // GPS location should NOT have city/state or manual selection flag
        isManualSelection: false
      };

      // Validate coordinates are reasonable (basic sanity check)
      if (locationData.latitude && locationData.longitude && 
          (Math.abs(locationData.latitude) > 90 || Math.abs(locationData.longitude) > 180)) {
        throw new Error('Invalid coordinates received from GPS');
      }

      setLocation(locationData);
    } catch (error: any) {
      let errorMessage = 'Failed to get location. ';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += 'Location access was denied. Please enable location access in your browser settings and try again.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage += 'Location information is unavailable. Please check your GPS settings.';
          break;
        case error.TIMEOUT:
          errorMessage += 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage += error.message || 'An unknown error occurred.';
          break;
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
  };

  const value: LocationContextType = {
    location,
    setLocation,
    isLocationLoading,
    requestLocation,
    clearLocation,
    currentLocation: location, // Alias for backward compatibility
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};