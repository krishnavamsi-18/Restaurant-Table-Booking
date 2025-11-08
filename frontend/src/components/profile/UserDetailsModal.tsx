import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/auth';
import apiService from '../../services/api';

const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  transform: scale(0.95);
  animation: modalAppear 0.3s ease forwards;
  
  @keyframes modalAppear {
    to {
      transform: scale(1);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #333;
  font-size: 1.25rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f0f0f0;
    color: #333;
  }
`;

const ProfileSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 2rem;
  margin: 0 auto 1rem;
  border: 3px solid rgba(102, 126, 234, 0.2);
`;

const UserDisplayName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
`;

const UserEmail = styled.p`
  margin: 0;
  color: #666;
  font-size: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:invalid {
    border-color: #e74c3c;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
  ` : `
    background: #f8f9fa;
    color: #666;
    border: 1px solid #e1e5e9;
    
    &:hover {
      background: #e9ecef;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: rgba(39, 174, 96, 0.1);
  border-radius: 4px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  color: #333;
  font-weight: 500;
`;

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  if (!user) return null;

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getDisplayName = (): string => {
    if (user.full_name) return user.full_name;
    return user.email.split('@')[0];
  };

  const resetForm = () => {
    setFormData({
      full_name: user.full_name || '',
      phone: user.phone || ''
    });
    setError('');
    setSuccess('');
    setIsEditing(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Updating profile with data:', formData);
      
      // Call API to update profile (JWT handles user identification)
      const response = await apiService.updateProfile({
        full_name: formData.full_name,
        phone: formData.phone
      });
      
      console.log('Profile update response:', response);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh user data to show updated information
      console.log('Refreshing user data...');
      await refreshUser();
      console.log('User data refreshed successfully');
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal $isOpen={isOpen} onClick={handleClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>User Profile</ModalTitle>
          <CloseButton onClick={handleClose}>×</CloseButton>
        </ModalHeader>

        <ProfileSection>
          <ProfileAvatar>
            {getInitials(getDisplayName())}
          </ProfileAvatar>
          <UserDisplayName>{getDisplayName()}</UserDisplayName>
          <UserEmail>{user.email}</UserEmail>
        </ProfileSection>

        {!isEditing ? (
          <>
            <InfoGrid>
              <InfoCard>
                <InfoLabel>Full Name</InfoLabel>
                <InfoValue>{user.full_name || 'Not provided'}</InfoValue>
              </InfoCard>
              
              <InfoCard>
                <InfoLabel>Phone</InfoLabel>
                <InfoValue>{user.phone || 'Not provided'}</InfoValue>
              </InfoCard>
              
              <InfoCard>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{user.email}</InfoValue>
              </InfoCard>
              
              <InfoCard>
                <InfoLabel>User ID</InfoLabel>
                <InfoValue>{user.id}</InfoValue>
              </InfoCard>
            </InfoGrid>

            <ButtonGroup>
              <Button type="button" onClick={handleClose}>
                Close
              </Button>
              <Button type="button" $variant="primary" onClick={handleEditToggle}>
                Edit Profile
              </Button>
            </ButtonGroup>
          </>
        ) : (
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                disabled={isLoading}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </FormGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}

            <ButtonGroup>
              <Button type="button" onClick={handleEditToggle} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" $variant="primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </ButtonGroup>
          </Form>
        )}
      </ModalContent>
    </Modal>
  );
};

export default UserDetailsModal;