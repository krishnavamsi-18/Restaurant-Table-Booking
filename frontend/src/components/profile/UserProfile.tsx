import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const ProfileContainer = styled.div`
  position: relative;        <        <DropdownItem onClick={() => handleItemClick(onUserDetails)}>
          User Details
        </DropdownItem>
        
        <DropdownItem onClick={() => handleItemClick(onChangePassword)}>
          Change Password
        </DropdownItem>
        
        <DropdownItem onClick={() => handleItemClick(onLogout)}>
          Logout
        </DropdownItem>nClick={() => handleItemClick(onUserDetails)}>
          User Details
        </DropdownItem>
        
        <DropdownItem onClick={() => handleItemClick(onChangePassword)}>
          Change Password
        </DropdownItem>
        
        <DropdownItem onClick={() => handleItemClick(onLogout)}>
          Logout
        </DropdownItem>nline-block;
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 25px;
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    gap: 0.3rem;
  }
`;

const ProfileAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  border: none;
  
  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
`;

const UserName = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;



const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 200px;
  z-index: 1001;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(8px) scale(1)' : 'translateY(0px) scale(0.95)'};
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
`;

const DropdownHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const DropdownUserName = styled.h4`
  margin: 0;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
`;

const DropdownUserEmail = styled.p`
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: 0.85rem;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #333;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
  }
  
  &:first-child {
    border-radius: 0;
  }
  
  &:last-child {
    border-radius: 0 0 12px 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    color: #e74c3c;
    
    &:hover {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

interface UserProfileProps {
  onChangePassword: () => void;
  onUserDetails: () => void;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  onChangePassword,
  onUserDetails,
  onLogout
}) => {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleItemClick = (action: () => void) => {
    action();
    setIsDropdownOpen(false);
  };

  return (
    <ProfileContainer>
      <Overlay 
        $isOpen={isDropdownOpen} 
        onClick={() => setIsDropdownOpen(false)} 
      />
      
      <ProfileButton onClick={toggleDropdown}>
        <ProfileAvatar>
          {getInitials(getDisplayName())}
        </ProfileAvatar>
      </ProfileButton>
      
      <DropdownMenu $isOpen={isDropdownOpen}>
        <DropdownHeader>
          <DropdownUserName>{getDisplayName()}</DropdownUserName>
          <DropdownUserEmail>{user.email}</DropdownUserEmail>
        </DropdownHeader>
        
        <DropdownItem onClick={() => handleItemClick(onUserDetails)}>
          User Details
        </DropdownItem>
        
        <DropdownItem onClick={() => handleItemClick(onChangePassword)}>
          Change Password
        </DropdownItem>
        
        <DropdownItem onClick={() => handleItemClick(onLogout)}>
          Logout
        </DropdownItem>
      </DropdownMenu>
    </ProfileContainer>
  );
};

export default UserProfile;