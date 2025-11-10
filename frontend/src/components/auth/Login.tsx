import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types/auth';
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

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>(() => {
    // Initialize from sessionStorage to survive remounts
    return sessionStorage.getItem('login-error') || '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();
  
  // Persist error to sessionStorage whenever it changes
  useEffect(() => {
    if (error) {
      sessionStorage.setItem('login-error', error);
    } else {
      sessionStorage.removeItem('login-error');
    }
  }, [error]);
  
  // Clear error when component mounts (except for initial load)
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedError = sessionStorage.getItem('login-error');
      if (storedError && !error) {
        setError(storedError);
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  

  


  // Check if user is already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/location-settings', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // CRITICAL: Prevent any form submission behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      return false;
    }

    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields');
      return false;
    }

    // Clear any existing error and set submitting state
    setError('');
    setIsSubmitting(true);
    
    try {
      await login(credentials);
      sessionStorage.removeItem('login-error');
      setError('');
      navigate('/location-settings');
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = '🔌 Cannot connect to server. Please make sure the backend server is running on http://localhost:8001';
      } else if (error.response?.status === 401) {
        errorMessage = '❌ Invalid email or password. Please check your credentials and try again.';
      } else if (error.response?.status === 400) {
        const detail = error.response?.data?.detail || error.response?.data?.message;
        errorMessage = detail ? `❌ ${detail}` : '❌ Invalid login information provided.';
      } else if (error.response?.status === 422) {
        errorMessage = '❌ Please check your input format and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = '🔧 Server error. Please try again in a few moments.';
      } else if (error.response?.data?.detail) {
        errorMessage = `❌ ${error.response.data.detail}`;
      } else if (error.response?.data?.message) {
        errorMessage = `❌ ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      // Store in sessionStorage to survive remounts
      sessionStorage.setItem('login-error', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
    
    // Explicitly return false to prevent any form submission
    return false;
  };

  return (
    <Container>
      <AuthNavbar />
      
      <ContentArea>
        <WelcomeSection>
          <WelcomeTitle>Welcome Back!</WelcomeTitle>
          <WelcomeSubtitle>Sign in to discover amazing restaurants near you</WelcomeSubtitle>
        </WelcomeSection>
        
        <FormCard>
        <Title>Welcome Back</Title>
        <Form noValidate onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="Enter your email"
              $hasError={!!error && error.toLowerCase().includes('email')}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              $hasError={!!error && error.toLowerCase().includes('password')}
              required
            />
          </InputGroup>

          {/* Error Message Display */}
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
          


          <Button 
            type="submit" 
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <>
                Signing In...
              </>
            ) : (
              <>
                Sign In
              </>
            )}
          </Button>
          
          {/* Test button to verify error display */}

          
        </Form>
      </FormCard>
      </ContentArea>
    </Container>
  );
};

export default Login;