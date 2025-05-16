import React from 'react';
import styled from 'styled-components';
import { useAppSelector, useAppDispatch } from '../../../store';
import { ViewType, setActiveView } from '../../../store/slices/uiSlice';

const SidebarContainer = styled.div<{ isOpen: boolean, width: number }>`
  grid-area: sidebar;
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  width: ${props => props.width}px;
  background-color: ${props => props.theme.background.secondary};
  border-right: 1px solid ${props => props.theme.border.default};
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s ease;
  z-index: 50;
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  text-transform: uppercase;
  color: ${props => props.theme.text.tertiary};
  margin: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${props => props.theme.border.light};
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li<{ isActive?: boolean }>`
  padding: 0.75rem 1rem;
  margin: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  color: ${props => props.isActive === true ? props.theme.text.primary : props.theme.text.secondary};
  background-color: ${props => props.isActive === true ? props.theme.background.tertiary : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.background.tertiary};
    color: ${props => props.theme.text.primary};
  }
`;

/**
 * Sidebar component for navigation and tools
 */
const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebar, activeView } = useAppSelector(state => state.ui);
  const { isGameActive } = useAppSelector(state => state.game);
  
  const handleNavClick = (view: ViewType) => {
    dispatch(setActiveView(view));
  };
  
  return (
    <SidebarContainer isOpen={sidebar.isOpen} width={sidebar.width}>
      <SectionTitle>Navigation</SectionTitle>
      <NavList>
        <NavItem 
          isActive={activeView === 'worldView'} 
          onClick={() => handleNavClick('worldView')}
        >
          World View
        </NavItem>
        <NavItem 
          isActive={activeView === 'colonyManagement'} 
          onClick={() => handleNavClick('colonyManagement')}
        >
          Colony Management
        </NavItem>
        <NavItem 
          isActive={activeView === 'resources'} 
          onClick={() => handleNavClick('resources')}
        >
          Resources
        </NavItem>
        <NavItem 
          isActive={activeView === 'research'} 
          onClick={() => handleNavClick('research')}
        >
          Research
        </NavItem>
      </NavList>
      
      {isGameActive && (
        <>
          <SectionTitle>Tools</SectionTitle>
          <NavList>
            <NavItem 
              isActive={activeView === 'building'} 
              onClick={() => handleNavClick('building')}
            >
              Building
            </NavItem>
            <NavItem 
              isActive={activeView === 'zones'} 
              onClick={() => handleNavClick('zones')}
            >
              Zones
            </NavItem>
            <NavItem 
              isActive={activeView === 'orders'} 
              onClick={() => handleNavClick('orders')}
            >
              Orders
            </NavItem>
          </NavList>
        </>
      )}
      
      <SectionTitle>Settings</SectionTitle>
      <NavList>
        <NavItem 
          isActive={activeView === 'gameOptions'} 
          onClick={() => handleNavClick('gameOptions')}
        >
          Game Options
        </NavItem>
        <NavItem 
          isActive={activeView === 'graphics'} 
          onClick={() => handleNavClick('graphics')}
        >
          Graphics
        </NavItem>
        <NavItem 
          isActive={activeView === 'audio'} 
          onClick={() => handleNavClick('audio')}
        >
          Audio
        </NavItem>
      </NavList>
    </SidebarContainer>
  );
};

export default Sidebar;
