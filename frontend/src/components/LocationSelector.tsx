import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LocationData } from '../types/restaurant';
import { useLocation } from '../contexts/LocationContext';
import { apiService } from '../services/api';

const Container = styled.div`
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h3`
  color: #333;
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LocationIcon = styled.span`
  font-size: 24px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>` 
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 5px;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
        `;
      case 'success':
        return `
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
          }
        `;
      default:
        return `
          background: #f8f9fa;
          color: #495057;
          border: 1px solid #dee2e6;
          &:hover {
            background: #e9ecef;
            transform: translateY(-1px);
          }
        `;
    }
  }}
`;

const ManualLocationSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #f1f3f4;
`;

const SectionTitle = styled.h4`
  color: #333;
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
`;

const StatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const CitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 15px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background: #fafbfc;
`;

const StateCard = styled.div<{ $selected?: boolean }>`
  padding: 15px;
  border: 2px solid ${props => props.$selected ? '#667eea' : '#e1e8ed'};
  border-radius: 12px;
  background: ${props => props.$selected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
  color: ${props => props.$selected ? 'white' : '#333'};
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-color: #667eea;
  }
`;

const CityCard = styled.div<{ $selected?: boolean }>`
  padding: 12px;
  border: 2px solid ${props => props.$selected ? '#27ae60' : '#dee2e6'};
  border-radius: 8px;
  background: ${props => props.$selected ? '#27ae60' : 'white'};
  color: ${props => props.$selected ? 'white' : '#495057'};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    border-color: #27ae60;
    background: ${props => props.$selected ? '#229954' : '#f8f9fa'};
  }
`;

const CurrentLocationDisplay = styled.div`
  background: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
  border-left: 4px solid #27ae60;
`;

const LocationText = styled.p`
  margin: 0;
  color: #333;
  font-weight: 500;
`;

const CoordinatesText = styled.p`
  margin: 5px 0 0 0;
  color: #666;
  font-size: 12px;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-top: 15px;
  font-size: 14px;
  padding: 10px;
  background: #fdf2f2;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  margin-top: 15px;
  font-size: 14px;
  padding: 10px;
  background: #f0f9f4;
  border-radius: 8px;
  border-left: 4px solid #27ae60;
`;

// Coordinates for major Indian states and cities - Updated for better Guntur support
const LOCATION_COORDINATES: Record<string, Record<string, { lat: number; lng: number }>> = {
  'Andhra Pradesh': {
    'Guntur': { lat: 16.3067, lng: 80.4365 }, // Prioritize Guntur
    'Vijayawada': { lat: 16.5062, lng: 80.6480 },
    'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'Tirupati': { lat: 13.6288, lng: 79.4192 },
    'Kurnool': { lat: 15.8281, lng: 78.0373 },
    'Nellore': { lat: 14.4426, lng: 79.9865 },
    'Kakinada': { lat: 16.9891, lng: 82.2475 },
    'Rajahmundry': { lat: 17.0005, lng: 81.8040 },
    'Default': { lat: 16.3067, lng: 80.4365 } // Default to Guntur now
  },
  'Telangana': {
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Warangal': { lat: 17.9689, lng: 79.5941 },
    'Default': { lat: 17.3850, lng: 78.4867 }
  }
};

interface LocationSelectorProps {
  onLocationChange?: (location: LocationData | null) => void;
  autoRedirect?: boolean; // New prop to control auto-redirection
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationChange, autoRedirect = false }) => {
  const { location, setLocation, isLocationLoading, requestLocation, clearLocation } = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (onLocationChange) {
      onLocationChange(location);
    }
    // Only redirect if autoRedirect is explicitly enabled
    if (location && autoRedirect === true) {
      console.log('Location updated, auto-redirecting enabled. Location:', location);
      setTimeout(() => {
        console.log('Auto-redirecting to restaurants from LocationSelector...');
        navigate('/restaurants');
      }, 1000);
    }
  }, [location, onLocationChange, autoRedirect, navigate]);

  // Fetch available states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const availableStates = await apiService.getStates();
        setStates(availableStates);
      } catch (err) {
        console.error('Error fetching states:', err);
        setError('Failed to load available states');
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, []);

  // Fetch cities when state is selected
  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedState) {
        setCities([]);
        return;
      }

      try {
        setLoadingCities(true);
        const availableCities = await apiService.getCitiesByState(selectedState);
        setCities(availableCities);
      } catch (err) {
        console.error('Error fetching cities:', err);
        setError('Failed to load cities for selected state');
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, [selectedState]);

  const handleGetCurrentLocation = async () => {
    try {
      setError('');
      setSuccess('');
      await requestLocation();
      
      // Add debug info about the obtained location
      const currentLoc = location || JSON.parse(localStorage.getItem('userLocation') || '{}');
      console.log('🎯 GPS location obtained:', currentLoc);
      
      if (currentLoc.latitude && currentLoc.longitude) {
        console.log(`📍 Coordinates: ${currentLoc.latitude}, ${currentLoc.longitude}`);
        // For Guntur area, let's check if coordinates are reasonable
        const isInGunturArea = (
          currentLoc.latitude >= 15.5 && currentLoc.latitude <= 17.5 && 
          currentLoc.longitude >= 79.5 && currentLoc.longitude <= 81.5
        );
        console.log(`🗺️ Location appears to be in Guntur/AP area: ${isInGunturArea}`);
      }
      
      setSuccess('✅ GPS location obtained! Coordinates saved for restaurant search.');
      setShowManualSelection(false);
      
      // Auto-redirect is handled by the useEffect hook based on autoRedirect prop
    } catch (err: any) {
      console.error('GPS location error:', err);
      setError(`❌ ${err.message}. You can try manual city selection instead.`);
    }
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSelectedCity('');
    setError('');
    setSuccess('');
  };

  const handleCitySelect = (city: string) => {
    if (!selectedState) {
      setError('Please select a state first');
      return;
    }

    setSelectedCity(city);

    // Get coordinates for the selected location
    const stateCoords = LOCATION_COORDINATES[selectedState];
    const cityCoords = stateCoords?.[city] || stateCoords?.['Default'];
    
    if (!cityCoords) {
      setError('Location coordinates not found');
      return;
    }

    // For manual city selection, we should NOT set coordinates
    // This ensures pure city-based filtering without radius search
    const manualLocation: LocationData = {
      city: city,
      state: selectedState,
      isManualSelection: true // Flag to indicate this was manually selected
    };

    console.log('Setting manual location:', manualLocation);
    setLocation(manualLocation);
    setSuccess(`📍 Location set to ${city}, ${selectedState}`);
    setError('');
    
    // Auto-redirect is handled by the useEffect hook based on autoRedirect prop
  };

  const handleClearLocation = () => {
    // Clear all location data including localStorage
    clearLocation();
    localStorage.removeItem('userLocation');
    setSelectedState('');
    setSelectedCity('');
    setError('');
    setSuccess('');
    console.log('🗑️ Location completely cleared');
  };

  const toggleManualSelection = () => {
    setShowManualSelection(!showManualSelection);
    setError('');
    setSuccess('');
  };

  return (
    <Container>
      <Title>
        <LocationIcon>📍</LocationIcon>
        Location Settings
      </Title>

      <ButtonGroup>
        <Button onClick={handleGetCurrentLocation} disabled={isLocationLoading}>
          {isLocationLoading ? (
            <>
              <span>🔄</span>
              Getting Location...
            </>
          ) : (
            <>
              <span>🎯</span>
              Use Current Location
            </>
          )}
        </Button>
        
        <Button $variant="secondary" onClick={toggleManualSelection}>
          <span>🗺️</span>
          {showManualSelection ? 'Hide Location Selector' : 'Select from Database'}
        </Button>

        {location && (
          <Button $variant="success" onClick={handleClearLocation}>
            <span>🗑️</span>
            Clear Location
          </Button>
        )}
      </ButtonGroup>

      {showManualSelection && (
        <ManualLocationSection>
          <SectionTitle>
            🗺️ Select Your Location
            {loadingStates && <span> (Loading states...)</span>}
          </SectionTitle>
          
          {/* States Grid */}
          <SectionTitle style={{ fontSize: '14px', marginTop: '15px', marginBottom: '10px' }}>
            Choose State:
          </SectionTitle>
          <StatesGrid>
            {states.map((state) => (
              <StateCard
                key={state}
                $selected={selectedState === state}
                onClick={() => handleStateSelect(state)}
              >
                <span style={{ fontSize: '20px', marginBottom: '5px', display: 'block' }}>
                  {state === 'Andhra Pradesh' ? '🏛️' : '🏢'}
                </span>
                {state}
              </StateCard>
            ))}
          </StatesGrid>

          {/* Cities Grid */}
          {selectedState && (
            <>
              <SectionTitle style={{ fontSize: '14px', marginTop: '20px', marginBottom: '10px' }}>
                Choose City in {selectedState}:
                {loadingCities && <span> (Loading...)</span>}
              </SectionTitle>
              <CitiesGrid>
                {cities.map((city) => (
                  <CityCard
                    key={city}
                    $selected={selectedCity === city}
                    onClick={() => handleCitySelect(city)}
                  >
                    🏙️ {city}
                  </CityCard>
                ))}
              </CitiesGrid>
            </>
          )}
        </ManualLocationSection>
      )}

      {location && (
        <CurrentLocationDisplay>
          <LocationText>
            📍 Current Location: {selectedCity ? `${selectedCity}, ${selectedState}` : 'GPS Location'}
          </LocationText>
          <CoordinatesText>
            {location.latitude && location.longitude 
              ? `Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
              : 'Manual city selection (no coordinates)'}
          </CoordinatesText>
          {selectedState && selectedCity && (
            <CoordinatesText style={{ color: '#27ae60', fontWeight: '500' }}>
              ✅ Manual location selected from database
            </CoordinatesText>
          )}
        </CurrentLocationDisplay>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
    </Container>
  );
};

export default LocationSelector;