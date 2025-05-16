import React from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../../store';
import { toggleMenu, toggleSidebar } from '../../../store/slices/uiSlice';

const HeaderContainer = styled.header`
  grid-area: header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme.background.elevated};
  color: ${props => props.theme.text.primary};
  border-bottom: 1px solid ${props => props.theme.border.default};
  box-shadow: ${props => props.theme.shadow.sm};
  height: 4rem;
  z-index: 100;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  
  img {
    height: 2.5rem;
    margin-right: 0.5rem;
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NavButton = styled.button`
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  color: ${props => props.theme.text.secondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.background.secondary};
    color: ${props => props.theme.text.primary};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.border.focus};
  }
`;

const MenuContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

/**
 * Application header component with navigation and main controls
 */
const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isMenuOpen } = useAppSelector(state => state.ui);
  const { status } = useAppSelector(state => state.app);
  const { isGameActive } = useAppSelector(state => state.game);
  
  const handleToggleMenu = () => {
    dispatch(toggleMenu());
  };
  
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };
  
  return (
    <HeaderContainer>
      <Logo>
        {/* Replace with actual logo */}
        <span>TerraFlux</span>
      </Logo>
      
      <Navigation>
        <MenuContainer>
          <NavButton onClick={handleToggleMenu}>
            Game Menu
          </NavButton>
          
          <NavButton onClick={handleToggleSidebar}>
            Toggle Sidebar
          </NavButton>
        </MenuContainer>
      </Navigation>
    </HeaderContainer>
  );
};

export default Header;
