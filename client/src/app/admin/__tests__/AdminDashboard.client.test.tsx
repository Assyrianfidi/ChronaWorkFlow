import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminDashboardClient from '../AdminDashboardClient';
import { UserRole } from '../types/next-auth';

// Mock next-auth/react
vi.mock("next-auth/react");

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  redirect: vi.fn(),
}));

const mockFetch = vi.fn(async () => ({ ok: true }));
vi.stubGlobal("fetch", mockFetch);

describe("AdminDashboardClient - Client Side", () => {
  const mockUsers = [
    {
      id: "1",
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN" as UserRole,
      emailVerified: new Date(),
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: [],
    },
    {
      id: "2",
      name: "Regular User",
      email: "user@example.com",
      role: "USER" as UserRole,
      emailVerified: new Date(),
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: [],
    },
  ];

  // Mock the server component props
  const mockProps = {
    users: mockUsers,
    isAdmin: true,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock session
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: "ADMIN",
        },
      },
      status: "authenticated",
    });

    // Mock router
    const pushMock = vi.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });
  });

  it("renders the admin dashboard with user management table", async () => {
    render(<AdminDashboardClient users={mockProps.users} />);

    // Check if the page title is rendered
    expect(screen.getByText("User Management")).toBeInTheDocument();

    // Check if the table headers are rendered
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // Check if user data is rendered
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("Regular User")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("redirects to unauthorized if user is not admin", () => {
    // Mock non-admin user
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          role: "USER",
        },
      },
      status: "authenticated",
    });

    const pushMock = vi.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });

    render(<AdminDashboardClient users={mockProps.users} />);

    // Check if redirect was called
    expect(pushMock).toHaveBeenCalledWith("/unauthorized");
  });

  it("allows changing user roles", async () => {
    render(<AdminDashboardClient users={mockProps.users} />);

    // Find and click the role select for the regular user
    const roleSelects = screen.getAllByRole("combobox");
    const regularUserSelect = roleSelects[1]; // Second user in the list
    fireEvent.change(regularUserSelect, { target: { value: "ADMIN" } });

    // Check if the update function was called with the correct parameters
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/users/role",
        expect.objectContaining({
          method: "POST",
          headers: expect.any(Object),
          body: JSON.stringify({ userId: "2", role: "ADMIN" }),
        }),
      );
    });
  });
});
