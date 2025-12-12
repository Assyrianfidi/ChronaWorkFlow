import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

describe("User Workflow Integration", () => {
  const mockSession = {
    data: {
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "USER",
      },
      expires: "1",
    },
    status: "authenticated",
  };

  const mockAdminSession = {
    ...mockSession,
    data: {
      ...mockSession.data,
      user: {
        ...mockSession.data.user,
        role: "ADMIN",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  it("completes full user journey", async () => {
    // 1. Mock successful login
// @ts-ignore
    (useSession as jest.Mock).mockReturnValue({
      ...mockSession,
      status: "unauthenticated",
    });

    // 2. Test login page
// @ts-ignore
// @ts-ignore
    const LoginPage = (await import("../app/auth/login/page")).default;
    render(<LoginPage />);

    // Verify login form renders
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // 3. Mock successful login response
// @ts-ignore
    (useSession as jest.Mock).mockReturnValue(mockSession);

    // 4. Test dashboard access
// @ts-ignore
// @ts-ignore
    const Dashboard = (await import("../pages/dashboard")).default;
    render(<Dashboard />);

    // Verify dashboard content
    expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();

    // 5. Test profile access
// @ts-ignore
// @ts-ignore
    const ProfilePage = (await import("../app/profile/page")).default;
    render(<ProfilePage />);

    // Verify profile form
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it("validates admin access control", async () => {
    // Test admin access to user management
// @ts-ignore
    (useSession as jest.Mock).mockReturnValue(mockAdminSession);

// @ts-ignore
// @ts-ignore
    const AdminDashboard = (await import("../app/admin/page")).default;
    render(<AdminDashboard />);

    // Verify admin dashboard content
    expect(screen.getByText(/user management/i)).toBeInTheDocument();

    // Test regular user cannot access admin
// @ts-ignore
    (useSession as jest.Mock).mockReturnValue(mockSession);

    // Should redirect or show unauthorized
    render(<AdminDashboard />);
    expect(screen.queryByText(/user management/i)).not.toBeInTheDocument();
  });
});
