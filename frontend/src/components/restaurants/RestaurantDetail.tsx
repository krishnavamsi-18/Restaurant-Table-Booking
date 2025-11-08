import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Restaurant } from '../../types/restaurant';
import apiService from '../../services/api';
import { formatOperatingHours, getRestaurantStatus, getWeeklyOperatingHours } from '../../utils/restaurantUtils';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const BackButton = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  padding: 12px 16px;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  z-index: 100;

  &:hover {
    background: white;
    transform: translateY(-2px);
  }
`;

const HeroSection = styled.div`
  position: relative;
  height: 400px;
  overflow: hidden;
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 40px;
  color: white;
`;

const RestaurantName = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 10px 0;
`;

const RestaurantCuisine = styled.p`
  font-size: 18px;
  margin: 0 0 10px 0;
  opacity: 0.9;
`;

const RestaurantRating = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
`;

const ContentSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
`;

const MainContent = styled.div`
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InfoCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 20px 0;
`;

const Description = styled.p`
  color: #666;
  line-height: 1.6;
  font-size: 16px;
  margin-bottom: 30px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const InfoLabel = styled.span`
  color: #888;
  font-size: 14px;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #333;
  font-size: 16px;
  font-weight: 600;
`;

const ReserveButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #666;
`;

const ContactIcon = styled.span`
  font-size: 18px;
  width: 24px;
  text-align: center;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  gap: 20px;
  color: #e74c3c;
  font-size: 18px;
`;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  border: 1px solid ${props => props.color}30;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    background: ${props => props.color};
    border-radius: 50%;
  }
`;

const OperatingHoursContainer = styled.div`
  margin-top: 10px;
`;

const HoursHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ClockIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 16px;
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.25);
`;

const HoursGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  margin-top: 15px;
`;

const HoursRow = styled.div<{ isToday: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${props => props.isToday ? '#667eea15' : '#f8f9fa'};
  border: ${props => props.isToday ? '1px solid #667eea30' : '1px solid #e9ecef'};
  border-radius: 8px;
  font-size: 14px;
`;

const DayName = styled.span<{ isToday: boolean }>`
  font-weight: ${props => props.isToday ? '600' : '500'};
  color: ${props => props.isToday ? '#667eea' : '#495057'};
`;

const HoursTime = styled.span<{ isToday: boolean }>`
  font-weight: ${props => props.isToday ? '600' : '400'};
  color: #6c757d;
`;

const HoursRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TodayBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #2ecc71;
  background: #2ecc7115;
  border: 1px solid #2ecc7130;
`;

const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(
    location.state?.restaurant || null
  );
  const [isLoading, setIsLoading] = useState(!restaurant);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!restaurant && id) {
      fetchRestaurant(id);
    }
  }, [id, restaurant]);

  const fetchRestaurant = async (restaurantId: string) => {
    try {
      setIsLoading(true);
      setError('');
      const restaurantData = await apiService.getRestaurantById(restaurantId);
      setRestaurant(restaurantData);
    } catch (error: any) {
      setError('Failed to load restaurant details. Please try again.');
      console.error('Error fetching restaurant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReservation = () => {
    if (restaurant) {
      navigate(`/reservation/${restaurant.id}`, { state: { restaurant } });
    }
  };

  const goBack = () => {
    navigate('/restaurants');
  };

  if (isLoading) {
    return <LoadingMessage>Loading restaurant details...</LoadingMessage>;
  }

  if (error || !restaurant) {
    return (
      <ErrorMessage>
        <div>{error || 'Restaurant not found'}</div>
        <ReserveButton onClick={goBack}>Back to Restaurants</ReserveButton>
      </ErrorMessage>
    );
  }

  return (
    <Container>
      <BackButton onClick={goBack}>← Back</BackButton>
      
      <HeroSection>
        <HeroImage
          src={restaurant.image_url}
          alt={restaurant.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x400?text=Restaurant+Image';
          }}
        />
        <HeroOverlay>
          <RestaurantName>{restaurant.name}</RestaurantName>
          <RestaurantCuisine>{restaurant.cuisine || restaurant.cuisine_type}</RestaurantCuisine>
          <RestaurantRating>
            <span>⭐ {restaurant.rating}</span>
            <span>•</span>
            <span>{restaurant.price_range || '$$'}</span>
          </RestaurantRating>
        </HeroOverlay>
      </HeroSection>

      <ContentSection>
        <MainContent>
          <SectionTitle>About {restaurant.name}</SectionTitle>
          <Description>
            {restaurant.description || 
            `Experience the finest ${restaurant.cuisine || restaurant.cuisine_type} cuisine at ${restaurant.name}. 
            Our restaurant offers an exceptional dining experience with carefully crafted dishes 
            and a warm, welcoming atmosphere. Perfect for any occasion, from intimate dinners 
            to special celebrations.`}
          </Description>

          <InfoGrid>
            <InfoItem>
              <InfoLabel>Cuisine Type</InfoLabel>
              <InfoValue>{restaurant.cuisine || restaurant.cuisine_type}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Rating</InfoLabel>
              <InfoValue>⭐ {restaurant.rating}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Price Range</InfoLabel>
              <InfoValue>{restaurant.price_range || '$$'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Today's Hours</InfoLabel>
              <InfoValue>
                {formatOperatingHours(restaurant)}
                <StatusBadge color={getRestaurantStatus(restaurant).color}>
                  {getRestaurantStatus(restaurant).status}
                </StatusBadge>
              </InfoValue>
            </InfoItem>
          </InfoGrid>

          {restaurant.operating_hours && (
            <OperatingHoursContainer>
              <SectionTitle>Operating Hours</SectionTitle>
              <HoursGrid>
                {getWeeklyOperatingHours(restaurant).map(({ day, hours, isToday }) => (
                  <HoursRow key={day} isToday={isToday}>
                    <DayName isToday={isToday}>{day}</DayName>
                    <HoursTime isToday={isToday}>{hours}</HoursTime>
                  </HoursRow>
                ))}
              </HoursGrid>
            </OperatingHoursContainer>
          )}
        </MainContent>

        <SidebarContent>
          <InfoCard>
            <SectionTitle>Make a Reservation</SectionTitle>
            <ReserveButton onClick={handleReservation}>
              Book a Table
            </ReserveButton>
          </InfoCard>

          <InfoCard>
            <SectionTitle>Contact Information</SectionTitle>
            <ContactInfo>
              <ContactItem>
                <ContactIcon>📍</ContactIcon>
                <span>{restaurant.address}</span>
              </ContactItem>
              <ContactItem>
                <ContactIcon>📞</ContactIcon>
                <span>{restaurant.phone || '+1 (555) 123-4567'}</span>
              </ContactItem>
              <ContactItem>
                <ContactIcon>🌐</ContactIcon>
                <span>{restaurant.website || 'www.restaurant.com'}</span>
              </ContactItem>
              <ContactItem>
                <ContactIcon>✉️</ContactIcon>
                <span>{restaurant.email || 'info@restaurant.com'}</span>
              </ContactItem>
            </ContactInfo>
          </InfoCard>
        </SidebarContent>
      </ContentSection>
    </Container>
  );
};

export default RestaurantDetail;