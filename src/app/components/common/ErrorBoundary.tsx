import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  height: 100%;
  width: 100%;
  background-color: ${props => props.theme.background.primary};
  color: ${props => props.theme.text.primary};
  overflow: auto;
`;

const ErrorTitle = styled.h1`
  color: ${props => props.theme.status.danger};
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const ErrorDetails = styled.pre`
  background-color: ${props => props.theme.background.secondary};
  border: 1px solid ${props => props.theme.border.default};
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  width: 100%;
  max-width: 800px;
  max-height: 300px;
  font-family: monospace;
  font-size: 0.875rem;
`;

const RestartButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.theme.button.primary.background};
  color: ${props => props.theme.button.primary.text};
  border: none;
  margin-top: 1rem;

  &:hover {
    background-color: ${props => props.theme.button.primary.hover};
  }

  &:active {
    background-color: ${props => props.theme.button.primary.active};
  }
`;

/**
 * Error Boundary component to catch unhandled JavaScript errors
 * in React components and display a fallback UI
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Pick<ErrorBoundaryState, 'hasError' | 'error'> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      errorInfo
    });

    // Here you could also call an error reporting service:
    // ErrorReportingService.logError(error, errorInfo);
  }

  handleRestart = (): void => {
    // Reload the application
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      
      return (
        <ErrorContainer>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            {error?.message || 'An unexpected error occurred'}
          </ErrorMessage>
          
          {errorInfo && (
            <>
              <h3>Component Stack Trace:</h3>
              <ErrorDetails>
                {errorInfo.componentStack}
              </ErrorDetails>
            </>
          )}
          
          <RestartButton onClick={this.handleRestart}>
            Restart Application
          </RestartButton>
        </ErrorContainer>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
