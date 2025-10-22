import React from 'react';
import styled from '@emotion/styled';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { theme } from '../styles/globalStyles';

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${theme.colors.background.base};
  padding: ${theme.spacing.xl};
`;

const ErrorCard = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xxl};
  max-width: 600px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 1px solid ${theme.colors.border};
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${theme.spacing.lg};

  svg {
    width: 64px;
    height: 64px;
    color: ${theme.colors.status.error};
  }
`;

const ErrorTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${theme.spacing.md};
`;

const ErrorMessage = styled.p`
  color: ${theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  background: ${theme.colors.background.elevated};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
  cursor: pointer;

  summary {
    color: ${theme.colors.text.secondary};
    font-weight: 600;
    margin-bottom: ${theme.spacing.sm};
    user-select: none;

    &:hover {
      color: ${theme.colors.text.primary};
    }
  }

  pre {
    margin-top: ${theme.spacing.sm};
    padding: ${theme.spacing.md};
    background: ${theme.colors.background.base};
    border-radius: ${theme.borderRadius.sm};
    overflow-x: auto;
    font-size: 12px;
    color: ${theme.colors.text.secondary};
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: center;
`;

const Button = styled.button`
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  transition: all ${theme.transitions.fast};
  border: none;

  svg {
    width: 18px;
    height: 18px;
  }

  &.primary {
    background: ${theme.colors.accent.primary};
    color: white;

    &:hover {
      background: ${theme.colors.accent.primaryHover};
    }
  }

  &.secondary {
    background: ${theme.colors.background.elevated};
    color: ${theme.colors.text.primary};
    border: 1px solid ${theme.colors.border};

    &:hover {
      background: ${theme.colors.background.base};
    }
  }
`;

/**
 * Error Fallback Component
 * Displays a user-friendly error message with recovery options
 */
export function ErrorFallback({ error, errorInfo, onReset }) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <ErrorContainer>
      <ErrorCard>
        <IconWrapper>
          <AlertTriangle />
        </IconWrapper>

        <ErrorTitle>Something went wrong</ErrorTitle>

        <ErrorMessage>
          We're sorry, but something unexpected happened. This error has been
          logged and you can try reloading the page or returning to the home screen.
        </ErrorMessage>

        <ErrorDetails>
          <summary>Technical Details</summary>
          <pre>
            <strong>Error:</strong> {error?.message || 'Unknown error'}
            {'\n\n'}
            {error?.stack || 'No stack trace available'}
            {errorInfo?.componentStack && (
              <>
                {'\n\n'}
                <strong>Component Stack:</strong>
                {errorInfo.componentStack}
              </>
            )}
          </pre>
        </ErrorDetails>

        <ButtonGroup>
          <Button className="primary" onClick={onReset || handleReload}>
            <RefreshCw size={18} />
            Try Again
          </Button>
          <Button className="secondary" onClick={handleGoHome}>
            <Home size={18} />
            Go Home
          </Button>
        </ButtonGroup>
      </ErrorCard>
    </ErrorContainer>
  );
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Store error info in state
    this.setState({
      error,
      errorInfo
    });

    // Send error to main process for logging
    if (window.api && window.api.invoke) {
      window.api.invoke('log:error', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }).catch(err => {
        console.error('Failed to log error to main process:', err);
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          onReset: this.handleReset
        });
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
