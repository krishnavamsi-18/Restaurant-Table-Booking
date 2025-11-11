import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const NavbarContainer = styled.nav`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const NavbarContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  text-decoration: none;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionButton = styled(Link)<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.7rem 2rem;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
  
  ${props => props.$variant === 'primary' ? `
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    color: #667eea;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
      transition: left 0.5s;
    }
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }
    
    &:hover:before {
      left: 100%;
    }
  ` : `
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(10px);
    
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    
    &:hover:before {
      left: 100%;
    }
  `}
  
  @media (max-width: 768px) {
    padding: 0.6rem 1.5rem;
    font-size: 0.9rem;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 5px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div<{ $isOpen: boolean }>`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'flex' : 'none'};
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 2rem 2rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

const AuthNavbar: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <NavbarContainer>
      <NavbarContent>
        <Logo>
          🍽️ FoodieFind
        </Logo>
        
        {/* Desktop Navigation */}
        <NavLinks>
          {isLoginPage ? (
            <ActionButton to="/register" $variant="primary">
              Sign Up
            </ActionButton>
          ) : isRegisterPage ? (
            <ActionButton to="/login" $variant="primary">
              Sign In
            </ActionButton>
          ) : (
            <>
              <ActionButton to="/login" $variant="secondary">
                Sign In
              </ActionButton>
              <ActionButton to="/register" $variant="primary">
                Sign Up
              </ActionButton>
            </>
          )}
        </NavLinks>
        
        {/* Mobile Menu Button */}
        <MobileMenuButton onClick={toggleMobileMenu}>
          ☰
        </MobileMenuButton>
      </NavbarContent>
      
      {/* Mobile Menu */}
      <MobileMenu $isOpen={isMobileMenuOpen}>        
        {isLoginPage ? (
          <ActionButton to="/register" $variant="primary" onClick={() => setIsMobileMenuOpen(false)}>
            Sign Up
          </ActionButton>
        ) : isRegisterPage ? (
          <ActionButton to="/login" $variant="primary" onClick={() => setIsMobileMenuOpen(false)}>
            Sign In
          </ActionButton>
        ) : (
          <>
            <ActionButton to="/login" $variant="secondary" onClick={() => setIsMobileMenuOpen(false)}>
              Sign In
            </ActionButton>
            <ActionButton to="/register" $variant="primary" onClick={() => setIsMobileMenuOpen(false)}>
              Sign Up
            </ActionButton>
          </>
        )}
      </MobileMenu>
    </NavbarContainer>
  );
};

export default AuthNavbar;