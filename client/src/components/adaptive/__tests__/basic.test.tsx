import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdaptiveLayoutEngine } from '../AdaptiveLayoutEngine';

// Mock hooks
vi.mock('../hooks/useWindowSize', () => ({
  useWindowSize: vi.fn(() => ({ width: 1024, height: 768 })),
}));

vi.mock('../store/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: 'user' },
  })),
}));

describe('Basic Adaptive Tests', () => {
  it('renders adaptive layout engine', () => {
    render(
      <AdaptiveLayoutEngine>
        <div>Test Content</div>
      </AdaptiveLayoutEngine>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
