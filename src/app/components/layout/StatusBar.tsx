import React from 'react';
import styled from 'styled-components';
import { useAppSelector } from '../../../store';

const StatusBarContainer = styled.footer`
  grid-area: status;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 1rem;
  background-color: ${props => props.theme.background.secondary};
  border-top: 1px solid ${props => props.theme.border.default};
  height: 28px;
  font-size: 0.8125rem;
  color: ${props => props.theme.text.secondary};
`;

const StatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const GameControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SpeedButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active === true ? props.theme.background.tertiary : 'transparent'};
  border: none;
  border-radius: 4px;
  padding: 0.125rem 0.5rem;
  color: ${props => props.active === true ? props.theme.text.primary : props.theme.text.secondary};
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.background.tertiary};
    color: ${props => props.theme.text.primary};
  }
`;

/**
 * Status bar component showing game state, time, and controls
 */
const StatusBar: React.FC = () => {
  const { lastSaveTime, gameSpeed, tick } = useAppSelector(state => state.game);
  const { status } = useAppSelector(state => state.app);
  
  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <StatusBarContainer>
      <StatusGroup>
        <StatusItem>
          Status: {status}
        </StatusItem>
        <StatusItem>
          Last Save: {formatTimestamp(lastSaveTime)}
        </StatusItem>
        {tick > 0 && (
          <StatusItem>
            Game Tick: {tick}
          </StatusItem>
        )}
      </StatusGroup>
      
      <GameControls>
        <SpeedButton active={gameSpeed === 'paused'}>
          Pause
        </SpeedButton>
        <SpeedButton active={gameSpeed === 'normal'}>
          Normal
        </SpeedButton>
        <SpeedButton active={gameSpeed === 'fast'}>
          Fast
        </SpeedButton>
        <SpeedButton active={gameSpeed === 'ultra'}>
          Ultra
        </SpeedButton>
      </GameControls>
    </StatusBarContainer>
  );
};

export default StatusBar;
