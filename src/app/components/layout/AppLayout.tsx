import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { useAppSelector } from '../../../store';

interface AppLayoutProps {
  children: ReactNode;
}

const LayoutContainer = styled.div`
  display: grid;
  width: 100%;
  height: 100vh;
  grid-template-areas:
    "header header"
    "sidebar main"
    "status status";
  grid-template-rows: auto 1fr auto;
  grid-template-columns: auto 1fr;
  overflow: hidden;
`;

/**
 * Main application layout component that arranges the header, sidebar, main content, and status bar
 */
const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { sidebar } = useAppSelector(state => state.ui);
  
  return (
    <LayoutContainer>
      {children}
    </LayoutContainer>
  );
};

export default AppLayout;
