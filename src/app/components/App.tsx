import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled, { ThemeProvider } from 'styled-components';
import { RootState, useAppDispatch, useAppSelector } from '../../store';
import { setInitialized, updateTimestamp } from '../../store/slices/appSlice';
import { updateActivity } from '../../store/slices/sessionSlice';
import { updateViewport } from '../../store/slices/uiSlice';
import AppLayout from './layout/AppLayout';
import MainContent from './layout/MainContent';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import StatusBar from './layout/StatusBar';
import LoadingScreen from './common/LoadingScreen';
import ErrorBoundary from './common/ErrorBoundary';
import ModalContainer from './common/ModalContainer';
import { lightTheme, darkTheme } from '../theme';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: ${props => props.theme.background.primary};
  color: ${props => props.theme.text.primary};
  transition: background-color 0.3s ease;
`;

/**
 * Root application component that manages global state and layout
 */
const App: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // App state
  const { status, isInitialized } = useAppSelector((state: RootState) => state.app);
  const { themeMode } = useAppSelector((state: RootState) => state.ui);
  
  // Theme selection based on themeMode
  const isDarkMode = themeMode === 'dark' || 
    (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Update viewport dimensions
        const updateViewportDimensions = () => {
          dispatch(updateViewport({
            width: window.innerWidth,
            height: window.innerHeight
          }));
        };
        
        // Register window resize handler
        window.addEventListener('resize', updateViewportDimensions);
        updateViewportDimensions(); // Initial call
        
        // Register activity tracking
        const trackUserActivity = () => dispatch(updateActivity());
        window.addEventListener('mousemove', trackUserActivity);
        window.addEventListener('keydown', trackUserActivity);
        window.addEventListener('click', trackUserActivity);
        
        // Set up interval for periodic updates
        const updateInterval = setInterval(() => {
          dispatch(updateTimestamp());
        }, 60000); // Update every minute
        
        // Setup IPC communication with main process
        // This is where we would initialize bridge API
        
        // Signal that app initialization is complete
        dispatch(setInitialized(true));
        
        // Cleanup function
        return () => {
          window.removeEventListener('resize', updateViewportDimensions);
          window.removeEventListener('mousemove', trackUserActivity);
          window.removeEventListener('keydown', trackUserActivity);
          window.removeEventListener('click', trackUserActivity);
          clearInterval(updateInterval);
        };
      } catch (error) {
        console.error('Failed to initialize application:', error);
        // Handle initialization error here
      }
    };
    
    initializeApp();
  }, [dispatch]);
  
  // Select a theme, even for loading screen
  const activeTheme = theme;
  
  return (
    <ThemeProvider theme={activeTheme}>
      <ErrorBoundary>
        {!isInitialized ? (
          <LoadingScreen message="Initializing TerraFlux..." />
        ) : (
          <AppContainer>
            <AppLayout>
              <Header />
              <MainContent />
              <Sidebar />
              <StatusBar />
            </AppLayout>
            <ModalContainer />
          </AppContainer>
        )}
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
