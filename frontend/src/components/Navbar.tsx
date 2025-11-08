import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './profile/UserProfile';
import ChangePasswordModal from './profile/ChangePasswordModal';
import UserDetailsModal from './profile/UserDetailsModal';

const NavbarContainer = styled.nav`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: #f0f0f0;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const NavLink = styled(Link)<{ $isActive?: boolean }>`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
  background: ${props => props.$isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
`;

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  const handleUserDetails = () => {
    setIsUserDetailsOpen(true);
  };

  // Don't show navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  // Show different navbar for home page (non-authenticated users)
  if (!user && location.pathname === '/') {
    return (
      <NavbarContainer>
        <NavContent>
          <Logo to="/">
            🍽️ FoodieFind
          </Logo>
          
          <NavLinks>
            <NavLink to="/login">
              Sign In
            </NavLink>
            <NavLink to="/register" style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              fontWeight: '600' 
            }}>
              Get Started
            </NavLink>
          </NavLinks>
        </NavContent>
      </NavbarContainer>
    );
  }

  // Don't show navbar if user is not authenticated (except home page)
  if (!user) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <NavbarContainer>
        <NavContent>
          <Logo to="/restaurants">
            🍽️ FoodieFind
          </Logo>
          
          <NavLinks>
            <NavLink 
              to="/restaurants" 
              $isActive={isActive('/restaurants')}
            >
              Restaurants
            </NavLink>
            <NavLink 
              to="/reservations" 
              $isActive={isActive('/reservations')}
            >
              My Reservations
            </NavLink>
            <NavLink 
              to="/location-settings" 
              $isActive={isActive('/location-settings')}
            >
              Location
            </NavLink>
          </NavLinks>
          
          <UserSection>
            <UserProfile 
              onChangePassword={handleChangePassword}
              onUserDetails={handleUserDetails}
              onLogout={handleLogout}
            />
          </UserSection>
        </NavContent>
      </NavbarContainer>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <UserDetailsModal 
        isOpen={isUserDetailsOpen}
        onClose={() => setIsUserDetailsOpen(false)}
      />
    </>
  );
};

export default Navbar;