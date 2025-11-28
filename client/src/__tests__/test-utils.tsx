import { vi } from 'vitest';
import { render as rtlRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock next/navigation before importing
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
}));

// Mock next-auth/react before importing
const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
  },
  expires: '9999-12-31',
};

const mockAdminSession = {
  user: {
    ...mockSession.user,
    role: 'ADMIN',
  },
  expires: mockSession.expires,
};

let activeSession = mockSession;

const useSessionMock = vi.fn(() => ({ data: activeSession, status: 'authenticated' }));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
  SessionProvider: ({ children }: { children: ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any;
  router?: Partial<typeof mockRouter>;
  route?: string;
  initialEntries?: string[];
}

// Test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

// Custom render function with providers
const renderWithProviders = (
  ui: ReactElement,
  {
    session = activeSession,
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const queryClient = createTestQueryClient();

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

// Custom render function with router
export const renderWithRouter = (
  ui: ReactElement,
  {
    route = '/',
    initialEntries = [route],
    session = activeSession,
    ...renderOptions
  }: CustomRenderOptions & { route?: string; initialEntries?: string[] } = {}
) => {
  const queryClient = createTestQueryClient();

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

// Custom render function
const customRender = (
  ui: ReactElement,
  {
    session = activeSession,
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const queryClient = createTestQueryClient();

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock utils for testing
export const mockUseSession = useSessionMock;
export const mockRouterInstance = mockRouter;
export const setMockSession = (session: any) => {
  activeSession = session;
  useSessionMock.mockReturnValue({ data: session, status: 'authenticated' });
};

export const setMockAdminSession = () => {
  setMockSession(mockAdminSession);
};

export const setMockUserSession = () => {
  setMockSession(mockSession);
};

// Mock navigation functions
export const resetMockNavigate = () => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockRouter.forward.mockClear();
};

// Export everything
export * from '@testing-library/react';
export { customRender as render, renderWithProviders };
export { createTestQueryClient };
