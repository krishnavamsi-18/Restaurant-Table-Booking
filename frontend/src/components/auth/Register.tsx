import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterCredentials } from '../../types/auth';
import AuthNavbar from './AuthNavbar';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
`;

const ContentArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  gap: 60px;
  padding-top: 80px; /* Space for navbar */
  min-height: calc(100vh - 80px);
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 40px;
    padding-top: 100px;
  }
  
  @media (max-width: 768px) {
    padding-top: 90px;
    padding-bottom: 20px;
  }
`;

const WelcomeSection = styled.div`
  flex: 1;
  max-width: 500px;
  text-align: left;
  color: white;
  
  @media (max-width: 1024px) {
    text-align: center;
    max-width: none;
  }
`;

const WelcomeTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  margin: 0 0 20px 0;
  line-height: 1.2;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.2rem;
  margin: 0;
  line-height: 1.6;
  opacity: 0.9;
  font-weight: 300;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;


const FormCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  min-width: 350px;
  
  @media (max-width: 768px) {
    min-width: unset;
    max-width: 100%;
    padding: 30px;
  }
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #555;
  font-size: 14px;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.$hasError ? '#e74c3c' : '#e1e5e9'};
  border-radius: 10px;
  font-size: 16px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#e74c3c' : '#667eea'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(231, 76, 60, 0.1)' : 'rgba(102, 126, 234, 0.1)'};
  }

  &::placeholder {
    color: #aaa;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
  background: #fdf2f2;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &::before {
    content: "⚠️";
    font-size: 16px;
  }
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
  background: #d5f4e6;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #27ae60;
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #666;

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const PasswordHelp = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
`;

const ValidationCheck = styled.div<{ $isValid: boolean }>`
  font-size: 12px;
  color: ${props => props.$isValid ? '#27ae60' : '#666'};
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &::before {
    content: ${props => props.$isValid ? '"✓"' : '"○"'};
    font-weight: bold;
  }
`;

const Register: React.FC = () => {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>(() => {
    // Initialize from sessionStorage to survive remounts
    return sessionStorage.getItem('register-error') || '';
  });
  const [success, setSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  // Persist error to sessionStorage whenever it changes
  useEffect(() => {
    if (error) {
      sessionStorage.setItem('register-error', error);
    } else {
      sessionStorage.removeItem('register-error');
    }
  }, [error]);

  // Clear error when component mounts and restore from storage if needed
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedError = sessionStorage.getItem('register-error');
      if (storedError && !error) {
        setError(storedError);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setCredentials(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear error when user types
    if (error) {
      setError('');
      sessionStorage.removeItem('register-error');
    }
    if (success) {
      setSuccess('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) return false;
    
    if (!credentials.email || !credentials.password || !credentials.full_name) {
      const errorMsg = 'Please fill in all required fields';
      setError(errorMsg);
      sessionStorage.setItem('register-error', errorMsg);
      return false;
    }

    // Validate phone number if provided
    if (credentials.phone && credentials.phone.trim()) {
      const cleanPhone = credentials.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        const errorMsg = 'Phone number must be at least 10 digits';
        setError(errorMsg);
        sessionStorage.setItem('register-error', errorMsg);
        return false;
      }
    }

    if (credentials.password !== confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      sessionStorage.setItem('register-error', errorMsg);
      return false;
    }

    if (credentials.password.length < 6) {
      const errorMsg = 'Password must be at least 6 characters long';
      setError(errorMsg);
      sessionStorage.setItem('register-error', errorMsg);
      return false;
    }

    setIsSubmitting(true);
    setError('');
    sessionStorage.removeItem('register-error');
    setSuccess('');
    
    try {
      await register(credentials);
      setSuccess('Registration successful! Redirecting to location setup...');
      
      // Redirect after showing success message
      setTimeout(() => {
        navigate('/location-settings');
      }, 2000);
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.status === 400) {
        if (error.response?.data?.detail?.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = 'Invalid registration information. Please check your details and try again.';
        }
      } else if (error.response?.status === 422) {
        errorMessage = 'Please check your input. Make sure email format is valid and all required fields are filled.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred during registration. Please try again in a few moments.';
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      // Store error in sessionStorage to survive remounts
      sessionStorage.setItem('register-error', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
    
    return false;
  };

  return (
    <Container>
      <AuthNavbar />
      
      <ContentArea>
        <WelcomeSection>
          <WelcomeTitle>Join Us Today!</WelcomeTitle>
          <WelcomeSubtitle>Create your account and start discovering the best restaurants around you</WelcomeSubtitle>
        </WelcomeSection>
        
        <FormCard>
        <Title>Create Account</Title>
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              type="text"
              id="full_name"
              name="full_name"
              value={credentials.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={credentials.phone}
              onChange={handleChange}
              placeholder="Enter your phone number (optional)"
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="password">Password *</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password (min 6 characters)"
              $hasError={!!error && error.toLowerCase().includes('password')}
              required
            />
            {credentials.password && (
              <div>
                <ValidationCheck $isValid={credentials.password.length >= 6}>
                  At least 6 characters
                </ValidationCheck>
                <ValidationCheck $isValid={credentials.password !== credentials.password.toLowerCase()}>
                  Contains uppercase letter
                </ValidationCheck>
                <ValidationCheck $isValid={/\d/.test(credentials.password)}>
                  Contains number
                </ValidationCheck>
              </div>
            )}
          </InputGroup>

          <InputGroup>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              $hasError={!!confirmPassword && confirmPassword !== credentials.password}
              required
            />
            {confirmPassword && (
              <ValidationCheck $isValid={confirmPassword === credentials.password}>
                Passwords match
              </ValidationCheck>
            )}
          </InputGroup>

          <Button 
            type="submit" 
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? (
              <>
                Creating Account...
              </>
            ) : (
              <>
                Create Account
              </>
            )}
          </Button>

          {error && (
            <div style={{
              color: '#d32f2f',
              backgroundColor: '#ffebee',
              padding: '12px 16px',
              margin: '16px 0',
              border: '1px solid #d32f2f',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          

        </Form>
      </FormCard>
      </ContentArea>
    </Container>
  );
};

export default Register;