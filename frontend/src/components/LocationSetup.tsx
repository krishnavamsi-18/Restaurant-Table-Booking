import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocation } from '../contexts/LocationContext';
import LocationSelector from './LocationSelector';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const SetupCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 10px;
  font-size: 2.5rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 40px;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const Message = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
  font-weight: 500;
  
  ${props => props.$type === 'success' && `
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  `}
  
  ${props => props.$type === 'error' && `
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  `}
  
  ${props => props.$type === 'info' && `
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  `}
`;

const ContinueButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
`;

const LocationSetup: React.FC = () => {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const { location, clearLocation } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing location when component mounts
    clearLocation();
  }, [clearLocation]);

  const handleContinue = () => {
    navigate('/restaurants');
  };

  return (
    <Container>
      <SetupCard>
        <Title>Welcome!</Title>
        <Subtitle>
          To show you the best restaurants nearby, we need to know your location in Andhra Pradesh.
        </Subtitle>

        {/* Use LocationSelector without auto-redirect */}
        <LocationSelector 
          autoRedirect={false}
          onLocationChange={(loc) => {
            setMessage(loc ? 
              { text: '✅ Location set successfully! Click Continue to view restaurants.', type: 'success' } : 
              null
            );
          }}
        />

        {message && (
          <Message $type={message.type}>
            {message.text}
          </Message>
        )}

        {location && (
          <ContinueButton onClick={handleContinue}>
            Continue to Restaurants
          </ContinueButton>
        )}
      </SetupCard>
    </Container>
  );
};

export default LocationSetup;