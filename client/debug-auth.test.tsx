import { render, screen } from '@testing-library/react';
import { AuthProvider } from './src/contexts/AuthContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock authApi
vi.mock('./src/services/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getProfile: vi.fn(),
  },
}));

describe('AuthContext Debug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render AuthProvider without errors', () => {
    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
