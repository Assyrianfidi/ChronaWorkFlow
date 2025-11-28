import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminDashboardClient from '../AdminDashboardClient';
import userEvent from '@testing-library/user-event';
import { User } from '../types/user';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock next-auth/react
vi.mock('next-auth/react');

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('AdminDashboardClient', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      emailVerified: new Date(),
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: [{ 
          provider: 'google',
          providerAccountId: '123456789',
          type: 'oauth',
          userId: '1',
          id: 'acc1',
          refresh_token: undefined,
          access_token: undefined,
          expires_at: undefined,
          token_type: undefined,
          scope: undefined,
          id_token: undefined,
          session_state: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }],
    },
    {
      id: '2',
      name: 'Regular User',
      email: 'user@example.com',
      role: 'USER',
      emailVerified: new Date(),
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: [{ 
          provider: 'credentials',
          providerAccountId: '987654321',
          type: 'credentials',
          userId: '2',
          id: 'acc2',
          refresh_token: undefined,
          access_token: undefined,
          expires_at: undefined,
          token_type: undefined,
          scope: undefined,
          id_token: undefined,
          session_state: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }],
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
    });

    // Mock router
    const pushMock = vi.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });

    // Setup fetch mock
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the admin dashboard with user management table', () => {
    render(<AdminDashboardClient users={mockUsers} />);

    // Check if the page title is rendered
    expect(screen.getByText('User Management')).toBeInTheDocument();

    // Check if the table headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check if user data is rendered
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('shows loading state while session is loading', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<AdminDashboardClient users={[]} />);
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('redirects to unauthorized if user is not admin', () => {
    // Mock non-admin user
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: 'USER',
        },
      },
      status: 'authenticated',
    });

    const pushMock = vi.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });

    render(<AdminDashboardClient users={mockUsers} />);
    expect(pushMock).toHaveBeenCalledWith('/unauthorized');
  });

  it('allows changing user roles', async () => {
    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    // Store the original window.location
    const originalLocation = window.location;
    
    // Mock window.location.reload
    delete (window as any).location;
    (window as any).location = {
      ...originalLocation,
      reload: vi.fn(),
    };

    render(<AdminDashboardClient users={mockUsers} />);

    // Find and change the role select for the regular user
    const roleSelects = screen.getAllByRole('combobox');
    const regularUserSelect = roleSelects[1]; // Second user in the list
    
    fireEvent.change(regularUserSelect, { target: { value: 'ADMIN' } });

    // Check if fetch was called with the correct arguments
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: '2', role: 'ADMIN' }),
      });
    });

    // Check if the page was reloaded
    expect(window.location.reload).toHaveBeenCalled();
    
    // Restore the original window.location
    (window as any).location = originalLocation;
    
    // Clean up mocks
    mockFetch.mockClear();
  });
});
