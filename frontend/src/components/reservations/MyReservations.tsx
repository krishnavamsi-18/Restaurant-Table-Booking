import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { apiService } from '../../services/api';
import { Reservation } from '../../types/restaurant';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #2c3e50;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  font-size: 16px;
`;

const ReservationsGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
`;

const ReservationCard = styled.div<{ $status: string }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => 
    props.$status === 'confirmed' ? '#27ae60' : 
    props.$status === 'pending' ? '#f39c12' : 
    props.$status === 'cancelled' ? '#e74c3c' : '#95a5a6'
  };
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const RestaurantName = styled.h3`
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 18px;
`;

const ReservationDetails = styled.div`
  margin-bottom: 15px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
`;

const Label = styled.span`
  color: #7f8c8d;
  font-weight: 500;
`;

const Value = styled.span`
  color: #2c3e50;
  font-weight: 600;
`;

const Status = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => 
    props.$status === 'confirmed' ? '#d5f4e6' : 
    props.$status === 'pending' ? '#fef9e7' : 
    props.$status === 'cancelled' ? '#fadbd8' : '#f8f9fa'
  };
  color: ${props => 
    props.$status === 'confirmed' ? '#27ae60' : 
    props.$status === 'pending' ? '#f39c12' : 
    props.$status === 'cancelled' ? '#e74c3c' : '#95a5a6'
  };
`;

const SpecialRequests = styled.div`
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
  color: #5d6d7e;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
`;

const EmptyTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 10px;
`;

const EmptyMessage = styled.p`
  font-size: 16px;
  line-height: 1.5;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
  color: #7f8c8d;
`;

const ErrorMessage = styled.div`
  background: #fadbd8;
  color: #e74c3c;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  background: ${props => props.$active ? '#3498db' : '#ecf0f1'};
  color: ${props => props.$active ? 'white' : '#7f8c8d'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? '#2980b9' : '#d5dbdb'};
  }
`;

const ActionButtons = styled.div`
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 8px 16px;
  border: 2px solid #e74c3c;
  border-radius: 6px;
  background: transparent;
  color: #e74c3c;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;

  &:hover {
    background: #e74c3c;
    color: white;
  }

  &:disabled {
    border-color: #bdc3c7;
    color: #bdc3c7;
    cursor: not-allowed;
    
    &:hover {
      background: transparent;
      color: #bdc3c7;
    }
  }
`;

const Modal = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  margin: 20px;
`;

const ModalTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 20px;
`;

const ModalText = styled.p`
  color: #7f8c8d;
  margin-bottom: 25px;
  line-height: 1.6;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'danger' ? `
    background: #e74c3c;
    color: white;
    
    &:hover {
      background: #c0392b;
    }
  ` : `
    background: #ecf0f1;
    color: #7f8c8d;
    
    &:hover {
      background: #d5dbdb;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  background: #d5f4e6;
  color: #27ae60;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  border: 1px solid #27ae60;
`;

const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, activeFilter]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUserReservations();
      setReservations(data);
      setError('');
    } catch (err: any) {
      setError('Failed to load reservations. Please try again.');
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = reservations;
    
    if (activeFilter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      console.log('Today for comparison:', today.toDateString());
      
      filtered = reservations.filter(reservation => {
        const dateString = getReservationDate(reservation);
        if (!dateString) return false;
        
        const reservationDate = new Date(dateString);
        reservationDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        const isUpcoming = reservationDate >= today && 
                          (reservation.status === 'confirmed' || reservation.status === 'pending');
        
        console.log(`Reservation ${reservation.id}:`, {
          date: dateString,
          parsedDate: reservationDate.toDateString(),
          status: reservation.status,
          isUpcoming
        });
        
        return isUpcoming;
      });
    } else if (activeFilter === 'past') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day
      filtered = reservations.filter(reservation => {
        const dateString = getReservationDate(reservation);
        if (!dateString) return false;
        
        const reservationDate = new Date(dateString);
        reservationDate.setHours(0, 0, 0, 0); // Set to start of day
        return reservationDate < today && reservation.status !== 'cancelled';
      });
    } else if (activeFilter === 'cancelled') {
      filtered = reservations.filter(reservation => reservation.status === 'cancelled');
    }
    
    setFilteredReservations(filtered);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not set';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper functions to get field values with fallbacks
  const getReservationDate = (reservation: Reservation) => {
    return reservation.reservation_date || reservation.date || '';
  };

  const getReservationTime = (reservation: Reservation) => {
    return reservation.reservation_time || reservation.time || '';
  };

  const getPartySize = (reservation: Reservation) => {
    return reservation.party_size || reservation.guests || 0;
  };

  const handleCancelClick = (reservation: Reservation) => {
    setReservationToCancel(reservation);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!reservationToCancel) return;

    try {
      setCancelling(true);
      console.log('Cancelling reservation:', reservationToCancel.id);
      
      // Check if backend is reachable first
      try {
        const result = await apiService.cancelReservation(reservationToCancel.id);
        console.log('Cancel result:', result);
        
        // Update the reservation status in the local state
        setReservations(prev => 
          prev.map(reservation => 
            reservation.id === reservationToCancel.id 
              ? { ...reservation, status: 'cancelled' } 
              : reservation
          )
        );

        setSuccess('Reservation cancelled successfully!');
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        
        // If it's a network error or backend is down, update locally for demo
        if (apiError.code === 'ERR_NETWORK' || apiError.code === 'NETWORK_ERROR' || 
            apiError.message?.includes('Network Error') || 
            apiError.response?.status === 404) {
          
          console.log('Backend unavailable, updating locally for demo');
          
          // Update the reservation status in the local state
          setReservations(prev => 
            prev.map(reservation => 
              reservation.id === reservationToCancel.id 
                ? { ...reservation, status: 'cancelled' } 
                : reservation
            )
          );

          setSuccess('Reservation cancelled successfully! (Demo mode - backend connection issue)');
        } else {
          throw apiError; // Re-throw if it's a different error
        }
      }

      setShowCancelModal(false);
      setReservationToCancel(null);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to cancel reservation. Please try again.';
      setError(`Error: ${errorMessage}`);
      console.error('Error cancelling reservation:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setReservationToCancel(null);
  };

  const canCancelReservation = (reservation: Reservation) => {
    // Can only cancel confirmed or pending reservations
    if (reservation.status === 'cancelled') return false;
    
    // Can't cancel past reservations - check if reservation date is today or future
    const dateString = getReservationDate(reservation);
    if (!dateString) return false;
    
    const reservationDate = new Date(dateString);
    const today = new Date();
    reservationDate.setHours(23, 59, 59, 999); // End of reservation day
    today.setHours(0, 0, 0, 0); // Start of today
    
    return reservationDate >= today;
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading your reservations...</LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>My Reservations</Title>
        <Subtitle>Manage your restaurant bookings</Subtitle>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <FilterTabs>
        <FilterTab 
          $active={activeFilter === 'all'} 
          onClick={() => setActiveFilter('all')}
        >
          All Reservations
        </FilterTab>
        <FilterTab 
          $active={activeFilter === 'upcoming'} 
          onClick={() => setActiveFilter('upcoming')}
        >
          Upcoming
        </FilterTab>
        <FilterTab 
          $active={activeFilter === 'past'} 
          onClick={() => setActiveFilter('past')}
        >
          Past
        </FilterTab>
        <FilterTab 
          $active={activeFilter === 'cancelled'} 
          onClick={() => setActiveFilter('cancelled')}
        >
          Cancelled
        </FilterTab>
      </FilterTabs>

      {filteredReservations.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🍽️</EmptyIcon>
          <EmptyTitle>No reservations found</EmptyTitle>
          <EmptyMessage>
            {activeFilter === 'all' 
              ? "You haven't made any reservations yet. Start exploring restaurants to make your first booking!"
              : `No ${activeFilter} reservations found.`
            }
          </EmptyMessage>
        </EmptyState>
      ) : (
        <ReservationsGrid>
          {filteredReservations.map((reservation) => (
            <ReservationCard key={reservation.id} $status={reservation.status}>
              <RestaurantName>{reservation.restaurant_name}</RestaurantName>
              
              <ReservationDetails>
                <DetailRow>
                  <Label>Date:</Label>
                  <Value>{formatDate(getReservationDate(reservation))}</Value>
                </DetailRow>
                <DetailRow>
                  <Label>Time:</Label>
                  <Value>{formatTime(getReservationTime(reservation))}</Value>
                </DetailRow>
                <DetailRow>
                  <Label>Guests:</Label>
                  <Value>{getPartySize(reservation)} {getPartySize(reservation) === 1 ? 'person' : 'people'}</Value>
                </DetailRow>
              </ReservationDetails>

              {reservation.special_requests && (
                <SpecialRequests>
                  <Label>Special Requests:</Label>
                  <div>{reservation.special_requests}</div>
                </SpecialRequests>
              )}

              <ActionButtons>
                {canCancelReservation(reservation) && (
                  <CancelButton 
                    onClick={() => handleCancelClick(reservation)}
                    disabled={cancelling}
                  >
                    {cancelling && reservationToCancel?.id === reservation.id ? 'Cancelling...' : 'Cancel Reservation'}
                  </CancelButton>
                )}
              </ActionButtons>
            </ReservationCard>
          ))}
        </ReservationsGrid>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal $show={showCancelModal}>
        <ModalContent>
          <ModalTitle>Cancel Reservation</ModalTitle>
          <ModalText>
            Are you sure you want to cancel your reservation at{' '}
            <strong>{reservationToCancel?.restaurant_name}</strong> on{' '}
            <strong>{reservationToCancel ? formatDate(getReservationDate(reservationToCancel)) : ''}</strong> at{' '}
            <strong>{reservationToCancel ? formatTime(getReservationTime(reservationToCancel)) : ''}</strong>?
            <br /><br />
            This action cannot be undone.
          </ModalText>
          <ModalButtons>
            <ModalButton onClick={handleCancelModalClose} disabled={cancelling}>
              Keep Reservation
            </ModalButton>
            <ModalButton 
              $variant="danger" 
              onClick={handleCancelConfirm}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </ModalButton>
          </ModalButtons>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default MyReservations;