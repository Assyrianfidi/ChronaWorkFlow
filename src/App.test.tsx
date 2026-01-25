import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Mock the API client
vi.mock('./hooks/queryClient', () => ({
  apiRequest: vi.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('App Component', () => {
  it('should render without crashing', () => {
    renderWithProviders(<App />);

    // Basic smoke test - app should render
    expect(document.body).toBeTruthy();
  });
});
