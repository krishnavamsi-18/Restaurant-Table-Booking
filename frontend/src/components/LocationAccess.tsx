import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LocationData } from '../types/restaurant';
import { useLocation } from '../contexts/LocationContext';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  text-align: center;
`;

const Icon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
  color: #667eea;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 600;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 10px 5px;
  
  ${props => props.$variant === 'secondary' ? `
    background: #f8f9fa;
    color: #495057;
    border: 1px solid #dee2e6;
    &:hover {
      background: #e9ecef;
      transform: translateY(-1px);
    }
  ` : `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
  `}
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-top: 20px;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  margin-top: 20px;
  font-size: 14px;
`;

const LocationAccess: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const { location, isLocationLoading, requestLocation, setLocation } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if location is already set
    if (location) {
      console.log('Location already exists:', location);
      setSuccess('Location already granted');
      // If location exists, redirect immediately
      setTimeout(() => {
        navigate('/restaurants');
      }, 1000);
    }
  }, [location, navigate]);

  const handleLocationRequest = async () => {
    try {
      setError('');
      console.log('LocationAccess: Starting location request...');
      
      // Request location through the context
      await requestLocation();
      
      console.log('LocationAccess: Location request completed');
      
    } catch (err: any) {
      console.error('LocationAccess: Location request failed:', err);
      setError(err.message || 'Failed to get location');
    }
  };

  // Watch for location changes and redirect immediately
  useEffect(() => {
    if (location && !isLocationLoading) {
      console.log('LocationAccess: Location detected, redirecting to restaurants in 1 second...', location);
      const timer = setTimeout(() => {
        console.log('LocationAccess: Executing redirect now...');
        navigate('/restaurants');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location, isLocationLoading, navigate]);  const skipLocation = () => {
    // Store a default location (New York City) if user skips
    const defaultLocation: LocationData = {
      latitude: 40.7128,
      longitude: -74.0060,
    };
    
    localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
    navigate('/restaurants');
  };

  const proceedToRestaurants = () => {
    navigate('/restaurants');
  };

  return (
    <Container>
      <Card>
        <Icon>📍</Icon>
        <Title>Location Access</Title>
        <Description>
          To show you the best restaurants nearby, we need access to your location. 
          This helps us provide personalized recommendations and accurate directions.
        </Description>

        {!location && (
          <ButtonGroup>
            <Button onClick={handleLocationRequest} disabled={isLocationLoading}>
              {isLocationLoading ? 'Getting Location...' : 'Allow Location Access'}
            </Button>
            <Button $variant="secondary" onClick={skipLocation}>
              Skip for Now
            </Button>
          </ButtonGroup>
        )}

        {location && (
          <ButtonGroup>
            <Button onClick={proceedToRestaurants}>
              Continue to Restaurants
            </Button>
            <Button $variant="secondary" onClick={handleLocationRequest}>
              Update Location
            </Button>
          </ButtonGroup>
        )}

        {/* Debug info - remove in production */}
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
          <strong>Debug:</strong><br/>
          Location: {location ? `${location.latitude}, ${location.longitude}` : 'None'}<br/>
          Loading: {isLocationLoading ? 'Yes' : 'No'}
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </Card>
    </Container>
  );
};

export default LocationAccess;