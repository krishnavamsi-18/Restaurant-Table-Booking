import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import LocationSelector from './LocationSelector';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Card = styled.div`
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 10px 0;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 16px;
  margin: 0;
`;

const BackButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 30px;
  transition: background-color 0.2s;

  &:hover {
    background: #5a6268;
  }
`;

const ContinueButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 30px;
  margin-left: 15px;
  transition: background-color 0.2s;

  &:hover {
    background: #0056b3;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LocationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  const handleLocationChange = (location: any) => {
    setCurrentLocation(location);
    // Don't auto-redirect - wait for user to click Continue
  };

  const handleBack = () => {
    navigate('/restaurants');
  };

  const handleContinue = () => {
    navigate('/restaurants');
  };

  return (
    <Container>
      <Card>
        <Header>
          <Title>Location Settings</Title>
          <Subtitle>
            {currentLocation 
              ? "Location set successfully! Click 'Continue' to view restaurants." 
              : "Set your location to find restaurants near you"
            }
          </Subtitle>
        </Header>
        
        <LocationSelector onLocationChange={handleLocationChange} autoRedirect={false} />
        
        <ButtonContainer>
          <BackButton onClick={handleBack}>
            Back to Restaurants
          </BackButton>
          {currentLocation && (
            <ContinueButton onClick={handleContinue}>
              Continue to Restaurants
            </ContinueButton>
          )}
        </ButtonContainer>
      </Card>
    </Container>
  );
};

export default LocationSettings;