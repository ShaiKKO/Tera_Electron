import React from 'react';
import styled from 'styled-components';
import { useAppSelector } from '../../../store';
import WelcomePlaceholder from '../common/WelcomePlaceholder';
import SettingsPanel from '../settings/SettingsPanel';

const MainContentContainer = styled.main`
  grid-area: main;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.background.primary};
  overflow: hidden;
  position: relative;
`;

const GameViewport = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const GameCanvas = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  /* Canvas will be inserted here */
`;

const ContentOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  /* Child elements can receive pointer events */
  & > * {
    pointer-events: auto;
  }
`;

/**
 * Main content area where game view and primary content is displayed
 */
const MainContent: React.FC = () => {
  const { isGameActive } = useAppSelector(state => state.game);
  const { status } = useAppSelector(state => state.app);
  const { activeView } = useAppSelector(state => state.ui);
  
  // Check if the active view is a settings view
  const isSettingsView = ['gameOptions', 'graphics', 'audio'].includes(activeView);
  
  // Determine which settings section title to use
  const getSettingsSectionTitle = () => {
    switch(activeView) {
      case 'gameOptions': return 'Game Options';
      case 'graphics': return 'Graphics Settings';
      case 'audio': return 'Audio Settings';
      default: return 'Settings';
    }
  };
  
  return (
    <MainContentContainer>
      <GameViewport>
        {isSettingsView ? (
          <SettingsPanel sectionTitle={getSettingsSectionTitle()} />
        ) : !isGameActive ? (
          <WelcomePlaceholder />
        ) : (
          <>
            <GameCanvas id="game-canvas" />
            <ContentOverlay>
              {/* Game UI overlays will be inserted here */}
            </ContentOverlay>
          </>
        )}
      </GameViewport>
    </MainContentContainer>
  );
};

export default MainContent;
