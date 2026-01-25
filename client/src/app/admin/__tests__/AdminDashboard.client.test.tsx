import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import AdminDashboardClient from '../AdminDashboardClient';
import { useAuthStore } from "@/store/auth-store";

// Mock auth store
vi.mock("@/store/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

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
      role: "ADMIN",
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
      role: "USER",
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

    vi.mocked(useAuthStore).mockReturnValue({
      user: { role: "ADMIN" },
      isLoading: false,
    } as any);

    // Mock router
    const pushMock = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
    } as any);
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
    vi.mocked(useAuthStore).mockReturnValue({
      user: { role: "USER" },
      isLoading: false,
    } as any);

    const pushMock = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as any);

    render(<AdminDashboardClient users={mockProps.users} />);

    // Check if redirect was called
    expect(pushMock).toHaveBeenCalledWith("/unauthorized");
  });

  it("allows changing user roles", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
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

    consoleErrorSpy.mockRestore();
  });
});
