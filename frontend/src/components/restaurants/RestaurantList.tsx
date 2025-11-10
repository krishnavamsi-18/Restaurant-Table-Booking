import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Restaurant } from '../../types/restaurant';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { formatOperatingHours, getRestaurantStatus } from '../../utils/restaurantUtils';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px;
  max-width: 100vw;
  overflow-x: hidden;
`;

const Header = styled.div`
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  max-width: 100%;
  box-sizing: border-box;
`;

const Title = styled.h1`
  color: #333;
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 20px 0;
`;



const SearchBar = styled.input`
  width: 100%;
  padding: 15px 20px;
  border: 2px solid #e1e8ed;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s ease;
  margin-bottom: 15px;
  box-sizing: border-box;

  &:focus {
    border-color: #667eea;
  }

  &::placeholder {
    color: #999;
  }
`;

const LocationText = styled.span`
  color: #27ae60;
  font-weight: 500;
  font-size: 14px;
`;

const DistanceInfo = styled.div`
  color: #666;
  font-size: 12px;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

const ClearFiltersButton = styled.button`
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e1e8ed;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e9ecef;
    border-color: #667eea;
  }
`;

const RestaurantGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const RestaurantCard = styled.div`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const RestaurantImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const RestaurantInfo = styled.div`
  padding: 20px;
`;

const RestaurantName = styled.h3`
  color: #333;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const RestaurantCuisine = styled.p`
  color: #667eea;
  font-weight: 500;
  margin: 0 0 8px 0;
`;

const RestaurantAddress = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0 0 12px 0;
`;

const RestaurantDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #f39c12;
  font-weight: 500;
`;

const PriceRange = styled.span`
  color: #27ae60;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  border: 1px solid ${props => props.color}30;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: ${props => props.color};
    border-radius: 50%;
  }
`;

const RestaurantHours = styled.div`
  color: #666;
  font-size: 13px;
  margin-top: 4px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #e74c3c;
  font-size: 18px;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
`;

const NavigationButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
`;

const NavButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
`;

const RestaurantList: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { logout } = useAuth();
  const { location: currentLocation } = useLocation();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const routeState = routerLocation.state as { search?: string } | null;

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  // Check if location is available on component mount
  useEffect(() => {
    fetchRestaurants();
  }, [currentLocation]);

  useEffect(() => {
    // Filter restaurants based on search term
    if (searchTerm.trim() === '') {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant =>
        (restaurant.name && restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ((restaurant.cuisine || restaurant.cuisine_type) && (restaurant.cuisine || restaurant.cuisine_type)!.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (restaurant.address && restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchTerm, restaurants]);

  useEffect(() => {
    if (routeState?.search) {
      setSearchTerm(routeState.search);
    }
  }, [routeState]);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Use currentLocation from LocationContext
      const location = currentLocation;
      
      if (!location) {
        // If no location is set, try to load all restaurants from Andhra Pradesh as fallback
        console.log('No location set, loading all Andhra Pradesh restaurants as fallback');
        try {
          const fallbackData = await apiService.getRestaurants(
            undefined, // latitude
            undefined, // longitude  
            undefined, // radius
            'Andhra Pradesh', // state
            undefined // city
          );
          console.log(`Fallback: Found ${fallbackData.length} restaurants in Andhra Pradesh`);
          setRestaurants(fallbackData);
          setFilteredRestaurants(fallbackData);
          setError('🗺️ Showing all restaurants in Andhra Pradesh. Set your location for better results.');
        } catch (err) {
          setError('Please set your location first to see nearby restaurants.');
          setRestaurants([]);
          setFilteredRestaurants([]);
        }
        setIsLoading(false);
        return;
      }
      
      // Fetch restaurants based on current location
      console.log('RestaurantList: Current location data:', location);
      console.log('RestaurantList: Manual selection flag:', location.isManualSelection);
      console.log('RestaurantList: Has city/state:', !!location.city && !!location.state);
      console.log('RestaurantList: Has coordinates:', !!location.latitude && !!location.longitude);
      
      let data;
      // IMPORTANT: ONLY use city-based filtering when explicitly manually selected
      // Check ONLY for the manual selection flag to avoid GPS coordinates interference
      if (location.isManualSelection === true && location.city && location.state) {
        // City-based filtering - when user manually selected a city
        console.log('🏙️ RestaurantList: Using EXACT city-based filtering (manual selection):', location.city, location.state);
        console.log('🔍 API Call Details:', {
          latitude: undefined,
          longitude: undefined, 
          radius: undefined,
          state: location.state,
          city: location.city
        });
        
        try {
          data = await apiService.getRestaurants(
            undefined, // latitude
            undefined, // longitude
            undefined, // radius
            location.state, // state
            location.city // city
          );
          console.log(`✅ City filtering SUCCESS: Found ${data.length} restaurants in ${location.city}, ${location.state}`);
          
          // Debug: Check if all restaurants are from the correct city
          const wrongCityRestaurants = data.filter(r => r.city !== location.city);
          if (wrongCityRestaurants.length > 0) {
            console.error('❌ FILTERING FAILED: Found restaurants from other cities:', wrongCityRestaurants.map(r => r.city));
          } else {
            console.log('✅ FILTERING SUCCESS: All restaurants are from the correct city');
          }
        } catch (apiError) {
          console.error('❌ API Error:', apiError);
          throw apiError;
        }
        
        // If no restaurants in the exact city, try state-level search as fallback
        if (data.length === 0) {
          console.log(`No restaurants found in ${location.city}, ${location.state}. Trying state-level search...`);
          
          try {
            // Fallback to state-level search
            const stateData = await apiService.getRestaurants(
              undefined, // latitude
              undefined, // longitude
              undefined, // radius
              location.state, // state only
              undefined // no specific city
            );
            
            if (stateData.length > 0) {
              console.log(`State fallback successful: Found ${stateData.length} restaurants in ${location.state}`);
              data = stateData;
              setError(`⚠️ No restaurants found specifically in ${location.city}. Showing all restaurants in ${location.state}.`);
            } else {
              setError(`❌ No restaurants found in ${location.city} or ${location.state}. Please try a different location.`);
              setIsLoading(false);
              return;
            }
          } catch (stateError) {
            console.error('State fallback failed:', stateError);
            setError(`❌ No restaurants found in ${location.city}, ${location.state}. Please try selecting a different city.`);
            setIsLoading(false);
            return;
          }
        }
      } else if (location.latitude && location.longitude && !location.isManualSelection) {
        // GPS coordinate-based filtering - when user allowed location access  
        console.log('📍 RestaurantList: Using GPS coordinate-based filtering (radius search):', location.latitude, location.longitude);
        console.log('🔍 GPS API Call Details:', {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: 10.0, // More restrictive radius
          state: undefined,
          city: undefined
        });
        data = await apiService.getRestaurants(
          location.latitude,
          location.longitude,
          10.0 // Start with a more restrictive radius (10km) to avoid other cities
        );
        
        console.log(`GPS filtering (10km): Found ${data.length} restaurants`);
        
        // If no restaurants found within 10km, try with 20km radius (still reasonable)
        if (data.length === 0) {
          console.log('No restaurants found within 10km, expanding to 20km...');
          data = await apiService.getRestaurants(
            location.latitude,
            location.longitude,
            20.0
          );
          console.log(`GPS filtering (20km): Found ${data.length} restaurants`);
        }
        
        // If still no restaurants within 20km, try state-based fallback
        if (data.length === 0) {
          console.log('No restaurants found within 20km, trying state-based fallback...');
          
          // Try to get restaurants from Andhra Pradesh as fallback
          try {
            data = await apiService.getRestaurants(
              undefined, // latitude
              undefined, // longitude
              undefined, // radius
              'Andhra Pradesh', // state - assuming user is in AP based on Guntur coordinates
              undefined // city
            );
            console.log(`State fallback: Found ${data.length} restaurants in Andhra Pradesh`);
            
            if (data.length > 0) {
              setError('🗺️ No restaurants found near your exact location. Showing all restaurants in Andhra Pradesh.');
            } else {
              setError('No restaurants found within 20km of your location. Please try manual city selection for more options.');
              setIsLoading(false);
              return;
            }
          } catch (fallbackError) {
            console.error('State fallback failed:', fallbackError);
            setError('No restaurants found within 20km of your location. Please try manual city selection for more options.');
            setIsLoading(false);
            return;
          }
        }
      } else {
        throw new Error('Location data is incomplete');
      }
      
      console.log(`Found ${data.length} restaurants`);
      setRestaurants(data);
      setFilteredRestaurants(data);
    } catch (err) {
      setError('Failed to fetch restaurants. Please try again.');
      console.error('Error fetching restaurants:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    navigate(`/restaurant/${restaurant.id}`, { state: { restaurant } });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearFilters = () => {
    setSearchTerm('');
  };

  const goToLocationSettings = () => {
    navigate('/location-settings');
  };

  const goToReservations = () => {
    navigate('/reservations');
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingMessage>Loading restaurants...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
        <NavigationButtons>
          {error.includes('location') ? (
            <NavButton onClick={goToLocationSettings}>Set Location</NavButton>
          ) : (
            <NavButton onClick={fetchRestaurants}>Try Again</NavButton>
          )}
          <NavButton onClick={handleLogout}>Logout</NavButton>
        </NavigationButtons>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Discover Restaurants</Title>
        <SearchBar
          type="text"
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <FilterContainer>
            <ClearFiltersButton onClick={clearFilters}>
              Clear Filters
            </ClearFiltersButton>
          </FilterContainer>
        )}
      </Header>

      {filteredRestaurants.length === 0 ? (
        <NoResults>
          {searchTerm ? `No restaurants found matching "${searchTerm}"` : 'No restaurants available'}
        </NoResults>
      ) : (
        <RestaurantGrid>
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              onClick={() => handleRestaurantClick(restaurant)}
            >
              <RestaurantImage
                src={restaurant.image_url}
                alt={restaurant.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.log(`Image failed to load for ${restaurant.name}: ${target.src}`);
                  
                  // Check if already using placeholder to prevent infinite loop
                  if (target.src.includes('placeholder.com')) {
                    console.log('Already using placeholder, no further fallback');
                    return;
                  }
                  
                  // If original Unsplash URL failed, try a different Unsplash fallback
                  if (target.src === restaurant.image_url && target.src.includes('unsplash.com')) {
                    console.log('Trying cuisine-based Unsplash fallback');
                    const cuisine = restaurant.cuisine || restaurant.cuisine_type || 'restaurant';
                    target.src = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=350&h=200&fit=crop&auto=format&q=80`;
                  } else {
                    // Use placeholder as final fallback
                    console.log('Using placeholder fallback');
                    const restaurantName = restaurant.name || 'Restaurant';
                    target.src = `https://via.placeholder.com/350x200/667eea/white?text=${encodeURIComponent(restaurantName)}`;
                  }
                }}
              />
              <RestaurantInfo>
                <RestaurantName>{restaurant.name}</RestaurantName>
                <RestaurantCuisine>{restaurant.cuisine || restaurant.cuisine_type}</RestaurantCuisine>
                <RestaurantAddress>{restaurant.address}</RestaurantAddress>
                {currentLocation && currentLocation.latitude && currentLocation.longitude && 
                 restaurant.latitude && restaurant.longitude && (
                  <DistanceInfo>
                    <span>📍</span>
                    {calculateDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      restaurant.latitude,
                      restaurant.longitude
                    )} km away
                  </DistanceInfo>
                )}
                <RestaurantDetails>
                  <Rating>
                    ⭐ {restaurant.rating}
                  </Rating>
                  <PriceRange>{restaurant.price_range || '$$'}</PriceRange>
                </RestaurantDetails>
                {restaurant.operating_hours && (
                  <RestaurantHours>
                    {formatOperatingHours(restaurant)}
                  </RestaurantHours>
                )}
                {restaurant.operating_hours && (
                  <StatusBadge color={getRestaurantStatus(restaurant).color}>
                    {getRestaurantStatus(restaurant).status}
                  </StatusBadge>
                )}
              </RestaurantInfo>
            </RestaurantCard>
          ))}
        </RestaurantGrid>
      )}
    </Container>
  );
};

export default RestaurantList;