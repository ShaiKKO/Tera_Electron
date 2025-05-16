import React from 'react';
import styled from 'styled-components';

const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.text.primary};
`;

const Subtitle = styled.h2`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  font-weight: normal;
  color: ${props => props.theme.text.secondary};
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.primary === true
    ? props.theme.button.primary.background
    : props.theme.button.secondary.background};
  color: ${props => props.primary === true
    ? props.theme.button.primary.text
    : props.theme.button.secondary.text};
  border: none;

  &:hover {
    background-color: ${props => props.primary === true
      ? props.theme.button.primary.hover
      : props.theme.button.secondary.hover};
  }

  &:active {
    background-color: ${props => props.primary === true
      ? props.theme.button.primary.active
      : props.theme.button.secondary.active};
  }
`;

const VersionLabel = styled.div`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  font-size: 0.75rem;
  color: ${props => props.theme.text.tertiary};
`;

/**
 * Welcome placeholder shown when no game is active
 */
const WelcomePlaceholder: React.FC = () => {
  return (
    <WelcomeContainer>
      <Title>Welcome to TerraFlux</Title>
      <Subtitle>A colony simulation and exploration game</Subtitle>
      
      <ButtonsContainer>
        <Button primary>New Game</Button>
        <Button>Load Game</Button>
        <Button>Tutorial</Button>
      </ButtonsContainer>
      
      <VersionLabel>Version 0.1.0</VersionLabel>
    </WelcomeContainer>
  );
};

export default WelcomePlaceholder;
