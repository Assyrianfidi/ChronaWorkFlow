import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';
import ResetPasswordPage from '../page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock the auth store
const mockResetPassword = vi.fn();
const mockUseAuthStore = vi.fn();

vi.mock('../store/auth-store', () => ({
  useAuthStore: (selector?: (state: any) => any) => mockUseAuthStore(selector),
}));

describe('ResetPasswordPage', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockPush = vi.fn();
  
  beforeAll(() => {
    user = userEvent.setup();
  });
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default auth store mock
    mockUseAuthStore.mockImplementation((selector?: (state: any) => any) => {
      const state = {
        isAuthenticated: false,
        isLoading: false,
        resetPassword: mockResetPassword,
        user: null,
        error: null,
        clearError: vi.fn(),
      };
      return typeof selector === 'function' ? selector(state) : state;
    });
    
    // Mock useRouter
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
    });
    
    // Mock useSearchParams
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => key === 'token' ? 'test-token' : null,
    });
    
    // Mock usePathname
    (usePathname as any).mockReturnValue('/auth/reset-password');
  });
  
  it('renders the reset password form with token', async () => {
    render(<ResetPasswordPage />);
    
    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });
  
  it('shows error when token is missing', () => {
    (useSearchParams as any).mockReturnValue({
      get: () => null,
    });

    render(<ResetPasswordPage />);

    expect(screen.getByRole('heading', { name: /invalid reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request new reset link/i })).toHaveAttribute('href', '/auth/forgot-password');
  });
  
  it('validates password requirements', async () => {
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText('New Password');
    const confirmInput = screen.getByPlaceholderText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Test min length
    await user.type(passwordInput, 'short');
    await user.click(submitButton);
    
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    
    // Clear input
    await user.clear(passwordInput);
    
    // Test password complexity
    await user.type(passwordInput, 'alllowercase1');
    await user.click(submitButton);
    
    expect(await screen.findByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
    
    // Clear input
    await user.clear(passwordInput);
    
    // Test password match
    await user.type(passwordInput, 'ValidPass123!');
    await user.type(confirmInput, 'DifferentPass123!');
    await user.click(submitButton);
    
    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
  });
  
  it('validates password confirmation', async () => {
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    await user.type(passwordInput, 'ValidPass123!');
    await user.type(confirmPasswordInput, 'DifferentPass123!');
    await user.click(submitButton);
    
    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
  });
  
  it('handles successful password reset', async () => {
    mockResetPassword.mockResolvedValueOnce({});
    
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText('New Password');
    const confirmInput = screen.getByPlaceholderText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    await user.type(passwordInput, 'NewSecurePass123!');
    await user.type(confirmInput, 'NewSecurePass123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'test-token',
        newPassword: 'NewSecurePass123!',
      });
      
      expect(mockPush).toHaveBeenCalledWith('/auth/login?reset=success');
    });
  });
  
  it('handles password reset error', async () => {
    const errorMessage = 'Failed to reset password';
    mockResetPassword.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText('New Password');
    const confirmInput = screen.getByPlaceholderText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    await user.type(passwordInput, 'NewSecurePass123!');
    await user.type(confirmInput, 'NewSecurePass123!');
    await user.click(submitButton);
    
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });
  
  it('redirects to dashboard if already authenticated', () => {
    mockUseAuthStore.mockImplementation((selector?: (state: any) => any) => {
      const state = {
        isAuthenticated: true,
        isLoading: false,
        resetPassword: mockResetPassword,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        error: null,
        clearError: vi.fn(),
      };
      return typeof selector === 'function' ? selector(state) : state;
    });
    
    render(<ResetPasswordPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
  
  it('disables form fields and button during submission', async () => {
    let resolveResetPassword: (value?: any) => void;
    
    mockResetPassword.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveResetPassword = resolve;
      })
    );
    
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText('New Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm New Password');
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    await user.type(passwordInput, 'NewSecurePass123!');
    await user.type(confirmPasswordInput, 'NewSecurePass123!');
    await user.click(submitButton);
    
    // Check if fields are disabled during submission
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise and check if fields are re-enabled
    await act(async () => {
      resolveResetPassword!({});
      await new Promise((r) => setTimeout(r, 0));
    });
    
    expect(passwordInput).not.toBeDisabled();
    expect(confirmPasswordInput).not.toBeDisabled();
    expect(submitButton).not.toBeDisabled();
  });
});
