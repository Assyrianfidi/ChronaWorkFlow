import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (!import.meta.env.PROD) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div>
        <h2>Something went wrong</h2>
        <p>We're sorry, but something unexpected happened.</p>
        <button type="button" onClick={this.handleTryAgain}>
          Try Again
        </button>
        <button type="button" onClick={this.handleReload}>
          Reload Page
        </button>

        {!import.meta.env.PROD && (
          <div>
            <h3>Error Details</h3>
            <pre>{this.state.error?.message}</pre>
          </div>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;
