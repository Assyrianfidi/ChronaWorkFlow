import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (!import.meta.env.PROD) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    return this.state.hasError 
      ? this.props.fallback 
      : this.props.children;
  }
}

export default ErrorBoundary;
