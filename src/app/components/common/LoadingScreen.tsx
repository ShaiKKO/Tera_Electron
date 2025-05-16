import React from 'react';
import styled, { keyframes, ThemeProvider } from 'styled-components';
import { getThemeValue } from '../../theme/helpers';
import { lightTheme } from '../../theme';

interface LoadingScreenProps {
  message?: string;
}

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: ${props => getThemeValue(props.theme, 'background.primary', '#FFFFFF')};
  color: ${props => getThemeValue(props.theme, 'text.primary', '#212529')};
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: ${props => getThemeValue(props.theme, 'text.accent', '#0D6EFD')};
  animation: ${rotate} 1s linear infinite;
  margin-bottom: 1.5rem;
`;

const Message = styled.div`
  font-size: 1.25rem;
  text-align: center;
  max-width: 80%;
`;

/**
 * Loading screen displayed during initialization or loading operations
 * This component can safely be used outside ThemeProvider with fallback values
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <LoadingContainer>
      <Spinner />
      <Message>{message}</Message>
    </LoadingContainer>
  );
};

export default LoadingScreen;
