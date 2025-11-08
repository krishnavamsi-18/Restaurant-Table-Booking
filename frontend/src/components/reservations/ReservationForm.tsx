import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Restaurant, ReservationCreate } from '../../types/restaurant';
import apiService from '../../services/api';
import { formatOperatingHours, isRestaurantOpen, getOperatingHoursForDay } from '../../utils/restaurantUtils';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 100px 20px 40px;
  position: relative;
`;

const BackButton = styled.button`
  position: fixed;
  top: 100px;
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

const FormContainer = styled.div`
  max-width: 600px;
  margin: 40px auto;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
  overflow: visible;
`;

const Title = styled.h1`
  color: #333;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 16px;
  text-align: center;
  margin-bottom: 40px;
`;

const RestaurantInfo = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 40px;
  text-align: center;
  position: relative;
  z-index: 5;
`;

const RestaurantName = styled.h2`
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 5px 0;
`;

const RestaurantDetails = styled.p`
  color: #666;
  font-size: 14px;
  margin: 0;
`;

const FormGroup = styled.div`
  margin-bottom: 40px;
  position: relative;
  clear: both;
`;

const Label = styled.label`
  display: block;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const InputContainer = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:invalid {
    border-color: #e74c3c;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 15px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 15px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 30px;
`;

const Button = styled.button`
  flex: 1;
  padding: 15px 30px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e1e5e9;

  &:hover {
    background: #e9ecef;
    border-color: #ced4da;
  }
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #e74c3c;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background: #efe;
  color: #27ae60;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
`;

const OperatingHoursInfo = styled.div`
  background: #f0f8ff;
  border: 1px solid #d0e7ff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;

const OperatingHoursTitle = styled.h3`
  color: #2563eb;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px 0;
`;

const OperatingHoursText = styled.p`
  color: #1e40af;
  font-size: 14px;
  margin: 5px 0;
  line-height: 1.4;
`;

const ValidationWarning = styled.div`
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  padding: 12px 15px;
  border-radius: 8px;
  margin-top: 15px;
  margin-bottom: 15px;
  font-size: 14px;
`;

const TimeSlotHelper = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-top: 15px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
`;

const WarningText = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
  color: #856404;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '⚠️';
    font-size: 16px;
  }
`;

interface ReservationFormProps {}

const ReservationForm: React.FC<ReservationFormProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const restaurant = location.state?.restaurant as Restaurant;

  const [formData, setFormData] = useState({
    restaurant_id: restaurant?.id || id || '',  // Use the actual ObjectId string
    reservation_date: '',
    reservation_time: '',
    party_size: 2,
    special_requests: '',
    date: '',
    time: '',
    persons: 2
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeValidationWarning, setTimeValidationWarning] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Generate time slots for a given day
  const generateTimeSlots = (selectedDate: string): string[] => {
    if (!restaurant?.operating_hours || !selectedDate) {
      console.log('Missing operating hours or date');
      return [];
    }

    const date = new Date(selectedDate + 'T00:00:00'); // Ensure proper date parsing
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof restaurant.operating_hours;
    console.log('Day name:', dayName);
    
    const dayHours = restaurant.operating_hours[dayName];
    console.log('Day hours:', dayHours);

    if (!dayHours || dayHours.is_closed) {
      console.log('Restaurant is closed on this day');
      return [];
    }

    const slots: string[] = [];
    
    // Parse opening and closing times
    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);
    
    console.log(`Open: ${openHour}:${openMin}, Close: ${closeHour}:${closeMin}`);

    // Handle midnight closing (00:00 means 24:00)
    const actualCloseHour = closeHour === 0 ? 24 : closeHour;
    const closeTimeMinutes = actualCloseHour * 60 + closeMin;
    const openTimeMinutes = openHour * 60 + openMin;

    // Generate 30-minute slots from opening to 1 hour before closing
    let currentTimeMinutes = openTimeMinutes;
    const lastSlotTime = closeTimeMinutes - 60; // 1 hour before closing

    while (currentTimeMinutes <= lastSlotTime) {
      const hour = Math.floor(currentTimeMinutes / 60);
      const minute = currentTimeMinutes % 60;
      
      // Convert 24-hour format back to normal for display
      const displayHour = hour >= 24 ? hour - 24 : hour;
      const timeStr = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeStr);

      currentTimeMinutes += 30; // 30-minute intervals
    }

    console.log('Generated slots:', slots);
    return slots;
  };

  // Validate selected time against operating hours
  const validateTimeSlot = (date: string, time: string): string => {
    if (!restaurant?.operating_hours || !date || !time) return '';

    const selectedDate = new Date(date);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof restaurant.operating_hours;
    const dayHours = restaurant.operating_hours[dayName];

    if (!dayHours || dayHours.is_closed) {
      return `Sorry, ${restaurant.name} is closed on ${selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}s.`;
    }

    const [selectedHour, selectedMin] = time.split(':').map(Number);
    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);

    const selectedTimeMinutes = selectedHour * 60 + selectedMin;
    const openTimeMinutes = openHour * 60 + openMin;
    const closeTimeMinutes = closeHour * 60 + closeMin;

    if (selectedTimeMinutes < openTimeMinutes) {
      return `Restaurant opens at ${dayHours.open}. Please select a time after opening.`;
    }

    // Must book at least 1 hour before closing to allow for dining
    if (selectedTimeMinutes > closeTimeMinutes - 60) {
      const lastBookingTime = `${Math.floor((closeTimeMinutes - 60) / 60).toString().padStart(2, '0')}:${((closeTimeMinutes - 60) % 60).toString().padStart(2, '0')}`;
      return `Last reservation is at ${lastBookingTime} (1 hour before closing at ${dayHours.close}).`;
    }

    return '';
  };

  // Update available time slots when date changes
  useEffect(() => {
    if (formData.date && restaurant?.operating_hours) {
      console.log('Generating time slots for date:', formData.date);
      console.log('Restaurant operating hours:', restaurant.operating_hours);
      
      const slots = generateTimeSlots(formData.date);
      console.log('Generated slots:', slots);
      setAvailableTimeSlots(slots);
      
      // Clear time if it's not available for the selected date
      if (formData.time) {
        const warning = validateTimeSlot(formData.date, formData.time);
        setTimeValidationWarning(warning);
      }
    } else {
      console.log('Cannot generate slots - missing date or operating hours');
      setAvailableTimeSlots([]);
    }
  }, [formData.date, restaurant]);

  // Set default date to today when component loads
  useEffect(() => {
    if (!formData.date) {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      setFormData(prev => ({
        ...prev,
        date: dateStr,
        reservation_date: dateStr
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev };
      
      if (name === 'date') {
        updated.date = value;
        updated.reservation_date = value;
      } else if (name === 'time') {
        updated.time = value;
        updated.reservation_time = value;
        
        // Validate time slot
        if (updated.date && value) {
          const warning = validateTimeSlot(updated.date, value);
          setTimeValidationWarning(warning);
        } else {
          setTimeValidationWarning('');
        }
      } else if (name === 'persons') {
        const persons = parseInt(value) || 1;
        updated.persons = persons;
        updated.party_size = persons;
      } else if (name === 'party_size') {
        updated.party_size = parseInt(value) || 1;
        updated.persons = parseInt(value) || 1;
      } else if (name === 'special_requests') {
        updated.special_requests = value;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate time slot before submission
    if (timeValidationWarning) {
      setError('Please select a valid time slot during restaurant operating hours.');
      return;
    }

    // Additional validation
    const timeError = validateTimeSlot(formData.date, formData.time);
    if (timeError) {
      setError(timeError);
      return;
    }

    setIsSubmitting(true);

    try {
      const reservationData: ReservationCreate = {
        restaurant_id: formData.restaurant_id,
        reservation_date: formData.reservation_date || formData.date,
        reservation_time: formData.reservation_time || formData.time,
        party_size: formData.party_size || formData.persons,
        special_requests: formData.special_requests,
        // Add additional fields that the backend expects
        date: formData.date,
        time: formData.time,
        guests: formData.persons
      };
      
      await apiService.createReservation(reservationData);
      setSuccess('Reservation created successfully!');
      setTimeout(() => {
        navigate('/reservations');
      }, 2000);
    } catch (error: any) {
      let errorMessage = 'Failed to create reservation. Please try again.';
      
      if (error.response?.data) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          // Handle FastAPI validation errors
          errorMessage = error.response.data.detail.map((err: any) => err.msg).join(', ');
        } else if (error.response.data.detail && typeof error.response.data.detail === 'object') {
          errorMessage = 'Validation error occurred. Please check your input.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Container>
      <BackButton onClick={goBack}>← Back</BackButton>
      
      <FormContainer>
        <Title>Make a Reservation</Title>
        <Subtitle>Book your table and enjoy a wonderful dining experience</Subtitle>

        {restaurant && (
          <RestaurantInfo>
            <RestaurantName>{restaurant.name}</RestaurantName>
            <RestaurantDetails>
              {restaurant.cuisine || restaurant.cuisine_type} • {restaurant.address}
            </RestaurantDetails>
          </RestaurantInfo>
        )}



        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="date">Date</Label>
            <Input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              min={today}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="time">Time</Label>
            {availableTimeSlots.length > 0 ? (
              <Select
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                disabled={availableTimeSlots.length === 0}
              >
                {availableTimeSlots.length === 0 ? (
                  <option value="">No available time slots for this date</option>
                ) : (
                  <>
                    <option value="">Select a time slot</option>
                    {availableTimeSlots.map(slot => {
                      const [hour, minute] = slot.split(':');
                      const displayTime = new Date(2000, 0, 1, parseInt(hour), parseInt(minute))
                        .toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        });
                      return (
                        <option key={slot} value={slot}>
                          {displayTime}
                        </option>
                      );
                    })}
                  </>
                )}
              </Select>
            ) : (
              <Input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            )}
            
            {/* Show operating hours for selected day */}

            
            {timeValidationWarning && (
              <ValidationWarning>{timeValidationWarning}</ValidationWarning>
            )}
            
            {formData.date && availableTimeSlots.length === 0 && restaurant?.operating_hours && (
              <ValidationWarning>
                Restaurant is closed on this day. Please select a different date.
              </ValidationWarning>
            )}
            
            {availableTimeSlots.length > 0 && (
              <TimeSlotHelper>
                💡 Available time slots are shown above. Last booking is 1 hour before closing.
              </TimeSlotHelper>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="persons">Number of Guests</Label>
            <Select
              id="persons"
              name="persons"
              value={formData.persons}
              onChange={handleInputChange}
              required
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="special_requests">Special Requests (Optional)</Label>
            <TextArea
              id="special_requests"
              name="special_requests"
              value={formData.special_requests}
              onChange={handleInputChange}
              placeholder="Any dietary restrictions, special occasions, or other requests..."
            />
          </FormGroup>

          <ButtonGroup>
            <CancelButton type="button" onClick={goBack}>
              Cancel
            </CancelButton>
            <SubmitButton 
              type="submit" 
              disabled={isSubmitting || Boolean(timeValidationWarning) || (formData.date ? availableTimeSlots.length === 0 : false)}
            >
              {isSubmitting ? 'Creating Reservation...' : 'Confirm Reservation'}
            </SubmitButton>
          </ButtonGroup>
        </form>
      </FormContainer>
    </Container>
  );
};

export default ReservationForm;