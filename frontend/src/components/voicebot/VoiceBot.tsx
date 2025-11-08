import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { ReservationCreate } from '../../types/restaurant';

interface Restaurant {
  id: string;
  name: string;
  city: string;
  state: string;
}

// Floating VoiceBot Widget Styles
const VoiceBotContainer = styled.div<{ $isExpanded?: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  transition: all 0.3s ease;
`;

const VoiceBotCard = styled.div<{ $isExpanded?: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
  
  ${props => props.$isExpanded ? `
    width: 400px;
    height: 500px;
    padding: 20px;
  ` : `
    width: 70px;
    height: 70px;
    padding: 0;
    border-radius: 50%;
  `}
`;

const VoiceBotTitle = styled.h2<{ $isExpanded?: boolean }>`
  color: white;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: ${props => props.$isExpanded ? 'block' : 'none'};
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
  100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
`;

const successGlow = keyframes`
  0% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
  50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.8); }
  100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
`;

const VoiceBotButton = styled.button<{ $isListening?: boolean; $isExpanded?: boolean; $isSuccess?: boolean }>`
  background: ${props => 
    props.$isSuccess 
      ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
      : props.$isListening 
        ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
        : 'linear-gradient(135deg, #3b82f6, #2563eb)'};
  border: none;
  border-radius: 50%;
  width: ${props => props.$isExpanded ? '60px' : '70px'};
  height: ${props => props.$isExpanded ? '60px' : '70px'};
  color: white;
  font-size: ${props => props.$isExpanded ? '1.5rem' : '2rem'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${props => props.$isExpanded ? '0 auto 15px auto' : '0'};
  animation: ${props => 
    props.$isSuccess 
      ? successGlow 
      : props.$isListening 
        ? pulse 
        : glow} 2s infinite;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const TranscriptDisplay = styled.div<{ $isExpanded?: boolean }>`
  background: rgba(15, 23, 42, 0.8);
  border-radius: 12px;
  padding: 15px;
  margin: 10px 0;
  min-height: 120px;
  max-height: 200px;
  overflow-y: auto;
  color: white;
  font-size: 0.9rem;
  line-height: 1.4;
  border: 1px solid rgba(59, 130, 246, 0.2);
  display: ${props => props.$isExpanded ? 'block' : 'none'};
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 2px;
  }
`;

const StatusText = styled.p<{ $isListening?: boolean; $isExpanded?: boolean }>`
  color: ${props => props.$isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.7)'};
  margin: 10px 0;
  font-weight: 500;
  font-size: 0.85rem;
  text-align: center;
  display: ${props => props.$isExpanded ? 'block' : 'none'};
`;

const ControlsContainer = styled.div<{ $isExpanded?: boolean }>`
  display: ${props => props.$isExpanded ? 'flex' : 'none'};
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
`;

const ActionButton = styled.button`
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.6);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.2rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

interface VoiceBotState {
  isExpanded: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSuccess: boolean;
  transcript: string;
  aiResponse: string;
  error: string | null;
}

const VoiceBot: React.FC = () => {
  const [state, setState] = useState<VoiceBotState>({
    isExpanded: false,
    isListening: false,
    isProcessing: false,
    isSuccess: false,
    transcript: '',
    aiResponse: '',
    error: null
  });
  
  const [recognition, setRecognition] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setState(prev => ({ 
        ...prev, 
        error: 'Speech recognition not supported. Please use Chrome or Edge.' 
      }));
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setState(prev => ({ ...prev, isListening: true, error: null }));
      };
      
      recognitionInstance.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };
      
      recognitionInstance.onerror = (event: any) => {
        setState(prev => ({ 
          ...prev, 
          isListening: false, 
          error: `Speech recognition error: ${event.error}` 
        }));
      };

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setState(prev => ({ ...prev, transcript: finalTranscript }));
          processVoiceCommandWithAI(finalTranscript.trim());
        }
      };

      setRecognition(recognitionInstance);
      recognitionRef.current = recognitionInstance;
    }
  }, []);

  // Process voice command using Gemini AI
  const processVoiceCommandWithAI = async (command: string) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      aiResponse: 'Processing your request with AI...' 
    }));

    try {
      // Send command to backend for AI processing
      const response = await fetch('http://localhost:8001/voicebot/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          command: command,
          context: {
            user_location: 'current_city', // Could be enhanced with actual location
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle different intents
      await handleAIResponse(result);

    } catch (error) {
      console.error('Error processing with AI:', error);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: 'Failed to process your request. Please try again.',
        aiResponse: 'Sorry, I had trouble understanding that. Please try again.'
      }));
    }
  };

  // Handle AI response based on intent
  const handleAIResponse = async (aiResult: any) => {
    const { intent, restaurant_match, reservation_details, response_message, action_required } = aiResult;

    setState(prev => ({ 
      ...prev, 
      aiResponse: response_message || 'Processing your request...' 
    }));

    // Get fresh auth state from localStorage to avoid context timing issues
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
    const currentToken = token || localStorage.getItem('token');

    switch (action_required) {
      case 'book_table':
        if (restaurant_match?.found && reservation_details) {
          // Check if time is missing
          if (!reservation_details.time) {
            setState(prev => ({ 
              ...prev, 
              isProcessing: false,
              aiResponse: `I found ${restaurant_match.name} for ${reservation_details.guests || 2} people. What time would you like to book?`
            }));
          }
          // Check time validation before attempting booking
          else if (reservation_details.time_validation && !reservation_details.time_validation.is_valid) {
            setState(prev => ({ 
              ...prev, 
              isProcessing: false,
              aiResponse: reservation_details.time_validation.message || 'The requested time is not available. Please choose a different time.'
            }));
          } else {
            await attemptReservationBooking(restaurant_match, reservation_details, currentUser, currentToken || undefined);
          }
        } else {
          setState(prev => ({ 
            ...prev, 
            isProcessing: false,
            aiResponse: restaurant_match?.alternatives?.length > 0 
              ? `I couldn't find that restaurant. Did you mean: ${restaurant_match.alternatives.join(', ')}?`
              : 'Please specify a restaurant name for your reservation.'
          }));
        }
        break;

      case 'show_restaurants':
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          aiResponse: 'Let me show you available restaurants. Redirecting...'
        }));
        setTimeout(() => navigate('/restaurants'), 2000);
        break;

      case 'ask_clarification':
        // Check if this is due to time validation failure
        if (reservation_details?.time_validation && !reservation_details.time_validation.is_valid) {
          setState(prev => ({ 
            ...prev, 
            isProcessing: false,
            aiResponse: reservation_details.time_validation.message || response_message || 'The requested time is not available. Please choose a different time.'
          }));
        } else if (restaurant_match?.found && restaurant_match?.confidence >= 0.7 && reservation_details) {
          // Only proceed with booking if there are no time validation issues
          setState(prev => ({ 
            ...prev, 
            aiResponse: `Great! I found ${restaurant_match.name}. Proceeding with your booking...`
          }));
          await attemptReservationBooking(restaurant_match, reservation_details, currentUser, currentToken || undefined);
        } else {
          setState(prev => ({ 
            ...prev, 
            isProcessing: false,
            aiResponse: response_message || 'Could you please provide more details?'
          }));
        }
        break;

      default:
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          aiResponse: response_message || 'I understand. How else can I help you?'
        }));
    }
  };

  // Attempt to book reservation using AI-processed data
  const attemptReservationBooking = async (restaurantMatch: any, reservationDetails: any, authUser?: any, authToken?: string | null) => {
    // Use passed auth parameters or fallback to current state
    const bookingUser = authUser || user;
    const bookingToken = authToken || token;
    
    if (!bookingUser) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        aiResponse: 'Please log in to make a reservation. I can redirect you to the login page.'
      }));
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    try {
      const bookingResponse = await fetch('http://localhost:8001/voicebot/book-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bookingToken}`
        },
        body: JSON.stringify({
          restaurant_id: restaurantMatch.restaurant_id,
          date: reservationDetails.date,
          time: reservationDetails.time,
          guests: reservationDetails.guests || 2,
          special_requests: reservationDetails.special_requests || ''
        })
      });

      if (!bookingResponse.ok) {
        throw new Error('Booking failed');
      }

      const bookingResult = await bookingResponse.json();
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        isSuccess: true,
        aiResponse: `🎉 Success! Your table at ${restaurantMatch.name} has been booked for ${reservationDetails.guests} people. Redirecting to your reservations...`
      }));

      // Redirect after 2 seconds to show success message
      setTimeout(() => {
        navigate('/reservations');
        setState(prev => ({ 
          ...prev, 
          isSuccess: false,
          aiResponse: 'Booking completed! You can see your reservation details here.'
        }));
      }, 2000);

    } catch (error) {
      console.error('Booking error:', error);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        aiResponse: `Found ${restaurantMatch.name} but couldn't complete the booking. Please try again or book manually.`
      }));
    }
  };

  // General chat with AI (when not making reservations)
  const sendChatMessage = async (message: string) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await fetch('http://localhost:8001/voicebot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: {} })
      });

      if (response.ok) {
        const result = await response.json();
        setState(prev => ({ 
          ...prev, 
          isProcessing: false,
          aiResponse: result.response 
        }));
      } else {
        throw new Error('Chat failed');
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        aiResponse: 'I apologize, but I\'m having trouble right now. Please try again later.'
      }));
    }
  };

  // Toggle voice listening
  const toggleListening = () => {
    if (!recognition) {
      setState(prev => ({ 
        ...prev, 
        error: 'Speech recognition not available.' 
      }));
      return;
    }
    
    if (state.isListening) {
      recognition.stop();
    } else {
      setState(prev => ({ 
        ...prev, 
        transcript: '',
        aiResponse: 'Listening... Try: "Book a table at Hotel TAJ for 4 people today at 7 PM"',
        error: null
      }));
      recognition.start();
    }
  };

  // Toggle widget expansion
  const toggleExpansion = () => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  // Close widget
  const closeWidget = () => {
    setState(prev => ({ 
      ...prev, 
      isExpanded: false,
      transcript: '',
      aiResponse: '',
      error: null
    }));
    if (recognition && state.isListening) {
      recognition.stop();
    }
  };

  // Quick action buttons
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'restaurants':
        navigate('/restaurants');
        break;
      case 'reservations':
        navigate('/reservations');
        break;
      case 'help':
        setState(prev => ({ 
          ...prev, 
          aiResponse: 'I can help you make restaurant reservations using voice commands. Try saying: "Book a table at [restaurant name] for [number] people at [time]"'
        }));
        break;
    }
  };

  const displayText = state.error || state.aiResponse || state.transcript || 
    (state.isExpanded ? 'Click the microphone and speak your request...' : '');

  return (
    <VoiceBotContainer $isExpanded={state.isExpanded}>
      <VoiceBotCard $isExpanded={state.isExpanded}>
        {state.isExpanded && (
          <>
            <CloseButton onClick={closeWidget}>×</CloseButton>
            <VoiceBotTitle $isExpanded={state.isExpanded}>
              🤖 AI Voice Assistant
            </VoiceBotTitle>
          </>
        )}
        
        <VoiceBotButton 
          onClick={state.isExpanded ? toggleListening : toggleExpansion}
          $isListening={state.isListening}
          $isExpanded={state.isExpanded}
          $isSuccess={state.isSuccess}
          disabled={state.isProcessing}
        >
          {state.isProcessing ? '⏳' : state.isSuccess ? '✅' : state.isListening ? '🔴' : '🎤'}
        </VoiceBotButton>

        {state.isExpanded && (
          <>
            <StatusText $isListening={state.isListening} $isExpanded={state.isExpanded}>
              {state.isProcessing ? 'AI is thinking...' :
               state.isListening ? 'Listening... Speak now!' : 
               'Click microphone to speak'}
            </StatusText>

            <TranscriptDisplay $isExpanded={state.isExpanded}>
              {displayText}
            </TranscriptDisplay>

            <ControlsContainer $isExpanded={state.isExpanded}>
              <ActionButton onClick={() => handleQuickAction('help')}>
                How to use Voice Assistant
              </ActionButton>
            </ControlsContainer>

            <div style={{ 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: '0.75rem', 
              marginTop: '15px',
              textAlign: 'left',
              lineHeight: '1.3'
            }}>
              <strong>🎯 Voice Commands:</strong><br />
              • "Book a table at Hotel TAJ for 4 people today at 7 PM"<br />
              • "Reserve at nagasai for 2 tomorrow at 7 PM"<br />
              • "Book pizza world for 4 people tonight"<br />
              • "Show me restaurants in the area"<br />
              • "Help me make a reservation"
            </div>
          </>
        )}
      </VoiceBotCard>
    </VoiceBotContainer>
  );
};

export default VoiceBot;